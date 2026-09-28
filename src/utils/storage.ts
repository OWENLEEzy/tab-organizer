import type {
  StorageSchema,
  AppSettings,
  Section,
  SectionAssignment,
  ViewMode,
  RecoverySnapshot,
} from '../types';
import { recoveryUrlSignature, shouldReplaceRecoveryCandidate } from '../lib/recovery-snapshots';
import { deleteSectionAndUnassignProducts } from '../lib/section-organizer';
import {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  normalizeCurrentSchema,
  normalizeRecoverySnapshot,
  upgradeSchema,
  pruneAssignments,
  reconcileAssignments,
  reconcileGroupOrder,
  reconcileUnsectionedProductKeys,
} from '../lib/storage-schema';

const STORAGE_KEYS = [
  'schemaVersion',
  'onboardingDone',
  'settings',
  'groupOrder',
  'sections',
  'sectionAssignments',
  'unsectionedProductKeys',
  'viewMode',
  'recoveryCandidate',
  'recoverySnapshots',
] as const;

/**
 * Serial write queue to prevent race conditions during rapid consecutive
 * read-modify-write operations.
 */
let writeQueue: Promise<void> = Promise.resolve();

function queuedWrite(fn: () => Promise<void>): Promise<void> {
  const task = writeQueue.then(fn);
  writeQueue = task.catch(() => {});
  return task;
}

export { DEFAULT_SETTINGS } from '../lib/storage-schema';

/**
 * A fresh install owns no sections: the onboarding card is where the user picks
 * and confirms them, so nothing is written until they do. See design spec §3.9.
 */
const EMPTY_SCHEMA: StorageSchema = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  onboardingDone: false,
  settings: DEFAULT_SETTINGS,
  groupOrder: {},
  sections: [],
  sectionAssignments: [],
  unsectionedProductKeys: [],
  viewMode: 'cards',
  recoveryCandidate: null,
  recoverySnapshots: [],
};

const DEFAULT_STORAGE: StorageSchema = EMPTY_SCHEMA;

async function readStorageSnapshot(): Promise<Record<string, unknown>> {
  return chrome.storage.local.get([...STORAGE_KEYS]);
}


async function persistStorage(data: StorageSchema): Promise<void> {
  await chrome.storage.local.set({
    schemaVersion: data.schemaVersion,
    onboardingDone: data.onboardingDone,
    settings: data.settings,
    groupOrder: data.groupOrder,
    sections: data.sections,
    sectionAssignments: data.sectionAssignments,
    unsectionedProductKeys: data.unsectionedProductKeys,
    viewMode: data.viewMode,
    recoveryCandidate: data.recoveryCandidate,
    recoverySnapshots: data.recoverySnapshots,
  });

  // Clean up legacy keys.
  await chrome.storage.local.remove([
    'manualGroups', 'groupAssignments', 'historyCandidate', 'history',
    'unsortedOverrides',
  ]);
}

/**
 * Read the full storage schema. The previous released schema is upgraded in
 * place; any other version mismatch resets destructively to DEFAULT_STORAGE.
 */
