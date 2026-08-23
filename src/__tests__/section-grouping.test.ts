import { describe, it, expect } from 'vitest';
import { buildSectionByProductKey } from '../lib/section-grouping';
import type { Section, SectionAssignment } from '../types';

const work: Section = { id: 'work', name: 'Work', order: 0, emoji: '💼' };
const fun: Section = { id: 'fun', name: 'Fun', order: 1 };

describe('buildSectionByProductKey', () => {
  it('maps each assigned product to its section ref', () => {
    const assignments: SectionAssignment[] = [
      { productKey: 'github', sectionId: 'work' },
      { productKey: 'localhost:3000', sectionId: 'work' },
      { productKey: 'youtube', sectionId: 'fun' },
    ];
    const map = buildSectionByProductKey([work, fun], assignments);

    expect(map.get('github')).toEqual({ sectionId: 'work', name: 'Work', emoji: '💼' });
    expect(map.get('localhost:3000')?.sectionId).toBe('work');
    expect(map.get('youtube')).toEqual({ sectionId: 'fun', name: 'Fun', emoji: undefined });
  });

  it('ignores assignments pointing at a missing section', () => {
    const assignments: SectionAssignment[] = [
      { productKey: 'github', sectionId: 'ghost' },
    ];
    expect(buildSectionByProductKey([work], assignments).size).toBe(0);
  });

  it('returns an empty map when there are no assignments', () => {
    expect(buildSectionByProductKey([work, fun], []).size).toBe(0);
  });
});
