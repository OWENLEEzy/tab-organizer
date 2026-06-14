import { computeOrganizePlan } from '../lib/organize-plan';
import { groupTabsByProduct } from '../lib/product-groups';
import { duplicateTabIdsToClose } from '../lib/duplicate-tabs';
import { getProductKey } from '../lib/product-key';
import { isRealTab } from '../lib/url-rules';
import { sortAndGroupTabs } from '../utils/sort-and-group-tabs';
import { queryAllTabs, closeTabIds } from '../utils/chrome-tabs';
import { readStorage, applyAssignmentUpdates } from '../utils/storage';
import { protectRecoveryBeforeClosing } from '../utils/recovery-protect';
import { chromeTabToAppTab } from '../utils/tab-mapping';

export interface OrganizeOutcome {
  /** True only when every step succeeded; false on any partial failure. */
  ok: boolean;
  /** How many duplicate tabs were actually closed. */
  closedCount: number;
  /** Real remaining counts AFTER organizing (never hardcoded to 0). */
  remainingDuplicates: number;
  remainingUnassigned: number;
}

async function loadGroups() {
  const [chromeTabs, storage] = await Promise.all([queryAllTabs(), readStorage()]);
  const tabs = chromeTabs.filter((t) => isRealTab(t.url ?? '')).map(chromeTabToAppTab);
  const groups = groupTabsByProduct(tabs, storage.groupOrder, storage.settings.customGroups);
  return { chromeTabs, storage, groups };
}

function countRemaining(
  groups: ReturnType<typeof groupTabsByProduct>,
  assignedKeys: Set<string>,
): { remainingDuplicates: number; remainingUnassigned: number } {
  const remainingUnassigned = groups.filter((g) => !assignedKeys.has(getProductKey(g))).length;
  const remainingDuplicates = duplicateTabIdsToClose(
    groups.flatMap((g) => g.tabs),
    undefined,
    true,
  ).length;
  return { remainingDuplicates, remainingUnassigned };
}

/**
 * Best-effort "organize" run for the popup, with honest reporting.
 *
 * Order matters: re-read fresh state → persist assignments as a delta merge →
 * protect recovery → close duplicates → sort + native-group by section → re-read
 * to report the REAL remaining counts. Any failed step flips `ok` to false so the
 * UI never claims success it didn't achieve.
 */
export async function runOrganize(): Promise<OrganizeOutcome> {
  const { chromeTabs, storage, groups } = await loadGroups();

  const plan = computeOrganizePlan({
    groups,
    sections: storage.sections,
    assignments: storage.sectionAssignments,
    unsectionedProductKeys: storage.unsectionedProductKeys,
    groupOrder: storage.groupOrder,
  });

  let ok = true;

  // Persist auto-assignments as a delta merge (won't clobber concurrent edits).
  try {
    await applyAssignmentUpdates(plan.assignmentUpdates);
  } catch (err: unknown) {
    ok = false;
    console.error('[Tab Organizer] Failed to persist assignments', err);
  }

  // Close duplicates — but protect recovery first so they stay restorable.
  let closedCount = 0;
  if (plan.tabIdsToClose.length > 0) {
    try {
      await protectRecoveryBeforeClosing(chromeTabs);
      await closeTabIds(plan.tabIdsToClose);
      closedCount = plan.tabIdsToClose.length;
    } catch (err: unknown) {
      ok = false;
      console.error('[Tab Organizer] Failed to close duplicate tabs', err);
    }
  }

  // Sort + native-group by section. Failures are reported, not swallowed.
  try {
    const result = await sortAndGroupTabs(plan.orderedGroups, {
      closedTabIds: new Set(plan.tabIdsToClose),
      sectionByProductKey: plan.sectionByProductKey,
    });
    if (result.moveFailures > 0 || result.groupFailures > 0) ok = false;
  } catch (err: unknown) {
    ok = false;
    console.error('[Tab Organizer] Failed to sort/group tabs', err);
  }

  // Re-read to report the REAL remaining counts after everything settled.
  const after = await loadGroups();
  const assignedKeys = new Set(after.storage.sectionAssignments.map((a) => a.productKey));
  const remaining = countRemaining(after.groups, assignedKeys);

  return { ok, closedCount, ...remaining };
}
