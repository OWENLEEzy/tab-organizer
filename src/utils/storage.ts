import type {
  StorageSchema,
  SavedTab,
  Workspace,
  AppSettings,
  Section,
  SectionAssignment,
  ViewMode,
  HistorySnapshot,
} from '../types';
import { historyUrlSignature, shouldReplaceHistoryCandidate } from '../lib/history-snapshots';
import { DEFAULT_SECTIONS } from '../config/sections';
import { DEFAULT_ACCENT, isAccentKey } from '../config/themes';
import { DEFAULT_GROUP_SORT, normalizeGroupSortBy } from '../config/group-sort';
import { isRealTab } from './url';

const CURRENT_SCHEMA_VERSION = 5;
const STORAGE_KEYS = [
  'schemaVersion',
  'deferred',
  'workspaces',
  'settings',
  'groupOrder',
  'sections',
  'sectionAssignments',
  'unsortedOverrides',
  'viewMode',
  'historyCandidate',
  'history',
  // Legacy keys cleaned after the section storage reset.
  'manualGroups',
  'groupAssignments',
  'recoveryCandidate',
  'recoveryHistory',
] as const;

/**
 * Serial write queue to prevent race conditions during rapid consecutive
 * read-modify-write operations (e.g., checking off multiple saved items).
 * Without this, overlapping reads can cause data loss.
 */
let writeQueue: Promise<void> = Promise.resolve();

function queuedWrite(fn: () => Promise<void>): Promise<void> {
  const task = writeQueue.then(fn);
  writeQueue = task.catch(() => {});
  return task;
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

const EMPTY_SCHEMA: StorageSchema = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  deferred: [],
  workspaces: [],
  settings: DEFAULT_SETTINGS,
  groupOrder: {},
  sections: [],
  sectionAssignments: [],
  unsortedOverrides: [],
  viewMode: 'cards',
  historyCandidate: null,
  history: [],
};

function isViewMode(value: unknown): value is ViewMode {
  return value === 'cards' || value === 'table';
}

type LegacyKeyBindings = Partial<AppSettings['keyBindings']> & {
  switchSpaceN?: unknown;
  switchSpaceAll?: unknown;
};

function normalizeKeyBindings(value: unknown): AppSettings['keyBindings'] {
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

function normalizeSections(value: unknown): Section[] {
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
      autoRules: Array.isArray(group.autoRules) ? group.autoRules : undefined,
    }))
    .sort((a, b) => a.order - b.order);
}

type LegacyAssignment = Partial<SectionAssignment> & {
  productKey?: unknown;
  itemType?: unknown;
  itemKey?: unknown;
  sectionId?: unknown;
  order?: unknown;
};

function normalizeAssignments(value: unknown): SectionAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((assignment): assignment is LegacyAssignment & { sectionId: string } => {
      if (!assignment || typeof assignment !== 'object') return false;
      const candidate = assignment as LegacyAssignment;
      const hasLegacyProductKey = typeof candidate.productKey === 'string';
      const hasProductItem = candidate.itemType === 'product' && typeof candidate.itemKey === 'string';
      return (hasLegacyProductKey || hasProductItem) && typeof candidate.sectionId === 'string';
    })
    .map((assignment, index) => {
      const productKey = typeof assignment.productKey === 'string'
        ? assignment.productKey
        : String(assignment.itemKey);

      return {
        productKey,
        sectionId: assignment.sectionId,
        order: Number.isFinite(assignment.order) ? Number(assignment.order) : index,
      };
    });
}

