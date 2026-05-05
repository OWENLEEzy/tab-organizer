import type { Tab, TabGroup } from '../types';
import { FRIENDLY_DOMAINS } from '../config/friendly-domains';
import { productForHostname } from '../config/products';

// ─── Constants ──────────────────────────────────────────────────────

const LOCAL_FILES_KEY = 'local-files';
const DEFAULT_COLOR = '#4DAB9A';
const DUPLICATE_COLOR = '#DFAB01';

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Derive a human-friendly display name for a domain.
 * Uses the FRIENDLY_DOMAINS lookup table, falls back to cleaning
 * the raw hostname (strip "www.", TLD, etc.).
 */
function friendlyNameForDomain(domain: string): string {
  if (FRIENDLY_DOMAINS[domain]) return FRIENDLY_DOMAINS[domain];
  if (domain === LOCAL_FILES_KEY) return FRIENDLY_DOMAINS[LOCAL_FILES_KEY] ?? 'Local Files';

  // Strip common prefix and TLD for a clean fallback
  const cleaned = domain.replace(/^www\./, '').replace(/\.[a-z.]+$/, '');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Count how many tabs in the array are duplicates (same URL appears
 * more than once).  Returns `{ duplicateCount, hasDuplicates }`.
 */
function countDuplicates(tabs: readonly Tab[]): {
  duplicateCount: number;
  hasDuplicates: boolean;
} {
  const urlCounts = new Map<string, number>();
  for (const tab of tabs) {
    const count = urlCounts.get(tab.url) ?? 0;
    urlCounts.set(tab.url, count + 1);
  }

  let duplicateCount = 0;
  for (const count of urlCounts.values()) {
    if (count > 1) duplicateCount += count - 1;
  }

  return { duplicateCount, hasDuplicates: duplicateCount > 0 };
}

/**
 * Check whether a domain is associated with any landing page pattern,
 * used for priority sorting (landing-page domains sort before others).
 */
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
      let hostname: string;
      if (tab.url.startsWith('file://')) {
        hostname = LOCAL_FILES_KEY;
      } else {
        hostname = new URL(tab.url).hostname;
      }

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
      friendlyName: productLabels.get(key) ?? friendlyNameForDomain(key),
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
