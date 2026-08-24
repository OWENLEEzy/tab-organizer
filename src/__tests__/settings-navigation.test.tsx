import { describe, it, expect } from 'vitest';
import { SETTINGS_NAVIGATION } from '../dashboard/components/settings/settings-navigation';
import { locales } from '../lib/i18n/locales';

describe('SETTINGS_NAVIGATION', () => {
  it('groups pages by intent, not by data model', () => {
    expect(SETTINGS_NAVIGATION.map((g) => g.labelKey)).toEqual([
      'settingsGroupPreferences',
      'settingsGroupCustomize',
      'settingsGroupAbout',
    ]);
  });

  it('lists every page exactly once', () => {
    const ids = SETTINGS_NAVIGATION.flatMap((g) => g.pages.map((p) => p.id));
    expect(ids).toEqual([
      'appearance', 'behavior', 'shortcuts', 'section-rules', 'product-rules', 'backup',
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only translation keys that exist in both locales', () => {
    const keys = SETTINGS_NAVIGATION.flatMap((g) => [g.labelKey, ...g.pages.map((p) => p.labelKey)]);
    for (const key of keys) {
      expect(locales.en).toHaveProperty(key);
      expect(locales.zh).toHaveProperty(key);
    }
  });

  it('no longer exposes the old model-named tabs', () => {
    expect(locales.en).not.toHaveProperty('settingsTabTab');
    expect(locales.en).not.toHaveProperty('settingsTabGroup');
    expect(locales.en).not.toHaveProperty('settingsTabSection');
    expect(locales.en).not.toHaveProperty('settingsTabSystem');
  });
});
