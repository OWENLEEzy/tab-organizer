/**
 * Resolves the primary unique identifier (productKey) for a tab group.
 * Follows the standard priority: productKey ?? itemKey ?? domain.
 */
export function getProductKey(group: { productKey?: string; itemKey?: string; domain: string }): string {
  return group.productKey ?? group.itemKey ?? group.domain;
}