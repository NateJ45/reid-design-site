// TEMPORARY diagnostic (remove before merge): tune 'Zodiak Fallback TNR' size-adjust on a Linux runner.
import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist/client');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.avif': 'image/avif', '.json': 'application/json' };
let tnr = null; let extra = '';
const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); const ext = path.extname(f);
  fs.readFile(f, (e, d) => {
    if (e) { s.statusCode = 404; s.end(); return; }
    s.setHeader('content-type', types[ext] || 'application/octet-stream');
    if (extra && ext === '.html') { d = Buffer.from(d.toString().replace('</head>', `<style>${extra}</style></head>`)); }
    if (tnr && (ext === '.css' || ext === '.html')) { d = Buffer.from(d.toString().replace(/size-adjust:\s*118\.19%/g, `size-adjust:${tnr}%`)); }
    s.end(d);
  });
}).listen(4555);
const b = await chromium.launch();
async function run(label, value) {
  tnr = value;
  const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.route(/Zodiak.*woff2/, (r) => r.abort());
  await p.goto('http://localhost:4555/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const m = await p.evaluate(() => { const h = document.querySelector('h1'); const f = document.querySelector('.home-hero__foot').getBoundingClientRect(); return { h1h: Math.round(h.getBoundingClientRect().height), footTop: Math.round(f.top), words: [...h.querySelectorAll('.r-w')].map((w) => Math.round(w.getBoundingClientRect().width)).join(','), sa: [...document.querySelectorAll('style')].some((x) => /size-adjust/.test(x.textContent)) }; });
  console.log(label.padEnd(28), JSON.stringify(m)); await ctx.close();
}
const variants = [['balance(current)', ''], ['wrap', '.home-hero__h1{text-wrap:wrap !important}'], ['pretty', '.home-hero__h1{text-wrap:pretty !important}'], ['wrap+nomax', '.home-hero__h1{text-wrap:wrap !important;max-width:none !important}']];
for (const [vn, css] of variants) {
  extra = css; tnr = null;
  { const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); await p.goto('http://localhost:4555/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500); console.log(vn.padEnd(18), 'LOADED', JSON.stringify(await p.evaluate(() => { const h = document.querySelector('h1'); return { h1h: Math.round(h.getBoundingClientRect().height), footTop: Math.round(document.querySelector('.home-hero__foot').getBoundingClientRect().top) }; }))); await ctx.close(); }
  for (const v of [null, 122, 125]) { console.log(vn.padEnd(18), 'tnr', v ?? '118.19'); await run(`  Zodiak blocked`, v); }
}
await b.close(); srv.close();
