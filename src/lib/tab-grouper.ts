import type { Tab, TabGroup } from '../types';
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
): TabGroup[] {
  if (tabs.length === 0) return [];

  const groupMap = new Map<string, Tab[]>();
  const productLabels = new Map<string, string>();
  const productIconDomains = new Map<string, string>();

  for (const tab of tabs) {
    try {
      const hostname = getTabDomain(tab.url);

      if (!hostname) continue;

      const product = productForHostname(hostname);
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
    });
  }

  return groups;
}
