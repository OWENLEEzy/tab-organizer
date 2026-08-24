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

/**
 * Match one keyword against one hostname at label boundaries.
 *
 * A *label* is one dot-separated segment of a hostname:
 * `api.github.com` → `['api', 'github', 'com']`.
 *
 * - A keyword with no dot matches when any single label *starts with* it, so
 *   `steam` claims `store.steampowered.com` but `irc` never claims
 *   `circleci.com` and `mega` never claims `omega.com`.
 * - A keyword with dots is itself a run of labels, and must match a contiguous
 *   run of hostname labels *exactly*, so `google.com` claims `docs.google.com`
 *   but `ba.com` never claims `alibaba.com`.
 *
 * Both arguments must already be lowercase.
 */
function keywordMatchesHostname(keywordLabels: readonly string[], hostname: string): boolean {
  const hostLabels = hostname.split('.');

  if (keywordLabels.length === 1) {
    const keyword = keywordLabels[0];
    return hostLabels.some((label) => label.startsWith(keyword));
  }

  const lastStart = hostLabels.length - keywordLabels.length;
  for (let start = 0; start <= lastStart; start += 1) {
    if (keywordLabels.every((label, offset) => hostLabels[start + offset] === label)) {
      return true;
    }
  }
  return false;
}

/** Match one rule against a product's hostnames. Never throws. */
export function ruleMatchesHostnames(
  rule: SectionAutoRule,
  hostnames: readonly string[],
): boolean {
  if (rule.kind === 'keyword') {
    const needle = rule.value.toLowerCase();
    if (needle === '') return false;
    const keywordLabels = needle.split('.');
    return hostnames.some((hostname) => keywordMatchesHostname(keywordLabels, hostname.toLowerCase()));
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
function findAutoSectionId(
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
