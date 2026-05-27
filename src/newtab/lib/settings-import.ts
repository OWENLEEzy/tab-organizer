import type { AppSettings, CustomGroup } from '../../types';
import { isAccentKey } from '../../config/themes';
import { isGroupSortOption, normalizeGroupSortBy } from '../../config/group-sort';

type ImportedSettings = Partial<Omit<AppSettings, 'keyBindings'>> & {
  keyBindings?: Partial<AppSettings['keyBindings']>;
};

const LANGUAGES = new Set(['en', 'zh', 'system']);
const KEY_BINDING_KEYS = [
  'switchSpaceN',
  'switchSpaceAll',
  'cyclePrev',
  'cycleNext',
  'focusSearch',
  'clearFilter',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isCustomGroup(value: unknown): value is CustomGroup {
  if (!isRecord(value)) return false;
  return typeof value.groupKey === 'string' && typeof value.groupLabel === 'string';
}

export function parseImportedSettings(input: unknown): ImportedSettings {
  if (!isRecord(input)) return {};

  const parsed: ImportedSettings = {};

  if (isAccentKey(input.theme)) {
    parsed.theme = input.theme;
  }

  if (typeof input.language === 'string' && LANGUAGES.has(input.language)) {
    parsed.language = input.language as AppSettings['language'];
  }

  if (typeof input.soundEnabled === 'boolean') {
    parsed.soundEnabled = input.soundEnabled;
  }

  if (typeof input.confettiEnabled === 'boolean') {
    parsed.confettiEnabled = input.confettiEnabled;
  }

  if (typeof input.maxChipsVisible === 'number' && Number.isFinite(input.maxChipsVisible)) {
    parsed.maxChipsVisible = input.maxChipsVisible;
  }

  if (typeof input.staleThresholdDays === 'number' && Number.isFinite(input.staleThresholdDays)) {
    parsed.staleThresholdDays = input.staleThresholdDays;
  }

  if (Array.isArray(input.customGroups)) {
    parsed.customGroups = input.customGroups.filter(isCustomGroup);
  }

  if (input.groupSortBy === 'default' || isGroupSortOption(input.groupSortBy)) {
    parsed.groupSortBy = normalizeGroupSortBy(input.groupSortBy);
  }

  if (isRecord(input.keyBindings)) {
    const keyBindings: Partial<AppSettings['keyBindings']> = {};
    for (const key of KEY_BINDING_KEYS) {
      const binding = input.keyBindings[key];
      if (typeof binding === 'string') {
        keyBindings[key] = binding;
      }
    }
    if (Object.keys(keyBindings).length > 0) {
      parsed.keyBindings = keyBindings;
    }
  }

  return parsed;
}
