import type { Section, SectionAssignment } from '../types';

/**
 * Where a product belongs in the Chrome tab bar: its SECTION (区域), not its
 * product. Native Chrome groups can't nest, so we group by section — title and
 * color come from the section.
 */
export interface ProductSectionRef {
  sectionId: string;
  name: string;
  emoji?: string;
}

/**
 * Build the productKey -> section lookup used to create native Chrome groups.
 * Products with no assignment (or pointing at a deleted section) are absent,
 * which means they stay ungrouped.
 */
export function buildSectionByProductKey(
  sections: readonly Section[],
  assignments: readonly SectionAssignment[],
): Map<string, ProductSectionRef> {
  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const byProductKey = new Map<string, ProductSectionRef>();

  for (const assignment of assignments) {
    const section = sectionById.get(assignment.sectionId);
    if (!section) continue;
    byProductKey.set(assignment.productKey, {
      sectionId: section.id,
      name: section.name,
      emoji: section.emoji,
    });
  }

  return byProductKey;
}
