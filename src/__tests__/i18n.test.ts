import { describe, it, expect } from 'vitest';
import { locales } from '../lib/i18n/locales';

describe('i18n locales dictionary symmetry', () => {
  it('should have locales with both en and zh languages', () => {
    expect(locales).toHaveProperty('en');
    expect(locales).toHaveProperty('zh');
  });

  it('should have identical translation keys in both en and zh dictionaries', () => {
    const enKeys = Object.keys(locales.en).sort();
    const zhKeys = Object.keys(locales.zh).sort();

    const missingInZh = enKeys.filter(k => !zhKeys.includes(k));
    const missingInEn = zhKeys.filter(k => !enKeys.includes(k));

    expect(missingInZh).toEqual([]);
    expect(missingInEn).toEqual([]);
  });
});
