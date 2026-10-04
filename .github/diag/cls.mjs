// TEMPORARY diagnostic (remove before merge): layout shifts on `/` at 412x823 on a Linux runner, throttled.
import { chromium } from '@playwright/test';
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
    window.__shifts = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__shifts.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), src: (e.sources || []).map((s) => (s.node ? (s.node.id || s.node.className || s.node.nodeName) : '') + ' ' + Math.round(s.previousRect.y) + '>' + Math.round(s.currentRect.y)).join('; ') });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await p.goto('http://localhost:4555/', { waitUntil: 'load' });
  await p.waitForTimeout(9000);
  console.log('RUN', run, JSON.stringify(await p.evaluate(() => ({ total: +window.__shifts.reduce((a, s) => a + s.v, 0).toFixed(4), shifts: window.__shifts, fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0), fonts: performance.getEntriesByType('resource').filter((r) => /woff2/.test(r.name)).map((r) => r.name.split('/').pop() + '@' + Math.round(r.responseEnd)) }))));
  await ctx.close();
}
await b.close(); srv.close();
