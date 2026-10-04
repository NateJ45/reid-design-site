// TEMPORARY diagnostic (remove before merge): which element shifts on `/` at 412x823 on a Linux runner.
import { chromium, devices } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist/client');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.avif': 'image/avif', '.json': 'application/json' };
const srv = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); fs.readFile(f, (e, d) => { if (e) { s.statusCode = 404; s.end(); } else { s.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream'); s.end(d); } }); }).listen(4555);
const b = await chromium.launch();
for (const run of [1, 2]) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const c = await ctx.newCDPSession(p);
  await c.send('Network.enable');
  await c.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.addInitScript(() => {
    window.__shifts = []; window.__fonts = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__shifts.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), src: (e.sources || []).map((s) => ({ n: s.node && (s.node.id || s.node.className || s.node.nodeName), from: [s.previousRect.y, s.previousRect.height].map(Math.round), to: [s.currentRect.y, s.currentRect.height].map(Math.round) })) }); } }).observe({ type: 'layout-shift', buffered: true });
    document.fonts && document.fonts.addEventListener('loadingdone', (ev) => window.__fonts.push({ t: Math.round(performance.now()), faces: ev.fontfaces.map((f) => f.family + ' ' + f.style + ' ' + f.weight) }));
  });
  await p.goto('http://localhost:4555/', { waitUntil: 'load' });
  await p.waitForTimeout(8000);
  console.log('RUN', run, JSON.stringify(await p.evaluate(() => ({ shifts: window.__shifts, fonts: window.__fonts, total: window.__shifts.reduce((a, s) => a + s.v, 0) })), null, 1));
  await ctx.close();
}
await b.close(); srv.close();
