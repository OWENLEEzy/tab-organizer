import React from 'react';
import { useI18n } from '../../hooks/useI18n';

interface BackupSectionProps {
  onExportSettings: () => void;
  onImportSettings: (json: string) => Promise<void>;
  appVersion: string;
}

export function BackupSection({
  onExportSettings,
  onImportSettings,
  appVersion,
}: BackupSectionProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
          {t('settingsBackupTitle')}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExportSettings}
            className="flex-1 rounded-chip font-body border border-border-color hover:bg-surface-light dark:hover:bg-surface-dark text-text-primary-light dark:text-text-primary-dark min-h-[var(--spacing-button-height)] cursor-pointer text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {t('settingsBackupExportBtn')}
          </button>
          <label
            className="flex-1 rounded-chip font-body border border-border-color hover:bg-surface-light dark:hover:bg-surface-dark text-text-primary-light dark:text-text-primary-dark min-h-[var(--spacing-button-height)] cursor-pointer text-xs transition-colors flex items-center justify-center gap-1.5 text-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            {t('settingsBackupImportBtn')}
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (evt) => {
                  const txt = evt.target?.result as string;
                  if (txt) {
                    await onImportSettings(txt);
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </div>

      <hr className="border-border-color/20" />

      <div className="rounded-md border border-border-color/50 bg-surface-light/40 p-3 dark:bg-surface-dark/40">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="font-body text-text-primary-light dark:text-text-primary-dark block text-sm font-medium">
              {t('settingsVersionTitle')}
            </span>
            <p className="font-body text-text-secondary mt-1 text-xs leading-relaxed">
              {t('settingsVersionDesc')}
            </p>
          </div>
          <span className="font-body rounded-sm bg-bg-card px-2 py-1 text-xs font-semibold text-text-secondary">
            v{appVersion}
          </span>
        </div>
      </div>
    </div>
  );
}
