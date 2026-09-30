// The eight never-launched sections removed on 2026-09-30 (journal, shop, style
// quiz, budget calculator, guides, press, gift certificates, resources hub).
// Their addresses forward permanently from public/_redirects; these tests pin
// the rules so a later edit to that file cannot quietly drop one, reorder the
// Studio proxy below them, or leave a page behind that the rule would shadow.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { RESERVED_SLUGS } from '../sanity/preview-routes';

/** [from, to] for every retired address, bare and with a trailing slash. */
const EXPECTED: [string, string][] = [
  ['/journal', '/'],
  ['/journal/', '/'],
  ['/journal/*', '/'],
  ['/shop', '/'],
  ['/shop/', '/'],
  ['/quiz', '/services/'],
  ['/quiz/', '/services/'],
  ['/calculator', '/services/'],
  ['/calculator/', '/services/'],
  ['/guides', '/'],
  ['/guides/', '/'],
  ['/guides/*', '/'],
  ['/press', '/about/'],
  ['/press/', '/about/'],
  ['/gift-certificates', '/contact/'],
  ['/gift-certificates/', '/contact/'],
  ['/resources', '/faq/'],
  ['/resources/', '/faq/'],
];

/** The rule lines of public/_redirects, comments and blanks dropped. */
function rules(): string[][] {
  return readFileSync('public/_redirects', 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split(/\s+/));
}

describe('retired-section redirects (public/_redirects)', () => {
  it('forwards every retired address permanently to its replacement', () => {
    const all = rules();
    for (const [from, to] of EXPECTED) {
      expect(all, from).toContainEqual([from, to, '301']);
    }
  });

  it('keeps the Studio deep-link proxy as the first rule', () => {
    expect(rules()[0]).toEqual(['/studio/*', '/studio/', '200']);
  });

  it('lists each source once, so no rule is dead behind an earlier one', () => {
    const froms = rules().map((r) => r[0]);
    expect(new Set(froms).size).toBe(froms.length);
  });

  it('never points a retired address at another retired address', () => {
    const retired = new Set(EXPECTED.map(([from]) => from.replace(/\/\*?$/, '')));
    for (const [, to] of EXPECTED) {
      expect(retired.has(to.replace(/\/$/, '')), to).toBe(false);
    }
  });

  it('leaves no page file behind that a rule would shadow', () => {
    for (const page of [
      'src/pages/journal',
      'src/pages/guides',
      'src/pages/shop.astro',
      'src/pages/quiz.astro',
      'src/pages/calculator.astro',
      'src/pages/press.astro',
      'src/pages/gift-certificates.astro',
      'src/pages/resources.astro',
    ]) {
      expect(existsSync(page), page).toBe(false);
    }
  });

  it('keeps every retired slug reserved, so a custom page cannot hide behind a rule', () => {
    for (const [from] of EXPECTED) {
      const slug = from.replace(/^\//, '').replace(/\/\*?$/, '');
      expect(RESERVED_SLUGS.has(slug), slug).toBe(true);
    }
  });
});
