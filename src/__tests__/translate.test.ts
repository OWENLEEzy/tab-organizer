import { describe, it, expect } from 'vitest';
import { resolveLocale, createTranslator } from '../lib/i18n/translate';

describe('resolveLocale', () => {
  it('returns an explicit en/zh preference as-is', () => {
    expect(resolveLocale('en')).toBe('en');
    expect(resolveLocale('zh')).toBe('zh');
  });

  it('falls back to navigator language for "system"', () => {
    expect(resolveLocale('system', 'zh-CN')).toBe('zh');
    expect(resolveLocale('system', 'en-US')).toBe('en');
  });

  it('defaults to en when undefined and no navigator language', () => {
    expect(resolveLocale(undefined)).toBe('en');
    expect(resolveLocale('system', undefined)).toBe('en');
  });
});

describe('createTranslator', () => {
  it('translates a known key in the target locale', () => {
    const t = createTranslator('zh');
    expect(t('metricTabs')).toBe('页面');
  });

  it('interpolates params', () => {
    const t = createTranslator('en');
    expect(t('popupWindowCount', { count: 3 })).toBe('3 windows');
  });

  it('returns the template unchanged when no params are given', () => {
    const t = createTranslator('en');
    expect(t('popupOrganize')).toBe('Organize');
  });

  it('falls back to the raw key for an unknown key', () => {
    const t = createTranslator('en');
    // @ts-expect-error testing the unknown-key fallback path
    expect(t('definitelyNotAKey')).toBe('definitelyNotAKey');
  });
});
