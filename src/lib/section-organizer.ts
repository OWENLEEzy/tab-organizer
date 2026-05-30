/**
 * section-organizer.ts
 *
 * Pure domain model for Tab Organizer's section/assignment system.
 *
 * Object model:
 * - ProductKey: TabGroup's stable identity, from productKey ?? itemKey ?? domain
 * - SectionId: section's stable identity (section.id)
 * - SectionAssignment: { productKey, sectionId, order } — group-level label relationship
 * - NoSection: system bucket for products without section labels; not a real section, not persisted
 * - unsectionedProductKeys: product keys the user explicitly moved to No section so auto-rules don't re-apply
 * - OrganizerModel: unified UI projection combining sections, products, assignments, and derived maps
 *
 * All UI id encoding/decoding lives here so the rest of the codebase stays pure.
 */

import type { Section, SectionAssignment, TabGroup } from '../types';
import { getProductKey } from './product-key';

// ─── ID Constants ─────────────────────────────────────────────────────────────

/** System bucket id for products with no section assignment. Never persisted. */
export const NO_SECTION_ID = '__no-section__';

/** Prefix for product item ids in UI (DnD, table rows, search). */
export const PRODUCT_ITEM_PREFIX = 'product:';

/** Prefix for section drop ids in UI (DnD droppable). */
export const SECTION_DROP_PREFIX = 'section:';

/** Unassigned section droppable id — maps to NO_SECTION_ID. */
export const UNASSIGNED_SECTION_DROP_ID = 'section:unassigned';

// ─── ID Codecs ───────────────────────────────────────────────────────────────

/**
 * Encode a productKey into a UI item id.
 * Only use this function to create product item ids; never concatenate manually.
 */
export function toProductItemId(productKey: string): string {
  return `${PRODUCT_ITEM_PREFIX}${productKey}`;
}

/**
 * Decode a product item id back to its productKey.
 * Returns null if the id doesn't match the product pattern.
 */
export function fromProductItemId(id: string): string | null {
  if (!id.startsWith(PRODUCT_ITEM_PREFIX)) return null;
  return id.slice(PRODUCT_ITEM_PREFIX.length);
}

/**
 * Encode a sectionId into a UI droppable id.
 * Only use this function to create section drop ids; never concatenate manually.
 */
export function toSectionDropId(sectionId: string): string {
  return `${SECTION_DROP_PREFIX}${sectionId}`;
}

/**
 * Decode a section droppable id back to its sectionId.
 * Returns null if the id doesn't match the section pattern.
 * Maps 'unassigned' → NO_SECTION_ID (the system bucket).
 */
export function fromSectionDropId(id: string): string | null {
  if (!id.startsWith(SECTION_DROP_PREFIX)) return null;
  const sectionId = id.slice(SECTION_DROP_PREFIX.length);
  // Map the unassigned drop target to the system bucket
  if (sectionId === 'unassigned') return NO_SECTION_ID;
  return sectionId;
}

/**
 * Parse a drop id (product or section) into its type and key.
 * Used by DnD and table components to interpret drag/drop ids.
 */
