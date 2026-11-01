import type { ProductSectionRef } from './section-grouping';

export type StripPlacement =
  | { kind: 'section'; sectionId: string }
  | { kind: 'unsectioned' };

export interface StripTab {
  productKey: string | null;
  pinned: boolean;
  groupTitle: string | null;
}

export function placementFromStrip(
  _tabs: readonly StripTab[],
  _sections: readonly ProductSectionRef[],
): ReadonlyMap<string, StripPlacement> {
  return new Map();
}
