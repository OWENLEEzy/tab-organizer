import type { CustomGroup, ProductInfo } from '../types';
import { productForHostname } from '../config/products';

/**
 * Resolve a tab's hostname (as produced by getTabDomain) into a single product
 * identity. User-defined custom group overrides win; otherwise the built-in
 * product rules / fallback apply.
 *
 * This is the ONE place every surface (dashboard, popup, sort/group pipeline)
 * derives product identity, so they can never drift apart.
 */
export function resolveProduct(
  hostname: string,
  customGroups?: CustomGroup[],
): ProductInfo {
  const normalizedHost = hostname.toLowerCase();
  const customOverride = customGroups?.find(
    (cg) =>
      cg.hostname?.toLowerCase() === normalizedHost ||
      (cg.hostnameEndsWith && normalizedHost.endsWith(cg.hostnameEndsWith.toLowerCase())),
  );

  if (customOverride) {
    return {
      key: customOverride.groupKey,
      label: customOverride.groupLabel,
      iconDomain: hostname,
    };
  }

  return productForHostname(hostname);
}
