import { describe, it, expect } from 'vitest';
import { getSectionVisibility, isHiddenSectionPath, SECTION_ROUTES } from './sectionVisibility';

describe('getSectionVisibility', () => {
  it('treats an undefined input as every section visible', () => {
    expect(getSectionVisibility(undefined)).toEqual({ portfolio: true, eDesign: true });
  });

  it('treats a null input as every section visible', () => {
    // Same as undefined: the rule is `value !== false`, and null !== false.
    const visible = getSectionVisibility(null);
    expect(visible.portfolio).toBe(true);
    expect(visible.eDesign).toBe(true);
  });

  it('treats null and unset fields on an object as visible, and only explicit false as hidden', () => {
    expect(getSectionVisibility({ showPortfolio: false })).toEqual({
      portfolio: false,
      eDesign: true,
    });
    expect(getSectionVisibility({ showPortfolio: null, showEDesign: false })).toEqual({
      portfolio: true,
      eDesign: false,
    });
  });

  it('hides every section that is explicitly set to false, independent of the others', () => {
    expect(getSectionVisibility(allOffRaw())).toEqual({ portfolio: false, eDesign: false });
  });

  it('ignores the retired switches still stored on siteSettings', () => {
    // The eight removed sections' switches (showJournal, showShop, ...) stay in
    // the dataset as hidden fields (2026-09-30). They must not leak into the map.
    const raw = { showJournal: false, showShop: false } as unknown as Parameters<
      typeof getSectionVisibility
    >[0];
    expect(getSectionVisibility(raw)).toEqual({ portfolio: true, eDesign: true });
  });
});

// The sitemap filter in astro.config.mjs leans on isHiddenSectionPath to keep
// the meta-refresh stubs of switched-off sections out of sitemap-0.xml. These
// pin the prefix matching so a hidden section drops its index AND its detail
// pages, and a visible neighbour with a similar name is never caught.
describe('isHiddenSectionPath', () => {
  const allOff = getSectionVisibility(allOffRaw());

  it('hides the index of every switched-off section', () => {
    for (const prefixes of Object.values(SECTION_ROUTES)) {
      for (const prefix of prefixes) {
        expect(isHiddenSectionPath(`${prefix}/`, allOff), prefix).toBe(true);
        expect(isHiddenSectionPath(prefix, allOff), prefix).toBe(true);
      }
    }
  });

  it('hides detail pages under a hidden section', () => {
    expect(isHiddenSectionPath('/portfolio/before-after/', allOff)).toBe(true);
    expect(isHiddenSectionPath('/portfolio/a-project/', allOff)).toBe(true);
  });

  it('never hides a page that is not a section, or a look-alike slug', () => {
    for (const path of [
      '/',
      '/about/',
      '/contact/',
      '/privacy/',
      '/portfolio-tips/',
      '/e-designers/',
    ]) {
      expect(isHiddenSectionPath(path, allOff), path).toBe(false);
    }
  });

  it('hides nothing when every flag is unset (the fail-open default)', () => {
    const allOn = getSectionVisibility(null);
    for (const prefixes of Object.values(SECTION_ROUTES)) {
      for (const prefix of prefixes) {
        expect(isHiddenSectionPath(`${prefix}/`, allOn), prefix).toBe(false);
      }
    }
  });

  it('matches the live settings: e-design visible, portfolio hidden', () => {
    const live = getSectionVisibility({ showPortfolio: false, showEDesign: true });
    expect(isHiddenSectionPath('/e-design/', live)).toBe(false);
    expect(isHiddenSectionPath('/portfolio/', live)).toBe(true);
  });
});

function allOffRaw() {
  return { showPortfolio: false, showEDesign: false };
}
