import type { TabGroup } from '../../types';
import { getProductLabel, type ProductLabels } from '../../lib/product-labels';
import { getProductKey } from '../../lib/product-key';

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
  if (getProductLabel(productLabels, getProductKey(group)) !== undefined) return 'custom';

  const label = group.friendlyName || group.domain;
  if (label === group.domain) return 'domain-fallback';

  return 'built-in';
}
