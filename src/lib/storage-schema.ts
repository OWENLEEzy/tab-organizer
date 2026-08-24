import type {
  StorageSchema,
  AppSettings,
  Section,
  SectionAssignment,
  SectionAutoRule,
  ViewMode,
  RecoverySnapshot,
} from '../types';
import { recoveryUrlSignature } from './recovery-snapshots';
import { normalizeKeyword } from './section-keywords';
import { DEFAULT_ACCENT, isAccentKey } from '../config/themes';
import { DEFAULT_GROUP_SORT, normalizeGroupSortBy } from '../config/group-sort';

export const CURRENT_SCHEMA_VERSION = 6;

function isRealTab(url: string): boolean {
  const browserInternalPrefixes = [
    'chrome://',
    'chrome-extension://',
    'chrome-search://',
    'devtools://',
    'about:',
    'edge://',
    'brave://',
  ];
  const normalized = url.trim().toLowerCase();
  const target = normalized.startsWith('view-source:')
    ? normalized.slice('view-source:'.length)
    : normalized;

  return (
    target !== '' &&
    !browserInternalPrefixes.some((prefix) => target.startsWith(prefix))
  );
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: DEFAULT_ACCENT,
  language: 'system',
  soundEnabled: true,
  confettiEnabled: true,
  maxChipsVisible: 8,
  staleThresholdDays: 3,
  customGroups: [
    { hostnameEndsWith: '.substack.com', groupKey: 'substack', groupLabel: "Author's Substack" },
    { hostnameEndsWith: '.github.io', groupKey: 'github-pages', groupLabel: 'GitHub Pages' },
  ],
  landingPagePatterns: [],
  keyBindings: {
    switchSectionN: 'Meta+{n}',
    switchSectionAll: 'Meta+0',
    cyclePrev: 'ArrowLeft',
    cycleNext: 'ArrowRight',
    focusSearch: '/',
    clearFilter: 'Escape',
  },
  groupSortBy: DEFAULT_GROUP_SORT,
};

export function isViewMode(value: unknown): value is ViewMode {
  return value === 'cards' || value === 'table';
}

type LegacyKeyBindings = Partial<AppSettings['keyBindings']> & {
  switchSpaceN?: unknown;
  switchSpaceAll?: unknown;
};

export function normalizeKeyBindings(value: unknown): AppSettings['keyBindings'] {
  const defaults = DEFAULT_SETTINGS.keyBindings;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaults;
  }

  const candidate = value as LegacyKeyBindings;
  const switchSectionN = typeof candidate.switchSectionN === 'string'
    ? candidate.switchSectionN
    : typeof candidate.switchSpaceN === 'string'
      ? candidate.switchSpaceN
      : typeof candidate.switchSpaceN === 'number'
        ? String(candidate.switchSpaceN)
        : defaults.switchSectionN;
  const switchSectionAll = typeof candidate.switchSectionAll === 'string'
    ? candidate.switchSectionAll
    : typeof candidate.switchSpaceAll === 'string'
      ? candidate.switchSpaceAll
      : typeof candidate.switchSpaceAll === 'number'
        ? String(candidate.switchSpaceAll)
        : defaults.switchSectionAll;

  return {
    switchSectionN,
    switchSectionAll,
    cyclePrev: typeof candidate.cyclePrev === 'string' ? candidate.cyclePrev : defaults.cyclePrev,
    cycleNext: typeof candidate.cycleNext === 'string' ? candidate.cycleNext : defaults.cycleNext,
    focusSearch: typeof candidate.focusSearch === 'string' ? candidate.focusSearch : defaults.focusSearch,
    clearFilter: typeof candidate.clearFilter === 'string' ? candidate.clearFilter : defaults.clearFilter,
  };
}

