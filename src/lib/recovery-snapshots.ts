import { productForHostname } from '../config/products';
import type { RecoveryProductSummary, RecoverySnapshot, RecoveryTab, Tab } from '../types';
import { getTabDomain, isRealTab } from '../utils/url';

const MAX_TABS_PER_SNAPSHOT = 80;

function snapshotId(capturedAt: string, tabs: RecoveryTab[]): string {
  const key = `${capturedAt}:${tabs.map((tab) => tab.url).join('|')}`;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = Math.imul(31, hash) + key.charCodeAt(index) | 0;
  }
  return `recovery-${Math.abs(hash).toString(36)}`;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

export function recoveryUrlSignature(snapshot: RecoverySnapshot): string {
  return snapshot.tabs.map((tab) => normalizeUrl(tab.url)).sort().join('\n');
}

export function shouldReplaceRecoveryCandidate(
  current: RecoverySnapshot | null,
  next: RecoverySnapshot,
): boolean {
  if (!current) return true;
  return recoveryUrlSignature(current) !== recoveryUrlSignature(next);
}

export function buildRecoverySnapshot(
  tabs: readonly Tab[],
  capturedAt: string = new Date().toISOString(),
): RecoverySnapshot | null {
  const recoveryTabs: RecoveryTab[] = [];

  for (const tab of tabs) {
    if (!isRealTab(tab.url)) continue;
    const hostname = getTabDomain(tab.url);
    if (!hostname) continue;

    const product = productForHostname(hostname);
    recoveryTabs.push({
      url: tab.url,
      title: tab.title,
      domain: hostname,
      productKey: product.key,
      productLabel: product.label,
      iconDomain: product.iconDomain,
      favIconUrl: tab.favIconUrl,
      capturedAt,
      windowId: tab.windowId,
      active: tab.active,
    });

    if (recoveryTabs.length >= MAX_TABS_PER_SNAPSHOT) break;
  }

  if (recoveryTabs.length === 0) return null;

  const productsByKey = new Map<string, RecoveryProductSummary>();
  for (const tab of recoveryTabs) {
    const existing = productsByKey.get(tab.productKey);
    if (existing) {
      existing.tabCount += 1;
    } else {
      productsByKey.set(tab.productKey, {
        productKey: tab.productKey,
        label: tab.productLabel,
        iconDomain: tab.iconDomain,
        tabCount: 1,
      });
    }
  }

  const products = [...productsByKey.values()].sort((a, b) => {
    const countDiff = b.tabCount - a.tabCount;
    if (countDiff !== 0) return countDiff;
    return a.label.localeCompare(b.label);
  });

  return {
    id: snapshotId(capturedAt, recoveryTabs),
    capturedAt,
    tabCount: recoveryTabs.length,
    products,
    tabs: recoveryTabs,
  };
}
