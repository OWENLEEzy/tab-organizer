import { describe, expect, it } from 'vitest';
import { ACCENT_OPTIONS, ACCENTS, isAccentKey } from '../config/themes';
import { DEFAULT_SETTINGS } from '../utils/storage';

describe('theme configuration', () => {
  it('uses a valid configured accent as the default theme', () => {
    expect(isAccentKey(DEFAULT_SETTINGS.theme)).toBe(true);
  });

  it('derives theme option keys from the accent registry', () => {
    expect(ACCENT_OPTIONS.map((option) => option.key)).toEqual(Object.keys(ACCENTS));
  });
});
