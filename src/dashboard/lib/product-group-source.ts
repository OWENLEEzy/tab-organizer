import type { TabGroup } from '../../types';
import { getProductLabel, type ProductLabels } from '../../lib/product-labels';
import { getProductKey } from '../../lib/product-key';
import { fallbackProductForHostname } from '../../config/products';

/**
 * Where a product group's display name came from. Surfacing this lets the
 * settings page point at the groups the product failed to recognize instead of
 * asking the user to guess a hostname — see design spec §3.4.
 */
export type ProductGroupSource = 'built-in' | 'custom' | 'domain-fallback';

export function classifyProductGroup(
  group: TabGroup,
  productLabels: ProductLabels,
): ProductGroupSource {
  const productKey = getProductKey(group);
  if (getProductLabel(productLabels, productKey) !== undefined) return 'custom';

  // No product rule claimed this site: it was grouped under its own hostname.
  const hostname = group.tabs[0]?.domain;
  if (hostname && productKey === fallbackProductForHostname(hostname).key) return 'domain-fallback';

  return 'built-in';
}
