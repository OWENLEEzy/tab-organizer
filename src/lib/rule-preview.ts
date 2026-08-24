import type { Section, SectionAssignment, SectionAutoRule, TabGroup } from '../types';
import { getProductKey } from './product-key';
import { resolveMembership, rulesMatchHostnames } from './section-membership';

/**
 * What a draft rule set would actually do, told honestly.
 *
 * - `will-take`   the group ends up in the draft section
 * - `blocked`     the rules match, but an explicit assignment elsewhere wins
 * - `pinned`      the rules match, but the user's explicit veto wins
 *
 * `blocked` and `pinned` exist so the settings preview cannot claim a move the
 * engine will not perform. See design spec §3.3.
 */
export type RulePreviewStatus = 'will-take' | 'blocked' | 'pinned';

export interface RulePreviewRow {
  product: TabGroup;
  status: RulePreviewStatus;
  /** Section currently holding the product, when `status` is `blocked`. */
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

  for (const product of input.products) {
    const productKey = getProductKey(product);
    const hostnames = input.hostnamesByProductKey.get(productKey) ?? [productKey];

    if (!rulesMatchHostnames(input.draftRules, hostnames)) continue;

    const membership = resolveMembership({
      hostnames,
      sections: input.sections,
      assignedSectionId: assignedBy.get(productKey) ?? null,
      isPinnedUnsectioned: pinned.has(productKey),
    });

    if (membership.kind === 'assigned' && membership.sectionId !== input.draftSectionId) {
      rows.push({ product, status: 'blocked', blockedBySectionId: membership.sectionId });
      continue;
    }
    if (membership.kind === 'pinned-unsectioned') {
      rows.push({ product, status: 'pinned', blockedBySectionId: null });
      continue;
    }

    rows.push({ product, status: 'will-take', blockedBySectionId: null });
  }

  return rows;
}
