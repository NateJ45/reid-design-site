// Foundation, edit with care
// =============================================================================
// satori + resvg: the words on the share card (design F, "the cover")
// =============================================================================
// satori lays the card out and emits an SVG (text as glyph paths, shaped with
// harfbuzz); resvg rasterises it. Both are pure npm packages with prebuilt
// binaries, so a build needs no browser and no system fonts.
//
// Fonts are handed over as bytes (starter PORTS.md card 46): satori reads
// TTF/OTF/WOFF, never WOFF2, so the site's own Zodiak Light and General Sans
// Medium come from the .woff copies fetch-fonts.mjs keeps in scripts/.og-fonts/.
//
// prepareCard() (og-render.mjs) already drew every image into ONE background
// PNG and decided every size and line break, so this file only places that
// PNG and sets the words where the layout says. Keep it that way: satori is
// flexbox only, so anything clever belongs in prepareCard().
// =============================================================================

import { readFileSync } from 'node:fs';
import { CARD, ogFont } from './og-render.mjs';

const uri = (buf, type = 'image/png') => `data:${type};base64,${buf.toString('base64')}`;
const svgUri = (s) => uri(Buffer.from(s), 'image/svg+xml');

const el = (type, style, children, extra = {}) => ({
  type,
  props: { style, children, ...extra },
});
const img = (src, width, height, style = {}) => ({
  type: 'img',
  props: { src, width, height, style: { width, height, ...style } },
});

/**
 * A tag's notched end: a point with a punched hole, the site's .r-pricetag and
 * .r-tag shape. satori has no clip-path, so the notch is a small SVG drawn in
 * the tag's colour and set flush against the tag body.
 */
