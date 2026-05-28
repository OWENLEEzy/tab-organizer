import { useCallback } from 'react';
import type { CustomGroup } from '../../types';
import type { SettingsStore } from '../../stores/settings-store';
import type { TabStore } from '../../stores/tab-store';
import { parseImportedSettings } from '../lib/settings-import';
import { useI18n } from '../hooks/useI18n';

interface UseSettingsImportExportOptions {
  settingsStore: SettingsStore;
  tabStore: TabStore;
  showToast: (message: string) => void;
}

export function useSettingsImportExport({
  settingsStore,
  tabStore,
  showToast,
}: UseSettingsImportExportOptions) {
  const { t } = useI18n();

  const handleExportConfig = useCallback(() => {
    const config = {
      version: '1.0',
      settings: settingsStore.settings,
      sections: tabStore.sections,
      sectionAssignments: tabStore.sectionAssignments,
      unsortedOverrides: tabStore.unsortedOverrides,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `tab-organizer-settings-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
    showToast(t('toastSettingsExported'));
  }, [settingsStore, tabStore, showToast, t]);

  const handleImportConfig = useCallback(async (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON');
      }

      const configVersion = parsed.version;
      if (typeof configVersion !== 'string' || !/^\d+\.\d+$/.test(configVersion)) {
        throw new Error('Invalid or missing config version');
      }

      if (parsed.settings && typeof parsed.settings === 'object') {
        const importedSettings = parseImportedSettings(parsed.settings);
        if (importedSettings.theme) await settingsStore.setTheme(importedSettings.theme);
        if (importedSettings.soundEnabled !== undefined && importedSettings.soundEnabled !== settingsStore.settings.soundEnabled) await settingsStore.toggleSound();
        if (importedSettings.confettiEnabled !== undefined && importedSettings.confettiEnabled !== settingsStore.settings.confettiEnabled) await settingsStore.toggleConfetti();
        if (importedSettings.maxChipsVisible !== undefined) await settingsStore.setMaxChipsVisible(importedSettings.maxChipsVisible);
        if (importedSettings.staleThresholdDays !== undefined) await settingsStore.setStaleThresholdDays(importedSettings.staleThresholdDays);
        if (importedSettings.groupSortBy) await settingsStore.setGroupSortBy(importedSettings.groupSortBy);

        if (importedSettings.customGroups) {
          await Promise.all(settingsStore.settings.customGroups.map(cg =>
            settingsStore.removeCustomGroup(cg.groupKey)
          ));
          await Promise.all(importedSettings.customGroups.map((cg: CustomGroup) =>
            settingsStore.addCustomGroup(cg)
          ));
        }

        if (importedSettings.keyBindings) {
          const updates: Promise<void>[] = [];
          for (const [key, binding] of Object.entries(importedSettings.keyBindings)) {
            updates.push(settingsStore.updateKeyBinding(key as keyof typeof settingsStore.settings.keyBindings, binding));
          }
          await Promise.all(updates);
        }
      }

      if (Array.isArray(parsed.sections)) {
        const sections = parsed.sections;
        const sectionAssignments = Array.isArray(parsed.sectionAssignments) ? parsed.sectionAssignments : [];
        const unsortedOverrides = Array.isArray(parsed.unsortedOverrides)
          ? (parsed.unsortedOverrides as unknown[]).filter((value): value is string => typeof value === 'string')
          : [];
        await tabStore.importBackup(sections, sectionAssignments, unsortedOverrides);
      }

      showToast(t('toastSettingsImported'));
    } catch (err) {
      console.error('[Tab Organizer] Failed to import settings:', err);
      showToast(t('toastImportFailed'));
    }
  }, [settingsStore, tabStore, showToast, t]);

  return { handleExportConfig, handleImportConfig };
}