export async function readStorage(): Promise<StorageSchema> {
  const raw = await readStorageSnapshot();
  const schema = upgradeSchema(raw) ?? DEFAULT_STORAGE;
  if (raw.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    await persistStorage(schema);
  }
  return schema;
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
async function updateStorage(
  updater: (current: StorageSchema) => StorageSchema | Promise<StorageSchema>
): Promise<StorageSchema> {
  let nextState = EMPTY_SCHEMA;

  await queuedWrite(async () => {
    const raw = await readStorageSnapshot();
    const isCurrentVersion = raw.schemaVersion === CURRENT_SCHEMA_VERSION;
    const current = upgradeSchema(raw) ?? DEFAULT_STORAGE;
    const updated = await updater(current);
    nextState = normalizeCurrentSchema(updated as unknown as Record<string, unknown>);

    if (!isCurrentVersion || JSON.stringify(nextState) !== JSON.stringify(current)) {
      await persistStorage(nextState);
    }
  });

  return nextState;
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
    const nextOverrides = current.unsectionedProductKeys.filter((productKey) =>
      currentProductKeys.has(productKey)
    );

    if (
      staleKeys.length === 0 &&
      nextAssignments.length === current.sectionAssignments.length &&
      nextOverrides.length === current.unsectionedProductKeys.length
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
      unsectionedProductKeys: nextOverrides,
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
  unsectionedProductKeys: string[];
  viewMode: ViewMode;
  onboardingDone: boolean;
}> {
  let nextStorage: StorageSchema;

  try {
    nextStorage = await updateStorage((current) => {
      const currentSections = current.sections;

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
      const unsectionedProductKeys = reconcileUnsectionedProductKeys(
        current.unsectionedProductKeys,
        currentProductKeys,
        legacyKeyMap,
      );

      if (
        currentSections === current.sections &&
        JSON.stringify(groupOrder) === JSON.stringify(current.groupOrder) &&
        JSON.stringify(sectionAssignments) === JSON.stringify(current.sectionAssignments) &&
        JSON.stringify(unsectionedProductKeys) === JSON.stringify(current.unsectionedProductKeys)
      ) {
        return current;
      }

      return {
        ...current,
        sections: currentSections,
        groupOrder,
        sectionAssignments,
        unsectionedProductKeys,
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
    unsectionedProductKeys: nextStorage.unsectionedProductKeys,
    viewMode: nextStorage.viewMode,
    onboardingDone: nextStorage.onboardingDone,
  };
}

export async function readOrganizerState(): Promise<{
  groupOrder: Record<string, number>;
  sections: Section[];
  sectionAssignments: SectionAssignment[];
  unsectionedProductKeys: string[];
  viewMode: ViewMode;
  onboardingDone: boolean;
}> {
  const storage = await readStorage();
  return {
    groupOrder: storage.groupOrder,
    sections: storage.sections,
    sectionAssignments: storage.sectionAssignments,
    unsectionedProductKeys: storage.unsectionedProductKeys,
    viewMode: storage.viewMode,
    onboardingDone: storage.onboardingDone,
  };
}

export async function writeOrganizerState(state: {
  sections?: Section[];
  sectionAssignments?: SectionAssignment[];
  unsectionedProductKeys?: string[];
  viewMode?: ViewMode;
  /** Set together with the sections onboarding confirmed, in the same write. */
  onboardingDone?: boolean;
}): Promise<{
  sections: Section[];
  sectionAssignments: SectionAssignment[];
  unsectionedProductKeys: string[];
  viewMode: ViewMode;
}> {
  const next = await updateStorage((storage) => ({
    ...storage,
    sections: state.sections ?? storage.sections,
    sectionAssignments: state.sectionAssignments ?? storage.sectionAssignments,
    unsectionedProductKeys: state.unsectionedProductKeys ?? storage.unsectionedProductKeys,
    viewMode: state.viewMode ?? storage.viewMode,
    onboardingDone: state.onboardingDone ?? storage.onboardingDone,
  }));
  return {
    sections: next.sections,
    sectionAssignments: next.sectionAssignments,
    unsectionedProductKeys: next.unsectionedProductKeys,
    viewMode: next.viewMode,
  };
}

/** Mark the one-time onboarding as finished. */
/** Drop one product's "keep unsectioned" pin, reading fresh storage in the queue. */
export async function removeUnsectionedPin(productKey: string): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    unsectionedProductKeys: storage.unsectionedProductKeys.filter((key) => key !== productKey),
  }));
}

/**
 * Apply a batch of section assignments as a DELTA merge: each update replaces any
 * prior assignment for the same product, all other assignments are preserved, and
 * the affected products drop out of `unsectionedProductKeys`. Unlike a snapshot
 * replace, this reads the freshest storage inside the write queue, so it never
 * clobbers concurrent edits made elsewhere (e.g. the dashboard).
 */
export async function applyAssignmentUpdates(updates: SectionAssignment[]): Promise<void> {
  if (updates.length === 0) return;
  const updatedKeys = new Set(updates.map((u) => u.productKey));
  await updateStorage((storage) => ({
    ...storage,
    sectionAssignments: [
      ...storage.sectionAssignments.filter((a) => !updatedKeys.has(a.productKey)),
      ...updates,
    ],
    unsectionedProductKeys: storage.unsectionedProductKeys.filter((k) => !updatedKeys.has(k)),
  }));
}

/**
 * Auto-rule results computed from a possibly stale read. Inside the queue, skip
 * any product that meanwhile got an explicit assignment or a No section pin, so
 * a rule never overrides a user's choice (explicit > veto > rule).
 */
export async function applyAutoAssignments(updates: SectionAssignment[]): Promise<void> {
  if (updates.length === 0) return;
  await updateStorage((storage) => {
    const decided = new Set([
      ...storage.sectionAssignments.map((a) => a.productKey),
      ...storage.unsectionedProductKeys,
    ]);
    const fresh = updates.filter((u) => !decided.has(u.productKey));
    return fresh.length === 0
      ? storage
      : { ...storage, sectionAssignments: [...storage.sectionAssignments, ...fresh] };
  });
}

/** Edit the section list against fresh storage, so a concurrent edit is not overwritten. */
export async function updateSections(transform: (sections: Section[]) => Section[]): Promise<void> {
  await updateStorage((storage) => ({ ...storage, sections: transform(storage.sections) }));
}

/** Delete a section and move its groups to No section, computed inside the write queue. */
export async function deleteSectionInStorage(sectionId: string): Promise<void> {
  await updateStorage((storage) => {
    const { assignments, overrides } = deleteSectionAndUnassignProducts(
      storage.sectionAssignments,
      storage.unsectionedProductKeys,
      sectionId,
    );
    return {
      ...storage,
      sections: storage.sections
        .filter((section) => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index })),
      sectionAssignments: assignments,
      unsectionedProductKeys: overrides,
    };
  });
}

