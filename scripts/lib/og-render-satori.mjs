// Foundation, edit with care
// =============================================================================
// satori + resvg backend for the share card: THE BUILD DEFAULT (no browser)
// =============================================================================
// satori lays the card out and emits an SVG (text as glyph paths, shaped with
// harfbuzz); resvg rasterises it. Both are pure npm packages with prebuilt
// binaries, so a build needs no browser and no system fonts.
//
// Fonts are handed over as bytes (starter PORTS.md card 46): satori reads
// TTF/OTF/WOFF, never WOFF2, so the site's own Zodiak Light and General Sans
// Medium come from the .woff copies fetch-fonts.mjs keeps in
// scripts/.og-fonts/ (design E, 2026-09-30; design D used Cormorant and
// Source Sans from @fontsource).
//
// prepareCard() did every image operation (the ground, the graded photo, the
// fan deck, the logo plate) as ONE background PNG, and computed the title's
// line breaks from Zodiak's measured advance widths, so this file places one
// PNG and sets lines of text exactly as given.
// =============================================================================

import { readFileSync } from 'node:fs';
import { CARD, TRACKING, ogFont } from './og-render.mjs';

const uri = (png) => `data:image/png;base64,${png.toString('base64')}`;

export async function createSatoriBackend({ root }) {
  const { default: satori } = await import('satori');
  const { Resvg } = await import('@resvg/resvg-js');
  const fonts = [
    {
      name: 'Zodiak',
      weight: 300,
      style: 'normal',
      data: readFileSync(ogFont(root, 'Zodiak-300.woff')),
    },
    {
      name: 'General Sans',
      weight: 500,
      style: 'normal',
      data: readFileSync(ogFont(root, 'GeneralSans-500.woff')),
    },
  ];
  const C = CARD;
  const el = (type, style, children, extra = {}) => ({
    type,
    props: { style, children, ...extra },
  });

  return {
    name: 'satori',
    async render(p) {
      const tree = el(
        'div',
        { display: 'flex', position: 'relative', width: C.width, height: C.height },
        [
          {
            type: 'img',
            props: {
              src: uri(p.background),
              width: C.width,
              height: C.height,
              style: { position: 'absolute', left: 0, top: 0, width: C.width, height: C.height },
            },
          },
          // The words, bottom-anchored in the copy column so a short title
          // sits low like the home hero's and a long one grows upward.
          el(
            'div',
            {
              position: 'absolute',
              left: C.copy.left,
              top: C.copy.top,
              width: C.copy.width,
              height: C.copy.bottom - C.copy.top,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            },
            [
              el(
                'div',
                {
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 22,
                  fontFamily: 'General Sans',
                  fontWeight: 500,
                  fontSize: C.kicker.size,
                  color: C.cream,
                },
                [
                  el('div', { width: 34, height: 1.5, background: C.cream, marginRight: 14 }),
                  p.kicker,
                ],
              ),
              el(
                'div',
                {
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: 'Zodiak',
                  fontWeight: 300,
                  fontSize: p.titleSize,
                  lineHeight: 1.0,
                  letterSpacing: p.titleSize * TRACKING,
                  color: C.cream,
                },
                p.titleLines.map((line) => el('div', { whiteSpace: 'nowrap' }, line)),
              ),
            ],
          ),
          el(
            'div',
            {
              position: 'absolute',
              left: C.copy.left,
              bottom: C.url.bottom,
              fontFamily: 'General Sans',
              fontWeight: 500,
              fontSize: C.url.size,
              color: C.oat,
            },
            p.url,
          ),
        ],
      );
      const svg = await satori(tree, { width: C.width, height: C.height, fonts });
      return new Resvg(svg, { fitTo: { mode: 'original' } }).render().asPng();
    },
    async close() {},
  };
}
