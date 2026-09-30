// Foundation, edit with care
// =============================================================================
// Ambient doodles: one faint botanical growing in from a corner of every
// section (2026-09-30)
// =============================================================================
// Background ambience, like the branches in the corners of Staci's own
// Instagram posts: each content section on a page gets one of the fine-line
// botanicals (src/assets/doodles/), very faint, behind everything, drawing itself in as
// the section scrolls into view. Which doodle goes where is
// src/lib/doodle-map.ts; how they look is `.dd-amb` in src/styles/doodle.css.
//
// Which sections: the top-level <section> elements inside <main>, except
//   - the page's opening hero (the first section; it has its own art),
//   - the closing Walnut band (.final: it already has the logo's sprig),
//   - anything marked data-no-doodle,
//   - sections shorter than 300px (a doodle would crowd them).
// Corners alternate top right, bottom left, bottom right, top left, so two
// neighbouring sections never hang one in the same place.
//
// Dark grounds (the ink and Walnut bands) get cream ink; light ones Espresso.
// The drawings are fetched once each, only when a section comes near the
// screen, from the same origin (so the CSP's connect-src 'self' covers it).
// No JavaScript: no doodles, and nothing else changes.
// =============================================================================

import { doodlesForPage, type DoodleName } from '@/lib/doodle-map';

const urls = import.meta.glob<string>('../assets/doodles/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
});
const urlFor = (name: DoodleName) => urls[`../assets/doodles/${name}.svg`];

const cache = new Map<string, Promise<string>>();
function fetchSvg(url: string): Promise<string> {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url)
        .then((r) => (r.ok ? r.text() : ''))
        .catch(() => ''),
    );
  }
  return cache.get(url)!;
}

const CORNERS = ['tr', 'bl', 'br', 'tl'] as const;

/** Is this section's ground dark? Walks up to the first painted background. */
function onDarkGround(el: HTMLElement): boolean {
  let node: HTMLElement | null = el;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(bg);
    if (m && (m[4] === undefined || Number(m[4]) > 0.5)) {
      const [r, g, b] = [m[1], m[2], m[3]].map((v) => Number(v) / 255) as [number, number, number];
      return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4;
    }
    node = node.parentElement;
  }
  return false;
}

export function initAmbientDoodles() {
  const main = document.querySelector('main');
  if (!main) return;
  const sections = Array.from(main.querySelectorAll<HTMLElement>('section')).filter(
    (s, i, all) =>
      // Top level only: not inside another section.
      !all.some((o) => o !== s && o.contains(s)) &&
      !s.hasAttribute('data-no-doodle') &&
      !s.classList.contains('final') &&
      !s.querySelector(':scope > .dd-amb-frame'),
  );
  // The first one is the page's hero.
  const targets = sections.slice(1).filter((s) => s.offsetHeight >= 300);
  if (targets.length === 0) return;
  const names = doodlesForPage(location.pathname, targets.length);

  const near = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        near.unobserve(e.target);
        void place(e.target as HTMLElement);
      }
    },
    { rootMargin: '400px 0px' },
  );

  async function place(section: HTMLElement) {
    const i = targets.indexOf(section);
    const name = names[i];
    const url = name && urlFor(name);
    if (!url) return;
    const svg = await fetchSvg(url);
    if (!svg.startsWith('<svg') || section.querySelector(':scope > .dd-amb-frame')) return;
    // The section becomes the doodle's frame: positioned (if it was not) and
    // its own stacking context, so z-index -1 puts the drawing above the
    // section's ground but behind all of its content.
    if (getComputedStyle(section).position === 'static') section.style.position = 'relative';
    section.style.isolation = 'isolate';
    // A clipping frame the size of the section, so the stem can run off its
    // edge, holding the drawing in one corner.
    const frame = document.createElement('span');
    frame.className = 'dd-amb-frame';
    frame.setAttribute('aria-hidden', 'true');
    const el = document.createElement('span');
    el.className = `dd dd--scroll dd-amb dd-amb--${CORNERS[i % CORNERS.length]}`;
    if (onDarkGround(section)) el.classList.add('dd-amb--dark');
    el.innerHTML = svg;
    frame.append(el);
    section.prepend(frame);
  }

  targets.forEach((s) => near.observe(s));
}
