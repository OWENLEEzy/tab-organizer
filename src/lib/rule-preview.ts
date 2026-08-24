import type { Section, SectionAssignment, SectionAutoRule, TabGroup } from '../types';
import { getProductKey } from './product-key';
import { resolveMembership, rulesMatchHostnames } from './section-membership';

/**
 * What a draft rule set would actually do, told honestly.
 *
 * - `will-take`   the group ends up in the draft section
 * - `blocked`     the rules match, but something else wins: either an
 *                 explicit assignment elsewhere, or another section's own
 *                 rules auto-claiming the product first by `order`
 * - `pinned`      the rules match, but the user's explicit veto wins
 *
 * `blocked` and `pinned` exist so the settings preview cannot claim a move the
 * engine will not perform. See design spec §3.3.
 */
export type RulePreviewStatus = 'will-take' | 'blocked' | 'pinned';

export interface RulePreviewRow {
  product: TabGroup;
  status: RulePreviewStatus;
  /**
   * Section that actually wins the product when `status` is `blocked` —
   * either the section holding an explicit assignment, or the section whose
   * own rules auto-claim the product ahead of the draft section by `order`.
   */
  blockedBySectionId: string | null;
}

export interface RulePreviewInput {
  draftSectionId: string;
  draftRules: readonly SectionAutoRule[];
  products: readonly TabGroup[];
  hostnamesByProductKey: ReadonlyMap<string, readonly string[]>;
  sections: readonly Section[];
  assignments: readonly SectionAssignment[];
  unsectionedProductKeys: readonly string[];
}

export function previewRuleMatches(input: RulePreviewInput): RulePreviewRow[] {
  const assignedBy = new Map(input.assignments.map((a) => [a.productKey, a.sectionId]));
  const pinned = new Set(input.unsectionedProductKeys);
  const rows: RulePreviewRow[] = [];

  // Arbitrate against the section set as it will exist once the draft is
  // saved, so the preview and the engine cannot disagree about who wins by
  // order. If `draftSectionId` names a brand-new, not-yet-saved section, it
  // is absent from `input.sections` and this map is a no-op: `resolveMembership`
  // can then never resolve to it, so any other section that auto-claims the
  // product correctly yields `blocked` — a new section's `order` is unknown,
  // so promising `will-take` would be a guess.
  const draftedSections = input.sections.map((section) =>
    section.id === input.draftSectionId
      ? { ...section, autoRules: [...input.draftRules] }
      : section,
  );

  for (const product of input.products) {
    const productKey = getProductKey(product);
    const hostnames = input.hostnamesByProductKey.get(productKey) ?? [productKey];

    if (!rulesMatchHostnames(input.draftRules, hostnames)) continue;

    const membership = resolveMembership({
      hostnames,
      sections: draftedSections,
      assignedSectionId: assignedBy.get(productKey) ?? null,
      isPinnedUnsectioned: pinned.has(productKey),
    });

    if (membership.kind === 'pinned-unsectioned') {
      rows.push({ product, status: 'pinned', blockedBySectionId: null });
      continue;
    }
    if (
      (membership.kind === 'assigned' || membership.kind === 'auto') &&
      membership.sectionId !== input.draftSectionId
    ) {
      rows.push({ product, status: 'blocked', blockedBySectionId: membership.sectionId });
      continue;
    }

    rows.push({ product, status: 'will-take', blockedBySectionId: null });
  }

  return rows;
}