function normalizeUnsortedOverrides(value: unknown): string[] {
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

function reconcileGroupOrder(
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

function reconcileAssignments(
  assignments: SectionAssignment[],
  groups: Section[],
  currentProductKeys: Set<string>,
  legacyKeyMap: Map<string, string>,
): SectionAssignment[] {
  const sectionIds = new Set(groups.map((group) => group.id));
  const bestByProduct = new Map<string, SectionAssignment & { originalIndex: number }>();

  assignments.forEach((assignment, index) => {
    if (!sectionIds.has(assignment.sectionId)) return;

    const productKey = legacyKeyMap.get(assignment.productKey) ?? assignment.productKey;
    if (!currentProductKeys.has(productKey)) return;

    const candidate = { ...assignment, productKey, originalIndex: index };
    const existing = bestByProduct.get(productKey);

    if (
      !existing ||
      candidate.order < existing.order ||
      (candidate.order === existing.order && candidate.originalIndex < existing.originalIndex)
    ) {
      bestByProduct.set(productKey, candidate);
    }
  });

  return [...bestByProduct.values()]
    .sort((a, b) => a.originalIndex - b.originalIndex)
    .map(({ originalIndex: _originalIndex, ...assignment }) => assignment);
}

function reconcileUnsortedOverrides(
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

function normalizeHistorySnapshot(value: unknown): HistorySnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<HistorySnapshot>;
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
    .map((tab) => tab as HistorySnapshot['tabs'][number])
    .filter((tab) => typeof tab.url === 'string' && isRealTab(tab.url) && typeof tab.productKey === 'string')
    .slice(0, 80);

  if (tabs.length === 0) return null;

  const products = candidate.products
    .filter((product) => product && typeof product === 'object')
    .map((product) => product as HistorySnapshot['products'][number])
    .filter((product) => typeof product.productKey === 'string' && typeof product.label === 'string');

  return {
    id: candidate.id,
    capturedAt: candidate.capturedAt,
    tabCount: tabs.length,
    products,
    tabs,
  };
}

function normalizeHistory(value: unknown): HistorySnapshot[] {
  if (!Array.isArray(value)) return [];
  const result: HistorySnapshot[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const snapshot = normalizeHistorySnapshot(item);
    if (!snapshot) continue;
    const signature = historyUrlSignature(snapshot);
    if (seen.has(signature)) continue;
    seen.add(signature);
    result.push(snapshot);
    if (result.length >= 5) break;
  }

  return result;
}

/**
 * Migrate storage data from older schema versions.
 * Applies migrations sequentially: v0→v1, v1→v2, etc.
 */
function migrate(data: Record<string, unknown>): StorageSchema {
  const version = (data['schemaVersion'] as number | undefined) ?? 0;

  const sections = data['sections'];
  const sectionAssignments = data['sectionAssignments'];
  let historyCandidate = data['historyCandidate'];
  let history = data['history'];

  if (version < 4) {
    if (data['recoveryCandidate']) historyCandidate = data['recoveryCandidate'];
    if (data['recoveryHistory']) history = data['recoveryHistory'];
  }

  const rawSettings = { ...DEFAULT_SETTINGS, ...(data['settings'] as Partial<AppSettings> | undefined) };
  const settings: AppSettings = {
    ...rawSettings,
    theme: isAccentKey(rawSettings.theme) ? rawSettings.theme : DEFAULT_ACCENT,
    groupSortBy: normalizeGroupSortBy(rawSettings.groupSortBy),
    keyBindings: normalizeKeyBindings(rawSettings.keyBindings),
  };

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    deferred: Array.isArray(data['deferred']) ? (data['deferred'] as SavedTab[]) : [],
    workspaces: Array.isArray(data['workspaces']) ? (data['workspaces'] as Workspace[]) : [],
    settings,
    groupOrder: (data['groupOrder'] as Record<string, number> | undefined) ?? {},
    sections: normalizeSections(sections),
    sectionAssignments: normalizeAssignments(sectionAssignments),
    unsortedOverrides: normalizeUnsortedOverrides(data['unsortedOverrides']),
    viewMode: isViewMode(data['viewMode']) ? data['viewMode'] : 'cards',
    historyCandidate: normalizeHistorySnapshot(historyCandidate),
    history: normalizeHistory(history),
  };
}

async function readStorageSnapshot(): Promise<Record<string, unknown>> {
  return chrome.storage.local.get([...STORAGE_KEYS, 'recoveryCandidate', 'recoveryHistory']);
}

function hasOwnStorageKey(data: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(data, key);
}

async function persistStorage(data: StorageSchema): Promise<void> {
  await chrome.storage.local.set({
    schemaVersion: data.schemaVersion,
    deferred: data.deferred,
    workspaces: data.workspaces,
    settings: data.settings,
    groupOrder: data.groupOrder,
    sections: data.sections,
    sectionAssignments: data.sectionAssignments,
    unsortedOverrides: data.unsortedOverrides,
    viewMode: data.viewMode,
    historyCandidate: data.historyCandidate,
    history: data.history,
  });

  // Clean up legacy keys. Section data intentionally does not migrate from
  // manualGroups/groupAssignments; users get the new section schema cleanly.
  await chrome.storage.local.remove(['manualGroups', 'groupAssignments', 'recoveryCandidate', 'recoveryHistory']);
}

/**
 * Read the full storage schema, applying migrations if needed.
 */
export async function readStorage(): Promise<StorageSchema> {
  return migrate(await readStorageSnapshot());
}

/**
 * Replace the full storage schema. Prefer updateStorage for read-modify-write flows.
 */
export async function writeStorage(data: StorageSchema): Promise<void> {
  await queuedWrite(async () => {
    await persistStorage(data);
  });
}

/**
 * Safely update storage by reading the latest state inside the write queue.
 * This prevents stale read snapshots from overwriting unrelated keys.
 */
export async function updateStorage(
  updater: (current: StorageSchema) => StorageSchema | Promise<StorageSchema>
): Promise<StorageSchema> {
  let nextState = EMPTY_SCHEMA;

  await queuedWrite(async () => {
    const raw = await readStorageSnapshot();
    const current = migrate(raw);
    const updated = await updater(current);
    nextState = migrate(updated as unknown as Record<string, unknown>);

    const isVersionCurrent = raw.schemaVersion === CURRENT_SCHEMA_VERSION;
    const hasLegacyKeys =
      raw.manualGroups !== undefined ||
      raw.groupAssignments !== undefined ||
      raw.recoveryCandidate !== undefined ||
      raw.recoveryHistory !== undefined;

    const needsWrite = !isVersionCurrent || hasLegacyKeys || JSON.stringify(nextState) !== JSON.stringify(current);

    if (needsWrite) {
      await persistStorage(nextState);
    }
  });

  return nextState;
}

/**
 * Get saved tabs (deferred items), split into active and archived.
 * Filters out dismissed items.
 */
export async function getSavedTabs(): Promise<{
  active: SavedTab[];
  archived: SavedTab[];
}> {
  const storage = await readStorage();
  const visible = storage.deferred.filter((t) => !t.dismissed);
  return {
    active: visible.filter((t) => !t.completed),
    archived: visible.filter((t) => t.completed),
  };
}

/**
 * Save a tab for later. Creates a new SavedTab entry.
 */
export async function saveTabForLater(tab: {
  url: string;
  title: string;
}): Promise<SavedTab> {
  let domain = '';
  try {
    domain = new URL(tab.url).hostname;
  } catch {
    // Leave domain empty for malformed URLs
  }

  const savedTab: SavedTab = {
    id: crypto.randomUUID(),
    url: tab.url,
    title: tab.title,
    domain,
    savedAt: new Date().toISOString(),
    completed: false,
    dismissed: false,
  };

  await updateStorage((storage) => ({
    ...storage,
    deferred: [...storage.deferred, savedTab],
  }));
  return savedTab;
}

/**
 * Mark a saved tab as completed (checked off → archive).
 */
export async function checkOffSavedTab(id: string): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    deferred: storage.deferred.map((t) =>
      t.id === id
        ? { ...t, completed: true, completedAt: new Date().toISOString() }
        : t
    ),
  }));
}

