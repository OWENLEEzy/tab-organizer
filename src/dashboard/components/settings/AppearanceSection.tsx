import React from 'react';
import { ACCENT_OPTIONS, type AccentKey } from '../../../config/themes';
import { useI18n } from '../../hooks/useI18n';
import { SelectRow } from './SelectRow';

interface AppearanceSectionProps {
  theme: AccentKey;
  language: 'en' | 'zh' | 'system';
  viewMode: 'cards' | 'table';
  maxChipsVisible: number;
  onSetTheme: (theme: AccentKey) => void;
  onSetLanguage: (language: 'en' | 'zh' | 'system') => void;
  onViewModeChange: (mode: 'cards' | 'table') => void;
  onSetMaxChipsVisible: (count: number) => void;
}

const MAX_CHIPS_VALUES = [4, 6, 8, 12, 16, 20, 24] as const;

export function AppearanceSection({
  theme,
  language,
  viewMode,
  maxChipsVisible,
  onSetTheme,
  onSetLanguage,
  onViewModeChange,
  onSetMaxChipsVisible,
}: AppearanceSectionProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      <SelectRow
        id="setting-view-mode"
        label={t('settingsViewMode')}
        value={viewMode}
        options={[
          { value: 'cards', label: t('settingsViewModeCards') },
          { value: 'table', label: t('settingsViewModeTable') },
        ]}
        onChange={(val) => onViewModeChange(val as 'cards' | 'table')}
      />

      <SelectRow
        id="setting-language"
        label={t('settingsLang')}
        value={language}
        options={[
          { value: 'system', label: t('settingsLangSystem') },
          { value: 'en', label: t('settingsLangEn') },
          { value: 'zh', label: t('settingsLangZh') },
        ]}
        onChange={(val) => onSetLanguage(val as 'en' | 'zh' | 'system')}
      />

      <SelectRow
        id="setting-theme"
        label={t('settingsTheme')}
        value={theme}
        options={ACCENT_OPTIONS.map(({ key, labelKey }) => ({ value: key, label: t(labelKey) }))}
        onChange={onSetTheme}
      />

      <SelectRow
        id="setting-max-chips"
        label={t('settingsMaxChips')}
        value={maxChipsVisible}
        options={MAX_CHIPS_VALUES.map((value) => ({
          value,
          label: value === 8
            ? t('settingsOptionChipsCountDefault', { count: value })
            : t('settingsOptionChipsCount', { count: value }),
        }))}
        onChange={onSetMaxChipsVisible}
      />
    </div>
  );
}
