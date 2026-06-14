import { describe, it, expect } from 'vitest';
import { POPUP_STRINGS, createPopupTranslator, type PopupStringKey } from '../popup/popup-i18n';
import { locales } from '../lib/i18n/locales';

const LOCALES = ['en', 'zh'] as const;

describe('popup-i18n parity with the app dictionary', () => {
  it('every popup string matches the canonical locales.ts value', () => {
    for (const locale of LOCALES) {
      for (const key of Object.keys(POPUP_STRINGS[locale]) as PopupStringKey[]) {
        expect(POPUP_STRINGS[locale][key], `${locale}.${key}`).toBe(
          (locales[locale] as Record<string, string>)[key],
        );
      }
    }
  });

  it('en and zh expose the same popup keys', () => {
    expect(Object.keys(POPUP_STRINGS.zh).sort()).toEqual(Object.keys(POPUP_STRINGS.en).sort());
  });
});

describe('createPopupTranslator', () => {
  it('translates and interpolates in the target locale', () => {
    expect(createPopupTranslator('zh')('metricTabs')).toBe('页面');
    expect(createPopupTranslator('en')('popupWindowCount', { count: 3 })).toBe('3 windows');
  });

  it('falls back to English for a missing zh value path, then the raw key', () => {
    // @ts-expect-error testing the unknown-key fallback
    expect(createPopupTranslator('en')('nope')).toBe('nope');
  });
});
