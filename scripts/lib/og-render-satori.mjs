// Foundation, edit with care
// =============================================================================
// satori + resvg backend for the share card: THE BUILD DEFAULT (no browser)
// =============================================================================
// satori lays the card out and emits an SVG (text as glyph paths, shaped with
// harfbuzz); resvg rasterises it. Both are pure npm packages with prebuilt
// binaries (resvg ships @resvg/resvg-js-linux-x64-gnu for Workers Builds), so a
// build needs no browser and no system fonts.
//
// Fonts are handed over as bytes (starter PORTS.md card 46): satori reads
// TTF/OTF/WOFF, never WOFF2, and cannot pick a weight out of a variable font,
// so Cormorant Garamond 500 comes from @fontsource/cormorant-garamond's .woff
// and Source Sans 3 600 from the static @fontsource/source-sans-3 .woff (the
// site's own @fontsource-variable/source-sans-3 ships only a variable woff2).
//
// Why it matches the Chromium review backend: prepareCard() did every image
// operation satori lacks (CSS filter, mask-image, object-fit/position,
// border-radius on an image) and computed the title's line breaks from the
// font's real advance widths, so this file places three PNGs and sets lines of
// text exactly as given.
// =============================================================================

import { readFileSync } from 'node:fs';
import { CARD, fontFile } from './og-render.mjs';

const uri = (png) => `data:image/png;base64,${png.toString('base64')}`;

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
                  letterSpacing: p.titleSize * -0.005,
                  color: C.charcoal,
                  marginBottom: 16,
                  textAlign: 'center',
                },
                p.titleLines.map((line) => el('div', { whiteSpace: 'nowrap' }, line)),
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
                // satori gave a plain space no tracking of its own, so word gaps
                // came out visibly tighter than Chromium's; a no-break space is
                // tracked like a letter.
                p.kicker.replace(/ /g, ' '),
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
