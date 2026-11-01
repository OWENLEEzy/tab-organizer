import type { ProductSectionRef } from './section-grouping';

export type StripPlacement =
  | { kind: 'section'; sectionId: string }
  | { kind: 'unsectioned' };

export interface StripTab {
  productKey: string | null;
  pinned: boolean;
  groupTitle: string | null;
}

function sectionTitle(section: ProductSectionRef): string {
  return section.emoji ? `${section.emoji} ${section.name}` : section.name;
}

export function placementFromStrip(
  tabs: readonly StripTab[],
  sections: readonly ProductSectionRef[],
): ReadonlyMap<string, StripPlacement> {
  const sectionIdsByTitle = new Map<string, string[]>();
  for (const section of sections) {
    const title = sectionTitle(section);
    const ids = sectionIdsByTitle.get(title) ?? [];
    ids.push(section.sectionId);
    sectionIdsByTitle.set(title, ids);
  }

  const openProductKeys = new Set<string>();
  const sectionVotes = new Map<string, Set<string>>();
  const ambiguousProductKeys = new Set<string>();

  for (const tab of tabs) {
    if (tab.pinned || tab.productKey == null || tab.productKey === '') continue;
    openProductKeys.add(tab.productKey);
    if (tab.groupTitle == null) continue;

    const sectionIds = sectionIdsByTitle.get(tab.groupTitle) ?? [];
    if (sectionIds.length > 1) {
      ambiguousProductKeys.add(tab.productKey);
      continue;
    }
    if (sectionIds.length === 0) continue;

    const votes = sectionVotes.get(tab.productKey) ?? new Set<string>();
    votes.add(sectionIds[0]);
    sectionVotes.set(tab.productKey, votes);
  }

  const placements = new Map<string, StripPlacement>();
  for (const productKey of openProductKeys) {
    const votes = sectionVotes.get(productKey);
    if (votes != null && votes.size > 1) continue;
    if (votes != null && votes.size === 1) {
      placements.set(productKey, { kind: 'section', sectionId: [...votes][0] });
      continue;
    }
    if (ambiguousProductKeys.has(productKey)) continue;
    placements.set(productKey, { kind: 'unsectioned' });
  }

  return placements;
}