/**
 * Dismiss a saved tab (remove from all views).
 */
export async function dismissSavedTab(id: string): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    deferred: storage.deferred.map((t) =>
      t.id === id ? { ...t, dismissed: true } : t
    ),
  }));
}

/**
 * Read app settings from storage.
 */
export async function readSettings(): Promise<AppSettings> {
  const storage = await readStorage();
  return storage.settings;
}

/**
 * Update app settings in storage.
 */
export async function writeSettings(
  settings: Partial<AppSettings>
): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    settings: { ...storage.settings, ...settings },
  }));
}

/**
 * Read custom group ordering from storage.
 */
export async function readGroupOrder(): Promise<Record<string, number>> {
  const storage = await readStorage();
  return storage.groupOrder;
}

/**
 * Persist custom group ordering from drag-and-drop.
 */
export async function writeGroupOrder(order: Record<string, number>): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    groupOrder: order,
  }));
}

/**
 * Clear custom group ordering, resetting to default alphabetical order.
 */
export async function clearGroupOrder(): Promise<void> {
  await writeGroupOrder({});
}

/**
 * Cleanup groupOrder and assignments for items no longer present in the browser.
 */
export async function pruneStaleStorage(currentProductKeys: Set<string>): Promise<void> {
  await updateStorage((current) => {
    const staleKeys = Object.keys(current.groupOrder).filter((d) => !currentProductKeys.has(d));
    const nextAssignments = pruneAssignments(
      current.sectionAssignments,
      current.sections,
      currentProductKeys
    );
    const nextOverrides = current.unsortedOverrides.filter((productKey) =>
      currentProductKeys.has(productKey)
    );

    if (
      staleKeys.length === 0 &&
      nextAssignments.length === current.sectionAssignments.length &&
      nextOverrides.length === current.unsortedOverrides.length
    ) {
      return current;
    }

    const cleanedOrder: Record<string, number> = {};
    for (const [domain, order] of Object.entries(current.groupOrder)) {
      if (currentProductKeys.has(domain)) {
        cleanedOrder[domain] = order;
      }
    }

    return {
      ...current,
      groupOrder: cleanedOrder,
      sectionAssignments: nextAssignments,
      unsortedOverrides: nextOverrides,
    };
  }).catch((err: unknown) => {
    console.warn('[Tab Organizer] Failed to prune stale organizer storage:', err);
  });
}

