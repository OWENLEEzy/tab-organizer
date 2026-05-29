import type { Tab } from '../../../types';
import { getGroupFaviconUrl } from '../../../lib/tab-utils';

/**
 * Resolves the representative favicon for a product group (list of tabs).
 * Finds the first tab with a valid non-empty favicon URL, or falls back to using the first tab's URL.
 */
export function getProductGroupIconUrl(tabs: readonly Tab[]): string {
  return getGroupFaviconUrl(tabs);
}