function notch(width, height, fill, hole) {
  const r = Math.max(3, Math.round(height * 0.09));
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><path d="M${width} 0 H${Math.round(width * 0.45)} L0 ${height / 2} L${Math.round(width * 0.45)} ${height} H${width} Z" fill="${fill}"/><circle cx="${Math.round(width * 0.62)}" cy="${height / 2}" r="${r}" fill="${hole}"/></svg>`,
  );
}

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
  const C = CARD.c;
  const Z = { fontFamily: 'Zodiak', fontWeight: 300 };
  const GS = { fontFamily: 'General Sans', fontWeight: 500 };

  return {
    name: 'satori',
    async render(p) {
      const { content, words, tone } = p;
      const col = CARD.col;
      const L = CARD.label;
      const stack = [];

      // The big line: the page's own name.
      stack.push(
        el(
          'div',
          {
            display: 'flex',
            flexDirection: 'column',
            ...Z,
            fontSize: words.label.size,
            lineHeight: L.lineHeight,
            letterSpacing: words.label.size * L.tracking,
            color: tone.fg,
          },
          words.label.lines.map((line) => el('div', { whiteSpace: 'nowrap' }, line)),
        ),
      );

      // A project's title under "Portfolio".
      if (words.title) {
        stack.push(
          el(
            'div',
            {
              display: 'flex',
              flexDirection: 'column',
              marginTop: 18,
              ...Z,
              fontSize: words.title.size,
              lineHeight: CARD.title.lineHeight,
              letterSpacing: words.title.size * -0.015,
              color: tone.sub,
            },
            words.title.lines.map((line) => el('div', { whiteSpace: 'nowrap' }, line)),
          ),
        );
      }

      // One real fact: "from $225", "4 steps", "19 answers".
      if (content.fact) {
        stack.push(
          el(
            'div',
            {
              marginTop: CARD.fact.gap,
              ...Z,
              fontSize: CARD.fact.size,
              lineHeight: 1,
              letterSpacing: CARD.fact.size * -0.02,
              color: tone.sub,
            },
            content.fact,
          ),
        );
      }

      // The price tag (Contact): the header's "Book a consult $225" button.
      if (content.tag) {
        const T = CARD.tag;
        const dark = tone.fg === C.cream;
        const bg = dark ? C.cream : C.ink;
        const fg = dark ? C.ink : C.cream;
        stack.push(
          el('div', { display: 'flex', marginTop: T.gap, alignSelf: 'flex-start' }, [
            img(notch(T.notch, T.height, bg, tone.bg), T.notch, T.height),
            el(
              'div',
              {
                display: 'flex',
                alignItems: 'center',
                height: T.height,
                padding: '0 34px 0 22px',
                background: bg,
                color: fg,
                borderRadius: '0 4px 4px 0',
              },
              [
                el('div', { ...GS, fontSize: T.label, whiteSpace: 'nowrap' }, content.tag.label),
                el('div', {
                  width: 2,
                  height: 54,
                  margin: '0 22px',
                  background: dark ? 'rgba(35,30,27,0.3)' : 'rgba(245,237,227,0.3)',
                }),
                el(
                  'div',
                  { ...Z, fontSize: T.price, lineHeight: 1, letterSpacing: T.price * -0.02 },
                  content.tag.price,
                ),
              ],
            ),
          ]),
        );
      }

      // A short line of the page's own words, led by a rule.
      if (words.line) {
        stack.push(
          el(
            'div',
            {
              display: 'flex',
              alignItems: 'center',
              marginTop: CARD.line.gap,
              ...GS,
              fontSize: words.line.size,
              color: tone.sub,
              whiteSpace: 'nowrap',
            },
            [
              el('div', {
                width: CARD.line.rule,
                height: 2,
                background: tone.sub,
                marginRight: 16,
              }),
              words.line.text,
            ],
          ),
        );
      }

      const children = [
        img(uri(p.background), CARD.width, CARD.height, { position: 'absolute', left: 0, top: 0 }),
        // The column: bottom-anchored under the masthead.
        el(
          'div',
          {
            position: 'absolute',
            left: col.left,
            top: 0,
            width: col.width,
            height: CARD.height,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: col.bottom + words.reserve,
          },
          stack,
        ),
      ];

      // The tape's inch figures (Process).
      if (content.object === 'tape') {
        const T = CARD.tape;
        for (let i = 0; T.bandLeft + i * T.inch < CARD.width; i++) {
          children.push(
            el(
              'div',
              {
                position: 'absolute',
                left: T.bandLeft + i * T.inch + 6,
                top: T.bandTop + T.bandHeight - 26,
                ...GS,
                fontSize: 17,
                color: C.ink,
              },
              String(i),
            ),
          );
        }
      }

      // The checklist's words (FAQ topics; the fallback's checklist).
      const K = words.checklist;
      if (K) {
        if (K.headLines.length) {
          children.push(
            el(
              'div',
              {
                position: 'absolute',
                left: K.left + K.pad,
                top: K.top + K.pad - 4,
                width: K.width - K.pad * 2,
                display: 'flex',
                flexDirection: 'column',
                ...Z,
                fontSize: K.headSize,
                lineHeight: 1.1,
                color: C.espresso,
              },
              K.headLines.map((line) => el('div', { whiteSpace: 'nowrap' }, line)),
            ),
          );
        }
        for (const r of K.rows) {
          children.push(
            el(
              'div',
              {
                position: 'absolute',
                left: K.left + K.pad + K.box + 12,
                top: r.y,
                ...Z,
                fontSize: K.itemSize,
                lineHeight: 1.2,
                color: C.ink,
                whiteSpace: 'nowrap',
              },
              r.text,
            ),
          );
        }
      }

      // Her name tag, pinned to the photo: a paper tag like the site's .r-tag.
      if (content.nameTag && p.hasPhoto) {
        const N = CARD.nameTag;
        children.push(
          el('div', { position: 'absolute', left: N.left, bottom: N.bottom, display: 'flex' }, [
            img(notch(16, 62, C.paper, C.bronze), 16, 62, { alignSelf: 'center' }),
            el(
              'div',
              {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: 62,
                padding: '8px 14px 10px 8px',
                background: C.paper,
                borderRadius: '0 3px 3px 0',
                color: C.ink,
              },
              [
                ...(content.nameTag.role
                  ? [
                      el(
                        'div',
                        { ...GS, fontSize: N.role, color: C.espresso, whiteSpace: 'nowrap' },
                        content.nameTag.role,
                      ),
                    ]
                  : []),
                el(
                  'div',
                  {
                    ...Z,
                    fontSize: N.name,
                    lineHeight: 1,
                    letterSpacing: N.name * -0.02,
                    whiteSpace: 'nowrap',
                    marginTop: content.nameTag.role ? 4 : 0,
                  },
                  content.nameTag.name,
                ),
              ],
            ),
          ]),
        );
      }

      const tree = el(
        'div',
        { display: 'flex', position: 'relative', width: CARD.width, height: CARD.height },
        children,
      );
      const out = await satori(tree, { width: CARD.width, height: CARD.height, fonts });
      return new Resvg(out, { fitTo: { mode: 'original' } }).render().asPng();
    },
    async close() {},
  };
}
