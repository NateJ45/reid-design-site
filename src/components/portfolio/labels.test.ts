import { describe, expect, it } from 'vitest';
import { humanizeEnum } from './labels';

describe('humanizeEnum', () => {
  it('turns a camelCase dropdown value into a sentence-case label', () => {
    expect(humanizeEnum('livingRoom')).toBe('Living room');
    expect(humanizeEnum('modernCoastal')).toBe('Modern coastal');
    expect(humanizeEnum('kitchen')).toBe('Kitchen');
  });

  it('copes with hyphens, underscores and nothing at all', () => {
    expect(humanizeEnum('mid-century_modern')).toBe('Mid century modern');
    expect(humanizeEnum('')).toBe('');
    expect(humanizeEnum(undefined)).toBe('');
    expect(humanizeEnum(null)).toBe('');
  });
});