export function isCompilablePattern(pattern: string): boolean {
  try {
    new RegExp(pattern, 'i');
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate one persisted auto-rule against the union type. This is the last
 * gate before a rule enters the domain, and it is shared by every write path
 * including backup import — see design spec §3.12.
 *
 * Rules persisted or exported before the union carry `{ pattern, type: 'hostname' }`.
 * They convert to `{ kind: 'regex', pattern }` — exactly how `ruleMatchesHostnames`
 * already treats them at runtime — so an upgrade or an older backup keeps the
 * user's grouping behavior instead of silently blanking every section's rules.
 */
export function normalizeAutoRule(value: unknown): SectionAutoRule | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { kind?: unknown; type?: unknown; value?: unknown; pattern?: unknown };

  if (candidate.kind === 'keyword' && typeof candidate.value === 'string') {
    const result = normalizeKeyword(candidate.value);
    return result.ok ? { kind: 'keyword', value: result.value } : null;
  }

  const isRegexRule = candidate.kind === 'regex' || candidate.type === 'hostname';
  if (isRegexRule && typeof candidate.pattern === 'string' && isCompilablePattern(candidate.pattern)) {
    return { kind: 'regex', pattern: candidate.pattern };
  }

  return null;
}

export function normalizeAutoRules(value: unknown): SectionAutoRule[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rules = value
    .map(normalizeAutoRule)
    .filter((rule): rule is SectionAutoRule => rule !== null);
  return rules.length > 0 ? rules : undefined;
}

export function normalizeSections(value: unknown): Section[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((group): group is Section => {
      if (!group || typeof group !== 'object') return false;
      const candidate = group as Partial<Section>;
      return typeof candidate.id === 'string' && candidate.id.trim() !== '' && typeof candidate.name === 'string';
    })
    .map((group, index) => ({
      id: group.id,
      name: group.name.trim() || 'Untitled',
      order: Number.isFinite(group.order) ? group.order : index,
      emoji: typeof group.emoji === 'string' ? group.emoji : undefined,
      autoRules: normalizeAutoRules(group.autoRules),
    }))
    .sort((a, b) => a.order - b.order);
}

type LegacyAssignment = Partial<SectionAssignment> & {
  productKey?: unknown;
  itemType?: unknown;
  itemKey?: unknown;
  sectionId?: unknown;
};

export function normalizeAssignments(value: unknown): SectionAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((assignment): assignment is LegacyAssignment & { sectionId: string } => {
      if (!assignment || typeof assignment !== 'object') return false;
      const candidate = assignment as LegacyAssignment;
      const hasLegacyProductKey = typeof candidate.productKey === 'string';
      const hasProductItem = candidate.itemType === 'product' && typeof candidate.itemKey === 'string';
      return (hasLegacyProductKey || hasProductItem) && typeof candidate.sectionId === 'string';
    })
    .map((assignment) => ({
      productKey: typeof assignment.productKey === 'string'
        ? assignment.productKey
        : String(assignment.itemKey),
      sectionId: assignment.sectionId,
    }));
}

export function normalizeUnsectionedProductKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const overrides: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') continue;
    const productKey = item.trim();
    if (!productKey || seen.has(productKey)) continue;
    seen.add(productKey);
    overrides.push(productKey);
  }

  return overrides;
}

/**
 * Prune assignments that point to non-existent groups or products.
 */
export function pruneAssignments(
  assignments: SectionAssignment[],
  groups: Section[],
  currentProductKeys: Set<string>,
): SectionAssignment[] {
  const sectionIds = new Set(groups.map((g) => g.id));
  const seen = new Set<string>();

  return assignments.filter((assignment) => {
    if (!sectionIds.has(assignment.sectionId)) return false;
    if (!currentProductKeys.has(assignment.productKey)) return false;

    if (seen.has(assignment.productKey)) return false;
    seen.add(assignment.productKey);
    return true;
  });
}

export function reconcileGroupOrder(
  groupOrder: Record<string, number>,
  currentProductKeys: Set<string>,
  legacyKeyMap: Map<string, string>,
): Record<string, number> {
  const nextOrder: Record<string, number> = {};
  const canonicalSources = new Set<string>();

  for (const [productKey, order] of Object.entries(groupOrder)) {
    const isCanonicalKey = currentProductKeys.has(productKey);
    const canonicalKey = isCanonicalKey
      ? productKey
      : legacyKeyMap.get(productKey) ?? productKey;
    if (!currentProductKeys.has(canonicalKey)) continue;

    if (isCanonicalKey) {
      nextOrder[canonicalKey] = order;
      canonicalSources.add(canonicalKey);
      continue;
    }

    if (
      !canonicalSources.has(canonicalKey) &&
      (nextOrder[canonicalKey] === undefined || order < nextOrder[canonicalKey])
    ) {
      nextOrder[canonicalKey] = order;
    }
  }

  return nextOrder;
}

