import type {
  StorageSchema,
  SavedTab,
  Workspace,
  AppSettings,
  OrganizerSection,
  SectionAssignment,
  ViewMode,
  RecoverySnapshot,
} from '../types';
import { recoveryUrlSignature, shouldReplaceRecoveryCandidate } from '../lib/recovery-snapshots';

const CURRENT_SCHEMA_VERSION = 3;
const STORAGE_KEYS = [
  'schemaVersion',
  'deferred',
  'workspaces',
  'settings',
  'groupOrder',
  'sections',
  'sectionAssignments',
  'viewMode',
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
  sections: [],
  sectionAssignments: [],
  viewMode: 'cards',
  recoveryCandidate: null,
  recoveryHistory: [],
};

function isViewMode(value: unknown): value is ViewMode {
  return value === 'cards' || value === 'table';
}

function normalizeSections(value: unknown): OrganizerSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((section): section is OrganizerSection => {
      if (!section || typeof section !== 'object') return false;
      const candidate = section as Partial<OrganizerSection>;
      return typeof candidate.id === 'string' && candidate.id.trim() !== '' && typeof candidate.name === 'string';
    })
    .map((section, index) => ({
      id: section.id,
      name: section.name.trim() || 'Untitled',
      order: Number.isFinite(section.order) ? section.order : index,
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

function normalizeRecoverySnapshot(value: unknown): RecoverySnapshot | null {
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
    .filter((tab) => typeof tab.url === 'string' && typeof tab.productKey === 'string')
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

function normalizeRecoveryHistory(value: unknown): RecoverySnapshot[] {
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

/**
 * Migrate storage data from older schema versions.
 * Applies migrations sequentially: v0→v1, v1→v2, etc.
 */
function migrate(data: Partial<StorageSchema>): StorageSchema {
  const version = data.schemaVersion ?? 0;

  if (version < 1) {
    // v0 → v1: initial schema
    // Existing "deferred" data from vanilla JS version may exist
    // under the key "deferred" with shape: { id, url, title, savedAt, completed, dismissed }
    // The new schema is compatible — no transformation needed.
  }

  if (version < 2) {
    // v1 → v2: add groupOrder for drag-and-drop persistence
  }

  if (version < 3) {
    // v2 → v3: add user-owned sections, section assignments, and view mode.
    // Do not create a Homepages section during migration.
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    deferred: Array.isArray(data.deferred) ? data.deferred : [],
    workspaces: Array.isArray(data.workspaces) ? data.workspaces : [],
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
    groupOrder: data.groupOrder ?? {},
    sections: normalizeSections(data.sections),
    sectionAssignments: normalizeAssignments(data.sectionAssignments),
    viewMode: isViewMode(data.viewMode) ? data.viewMode : 'cards',
    recoveryCandidate: normalizeRecoverySnapshot(data.recoveryCandidate),
    recoveryHistory: normalizeRecoveryHistory(data.recoveryHistory),
  };
}

async function readStorageSnapshot(): Promise<Partial<StorageSchema>> {
  const result = await chrome.storage.local.get([...STORAGE_KEYS]);

  return {
    schemaVersion: result.schemaVersion as number | undefined,
    deferred: result.deferred as SavedTab[] | undefined,
    workspaces: result.workspaces as Workspace[] | undefined,
    settings: result.settings as AppSettings | undefined,
    groupOrder: result.groupOrder as Record<string, number> | undefined,
    sections: result.sections as OrganizerSection[] | undefined,
    sectionAssignments: result.sectionAssignments as SectionAssignment[] | undefined,
    viewMode: result.viewMode as ViewMode | undefined,
    recoveryCandidate: result.recoveryCandidate as RecoverySnapshot | null | undefined,
    recoveryHistory: result.recoveryHistory as RecoverySnapshot[] | undefined,
  };
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
    viewMode: data.viewMode,
    recoveryCandidate: data.recoveryCandidate,
    recoveryHistory: data.recoveryHistory,
  });
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
    nextState = migrate(await updater(current));
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
  sections: OrganizerSection[];
  sectionAssignments: SectionAssignment[];
  viewMode: ViewMode;
}> {
  const storage = await readStorage();
  return {
    sections: storage.sections,
    sectionAssignments: storage.sectionAssignments,
    viewMode: storage.viewMode,
  };
}

export async function writeOrganizerState(state: {
  sections?: OrganizerSection[];
  sectionAssignments?: SectionAssignment[];
  viewMode?: ViewMode;
}): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    sections: state.sections ?? storage.sections,
    sectionAssignments: state.sectionAssignments ?? storage.sectionAssignments,
    viewMode: state.viewMode ?? storage.viewMode,
  }));
}

export async function updateRecoveryCandidate(snapshot: RecoverySnapshot | null): Promise<void> {
  await updateStorage((storage) => {
    if (snapshot == null) {
      return { ...storage, recoveryCandidate: null };
    }

    const normalized = normalizeRecoverySnapshot(snapshot);
    if (!normalized || !shouldReplaceRecoveryCandidate(storage.recoveryCandidate, normalized)) {
      return storage;
    }

    return { ...storage, recoveryCandidate: normalized };
  });
}

export async function promoteRecoveryCandidate(): Promise<boolean> {
  let promoted = false;

  await updateStorage((storage) => {
    const candidate = storage.recoveryCandidate;
    if (!candidate) return storage;

    const latest = storage.recoveryHistory[0] ?? null;
    if (latest && recoveryUrlSignature(latest) === recoveryUrlSignature(candidate)) {
      return storage;
    }

    promoted = true;
    return {
      ...storage,
      recoveryHistory: [candidate, ...storage.recoveryHistory].slice(0, 5),
    };
  });

  return promoted;
}

export async function deleteRecoverySnapshot(id: string): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    recoveryHistory: storage.recoveryHistory.filter((snapshot) => snapshot.id !== id),
  }));
}

export async function clearRecoverySnapshots(): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    recoveryCandidate: null,
    recoveryHistory: [],
  }));
}

export async function readRecoverySnapshots(): Promise<RecoverySnapshot[]> {
  const storage = await readStorage();
  return storage.recoveryHistory;
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
