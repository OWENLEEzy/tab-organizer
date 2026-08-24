import type { CustomGroup, TabGroup } from '../../types';
import { getProductKey } from '../../lib/product-key';

/**
 * Where a product group's display name came from. Surfacing this lets the
 * settings page point at the groups the product failed to recognize instead of
 * asking the user to guess a hostname — see design spec §3.4.
 */
export type ProductGroupSource = 'built-in' | 'custom' | 'domain-fallback';

export function classifyProductGroup(
  group: TabGroup,
  customGroups: readonly CustomGroup[],
): ProductGroupSource {
  const productKey = getProductKey(group);
  if (customGroups.some((custom) => custom.groupKey === productKey)) return 'custom';

  const label = group.friendlyName || group.domain;
  if (label === group.domain) return 'domain-fallback';

  return 'built-in';
}
