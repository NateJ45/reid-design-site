// Foundation, edit with care
// =============================================================================
// satori + resvg backend for the share card (no browser)
// =============================================================================
// STATUS 2026-09-29: WRITTEN, NOT YET RUN. Its three packages are not installed:
//   satori, @resvg/resvg-js       approved by Nathan; the install is waiting on
//                                 a permission he has to grant in person
//   @fontsource/source-sans-3     NOT yet approved. satori reads TTF/OTF/WOFF
//                                 only, never WOFF2, and cannot pick a weight
//                                 out of a variable font. The site's
//                                 @fontsource-variable/source-sans-3 ships ONLY
//                                 a variable woff2, so the static package (which
//                                 ships source-sans-3-latin-600-normal.woff) is
//                                 the smallest way to give satori the real face.
// Until then OG_RENDERER stays 'chromium' (scripts/lib/og-render.mjs).
//
// Why it can match the Chromium card: prepareCard() already did every image
// operation satori lacks (CSS filter, mask-image, object-fit/position,
// border-radius on an image), so this file only places three PNGs and sets
// three strings. The one known visual gap is title wrapping: satori has no
// `text-wrap: balance`, so a two-line title may break unevenly. balanceLines()
// below pre-breaks it by character count to get close.
// =============================================================================

import { readFileSync } from 'node:fs';
import { CARD, fontFile } from './og-render.mjs';

const uri = (png) => `data:image/png;base64,${png.toString('base64')}`;

/** Break a title into n lines of near-equal length (satori has no text-wrap: balance). */
export function balanceLines(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = Math.max(1, Math.ceil(text.length / maxChars));
  if (lines === 1) return [text];
  const target = text.length / lines;
  const out = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && next.length > target && out.length < lines - 1) {
      out.push(cur);
      cur = w;
    } else cur = next;
  }
  out.push(cur);
  return out;
}

export async function createSatoriBackend({ root }) {
  const { default: satori } = await import('satori');
  const { Resvg } = await import('@resvg/resvg-js');
  const fonts = [
    {
      name: 'Cormorant Garamond',
      weight: 500,
      style: 'normal',
      data: readFileSync(
        fontFile(
          root,
          '@fontsource/cormorant-garamond',
          /^cormorant-garamond-latin-500-normal\.woff$/,
        ),
      ),
    },
    {
      name: 'Source Sans 3',
      weight: 600,
      style: 'normal',
      data: readFileSync(
        fontFile(root, '@fontsource/source-sans-3', /^source-sans-3-latin-600-normal\.woff$/),
      ),
    },
  ];
  const C = CARD;
  const el = (type, style, children, extra = {}) => ({
    type,
    props: { style, children, ...extra },
  });
  const img = (png, w, h, style = {}) => ({
    type: 'img',
    props: { src: uri(png), width: w, height: h, style: { width: w, height: h, ...style } },
  });

  return {
    name: 'satori',
    async render(p) {
      const copyW = C.width - C.copy.left - C.copy.right;
      // ~0.47em per Cormorant character is the measured average at these sizes.
      const perLine = Math.floor((copyW - C.copy.pad * 2) / (p.titleSize * 0.47));
      const tree = el(
        'div',
        {
          display: 'flex',
          position: 'relative',
          width: C.width,
          height: C.height,
          background: C.linen,
        },
        [
          img(p.arch, C.arch.width, C.arch.height, {
            position: 'absolute',
            left: C.arch.left,
            top: C.arch.top,
          }),
          p.circle
            ? img(p.circle, C.circle.size, C.circle.size, {
                position: 'absolute',
                left: C.circle.left,
                top: C.circle.top,
              })
            : null,
          el(
            'div',
            {
              position: 'absolute',
              left: C.copy.left,
              top: 0,
              width: copyW,
              height: C.height,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `0 ${C.copy.pad}px`,
            },
            [
              img(p.logo.png, p.logo.width, p.logo.height),
              el('div', {
                width: C.rule.width,
                height: C.rule.height,
                background: C.bronze,
                margin: `${C.rule.above}px 0 ${C.rule.below}px`,
              }),
              el(
                'div',
                {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  fontFamily: 'Cormorant Garamond',
                  fontWeight: 500,
                  fontSize: p.titleSize,
                  lineHeight: 1.06,
                  color: C.charcoal,
                  marginBottom: 16,
                  textAlign: 'center',
                },
                balanceLines(p.title, perLine).map((line) => el('div', {}, line)),
              ),
              el(
                'div',
                {
                  fontFamily: 'Source Sans 3',
                  fontWeight: 600,
                  fontSize: C.kicker.size,
                  letterSpacing: C.kicker.size * C.kicker.tracking,
                  color: C.bronzeDark,
                  lineHeight: 1.5,
                },
                p.kicker,
              ),
            ],
          ),
        ].filter(Boolean),
      );
      const svg = await satori(tree, { width: C.width, height: C.height, fonts });
      return new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng();
    },
    async close() {},
  };
}
