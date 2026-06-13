import { describe, it, expect } from 'vitest';
import { computeOrganizePlan } from '../lib/organize-plan';
import type { TabGroup, Section, SectionAssignment } from '../types';

function makeGroup(productKey: string, tabIds: number[]): TabGroup {
  return {
    id: productKey, domain: productKey, friendlyName: productKey,
    productKey, itemKey: productKey, iconDomain: productKey,
    tabs: tabIds.map((id) => ({
      id, url: `https://${productKey}.com/${id}`, title: '', favIconUrl: '',
      domain: productKey, windowId: 1, active: false,
      isDashboard: false, isDuplicate: false, isLandingPage: false, duplicateCount: 0,
    })),
    collapsed: false, order: 0, color: '#4DAB9A', hasDuplicates: false, duplicateCount: 0,
  };
}

const devSection: Section = { id: 'dev', name: 'Dev', order: 0,
  autoRules: [{ pattern: 'github', type: 'hostname' }] };
const aiSection: Section  = { id: 'ai', name: 'AI', order: 1,
  autoRules: [{ pattern: 'claude', type: 'hostname' }] };

describe('computeOrganizePlan', () => {
  it('auto-assigns unassigned group matching autoRules', () => {
    const groups = [makeGroup('github', [1, 2])];
    const plan = computeOrganizePlan({
      groups, sections: [devSection, aiSection],
      assignments: [], unsectionedProductKeys: [], groupOrder: {},
    });
    expect(plan.assignmentUpdates).toHaveLength(1);
    expect(plan.assignmentUpdates[0]).toMatchObject({ productKey: 'github', sectionId: 'dev' });
  });

  it('skips groups already in unsectionedProductKeys', () => {
    const groups = [makeGroup('github', [1])];
    const plan = computeOrganizePlan({
      groups, sections: [devSection],
      assignments: [], unsectionedProductKeys: ['github'], groupOrder: {},
    });
    expect(plan.assignmentUpdates).toHaveLength(0);
  });

  it('skips groups already assigned', () => {
    const groups = [makeGroup('github', [1])];
    const existing: SectionAssignment = { productKey: 'github', sectionId: 'dev', order: 0 };
    const plan = computeOrganizePlan({
      groups, sections: [devSection],
      assignments: [existing], unsectionedProductKeys: [], groupOrder: {},
    });
    expect(plan.assignmentUpdates).toHaveLength(0);
  });

  it('returns tabIdsToClose for duplicate URLs', () => {
    const groups = [makeGroup('github', [1, 2])];
    // Give both tabs the same URL to simulate duplicates
    groups[0].tabs[0].url = 'https://github.com/repo';
    groups[0].tabs[1].url = 'https://github.com/repo';
    groups[0].hasDuplicates = true;
    const plan = computeOrganizePlan({
      groups, sections: [], assignments: [], unsectionedProductKeys: [], groupOrder: {},
    });
    expect(plan.tabIdsToClose).toHaveLength(1);
  });

  it('skips stale assignment where group no longer exists', () => {
    const groups = [makeGroup('github', [1])];
    const staleAssignment: SectionAssignment = { productKey: 'missing-product', sectionId: 'dev', order: 0 };
    const plan = computeOrganizePlan({
      groups, sections: [devSection],
      assignments: [staleAssignment], unsectionedProductKeys: [], groupOrder: {},
    });
    // stale assignment doesn't crash; github still appears in orderedGroups
    expect(plan.orderedGroups.map((g) => g.productKey)).toContain('github');
  });

  it('orders unassigned groups by groupOrder when provided', () => {
    const github = makeGroup('github', [10]);
    const claude = makeGroup('claude', [20]);
    // claude has lower groupOrder value (comes first)
    const plan = computeOrganizePlan({
      groups: [github, claude],
      sections: [], assignments: [], unsectionedProductKeys: [],
      groupOrder: { github: 2, claude: 1 },
    });
    expect(plan.orderedGroups.map((g) => g.productKey)).toEqual(['claude', 'github']);
  });

  it('handles sections with no assignments without crashing', () => {
    const github = makeGroup('github', [1]);
    const assignments: SectionAssignment[] = [{ productKey: 'github', sectionId: 'dev', order: 0 }];
    // aiSection has no assignments — exercises the `?? []` fallback in section iteration
    const plan = computeOrganizePlan({
      groups: [github], sections: [devSection, aiSection],
      assignments, unsectionedProductKeys: [], groupOrder: {},
    });
    expect(plan.orderedGroups).toHaveLength(1);
  });

  it('falls back to tab count order when groupOrder is equal', () => {
    // Both unassigned, no groupOrder — should sort larger group first
    const small = makeGroup('small-product', [1]);
    const large = makeGroup('large-product', [10, 11, 12]);
    const plan = computeOrganizePlan({
      groups: [small, large],
      sections: [], assignments: [], unsectionedProductKeys: [], groupOrder: {},
    });
    expect(plan.orderedGroups.map((g) => g.productKey)).toEqual(['large-product', 'small-product']);
  });

  it('orders groups by section then assignment order', () => {
    const github = makeGroup('github', [10, 11]);
    const claude = makeGroup('claude', [20]);
    const assignments: SectionAssignment[] = [
      { productKey: 'github', sectionId: 'dev', order: 0 },
      { productKey: 'claude', sectionId: 'ai', order: 0 },
    ];
    const plan = computeOrganizePlan({
      groups: [claude, github], // intentionally unordered
      sections: [devSection, aiSection],
      assignments, unsectionedProductKeys: [], groupOrder: {},
    });
    // github (dev, order 0) should come before claude (ai, order 1)
    expect(plan.orderedGroups.map((g) => g.productKey)).toEqual(['github', 'claude']);
  });
});
