import type { ProductSectionRef } from './section-grouping';

export interface NativeTabSnapshot {
  id: number;
  index: number;
  pinned: boolean;
  groupId: number;
  productKey?: string;
}

export interface NativeGroupSnapshot {
  id: number;
  title?: string;
}

interface PlannedNativeGroup {
  key: string;
  section?: ProductSectionRef;
  originalGroupIds: number[];
  tabIds: number[];
}

export interface NativeGroupPlan {
  groups: PlannedNativeGroup[];
  ungroupedTabIds: number[];
  orderedTabIds: number[];
}

export function nativeSectionTitle(section: ProductSectionRef): string {
  return section.emoji ? `${section.emoji} ${section.name}` : section.name;
}

/** Decide destinations before browser mutations can change group membership. */
export function planNativeGroups(
  tabs: readonly NativeTabSnapshot[],
  nativeGroups: readonly NativeGroupSnapshot[],
  sections: readonly ProductSectionRef[],
  sectionByProductKey: ReadonlyMap<string, ProductSectionRef>,
  productOrder: readonly string[],
): NativeGroupPlan {
  const eligible = tabs.filter((tab) => !tab.pinned).sort((a, b) => a.index - b.index);
  const sectionById = new Map(sections.map((section) => [section.sectionId, section]));
  for (const section of sectionByProductKey.values()) sectionById.set(section.sectionId, section);
  const plans = new Map<string, PlannedNativeGroup>();
  for (const section of sectionById.values()) {
    plans.set(`section:${section.sectionId}`, {
      key: `section:${section.sectionId}`, section, originalGroupIds: [], tabIds: [],
    });
  }
  const ownerByNativeGroup = new Map<number, string>();
  for (const group of nativeGroups) {
    const matches = [...sectionById.values()].filter((section) => nativeSectionTitle(section) === group.title);
    const assignedSections = new Set(eligible
      .filter((tab) => tab.groupId === group.id && tab.productKey != null)
      .map((tab) => sectionByProductKey.get(tab.productKey!)?.sectionId)
      .filter((id): id is string => id != null));
    const matchingOwners = matches.filter((section) => assignedSections.has(section.sectionId));
    const owner = matches.length === 1 ? matches[0]
      : matchingOwners.length === 1 ? matchingOwners[0] : undefined;
    const key = owner ? `section:${owner.sectionId}` : `native:${group.id}`;
    if (!plans.has(key)) plans.set(key, { key, originalGroupIds: [], tabIds: [] });
    plans.get(key)!.originalGroupIds.push(group.id);
    ownerByNativeGroup.set(group.id, key);
  }
  const ungrouped: NativeTabSnapshot[] = [];
  for (const tab of eligible) {
    const assignment = tab.productKey == null ? undefined : sectionByProductKey.get(tab.productKey);
    const key = assignment ? `section:${assignment.sectionId}` : ownerByNativeGroup.get(tab.groupId);
    if (key) plans.get(key)!.tabIds.push(tab.id);
    else ungrouped.push(tab);
  }
  const tabById = new Map(eligible.map((tab) => [tab.id, tab]));
  const rank = new Map(productOrder.map((key, index) => [key, index]));
  const compare = (a: number, b: number): number => {
    const left = tabById.get(a)!;
    const right = tabById.get(b)!;
    const leftRank = left.productKey == null ? Infinity : rank.get(left.productKey) ?? Infinity;
    const rightRank = right.productKey == null ? Infinity : rank.get(right.productKey) ?? Infinity;
    return (leftRank === rightRank ? 0 : leftRank - rightRank) || left.index - right.index;
  };
  const groups = [...plans.values()].filter((plan) => plan.tabIds.length > 0);
  for (const group of groups) {
    // Preserve the user's ordering inside unrelated native groups.
    if (group.section) group.tabIds.sort(compare);
  }
  const sectionGroups = groups.filter((group) => group.section);
  const remaining = [
    ...groups.filter((group) => !group.section).map((group) => group.tabIds),
    ...ungrouped.filter((tab) => tab.productKey != null).map((tab) => [tab.id]),
  ].sort((a, b) => compare(a[0], b[0]));
  const blocks = [...sectionGroups.map((group) => group.tabIds), ...remaining];
  const pinnedCount = tabs.filter((tab) => tab.pinned).length;
  // Keep unrelated internal pages at their original slots when possible.
  // A native group cannot straddle one: use the nearest block boundary instead.
  let firstAnchorBoundary = 0;
  for (const anchor of ungrouped.filter((tab) => tab.productKey == null)) {
    const desiredIndex = anchor.index - pinnedCount;
    let position = 0;
    let closest = firstAnchorBoundary;
    let distance = Infinity;
    for (let boundary = 0; boundary <= blocks.length; boundary++) {
      if (boundary >= firstAnchorBoundary && Math.abs(position - desiredIndex) < distance) {
        distance = Math.abs(position - desiredIndex);
        closest = boundary;
      }
      position += blocks[boundary]?.length ?? 0;
    }
    blocks.splice(closest, 0, [anchor.id]);
    firstAnchorBoundary = closest + 1;
  }
  return {
    groups,
    ungroupedTabIds: ungrouped.map((tab) => tab.id),
    orderedTabIds: blocks.flat(),
  };
}
