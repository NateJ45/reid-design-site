// TEMPORARY diagnostic (remove before merge): hero geometry per font state on a Linux runner.
import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist/client');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.avif': 'image/avif', '.json': 'application/json' };
const srv = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); fs.readFile(f, (e, d) => { if (e) { s.statusCode = 404; s.end(); } else { s.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream'); s.end(d); } }); }).listen(4555);
const b = await chromium.launch();
const cases = [['all loaded', false, false, false], ['Waterfall blocked', true, false, false], ['Zodiak blocked', false, true, false], ['Zodiak+Waterfall blocked', true, true, false], ['ALL fonts blocked (+General Sans)', true, true, true]];
for (const [name, wf, zod, gs] of cases) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  if (wf) await p.route(/Waterfall.*woff2/, (r) => r.abort());
  if (zod) await p.route(/Zodiak.*woff2/, (r) => r.abort());
  if (gs) await p.route(/GeneralSans.*woff2/, (r) => r.abort());
  await p.goto('http://localhost:4555/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  const m = await p.evaluate(() => {
    const h = document.querySelector('h1');
    const f = document.querySelector('.home-hero__foot').getBoundingClientRect();
    const e = document.querySelector('.home-hero__eyebrow').getBoundingClientRect();
    const words = [...h.querySelectorAll('.r-w')].map((w) => { const r = w.getBoundingClientRect(); return `${w.textContent.trim()}@${Math.round(r.left)},${Math.round(r.top)}w${Math.round(r.width)}`; });
    const ff = (el) => getComputedStyle(el).fontFamily.slice(0, 70);
    return { eyebrowH: Math.round(e.height), h1top: Math.round(h.getBoundingClientRect().top), h1h: Math.round(h.getBoundingClientRect().height), footTop: Math.round(f.top), words: words.join(' | '), loaded: [...document.fonts].filter((x) => x.status === 'loaded').map((x) => x.family + x.style).join(',') };
  });
  console.log(name.padEnd(36), JSON.stringify(m));
  await ctx.close();
}
await b.close(); srv.close();
