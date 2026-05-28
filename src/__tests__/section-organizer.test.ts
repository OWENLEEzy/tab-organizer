import { describe, expect, it } from 'vitest';
import type { Section, SectionAssignment, Tab, TabGroup } from '../types';
import {
  NO_SECTION_ID,
  UNASSIGNED_SECTION_DROP_ID,
  assignProductToSection,
  autoAssignProducts,
  buildOrganizerModel,
  deleteSectionAndUnassignProducts,
  fromProductItemId,
  fromSectionDropId,
  getProductSectionId,
  moveProductToNoSection,
  toProductItemId,
  toSectionDropId,
} from '../lib/section-organizer';

function tab(id: number, url: string): Tab {
  return {
    id,
    url,
    title: url,
    favIconUrl: '',
    domain: new URL(url).hostname,
    windowId: 1,
    active: false,
    isDashboard: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
  };
}

function product(productKey: string, urls: string[], order = 0): TabGroup {
  return {
    id: productKey,
    domain: productKey,
    friendlyName: productKey,
    itemType: 'product',
    itemKey: productKey,
    productKey,
    tabs: urls.map((url, index) => tab(index + 1, url)),
    collapsed: false,
    order,
    color: '#000',
    hasDuplicates: false,
    duplicateCount: 0,
  };
}

const sections: Section[] = [
  {
    id: 'section-dev',
    name: 'Dev',
    order: 0,
    autoRules: [{ pattern: 'github|vercel', type: 'hostname' }],
  },
  {
    id: 'section-media',
    name: 'Media',
    order: 1,
    autoRules: [{ pattern: 'youtube', type: 'hostname' }],
  },
];

describe('section organizer ids', () => {
  it('round-trips product and section UI ids', () => {
    expect(toProductItemId('github')).toBe('product:github');
    expect(fromProductItemId('product:github')).toBe('github');
    expect(fromProductItemId('section:github')).toBeNull();

    expect(toSectionDropId('section-dev')).toBe('section:section-dev');
    expect(fromSectionDropId('section:section-dev')).toBe('section-dev');
    expect(fromSectionDropId(UNASSIGNED_SECTION_DROP_ID)).toBe('unassigned');
    expect(fromSectionDropId('product:github')).toBeNull();
  });
});

describe('buildOrganizerModel', () => {
  it('creates one projection for visible sections, navigation, buckets, and assignments', () => {
    const products = [
      product('github', ['https://github.com/a'], 2),
      product('youtube', ['https://youtube.com/watch?v=1'], 1),
      product('example.com', ['https://example.com'], 0),
    ];
    const assignments: SectionAssignment[] = [
      { productKey: 'github', sectionId: 'section-dev', order: 0 },
      { productKey: 'youtube', sectionId: 'section-media', order: 0 },
    ];

    const model = buildOrganizerModel({
      sections,
      products,
      assignments,
      noSectionOverrides: [],
      activeSectionId: null,
    });

    expect(model.sections.map((section) => section.id)).toEqual(['section-dev', 'section-media']);
    expect(model.visibleSections.map((section) => section.id)).toEqual(['section-dev', 'section-media']);
    expect(model.navigationSections).toEqual([null, 'section-dev', 'section-media']);
    expect(model.productsBySection.get('section-dev')?.map((item) => item.productKey)).toEqual(['github']);
    expect(model.productsBySection.get('section-media')?.map((item) => item.productKey)).toEqual(['youtube']);
    expect(model.unassignedProducts.map((item) => item.productKey)).toEqual(['example.com']);
    expect(model.assignmentByProductItemId.get('product:github')).toBe('section-dev');
    expect(getProductSectionId('example.com', model.assignmentByProductKey)).toBe(NO_SECTION_ID);
  });
});

describe('autoAssignProducts', () => {
  it('assigns only unassigned products not explicitly moved to No section', () => {
    const products = [
      product('github', ['https://github.com/a']),
      product('youtube', ['https://youtube.com/watch?v=1']),
      product('vercel', ['https://vercel.com/dashboard']),
    ];

    const next = autoAssignProducts({
      products,
      sections,
      assignments: [{ productKey: 'github', sectionId: 'section-dev', order: 0 }],
      noSectionOverrides: ['youtube'],
      hostnamesByProductKey: new Map([
        ['github', ['github.com']],
        ['youtube', ['youtube.com']],
        ['vercel', ['vercel.com']],
      ]),
    });

    expect(next).toEqual([{ productKey: 'vercel', sectionId: 'section-dev', order: 0 }]);
  });
});

describe('assignment mutations', () => {
  it('assigns, moves to No section, and deletes sections without mutating inputs', () => {
    const assignments: SectionAssignment[] = [
      { productKey: 'github', sectionId: 'section-dev', order: 0 },
    ];

    const assigned = assignProductToSection(assignments, 'youtube', 'section-media');
    expect(assigned).toEqual([
      { productKey: 'github', sectionId: 'section-dev', order: 0 },
      { productKey: 'youtube', sectionId: 'section-media', order: 0 },
    ]);
    expect(assignments).toEqual([{ productKey: 'github', sectionId: 'section-dev', order: 0 }]);

    const moved = moveProductToNoSection(assigned, [], 'youtube');
    expect(moved.assignments).toEqual([{ productKey: 'github', sectionId: 'section-dev', order: 0 }]);
    expect(moved.overrides).toEqual(['youtube']);

    const deleted = deleteSectionAndUnassignProducts(assigned, ['existing'], 'section-dev');
    expect(deleted.assignments).toEqual([{ productKey: 'youtube', sectionId: 'section-media', order: 0 }]);
    expect(deleted.overrides).toEqual(['existing', 'github']);
  });
});