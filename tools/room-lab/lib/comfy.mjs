// Small ComfyUI HTTP client. Node built-ins only (fetch, FormData, Blob).
// Base URL: env ROOM_COMFY_URL, default http://127.0.0.1:8188.
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { randomUUID } from 'node:crypto';

export const BASE = (process.env.ROOM_COMFY_URL || 'http://127.0.0.1:8188').replace(/\/+$/, '');
const CLIENT_ID = randomUUID();

async function call(path, init) {
  try {
    return await fetch(BASE + path, init);
  } catch (err) {
    throw new Error(
      `ComfyUI not reachable at ${BASE} (${err.cause?.code || err.message}). ` +
        'Start it first (see tools/room-lab/README.md) or set ROOM_COMFY_URL.',
    );
  }
}

async function failWith(res, what) {
  const text = await res.text().catch(() => '');
  throw new Error(`ComfyUI ${what} failed: HTTP ${res.status} ${res.statusText}\n${text}`);
}

/** Upload an image into ComfyUI's input folder, overwriting; returns the stored name. */
export async function uploadImage(path) {
  const buf = await readFile(path);
  const form = new FormData();
  form.append('image', new Blob([buf], { type: 'image/png' }), basename(path));
  form.append('overwrite', 'true');
  form.append('type', 'input');
  const res = await call('/upload/image', { method: 'POST', body: form });
  if (!res.ok) await failWith(res, 'upload');
  const json = await res.json();
  return json.subfolder ? `${json.subfolder}/${json.name}` : json.name;
}

/** Queue an API-format workflow; returns prompt_id. Prints node_errors verbatim on 400. */
export async function queue(workflow) {
  const res = await call('/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: CLIENT_ID }),
  });
  if (!res.ok) await failWith(res, 'queue (/prompt)');
  const json = await res.json();
  if (json.node_errors && Object.keys(json.node_errors).length) {
    throw new Error(`ComfyUI node_errors:\n${JSON.stringify(json.node_errors, null, 2)}`);
  }
  return json.prompt_id;
}

/** Poll /history/{id} every second until it finishes; returns the history entry. */
export async function waitFor(promptId, { timeoutMs = 20 * 60 * 1000 } = {}) {
  const start = Date.now();
  for (;;) {
    const res = await call(`/history/${promptId}`);
    if (!res.ok) await failWith(res, 'history');
    const entry = (await res.json())[promptId];
    if (entry) {
      if (entry.status?.status_str === 'error') {
        throw new Error(`ComfyUI execution error:\n${JSON.stringify(entry.status, null, 2)}`);
      }
      if (entry.outputs && Object.keys(entry.outputs).length) return entry;
      if (entry.status?.completed) return entry;
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Timed out after ${Math.round(timeoutMs / 1000)}s waiting for prompt ${promptId}`,
      );
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

/** Download every output image of a history entry; returns [{ filename, node, buffer }]. */
export async function fetchOutputs(history) {
  const out = [];
  for (const [node, o] of Object.entries(history.outputs || {})) {
    for (const img of o.images || []) {
      const q = new URLSearchParams({
        filename: img.filename,
        subfolder: img.subfolder || '',
        type: img.type || 'output',
      });
      const res = await call(`/view?${q}`);
      if (!res.ok) await failWith(res, `view ${img.filename}`);
      out.push({ filename: img.filename, node, buffer: Buffer.from(await res.arrayBuffer()) });
    }
  }
  if (!out.length) throw new Error('ComfyUI finished but returned no output images.');
  return out;
}

/** Cheap reachability probe used at the start of generate. */
export async function ping() {
  const res = await call('/system_stats');
  if (!res.ok) await failWith(res, 'system_stats');
  return res.json();
}
