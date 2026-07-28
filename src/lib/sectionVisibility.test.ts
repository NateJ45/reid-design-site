import { describe, it, expect } from 'vitest';
import { getSectionVisibility } from './sectionVisibility';

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