export async function reconcileOrganizerState(
  currentProductKeys: Set<string>,
  legacyKeyMap: Map<string, string>,
): Promise<{
  groupOrder: Record<string, number>;
  sections: Section[];
  sectionAssignments: SectionAssignment[];
  unsortedOverrides: string[];
  viewMode: ViewMode;
}> {
  let nextStorage: StorageSchema;

  try {
    const raw = await readStorageSnapshot();
    const hasSections = hasOwnStorageKey(raw, 'sections');
    const shouldSeedDefaultSections = !hasSections;

    nextStorage = await updateStorage((current) => {
      let currentSections = current.sections;
      if (shouldSeedDefaultSections && currentSections.length === 0) {
        currentSections = DEFAULT_SECTIONS;
      }

      const groupOrder = reconcileGroupOrder(
        current.groupOrder,
        currentProductKeys,
        legacyKeyMap,
      );
      const sectionAssignments = reconcileAssignments(
        current.sectionAssignments,
        currentSections,
        currentProductKeys,
        legacyKeyMap,
      );
      const unsortedOverrides = reconcileUnsortedOverrides(
        current.unsortedOverrides,
        currentProductKeys,
        legacyKeyMap,
      );

      if (
        currentSections === current.sections &&
        JSON.stringify(groupOrder) === JSON.stringify(current.groupOrder) &&
        JSON.stringify(sectionAssignments) === JSON.stringify(current.sectionAssignments) &&
        JSON.stringify(unsortedOverrides) === JSON.stringify(current.unsortedOverrides)
      ) {
        return current;
      }

      return {
        ...current,
        sections: currentSections,
        groupOrder,
        sectionAssignments,
        unsortedOverrides,
      };
    });
  } catch (err: unknown) {
    console.warn('[Tab Organizer] Failed to prune stale organizer storage:', err);
    nextStorage = await readStorage();
  }

  return {
    groupOrder: nextStorage.groupOrder,
    sections: nextStorage.sections,
    sectionAssignments: nextStorage.sectionAssignments,
    unsortedOverrides: nextStorage.unsortedOverrides,
    viewMode: nextStorage.viewMode,
  };
}

export async function readOrganizerState(): Promise<{
  groupOrder: Record<string, number>;
  sections: Section[];
  sectionAssignments: SectionAssignment[];
  unsortedOverrides: string[];
  viewMode: ViewMode;
}> {
  const storage = await readStorage();
  return {
    groupOrder: storage.groupOrder,
    sections: storage.sections,
    sectionAssignments: storage.sectionAssignments,
    unsortedOverrides: storage.unsortedOverrides,
    viewMode: storage.viewMode,
  };
}

export async function writeOrganizerState(state: {
  sections?: Section[];
  sectionAssignments?: SectionAssignment[];
  unsortedOverrides?: string[];
  viewMode?: ViewMode;
}): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    sections: state.sections ?? storage.sections,
    sectionAssignments: state.sectionAssignments ?? storage.sectionAssignments,
    unsortedOverrides: state.unsortedOverrides ?? storage.unsortedOverrides,
    viewMode: state.viewMode ?? storage.viewMode,
  }));
}

