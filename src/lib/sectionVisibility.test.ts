import { describe, it, expect } from 'vitest';
import { getSectionVisibility, isHiddenSectionPath, SECTION_ROUTES } from './sectionVisibility';

describe('getSectionVisibility', () => {
  it('treats an undefined input as every section visible', () => {
    const visible = getSectionVisibility(undefined);
    expect(visible).toEqual({
      portfolio: true,
      journal: true,
      shop: true,
      eDesign: true,
      giftCertificates: true,
      press: true,
      resources: true,
      guides: true,
      styleQuiz: true,
      budgetCalculator: true,
    });
  });

  it('treats a null input as every section visible', () => {
    // Same as undefined: the rule is `value !== false`, and null !== false.
    const visible = getSectionVisibility(null);
    expect(visible.portfolio).toBe(true);
    expect(visible.budgetCalculator).toBe(true);
  });

  it('treats null and unset fields on an object as visible, and only explicit false as hidden', () => {
    const visible = getSectionVisibility({
      showPortfolio: false,
      showJournal: null,
      showShop: true,
      // showEDesign left unset entirely
    });
    expect(visible.portfolio).toBe(false);
    expect(visible.journal).toBe(true);
    expect(visible.shop).toBe(true);
    expect(visible.eDesign).toBe(true);
  });

  it('hides every section that is explicitly set to false, independent of the others', () => {
    const visible = getSectionVisibility({
      showPortfolio: false,
      showJournal: false,
      showShop: false,
      showEDesign: false,
      showGiftCertificates: false,
      showPress: false,
      showResources: false,
      showGuides: false,
      showStyleQuiz: false,
      showBudgetCalculator: false,
    });
    expect(visible).toEqual({
      portfolio: false,
      journal: false,
      shop: false,
      eDesign: false,
      giftCertificates: false,
      press: false,
      resources: false,
      guides: false,
      styleQuiz: false,
      budgetCalculator: false,
    });
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
    expect(isHiddenSectionPath('/journal/some-post/', allOff)).toBe(true);
    expect(isHiddenSectionPath('/guides/a-guide/', allOff)).toBe(true);
  });

  it('never hides a page that is not a section, or a look-alike slug', () => {
    for (const path of [
      '/',
      '/about/',
      '/contact/',
      '/privacy/',
      '/portfolio-tips/',
      '/shopping/',
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

  it('matches the live 2026-09-28 settings: e-design visible, the other nine hidden', () => {
    const live = getSectionVisibility({ ...allOffRaw(), showEDesign: true });
    expect(isHiddenSectionPath('/e-design/', live)).toBe(false);
    expect(isHiddenSectionPath('/portfolio/', live)).toBe(true);
    expect(isHiddenSectionPath('/calculator/', live)).toBe(true);
  });
});

function allOffRaw() {
  return {
    showPortfolio: false,
    showJournal: false,
    showShop: false,
    showEDesign: false,
    showGiftCertificates: false,
    showPress: false,
    showResources: false,
    showGuides: false,
    showStyleQuiz: false,
    showBudgetCalculator: false,
  };
}
