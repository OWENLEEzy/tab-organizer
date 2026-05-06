import type {
  StorageSchema,
  SavedTab,
  Workspace,
  AppSettings,
  ManualGroup,
  GroupAssignment,
  ViewMode,
  HistorySnapshot,
} from '../types';
import { historyUrlSignature, shouldReplaceHistoryCandidate } from '../lib/history-snapshots';

const CURRENT_SCHEMA_VERSION = 4;
const STORAGE_KEYS = [
  'schemaVersion',
  'deferred',
  'workspaces',
  'settings',
  'groupOrder',
  'manualGroups',
  'groupAssignments',
  'viewMode',
  'historyCandidate',
  'history',
  // Legacy keys for migration
  'sections',
  'sectionAssignments',
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
  theme: 'system',
  soundEnabled: true,
  confettiEnabled: true,
  maxChipsVisible: 8,
  customGroups: [],
  landingPagePatterns: [],
};

const EMPTY_SCHEMA: StorageSchema = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  deferred: [],
  workspaces: [],
  settings: DEFAULT_SETTINGS,
  groupOrder: {},
  manualGroups: [],
  groupAssignments: [],
  viewMode: 'cards',
  historyCandidate: null,
  history: [],
};

function isViewMode(value: unknown): value is ViewMode {
  return value === 'cards' || value === 'table';
}

function normalizeManualGroups(value: unknown): ManualGroup[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((group): group is ManualGroup => {
      if (!group || typeof group !== 'object') return false;
      const candidate = group as Partial<ManualGroup>;
      return typeof candidate.id === 'string' && candidate.id.trim() !== '' && typeof candidate.name === 'string';
    })
    .map((group, index) => ({
      id: group.id,
      name: group.name.trim() || 'Untitled',
      order: Number.isFinite(group.order) ? group.order : index,
    }))
    .sort((a, b) => a.order - b.order);
}

type LegacyAssignment = Partial<GroupAssignment> & {
  productKey?: unknown;
  itemType?: unknown;
  itemKey?: unknown;
  groupId?: unknown;
  sectionId?: unknown; // Legacy
  order?: unknown;
};

function normalizeAssignments(value: unknown): GroupAssignment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((assignment): assignment is LegacyAssignment & { sectionId: string } => {
      if (!assignment || typeof assignment !== 'object') return false;
      const candidate = assignment as LegacyAssignment;
      const hasLegacyProductKey = typeof candidate.productKey === 'string';
      const hasProductItem = candidate.itemType === 'product' && typeof candidate.itemKey === 'string';
      return (hasLegacyProductKey || hasProductItem) && (typeof candidate.groupId === 'string' || typeof candidate.sectionId === 'string');
    })
    .map((assignment, index) => {
      const productKey = typeof assignment.productKey === 'string'
        ? assignment.productKey
        : String(assignment.itemKey);

      return {
        productKey,
        groupId: assignment.groupId ?? assignment.sectionId,
        order: Number.isFinite(assignment.order) ? Number(assignment.order) : index,
      };
    });
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
    .filter((tab) => typeof tab.url === 'string' && typeof tab.productKey === 'string')
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

  let manualGroups = data['manualGroups'];
  let groupAssignments = data['groupAssignments'];
  let historyCandidate = data['historyCandidate'];
  let history = data['history'];

  if (version < 4) {
    if (data['sections']) manualGroups = data['sections'];
    if (data['sectionAssignments']) groupAssignments = data['sectionAssignments'];
    if (data['recoveryCandidate']) historyCandidate = data['recoveryCandidate'];
    if (data['recoveryHistory']) history = data['recoveryHistory'];
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    deferred: Array.isArray(data['deferred']) ? (data['deferred'] as SavedTab[]) : [],
    workspaces: Array.isArray(data['workspaces']) ? (data['workspaces'] as Workspace[]) : [],
    settings: { ...DEFAULT_SETTINGS, ...(data['settings'] as Partial<AppSettings> | undefined) },
    groupOrder: (data['groupOrder'] as Record<string, number> | undefined) ?? {},
    manualGroups: normalizeManualGroups(manualGroups),
    groupAssignments: normalizeAssignments(groupAssignments),
    viewMode: isViewMode(data['viewMode']) ? data['viewMode'] : 'cards',
    historyCandidate: normalizeHistorySnapshot(historyCandidate),
    history: normalizeHistory(history),
  };
}

async function readStorageSnapshot(): Promise<Record<string, unknown>> {
  const result = await chrome.storage.local.get([...STORAGE_KEYS, 'sections', 'sectionAssignments', 'recoveryCandidate', 'recoveryHistory']);

  return {
    schemaVersion: result.schemaVersion,
    deferred: result.deferred,
    workspaces: result.workspaces,
    settings: result.settings,
    groupOrder: result.groupOrder,
    manualGroups: result.manualGroups,
    groupAssignments: result.groupAssignments,
    viewMode: result.viewMode,
    historyCandidate: result.historyCandidate,
    history: result.history,
    // Legacy fields for migration
    sections: result.sections,
    sectionAssignments: result.sectionAssignments,
    recoveryCandidate: result.recoveryCandidate,
    recoveryHistory: result.recoveryHistory,
  };
}

async function persistStorage(data: StorageSchema): Promise<void> {
  await chrome.storage.local.set({
    schemaVersion: data.schemaVersion,
    deferred: data.deferred,
    workspaces: data.workspaces,
    settings: data.settings,
    groupOrder: data.groupOrder,
    manualGroups: data.manualGroups,
    groupAssignments: data.groupAssignments,
    viewMode: data.viewMode,
    historyCandidate: data.historyCandidate,
    history: data.history,
  });

  // Clean up legacy keys
  await chrome.storage.local.remove(['sections', 'sectionAssignments', 'recoveryCandidate', 'recoveryHistory']);
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
    const current = migrate(await readStorageSnapshot());
    nextState = migrate(await updater(current) as unknown as Record<string, unknown>);
    await persistStorage(nextState);
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

export async function readOrganizerState(): Promise<{
  manualGroups: ManualGroup[];
  groupAssignments: GroupAssignment[];
  viewMode: ViewMode;
}> {
  const storage = await readStorage();
  return {
    manualGroups: storage.manualGroups,
    groupAssignments: storage.groupAssignments,
    viewMode: storage.viewMode,
  };
}

export async function writeOrganizerState(state: {
  manualGroups?: ManualGroup[];
  groupAssignments?: GroupAssignment[];
  viewMode?: ViewMode;
}): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    manualGroups: state.manualGroups ?? storage.manualGroups,
    groupAssignments: state.groupAssignments ?? storage.groupAssignments,
    viewMode: state.viewMode ?? storage.viewMode,
  }));
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
  const storage = await readStorage();
  return promoteHistorySnapshot(storage.historyCandidate);
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
