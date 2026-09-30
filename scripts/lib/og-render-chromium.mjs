// Foundation, edit with care
// Chromium backend for the share card (scripts/lib/og-render.mjs). A LOCAL
// REVIEW TOOL only (OG_RENDERER=chromium): the build uses satori. Places the
// background PNG prepareCard() made and sets the text in the real faces,
// embedded as data URIs (starter PORTS.md card 46). Needs a Playwright
// chromium on the machine (`npx playwright install chromium`).
//
// Design E, "the swatch card" (2026-09-30). Keep the layout in step with
// og-render-satori.mjs so an A/B of the two renderers stays meaningful.
//
// One browser per run. close() is NOT optional: an unclosed Playwright browser
// keeps the event loop alive, so a script finishes its work and then hangs.

import { readFileSync } from 'node:fs';
import { CARD, TRACKING, ogFont } from './og-render.mjs';

const uri = (png) => `data:image/png;base64,${png.toString('base64')}`;
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function fontFaces(root) {
  const face = (family, weight, file) =>
    `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;src:url(data:font/woff;base64,${readFileSync(ogFont(root, file)).toString('base64')}) format('woff');font-display:block}`;
  return [
    face('Zodiak', 300, 'Zodiak-300.woff'),
    face('General Sans', 500, 'GeneralSans-500.woff'),
  ].join('\n');
}

function html(p, faces) {
  const C = CARD;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${faces}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${C.width}px;height:${C.height}px;overflow:hidden;background:${C.walnut}}
.card{position:relative;width:${C.width}px;height:${C.height}px;
  -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.bg{position:absolute;left:0;top:0;width:${C.width}px;height:${C.height}px}
.copy{position:absolute;left:${C.copy.left}px;top:${C.copy.top}px;width:${C.copy.width}px;height:${C.copy.bottom - C.copy.top}px;
  display:flex;flex-direction:column;justify-content:flex-end}
.kicker{display:flex;align-items:center;margin-bottom:22px;font:500 ${C.kicker.size}px 'General Sans';color:${C.cream}}
.kicker i{display:block;width:34px;height:1.5px;background:${C.cream};margin-right:14px}
.title{font:300 ${p.titleSize}px/1 'Zodiak';letter-spacing:${TRACKING}em;color:${C.cream};white-space:nowrap}
.url{position:absolute;left:${C.copy.left}px;bottom:${C.url.bottom}px;font:500 ${C.url.size}px 'General Sans';color:${C.oat}}
</style></head><body><div class="card">
<img class="bg" src="${uri(p.background)}" alt="">
<div class="copy">
  <div class="kicker"><i></i>${esc(p.kicker)}</div>
  <div class="title">${p.titleLines.map((l) => `<div>${esc(l)}</div>`).join('')}</div>
</div>
<div class="url">${esc(p.url)}</div>
</div></body></html>`;
}

export async function createChromiumBackend({ root }) {
  const { chromium } = await import('playwright');
  // Launch now, so a machine without a browser fails HERE, once, and the
  // caller can fall back for every card instead of timing out per card.
  // OG_CHROMIUM_PATH points at a browser the pinned Playwright did not
  // download itself (a CI image or a cloud container that ships its own).
  const browser = await chromium.launch(
    process.env.OG_CHROMIUM_PATH ? { executablePath: process.env.OG_CHROMIUM_PATH } : {},
  );
  const faces = fontFaces(root);
  return {
    name: 'chromium',
    async render(prepared) {
      const page = await browser.newPage({
        viewport: { width: CARD.width, height: CARD.height },
        deviceScaleFactor: 1,
      });
      try {
        await page.setContent(html(prepared, faces), { waitUntil: 'load' });
        // Photographing before the faces decode reproduces the fallback-serif bug.
        await page.evaluate(() => document.fonts.ready);
        return await page.screenshot({ type: 'png' });
      } finally {
        await page.close();
      }
    },
    async close() {
      await browser.close();
    },
  };
}
