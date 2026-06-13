import type { TabGroup, Section, SectionAssignment } from '../types';
import { autoAssignProducts } from './section-organizer';
import { duplicateTabIdsToClose } from './duplicate-tabs';
import { getProductKey } from './product-key';

export interface OrganizePlan {
  assignmentUpdates: SectionAssignment[];
  tabIdsToClose: number[];
  /** Product groups in the desired display order (section order, then unassigned). */
  orderedGroups: TabGroup[];
}

interface ComputeInput {
  groups: TabGroup[];
  sections: Section[];
  assignments: SectionAssignment[];
  unsectionedProductKeys: string[];
  groupOrder: Record<string, number>;
}

export function computeOrganizePlan(input: ComputeInput): OrganizePlan {
  const { groups, sections, assignments, unsectionedProductKeys, groupOrder } = input;

  // 1. Auto-assign unassigned groups via autoRules
  const hostnamesByProductKey = new Map<string, string[]>();
  for (const g of groups) {
    const key = getProductKey(g);
    hostnamesByProductKey.set(key, [...new Set(g.tabs.map((t) => t.domain))]);
  }
  const assignmentUpdates = autoAssignProducts({
    products: groups, sections, assignments, unsectionedProductKeys, hostnamesByProductKey,
  });

  // 2. Find duplicate tab IDs to close (keep most-recently-accessed)
  const allTabs = groups.flatMap((g) => g.tabs);
  const tabIdsToClose = duplicateTabIdsToClose(allTabs, undefined, true);

  // 3. Compute the section-aware product order for the physical sort/group step
  const allAssignments = [...assignments, ...assignmentUpdates];
  const orderedGroups = orderGroups(groups, sections, allAssignments, groupOrder);

  return { assignmentUpdates, tabIdsToClose, orderedGroups };
}

function orderGroups(
  groups: TabGroup[],
  sections: Section[],
  assignments: SectionAssignment[],
  groupOrder: Record<string, number>,
): TabGroup[] {
  const assignmentBySectionId = new Map<string, SectionAssignment[]>();
  for (const a of assignments) {
    const list = assignmentBySectionId.get(a.sectionId) ?? [];
    list.push(a);
    assignmentBySectionId.set(a.sectionId, list);
  }

  const assignedKeys = new Set(assignments.map((a) => a.productKey));
  const groupByKey = new Map(groups.map((g) => [getProductKey(g), g]));
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // Assigned groups first (ordered by section order, then assignment order)
  const orderedGroups: TabGroup[] = [];
  for (const section of sortedSections) {
    const sectionAssignments = (assignmentBySectionId.get(section.id) ?? [])
      .sort((a, b) => a.order - b.order);
    for (const sa of sectionAssignments) {
      const g = groupByKey.get(sa.productKey);
      if (g) orderedGroups.push(g);
    }
  }

  // Unassigned groups at end, sorted by groupOrder then tab count
  const unassigned = groups
    .filter((g) => !assignedKeys.has(getProductKey(g)))
    .sort((a, b) => {
      const aOrder = groupOrder[getProductKey(a)] ?? Infinity;
      const bOrder = groupOrder[getProductKey(b)] ?? Infinity;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.tabs.length - a.tabs.length;
    });
  orderedGroups.push(...unassigned);

  return orderedGroups;
}