export async function assignProductToSection(productKey: string, sectionId: string): Promise<{
  sectionAssignments: SectionAssignment[];
  unsortedOverrides: string[];
}> {
  let nextState = {
    sectionAssignments: [] as SectionAssignment[],
    unsortedOverrides: [] as string[],
  };

  await updateStorage((storage) => {
    const existingInGroup = storage.sectionAssignments.filter(
      (assignment) => assignment.sectionId === sectionId && assignment.productKey !== productKey,
    );
    const sectionAssignments = [
      ...storage.sectionAssignments.filter((assignment) => assignment.productKey !== productKey),
      { productKey, sectionId, order: existingInGroup.length },
    ];
    const unsortedOverrides = storage.unsortedOverrides.filter((key) => key !== productKey);

    nextState = { sectionAssignments, unsortedOverrides };

    return {
      ...storage,
      sectionAssignments,
      unsortedOverrides,
    };
  });

  return nextState;
}

export async function unassignProductFromSections(productKey: string): Promise<{
  sectionAssignments: SectionAssignment[];
  unsortedOverrides: string[];
}> {
  let nextState = {
    sectionAssignments: [] as SectionAssignment[],
    unsortedOverrides: [] as string[],
  };

  await updateStorage((storage) => {
    const sectionAssignments = storage.sectionAssignments.filter(
      (assignment) => assignment.productKey !== productKey,
    );
    // Moving a product group to No section is an explicit user choice. Keep it
    // out of auto-rules until the user assigns it to a section again.
    const unsortedOverrides = storage.unsortedOverrides.includes(productKey)
      ? storage.unsortedOverrides
      : [...storage.unsortedOverrides, productKey];

    nextState = { sectionAssignments, unsortedOverrides };

    return {
      ...storage,
      sectionAssignments,
      unsortedOverrides,
    };
  });

  return nextState;
}

export async function updateHistoryCandidate(snapshot: HistorySnapshot | null): Promise<void> {
  await updateStorage((storage) => {
    if (snapshot == null) {
      return { ...storage, historyCandidate: null };
    }

    const normalized = normalizeHistorySnapshot(snapshot);
    if (!normalized || !shouldReplaceHistoryCandidate(storage.historyCandidate, normalized)) {
      return storage;
    }

    return { ...storage, historyCandidate: normalized };
  });
}

function promoteSnapshotInStorage(
  storage: StorageSchema,
  snapshot: HistorySnapshot | null,
): { next: StorageSchema; promoted: boolean } {
  const normalized = normalizeHistorySnapshot(snapshot);
  if (!normalized) return { next: storage, promoted: false };

  const signature = historyUrlSignature(normalized);
  const latest = storage.history[0] ?? null;
  if (latest && historyUrlSignature(latest) === signature) {
    return {
      next: { ...storage, historyCandidate: normalized },
      promoted: false,
    };
  }

  const history = [
    normalized,
    ...storage.history.filter((item) => historyUrlSignature(item) !== signature),
  ].slice(0, 5);

  return {
    next: {
      ...storage,
      historyCandidate: normalized,
      history,
    },
    promoted: true,
  };
}

export async function promoteHistorySnapshot(snapshot: HistorySnapshot | null): Promise<boolean> {
  let promoted = false;
  await updateStorage((storage) => {
    const result = promoteSnapshotInStorage(storage, snapshot);
    promoted = result.promoted;
    return result.next;
  });

  return promoted;
}

export async function promoteHistoryCandidate(): Promise<boolean> {
  let promoted = false;
  await updateStorage((storage) => {
    const result = promoteSnapshotInStorage(storage, storage.historyCandidate);
    promoted = result.promoted;
    return result.next;
  });

  return promoted;
}

export async function deleteHistorySnapshot(id: string): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    history: storage.history.filter((snapshot) => snapshot.id !== id),
  }));
}

export async function clearHistory(): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    historyCandidate: null,
    history: [],
  }));
}

export async function readHistory(): Promise<HistorySnapshot[]> {
  const storage = await readStorage();
  return storage.history;
}

/**
 * Read all workspaces from storage.
 */
export async function readWorkspaces(): Promise<Workspace[]> {
  const storage = await readStorage();
  return storage.workspaces;
}

/**
 * Replace all workspaces in storage.
 */
export async function writeWorkspaces(workspaces: Workspace[]): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    workspaces,
  }));
}

// Export for testing
export { EMPTY_SCHEMA, CURRENT_SCHEMA_VERSION };
