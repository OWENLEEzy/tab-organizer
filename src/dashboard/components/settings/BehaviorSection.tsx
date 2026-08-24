import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { SelectRow } from './SelectRow';
import { ToggleRow } from './ToggleRow';

interface BehaviorSectionProps {
  staleThresholdDays: number;
  onSetStaleThresholdDays: (days: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  confettiEnabled: boolean;
  onToggleConfetti: () => void;
  onResetSortOrder: () => void;
}

const STALE_THRESHOLD_VALUES = [1, 2, 3, 5, 7, 14, 30] as const;

export function BehaviorSection({
  staleThresholdDays,
  onSetStaleThresholdDays,
  soundEnabled,
  onToggleSound,
  confettiEnabled,
  onToggleConfetti,
  onResetSortOrder,
}: BehaviorSectionProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      <SelectRow
        id="setting-stale-threshold"
        label={t('settingsStaleThreshold')}
        value={staleThresholdDays}
        options={STALE_THRESHOLD_VALUES.map((value) => ({
          value,
          label: value === 3
            ? t('settingsOptionDaysCountDefault', { count: value })
            : t('settingsOptionDaysCount', { count: value }),
        }))}
        onChange={onSetStaleThresholdDays}
      />

      <ToggleRow
        id="setting-sound"
        label={t('settingsOptionsSound')}
        checked={soundEnabled}
        onChange={onToggleSound}
      />

      <ToggleRow
        id="setting-confetti"
        label={t('settingsOptionsConfetti')}
        checked={confettiEnabled}
        onChange={onToggleConfetti}
      />

      <hr className="border-border-color/20" />

      <div className="flex items-center justify-between">
        <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm">
          {t('settingsSortOrderTitle')}
        </span>
        <button
          type="button"
          onClick={onResetSortOrder}
          className="rounded-chip font-body text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-primary/40 min-h-[var(--spacing-button-height)] cursor-pointer px-3 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('settingsSortOrderBtn')}
        </button>
      </div>
    </div>
  );
}
