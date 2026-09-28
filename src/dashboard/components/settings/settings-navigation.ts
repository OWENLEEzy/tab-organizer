/**
 * Settings navigation, grouped by what the user is trying to do rather than by
 * the product's data model. Light preferences and heavy customization no longer
 * share one flat tab strip — see design spec §3.2.
 */

import type { TranslationKey } from '../../hooks/useI18n';

export type SettingsPageId =
  | 'appearance'
  | 'behavior'
  | 'shortcuts'
  | 'section-rules'
  | 'product-rules'
  | 'backup';

interface SettingsNavPage {
  id: SettingsPageId;
  labelKey: TranslationKey;
}

export interface SettingsNavGroup {
  labelKey: TranslationKey;
  pages: readonly SettingsNavPage[];
}

export const SETTINGS_NAVIGATION: readonly SettingsNavGroup[] = [
  {
    labelKey: 'settingsGroupPreferences',
    pages: [
      { id: 'appearance', labelKey: 'settingsNavAppearance' },
      { id: 'behavior', labelKey: 'settingsNavBehavior' },
      { id: 'shortcuts', labelKey: 'settingsTabShortcuts' },
    ],
  },
  {
    labelKey: 'settingsGroupCustomize',
    pages: [
      { id: 'section-rules', labelKey: 'settingsNavSectionRules' },
      { id: 'product-rules', labelKey: 'settingsNavProductRules' },
    ],
  },
  {
    labelKey: 'settingsGroupAbout',
    pages: [{ id: 'backup', labelKey: 'settingsNavBackup' }],
  },
];

export const DEFAULT_SETTINGS_PAGE: SettingsPageId = 'appearance';
