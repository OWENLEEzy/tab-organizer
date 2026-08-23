import type { Section, SectionAutoRule } from '../types';

/**
 * Where a product group belongs, and why.
 *
 * Three independent data sources can each have an opinion: explicit
 * assignments, the explicit "keep it unsectioned" veto list, and the section
 * auto-rules. This module is the only place their priority is written down:
 *
 *     explicit assignment  >  explicit veto  >  rule inference
 *
 * Every consumer — auto-assignment, the settings preview, the pinned badge —
 * reads this so the UI can never promise something the engine will not do.
 */
export type Membership =
  | { kind: 'assigned'; sectionId: string }
  | { kind: 'pinned-unsectioned' }
  | { kind: 'auto'; sectionId: string }
  | { kind: 'none' };

export interface MembershipInput {
  /** Hostnames observed for this product group. */
  hostnames: readonly string[];
  /** All sections. Sorted by `order` internally; callers need not pre-sort. */
  sections: readonly Section[];
  /** Section this product is explicitly assigned to, or null. */
  assignedSectionId: string | null;
  /** True when the user explicitly moved this product out of every section. */
  isPinnedUnsectioned: boolean;
}

/** Match one rule against a product's hostnames. Never throws. */
export function ruleMatchesHostnames(
  rule: SectionAutoRule,
  hostnames: readonly string[],
): boolean {
  if (rule.kind === 'keyword') {
    const needle = rule.value.toLowerCase();
    if (needle === '') return false;
    return hostnames.some((hostname) => hostname.toLowerCase().includes(needle));
  }

  try {
    const re = new RegExp(rule.pattern, 'i');
    return hostnames.some((hostname) => re.test(hostname));
  } catch {
    // An uncompilable pattern matches nothing rather than breaking its siblings.
    return false;
  }
}

/** True when any rule in the set matches. */
export function rulesMatchHostnames(
  rules: readonly SectionAutoRule[] | undefined,
  hostnames: readonly string[],
): boolean {
  if (!rules || rules.length === 0) return false;
  return rules.some((rule) => ruleMatchesHostnames(rule, hostnames));
}

/** First section (in `order`) whose rules match, or null. */
export function findAutoSectionId(
  sections: readonly Section[],
  hostnames: readonly string[],
): string | null {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  for (const section of sorted) {
    if (rulesMatchHostnames(section.autoRules, hostnames)) return section.id;
  }
  return null;
}

/** Arbitrate the three sources. This is the only place the priority lives. */
export function resolveMembership(input: MembershipInput): Membership {
  if (input.assignedSectionId !== null) {
    return { kind: 'assigned', sectionId: input.assignedSectionId };
  }
  if (input.isPinnedUnsectioned) {
    return { kind: 'pinned-unsectioned' };
  }
  const autoSectionId = findAutoSectionId(input.sections, input.hostnames);
  return autoSectionId === null
    ? { kind: 'none' }
    : { kind: 'auto', sectionId: autoSectionId };
}