export async function assignProductToSection(productKey: string, sectionId: string): Promise<{
  sectionAssignments: SectionAssignment[];
  unsectionedProductKeys: string[];
}> {
  let nextState = {
    sectionAssignments: [] as SectionAssignment[],
    unsectionedProductKeys: [] as string[],
  };

  await updateStorage((storage) => {
    const sectionAssignments = [
      ...storage.sectionAssignments.filter((assignment) => assignment.productKey !== productKey),
      { productKey, sectionId },
    ];
    const unsectionedProductKeys = storage.unsectionedProductKeys.filter((key) => key !== productKey);

    nextState = { sectionAssignments, unsectionedProductKeys };

    return {
      ...storage,
      sectionAssignments,
      unsectionedProductKeys,
    };
  });

  return nextState;
}

export async function unassignProductFromSections(productKey: string): Promise<{
  sectionAssignments: SectionAssignment[];
  unsectionedProductKeys: string[];
}> {
  let nextState = {
    sectionAssignments: [] as SectionAssignment[],
    unsectionedProductKeys: [] as string[],
  };

  await updateStorage((storage) => {
    const sectionAssignments = storage.sectionAssignments.filter(
      (assignment) => assignment.productKey !== productKey,
    );
    // Moving a product group to No section is an explicit user choice. Keep it
    // out of auto-rules until the user assigns it to a section again.
    const unsectionedProductKeys = storage.unsectionedProductKeys.includes(productKey)
      ? storage.unsectionedProductKeys
      : [...storage.unsectionedProductKeys, productKey];

    nextState = { sectionAssignments, unsectionedProductKeys };

    return {
      ...storage,
      sectionAssignments,
      unsectionedProductKeys,
    };
  });

  return nextState;
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

function promoteSnapshotInStorage(
  storage: StorageSchema,
  snapshot: RecoverySnapshot | null,
): { next: StorageSchema; promoted: boolean } {
  const normalized = normalizeRecoverySnapshot(snapshot);
  if (!normalized) return { next: storage, promoted: false };

  const signature = recoveryUrlSignature(normalized);
  const latest = storage.recoverySnapshots[0] ?? null;
  if (latest && recoveryUrlSignature(latest) === signature) {
    return {
      next: { ...storage, recoveryCandidate: normalized },
      promoted: false,
    };
  }

  const recoverySnapshots = [
    normalized,
    ...storage.recoverySnapshots.filter((item) => recoveryUrlSignature(item) !== signature),
  ].slice(0, 5);

  return {
    next: {
      ...storage,
      recoveryCandidate: normalized,
      recoverySnapshots,
    },
    promoted: true,
  };
}

export async function promoteRecoverySnapshot(snapshot: RecoverySnapshot | null): Promise<boolean> {
  let promoted = false;
  await updateStorage((storage) => {
    const result = promoteSnapshotInStorage(storage, snapshot);
    promoted = result.promoted;
    return result.next;
  });

  return promoted;
}

export async function promoteRecoveryCandidate(): Promise<boolean> {
  let promoted = false;
  await updateStorage((storage) => {
    const result = promoteSnapshotInStorage(storage, storage.recoveryCandidate);
    promoted = result.promoted;
    return result.next;
  });

  return promoted;
}

export async function deleteRecoverySnapshot(id: string): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    recoverySnapshots: storage.recoverySnapshots.filter((snapshot) => snapshot.id !== id),
  }));
}

export async function clearRecoverySnapshots(): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    recoveryCandidate: null,
    recoverySnapshots: [],
  }));
}

export async function readRecoverySnapshots(): Promise<RecoverySnapshot[]> {
  const storage = await readStorage();
  return storage.recoverySnapshots;
}