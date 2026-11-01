import { describe, expect, it } from 'vitest';
import { placementFromStrip, type StripTab } from '../lib/placement-from-strip';
import type { ProductSectionRef } from '../lib/section-grouping';

const sections: ProductSectionRef[] = [
  { sectionId: 'work', name: 'Work' },
  { sectionId: 'other', name: '其他' },
];

function place(tabs: StripTab[], sectionList: ProductSectionRef[] = sections) {
  return placementFromStrip(tabs, sectionList);
}

describe('placementFromStrip', () => {
  it('puts a group in the section that holds its page, and marks an ungrouped group unsectioned', () => {
    const placed = place([
      { productKey: 'glados.example', pinned: false, groupTitle: '其他' },
      { productKey: 'youtube.example', pinned: false, groupTitle: null },
    ]);

    expect(placed.get('glados.example')).toEqual({ kind: 'section', sectionId: 'other' });
    expect(placed.get('youtube.example')).toEqual({ kind: 'unsectioned' });
  });

  it('places the whole group when one page sits in the section and another does not', () => {
    const placed = place([
      { productKey: 'glados.example', pinned: false, groupTitle: '其他' },
      { productKey: 'glados.example', pinned: false, groupTitle: null },
    ]);

    expect(placed.get('glados.example')).toEqual({ kind: 'section', sectionId: 'other' });
  });

  it('ignores pinned pages', () => {
    const placed = place([
      { productKey: 'glados.example', pinned: true, groupTitle: '其他' },
    ]);

    expect(placed.has('glados.example')).toBe(false);
  });

  it('leaves a group unchanged when its pages sit in two sections', () => {
    const placed = place([
      { productKey: 'glados.example', pinned: false, groupTitle: '其他' },
      { productKey: 'glados.example', pinned: false, groupTitle: 'Work' },
    ]);

    expect(placed.has('glados.example')).toBe(false);
  });

  it('leaves a group unchanged when the Chrome group title matches two sections', () => {
    const placed = place(
      [{ productKey: 'glados.example', pinned: false, groupTitle: '其他' }],
      [
        { sectionId: 'other-a', name: '其他' },
        { sectionId: 'other-b', name: '其他' },
      ],
    );

    expect(placed.has('glados.example')).toBe(false);
  });

  it('matches the section title organize writes, including the emoji', () => {
    const placed = place(
      [{ productKey: 'glados.example', pinned: false, groupTitle: '🧪 Work' }],
      [{ sectionId: 'work', name: 'Work', emoji: '🧪' }],
    );

    expect(placed.get('glados.example')).toEqual({ kind: 'section', sectionId: 'work' });
  });
});
