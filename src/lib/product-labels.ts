/**
 * User-chosen display names for product groups, keyed by product key.
 *
 * A label override only changes what a group is called. It never changes which
 * tabs belong to the group — that is hostname grouping (`CustomGroup`), a
 * separate concept. Keying by product key means one product has at most one
 * name, so renaming twice replaces rather than stacks.
 */
export type ProductLabels = Readonly<Record<string, string>>;

/**
 * The one way to read an override. Own properties only: a product key such as
 * `constructor` must not pick up `Object.prototype` members.
 */
export function getProductLabel(labels: ProductLabels | undefined, productKey: string): string | undefined {
  return labels && Object.hasOwn(labels, productKey) ? labels[productKey] : undefined;
}

/**
 * A blank label, or one equal to the product's built-in name, is not an
 * override: it clears the entry instead of storing a no-op rename.
 */
export function setProductLabel(
  labels: ProductLabels,
  productKey: string,
  label: string,
  defaultLabel?: string,
): Record<string, string> {
  const trimmed = label.trim();
  if (!trimmed || trimmed === defaultLabel) return clearProductLabel(labels, productKey);
  return { ...labels, [productKey]: trimmed };
}

export function clearProductLabel(labels: ProductLabels, productKey: string): Record<string, string> {
  const { [productKey]: _removed, ...rest } = labels;
  return rest;
}

/** Validate persisted or imported data: keep only non-blank string labels. */
export function normalizeProductLabels(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const labels: Record<string, string> = {};
  for (const [productKey, label] of Object.entries(value)) {
    if (typeof label !== 'string') continue;
    const trimmed = label.trim();
    if (trimmed) labels[productKey] = trimmed;
  }
  return labels;
}
