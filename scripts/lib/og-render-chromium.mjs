// Foundation, edit with care
// Chromium backend for the share card (scripts/lib/og-render.mjs). Places the
// PNGs prepareCard() made and sets the text in the real faces, embedded as
// woff2 data URIs (starter PORTS.md card 46). Needs a Playwright chromium on
// the machine (`npx playwright install chromium`).
//
// One browser per run. close() is NOT optional: an unclosed Playwright browser
// keeps the event loop alive, so a script finishes its work and then hangs.

import { readFileSync } from 'node:fs';
import { CARD, fontFile } from './og-render.mjs';

const uri = (png) => `data:image/png;base64,${png.toString('base64')}`;
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function fontFaces(root) {
  const face = (family, weight, file) =>
    `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${readFileSync(file).toString('base64')}) format('woff2');font-display:block}`;
  return [
    face(
      'Cormorant Garamond',
      500,
      fontFile(
        root,
        '@fontsource/cormorant-garamond',
        /^cormorant-garamond-latin-500-normal\.woff2$/,
      ),
    ),
    face(
      'Source Sans 3',
      '200 900',
      fontFile(
        root,
        '@fontsource-variable/source-sans-3',
        /^source-sans-3-latin-wght-normal\.woff2$/,
      ),
    ),
  ].join('\n');
}

function html(p, faces) {
  const C = CARD;
  const copyW = C.width - C.copy.left - C.copy.right;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${faces}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${C.width}px;height:${C.height}px;overflow:hidden;background:${C.linen}}
.card{position:relative;width:${C.width}px;height:${C.height}px;background:${C.linen};
  -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
img{position:absolute;display:block}
.copy{position:absolute;left:${C.copy.left}px;top:0;width:${copyW}px;height:${C.height}px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 ${C.copy.pad}px}
.logo{position:static}
.rule{width:${C.rule.width}px;height:${C.rule.height}px;background:${C.bronze};margin:${C.rule.above}px 0 ${C.rule.below}px}
.title{font-family:'Cormorant Garamond',serif;font-weight:500;color:${C.charcoal};font-size:${p.titleSize}px;
  line-height:1.06;letter-spacing:-.005em;margin:0 0 16px;text-wrap:balance}
.kicker{font-family:'Source Sans 3',sans-serif;font-weight:600;font-size:${C.kicker.size}px;letter-spacing:${C.kicker.tracking}em;
  color:${C.bronzeDark};line-height:1.5}
</style></head><body><div class="card">
<img src="${uri(p.arch)}" style="left:${C.arch.left}px;top:${C.arch.top}px;width:${C.arch.width}px;height:${C.arch.height}px" alt="">
${p.circle ? `<img src="${uri(p.circle)}" style="left:${C.circle.left}px;top:${C.circle.top}px;width:${C.circle.size}px;height:${C.circle.size}px" alt="">` : ''}
<div class="copy">
  <img class="logo" src="${uri(p.logo.png)}" style="width:${p.logo.width}px;height:${p.logo.height}px" alt="">
  <div class="rule"></div>
  <div class="title">${esc(p.title)}</div>
  <div class="kicker">${esc(p.kicker)}</div>
</div></div></body></html>`;
}

export async function createChromiumBackend({ root }) {
  const { chromium } = await import('playwright');
  // Launch now, so a machine without a browser fails HERE, once, and the
  // caller can fall back for every card instead of timing out per card.
  const browser = await chromium.launch();
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
