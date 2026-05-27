import type { Tab, TabGroup, ManualGroup, CustomGroup, GroupSortOption } from '../types';
import { productForHostname } from '../config/products';
import { friendlyDomain } from './title-cleaner';
import { countDuplicates } from './tab-utils';
import { getTabDomain } from '../utils/url';

// ─── Constants ──────────────────────────────────────────────────────

const DEFAULT_COLOR = '#4DAB9A';
const DUPLICATE_COLOR = '#DFAB01';

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Default sort comparator for domain keys.
 * Tab count descending, then stable product key.
 */
function defaultSortComparator(
  groupMap: Map<string, Tab[]>,
): (a: string, b: string) => number {
  return (a, b) => {
    const countDiff = groupMap.get(b)!.length - groupMap.get(a)!.length;
    if (countDiff !== 0) return countDiff;
    return a.localeCompare(b);
  };
}

/**
 * Get the most recent lastAccessed timestamp from a list of tabs.
 */
function getGroupLastAccessed(tabs: Tab[]): number | undefined {
  let max = 0;
  for (const tab of tabs) {
    if (tab.lastAccessed && tab.lastAccessed > max) {
      max = tab.lastAccessed;
    }
  }
  return max > 0 ? max : undefined;
}

/**
 * Create a sort comparator for TabGroup array based on the given sort option.
 */
export function createSortComparator(
  sortBy: GroupSortOption,
): (a: TabGroup, b: TabGroup) => number {
  switch (sortBy) {
    case 'name':
      return (a, b) => a.friendlyName.localeCompare(b.friendlyName);
    case 'lastAccessed':
      return (a, b) => {
        const aTime = a.lastAccessed ?? 0;
        const bTime = b.lastAccessed ?? 0;
        if (bTime !== aTime) return bTime - aTime;
        return a.friendlyName.localeCompare(b.friendlyName);
      };
    case 'count':
      return (a, b) => {
        const bCount = b.tabs.length;
        const aCount = a.tabs.length;
        if (bCount !== aCount) return bCount - aCount;
        return a.friendlyName.localeCompare(b.friendlyName);
      };
  }
}

/**
 * Group tabs by product.
 *
 * Algorithm:
 * 1. Resolve each tab's hostname into a stable product identity.
 * 2. Handle `file://` URLs as `local-files`.
 * 3. Sort: custom order first (if provided), then by tab count.
 *
 * The returned groups are fully hydrated TabGroup objects ready for
 * rendering — each carries its product label, icon domain, color, duplicate info,
 * and a stable sort order.
 */
export function groupTabsByDomain(
  tabs: readonly Tab[],
  customOrder?: Record<string, number>,
  customGroups?: CustomGroup[],
): TabGroup[] {
  if (tabs.length === 0) return [];

  const groupMap = new Map<string, Tab[]>();
  const productLabels = new Map<string, string>();
  const productIconDomains = new Map<string, string>();

  for (const tab of tabs) {
    try {
      const hostname = getTabDomain(tab.url);

      if (!hostname) continue;

      // 1. Check custom overrides first
      const normalizedHost = hostname.toLowerCase();
      const customOverride = customGroups?.find(
        (cg) =>
          cg.hostname?.toLowerCase() === normalizedHost ||
          (cg.hostnameEndsWith && normalizedHost.endsWith(cg.hostnameEndsWith.toLowerCase())),
      );

      const product = customOverride
        ? {
            key: customOverride.groupKey,
            label: customOverride.groupLabel,
            iconDomain: hostname,
          }
        : productForHostname(hostname);

      productLabels.set(product.key, product.label);
      productIconDomains.set(product.key, product.iconDomain);

      const existing = groupMap.get(product.key);
      if (existing) {
        existing.push(tab);
      } else {
        groupMap.set(product.key, [tab]);
      }
    } catch {
      // Skip malformed URLs
    }
  }

  // Build sorted groups
  const groups: TabGroup[] = [];

  const defaultCompare = defaultSortComparator(groupMap);

  // Sort keys: apply custom order overrides, then fall back to default logic
  const sortedKeys = [...groupMap.keys()].sort((a, b) => {
    if (customOrder && Object.keys(customOrder).length > 0) {
      const aCustom = customOrder[a];
      const bCustom = customOrder[b];

      // Both have custom order: sort by that
      if (aCustom !== undefined && bCustom !== undefined) {
        return aCustom - bCustom;
      }
      // Only one has custom order: custom-ordered goes first
      if (aCustom !== undefined) return -1;
      if (bCustom !== undefined) return 1;
    }

    // No custom order for either: use default sort
    return defaultCompare(a, b);
  });

  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const groupTabs = groupMap.get(key)!;
    const { duplicateCount, hasDuplicates } = countDuplicates(groupTabs);

    groups.push({
      id: key,
      domain: key,
      friendlyName: productLabels.get(key) ?? friendlyDomain(key),
      itemType: 'product',
      itemKey: key,
      productKey: key,
      iconDomain: productIconDomains.get(key) ?? key,
      tabs: groupTabs,
      collapsed: false,
      order: i,
      color: hasDuplicates ? DUPLICATE_COLOR : DEFAULT_COLOR,
      hasDuplicates,
      duplicateCount,
      lastAccessed: getGroupLastAccessed(groupTabs),
    });
  }

  return groups;
}

/**
 * Auto-assign a product to a space based on its hostname rules.
 */
export function autoAssignProductToSpace(
  hostnames: readonly string[],
  spaces: ManualGroup[]
): string | null {
  for (const space of spaces) {
    for (const rule of space.autoRules ?? []) {
      try {
        const re = new RegExp(rule.pattern, 'i');
        if (hostnames.some((hostname) => re.test(hostname))) return space.id;
      } catch {
        // Skip invalid regex patterns
      }
    }
  }
  return null;
}
