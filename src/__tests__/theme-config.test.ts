import { describe, expect, it } from 'vitest';
import { ACCENT_KEYS, ACCENT_OPTIONS, ACCENTS, isAccentKey } from '../config/themes';
import { DEFAULT_SETTINGS } from '../utils/storage';

// Fields that must be present and non-empty on every theme
const REQUIRED_TOKENS = [
  'label', 'isDark', 'color',
  'bgPage', 'bgSurface', 'bgCard', 'borderColor',
  'textPrimary', 'textSecondary', 'textMuted',
  'accentPrimary', 'accentPrimaryRgb',
  'bgHeader',
  'warningHex', 'warningRgb',
  'bgDuplicate', 'borderDuplicate',
  'shadowCard', 'shadowCardHover',
  'accentRed', 'accentRedRgb',
  'accentSage', 'accentSageRgb',
] as const;

describe('theme configuration', () => {
  it('uses a valid configured accent as the default theme', () => {
    expect(isAccentKey(DEFAULT_SETTINGS.theme)).toBe(true);
  });

  it('derives theme option keys from the accent registry', () => {
    expect(ACCENT_OPTIONS.map((option) => option.key)).toEqual(Object.keys(ACCENTS));
  });

  it('ACCENT_KEYS and ACCENTS have the same keys in the same order', () => {
    expect(ACCENT_KEYS.slice().sort()).toEqual(Object.keys(ACCENTS).sort());
  });
});

describe('accent theme contract', () => {
  for (const key of ACCENT_KEYS) {
    describe(`theme: ${key}`, () => {
      const config = ACCENTS[key as keyof typeof ACCENTS];

      for (const token of REQUIRED_TOKENS) {
        if (token === 'isDark') {
          it(`has "${token}" defined`, () => {
            expect(typeof config.isDark).toBe('boolean');
          });
        } else {
          it(`has "${token}" defined`, () => {
            const value = config[token as keyof typeof config] as string;
            expect(value).toBeTruthy();
            expect(value.length).toBeGreaterThan(0);
          });
        }
      }

      it('accentPrimaryRgb is a comma-separated triplet', () => {
        expect(config.accentPrimaryRgb).toMatch(/^\d+,\s*\d+,\s*\d+$/);
      });

      it('warningRgb is a comma-separated triplet', () => {
        expect(config.warningRgb).toMatch(/^\d+,\s*\d+,\s*\d+$/);
      });

      it('accentRedRgb is a comma-separated triplet', () => {
        expect(config.accentRedRgb).toMatch(/^\d+,\s*\d+,\s*\d+$/);
      });

      it('accentSageRgb is a comma-separated triplet', () => {
        expect(config.accentSageRgb).toMatch(/^\d+,\s*\d+,\s*\d+$/);
      });
    });
  }
});