export function parseDropId(id: string): { type: 'product'; productKey: string } | { type: 'section'; sectionId: string } | null {
  if (id.startsWith(PRODUCT_ITEM_PREFIX)) {
    return { type: 'product', productKey: id.slice(PRODUCT_ITEM_PREFIX.length) };
  }
  if (id.startsWith(SECTION_DROP_PREFIX)) {
    const sectionId = id.slice(SECTION_DROP_PREFIX.length);
    // Map the legacy unassigned id to NO_SECTION_ID
    const normalized = sectionId === 'unassigned' ? NO_SECTION_ID : sectionId;
    return { type: 'section', sectionId: normalized };
  }
  return null;
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface OrganizerModel {
  /** All real sections, sorted by order. */
  sections: Section[];
  /** All current TabGroup products. */
  products: TabGroup[];
  /** All explicit section assignments. */
  assignments: SectionAssignment[];
  /** Product keys that should not be auto-assigned (user chose No section). */
  unsectionedProductKeys: string[];
  /** Products explicitly assigned to each sectionId, sorted by assignment order. */
  productsBySection: Map<string, TabGroup[]>;
  /** Products with no section assignment (implicit NoSection bucket). */
  unassignedProducts: TabGroup[];
  /** Sections that have at least one product — for Cards view. */
  visibleSections: Section[];
  /** All sections with at least one product + leading null for "All sections" — for navigation. */
  navigationSections: (string | null)[];
  /** Map from product item id (product:<key>) to sectionId. */
  assignmentByProductItemId: Map<string, string>;
  /** Map from productKey to its sectionId (or NO_SECTION_ID if unassigned). */
  assignmentByProductKey: Map<string, string>;
  /** All sectionIds that currently have products (for keyboard nav). */
  activeSectionIds: Set<string>;
}

export interface BuildOrganizerModelInput {
  sections: Section[];
  products: TabGroup[];
  assignments: SectionAssignment[];
  unsectionedProductKeys: string[];
  activeSectionId: string | null;
}

// ─── OrganizerModel Builder ──────────────────────────────────────────────────

/**
 * Build the unified OrganizerModel UI projection.
 * This is the single source of truth for all section-derived state in the UI.
 */
export function buildOrganizerModel(input: BuildOrganizerModelInput): OrganizerModel {
  const { sections, products, assignments, unsectionedProductKeys } = input;

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // assignmentByProductItemId: id → sectionId
  const assignmentByProductItemId = new Map<string, string>();
  // assignmentByProductKey: productKey → sectionId
  const assignmentByProductKey = new Map<string, string>();
  // productsBySection: sectionId → products
  const productsBySection = new Map<string, TabGroup[]>();
  // orderMap: sectionId → (productItemId → order)
  const orderMaps = new Map<string, Map<string, number>>();

  // Initialize buckets
  for (const section of sortedSections) {
    productsBySection.set(section.id, []);
  }

  // Build assignment lookup maps
  for (const assignment of assignments) {
    const productKey = assignment.productKey;
    const itemId = toProductItemId(productKey);
    assignmentByProductItemId.set(itemId, assignment.sectionId);
    assignmentByProductKey.set(productKey, assignment.sectionId);

    const bucket = productsBySection.get(assignment.sectionId);
    if (bucket) {
      const orderMap = orderMaps.get(assignment.sectionId) ?? new Map<string, number>();
      orderMap.set(itemId, assignment.order);
      orderMaps.set(assignment.sectionId, orderMap);
    }
  }

  // Assign products to sections (respecting order)
  for (const product of products) {
    const productKey = getProductKey(product);
    const sectionId = assignmentByProductKey.get(productKey) ?? null;

    if (sectionId) {
      const bucket = productsBySection.get(sectionId);
      if (bucket) {
        bucket.push(product);
      }
    }
  }

  // Build sort-dropdown order map from the products array index.
  // The caller passes products pre-sorted by the active sort option (count/name/lastAccessed),
  // so the array index reflects the sort dropdown order. In practice every section-assigned
  // product already has an orderMap entry (written from SectionAssignment above), so this
  // fallback is mainly a defensive edge-case guard. Unassigned products bypass this loop
  // entirely and inherit the pre-sorted order from the products array.
  const productOrderByIndex = new Map<string, number>();
  for (let i = 0; i < products.length; i++) {
    productOrderByIndex.set(getProductKey(products[i]), i);
  }

  // Sort each bucket: assignment order (manual drag) > sort dropdown index > creation-time order
  for (const [sectionId, items] of productsBySection) {
    const orderMap = orderMaps.get(sectionId);
    items.sort((a, b) => {
      const aKey = getProductKey(a);
      const bKey = getProductKey(b);
      const aOrder = orderMap?.get(toProductItemId(aKey)) ?? productOrderByIndex.get(aKey) ?? a.order;
      const bOrder = orderMap?.get(toProductItemId(bKey)) ?? productOrderByIndex.get(bKey) ?? b.order;
      return aOrder - bOrder;
    });
  }

  // Unassigned products — includes products with no assignment, regardless of override status.
  // unsectionedProductKeys only blocks auto-assignment; it does not hide products from the No section bucket.
  const unassignedProducts = products.filter((p) => {
    const productKey = getProductKey(p);
    return !assignmentByProductKey.has(productKey);
  });

  // Visible sections (have at least one product) — for Cards view
  const visibleSections = sortedSections.filter((section) => {
    const bucket = productsBySection.get(section.id);
    return (bucket?.length ?? 0) > 0;
  });

  // Navigation sections: leading null for "All", then visible section ids
  const navigationSections: (string | null)[] = [null, ...visibleSections.map((s) => s.id)];

  // Active section ids for keyboard navigation
  const activeSectionIds = new Set<string>();
  for (const product of products) {
    const productKey = getProductKey(product);
    const sectionId = assignmentByProductKey.get(productKey);
    if (sectionId) {
      activeSectionIds.add(sectionId);
    }
  }

  return {
    sections: sortedSections,
    products,
    assignments,
    unsectionedProductKeys: unsectionedProductKeys,
    productsBySection,
    unassignedProducts,
    visibleSections,
    navigationSections,
    assignmentByProductItemId,
    assignmentByProductKey,
    activeSectionIds,
  };
}

// ─── Auto-Assignment ─────────────────────────────────────────────────────────

export interface AutoAssignProductsInput {
  products: TabGroup[];
  sections: Section[];
  assignments: SectionAssignment[];
  unsectionedProductKeys: string[];
  hostnamesByProductKey: Map<string, string[]>;
}

/**
 * Compute which products should be auto-assigned to sections based on autoRules.
 * Returns a list of new SectionAssignment objects to append.
 *
 * Rules:
 * - Only products with no existing assignment are candidates
 * - Products in unsectionedProductKeys are skipped
 * - All autoRules within each section are evaluated in order; first match wins
 * - Sections are evaluated in section order (sorted by order field)
 */
export function autoAssignProducts(input: AutoAssignProductsInput): SectionAssignment[] {
  const { products, sections, assignments, unsectionedProductKeys, hostnamesByProductKey } = input;

  const assignedKeys = new Set(assignments.map((a) => a.productKey));
  const overrideSet = new Set(unsectionedProductKeys);
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  const newAssignments: SectionAssignment[] = [];

  // Pre-compute existing assignment counts per section
  const existingCountBySection = new Map<string, number>();
  for (const a of assignments) {
    existingCountBySection.set(a.sectionId, (existingCountBySection.get(a.sectionId) ?? 0) + 1);
  }

  for (const product of products) {
    const productKey = getProductKey(product);
    if (assignedKeys.has(productKey)) continue;
    if (overrideSet.has(productKey)) continue;

    const hostnames = hostnamesByProductKey.get(productKey) ?? [productKey];

    for (const section of sortedSections) {
      const rules = section.autoRules ?? [];
      let matched = false;

      for (const rule of rules) {
        try {
          const re = new RegExp(rule.pattern, 'i');
          if (hostnames.some((hostname) => re.test(hostname))) {
            const existingCount = existingCountBySection.get(section.id) ?? 0;
            const newCount = newAssignments.filter((a) => a.sectionId === section.id).length;
            newAssignments.push({
              productKey,
              sectionId: section.id,
              order: existingCount + newCount,
            });
            assignedKeys.add(productKey);
            matched = true;
            break;
          }
        } catch {
          // Skip invalid regex patterns without affecting other rules in the same section
        }
      }
      if (matched) break;
    }
  }

  return newAssignments;
}

// ─── Assignment Mutations ─────────────────────────────────────────────────────

/**
 * Create a new assignment list with the given product assigned to the given section.
 * Removes any prior assignment for that productKey.
 */
export function assignProductToSection(
  currentAssignments: SectionAssignment[],
  productKey: string,
  sectionId: string,
): SectionAssignment[] {
  const existingInSection = currentAssignments.filter(
    (a) => a.sectionId === sectionId && a.productKey !== productKey,
  );
  return [
    ...currentAssignments.filter((a) => a.productKey !== productKey),
    { productKey, sectionId, order: existingInSection.length },
  ];
}

/**
 * Remove all assignments for the given productKey and add it to unsectionedProductKeys.
 * The productKey will be immune to auto-assignment until explicitly assigned.
 */
export function moveProductToUnsectioned(
  currentAssignments: SectionAssignment[],
  currentOverrides: string[],
  productKey: string,
): { assignments: SectionAssignment[]; overrides: string[] } {
  const assignments = currentAssignments.filter((a) => a.productKey !== productKey);
  const overrides = currentOverrides.includes(productKey)
    ? currentOverrides
    : [...currentOverrides, productKey];
  return { assignments, overrides };
}

/**
 * Remove a section and unassign all products that were in it.
 * The affected productKeys are added to unsectionedProductKeys so autoRules don't re-apply.
 */
export function deleteSectionAndUnassignProducts(
  currentAssignments: SectionAssignment[],
  currentOverrides: string[],
  sectionId: string,
): { assignments: SectionAssignment[]; overrides: string[] } {
  const removedProductKeys = currentAssignments
    .filter((a) => a.sectionId === sectionId)
    .map((a) => a.productKey);

  const assignments = currentAssignments.filter((a) => a.sectionId !== sectionId);
  const newOverrides = [
    ...currentOverrides,
    ...removedProductKeys.filter((k) => !currentOverrides.includes(k)),
  ];

  return { assignments, overrides: newOverrides };
}

// ─── NoSection Utilities ──────────────────────────────────────────────────────

/**
 * Returns true if sectionId represents the NoSection bucket.
 */
export function isNoSection(sectionId: string): boolean {
  return sectionId === NO_SECTION_ID;
}

/**
 * Check whether a product is explicitly assigned to a real section.
 */
export function isAssignedToSection(
  productKey: string,
  assignmentByProductKey: Map<string, string>,
): boolean {
  const sectionId = assignmentByProductKey.get(productKey);
  return sectionId !== undefined && !isNoSection(sectionId);
}

/**
 * Get the sectionId for a product, or NO_SECTION_ID if unassigned.
 */
export function getProductSectionId(
  productKey: string,
  assignmentByProductKey: Map<string, string>,
): string {
  return assignmentByProductKey.get(productKey) ?? NO_SECTION_ID;
}
