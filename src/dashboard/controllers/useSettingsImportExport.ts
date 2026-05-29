import { useCallback } from 'react';
import type { CustomGroup, Section, SectionAssignment } from '../../types';
import type { SettingsStore } from '../../stores/settings-store';
import type { TabStore } from '../../stores/tab-store';
import { parseImportedSettings } from '../lib/settings-import';
import { useI18n } from '../hooks/useI18n';

interface UseSettingsImportExportOptions {
  settingsStore: SettingsStore;
  tabStore: TabStore;
  showToast: (message: string) => void;
}

type LegacyGroupAssignment = {
  productKey?: unknown;
  itemType?: unknown;
  itemKey?: unknown;
  groupId?: unknown;
  sectionId?: unknown;
  order?: unknown;
};

type ImportedAutoRule = NonNullable<Section['autoRules']>[number];

function normalizeImportedSections(value: unknown): Section[] | null {
  if (!Array.isArray(value)) return null;

  return value
    .filter((section): section is Record<string, unknown> => (
      section != null &&
      typeof section === 'object' &&
      typeof (section as Record<string, unknown>).id === 'string' &&
      typeof (section as Record<string, unknown>).name === 'string'
    ))
    .map((section, index) => ({
      id: section.id as string,
      name: (section.name as string).trim() || 'Untitled',
      order: Number.isFinite(section.order) ? Number(section.order) : index,
      emoji: typeof section.emoji === 'string' ? section.emoji : undefined,
      autoRules: Array.isArray(section.autoRules)
        ? section.autoRules.filter((rule): rule is ImportedAutoRule => (
            rule != null &&
            typeof rule === 'object' &&
            (rule as Record<string, unknown>).type === 'hostname' &&
            typeof (rule as Record<string, unknown>).pattern === 'string'
          ))
        : undefined,
    }));
}

function normalizeImportedAssignments(value: unknown): SectionAssignment[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((assignment): assignment is LegacyGroupAssignment => assignment != null && typeof assignment === 'object')
    .flatMap((assignment, index): SectionAssignment[] => {
      const productKey = typeof assignment.productKey === 'string'
        ? assignment.productKey
        : assignment.itemType === 'product' && typeof assignment.itemKey === 'string'
          ? assignment.itemKey
          : '';
      const sectionId = typeof assignment.sectionId === 'string'
        ? assignment.sectionId
        : typeof assignment.groupId === 'string'
          ? assignment.groupId
          : '';

      if (!productKey || !sectionId) return [];

      return [{
        productKey,
        sectionId,
        order: Number.isFinite(assignment.order) ? Number(assignment.order) : index,
      }];
    });
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
      unsectionedProductKeys: tabStore.unsectionedProductKeys,
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
        if (importedSettings.language) await settingsStore.setLanguage(importedSettings.language);
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

      const importedSections = normalizeImportedSections(parsed.sections)
        ?? normalizeImportedSections(parsed.manualGroups);

      if (importedSections) {
        const rawAssignments = Array.isArray(parsed.sectionAssignments)
          ? parsed.sectionAssignments
          : parsed.groupAssignments;
        const sectionAssignments = normalizeImportedAssignments(rawAssignments);
        const rawUnsectioned = parsed.unsectionedProductKeys ?? parsed.unsortedOverrides;
        const unsectionedProductKeys = Array.isArray(rawUnsectioned)
          ? (rawUnsectioned as unknown[]).filter((value): value is string => typeof value === 'string')
          : [];
        await tabStore.importBackup(importedSections, sectionAssignments, unsectionedProductKeys);
      }

      showToast(t('toastSettingsImported'));
    } catch (err) {
      console.error('[Tab Organizer] Failed to import settings:', err);
      showToast(t('toastImportFailed'));
    }
  }, [settingsStore, tabStore, showToast, t]);

  return { handleExportConfig, handleImportConfig };
}