export function reconcileAssignments(
  assignments: SectionAssignment[],
  groups: Section[],
  currentProductKeys: Set<string>,
  legacyKeyMap: Map<string, string>,
): SectionAssignment[] {
  const sectionIds = new Set(groups.map((group) => group.id));
  const firstByProduct = new Map<string, SectionAssignment>();

  for (const assignment of assignments) {
    if (!sectionIds.has(assignment.sectionId)) continue;

    const productKey = legacyKeyMap.get(assignment.productKey) ?? assignment.productKey;
    if (!currentProductKeys.has(productKey)) continue;

    // A product belongs to one section: the first surviving entry wins and later
    // duplicates are dropped. Map insertion order preserves the stored order.
    if (firstByProduct.has(productKey)) continue;
    firstByProduct.set(productKey, { ...assignment, productKey });
  }

  return [...firstByProduct.values()];
}

export function reconcileUnsectionedProductKeys(
  overrides: string[],
  currentProductKeys: Set<string>,
  legacyKeyMap: Map<string, string>,
): string[] {
  const seen = new Set<string>();
  const nextOverrides: string[] = [];

  for (const override of overrides) {
    const productKey = legacyKeyMap.get(override) ?? override;
    if (!currentProductKeys.has(productKey) || seen.has(productKey)) continue;
    seen.add(productKey);
    nextOverrides.push(productKey);
  }

  return nextOverrides;
}

export function normalizeRecoverySnapshot(value: unknown): RecoverySnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<RecoverySnapshot>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.capturedAt !== 'string' ||
    !Array.isArray(candidate.tabs) ||
    !Array.isArray(candidate.products)
  ) {
    return null;
  }

  const tabs = candidate.tabs
    .filter((tab) => tab && typeof tab === 'object')
    .map((tab) => tab as RecoverySnapshot['tabs'][number])
    .filter((tab) => typeof tab.url === 'string' && isRealTab(tab.url) && typeof tab.productKey === 'string')
    .slice(0, 80);

  if (tabs.length === 0) return null;

  const products = candidate.products
    .filter((product) => product && typeof product === 'object')
    .map((product) => product as RecoverySnapshot['products'][number])
    .filter((product) => typeof product.productKey === 'string' && typeof product.label === 'string');

  return {
    id: candidate.id,
    capturedAt: candidate.capturedAt,
    tabCount: tabs.length,
    products,
    tabs,
  };
}

export function normalizeRecoverySnapshots(value: unknown): RecoverySnapshot[] {
  if (!Array.isArray(value)) return [];
  const result: RecoverySnapshot[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const snapshot = normalizeRecoverySnapshot(item);
    if (!snapshot) continue;
    const signature = recoveryUrlSignature(snapshot);
    if (seen.has(signature)) continue;
    seen.add(signature);
    result.push(snapshot);
    if (result.length >= 5) break;
  }

  return result;
}

export function normalizeSettings(value: unknown): AppSettings {
  const raw = { ...DEFAULT_SETTINGS, ...(value as Partial<AppSettings> | undefined) };
  return {
    ...raw,
    theme: isAccentKey(raw.theme) ? raw.theme : DEFAULT_ACCENT,
    groupSortBy: normalizeGroupSortBy(raw.groupSortBy),
    keyBindings: normalizeKeyBindings(raw.keyBindings),
  };
}

export function normalizeGroupOrder(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return { ...(value as Record<string, number>) };
}

/**
 * Normalize current-schema storage data. Only reads current schema keys —
 * no legacy fallback reads. On schema mismatch, callers reset to DEFAULT_STORAGE.
 */
export function normalizeCurrentSchema(data: Record<string, unknown>): StorageSchema {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    onboardingDone: data['onboardingDone'] === true,
    settings: normalizeSettings(data['settings']),
    groupOrder: normalizeGroupOrder(data['groupOrder']),
    sections: normalizeSections(data['sections']),
    sectionAssignments: normalizeAssignments(data['sectionAssignments']),
    unsectionedProductKeys: normalizeUnsectionedProductKeys(data['unsectionedProductKeys']),
    viewMode: isViewMode(data['viewMode']) ? data['viewMode'] : 'cards',
    recoveryCandidate: normalizeRecoverySnapshot(data['recoveryCandidate']),
    recoverySnapshots: normalizeRecoverySnapshots(data['recoverySnapshots']),
  };
}
