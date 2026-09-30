// Foundation, edit with care
// =============================================================================
// The doodles, as markup (inlined at build) and as URLs (fetched on demand)
// =============================================================================
//   doodleMarkup(name)  the SVG text, for Doodle.astro to inline, which is what
//                       lets CSS draw each stroke in.
//   doodleUrls()        name -> hashed same-origin URL, for the desktop header's
//                       hover cards: they fetch a drawing the first time a link
//                       is pointed at, so no page carries every doodle.
// Which page gets which doodle: src/lib/doodle-map.ts.
// =============================================================================

import type { DoodleName } from './doodle-map';

const markup = import.meta.glob<string>('../assets/doodles/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const urls = import.meta.glob<string>('../assets/doodles/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
});

const key = (name: DoodleName) => `../assets/doodles/${name}.svg`;

export function doodleMarkup(name: DoodleName): string | null {
  return markup[key(name)] ?? null;
}

export function doodleUrl(name: DoodleName): string | null {
  return urls[key(name)] ?? null;
}
