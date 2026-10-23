import { describe, expect, it } from 'vitest';
import { planNativeGroups, type NativeTabSnapshot } from '../lib/native-group-plan';

const work = { sectionId: 'work', name: 'Work' };
const tab = (id: number, groupId: number, productKey?: string): NativeTabSnapshot => ({ id, index: id - 1, pinned: false, groupId, productKey });

describe('native group plan', () => {
  it('plans assigned, adopted, preserved and ungrouped pages from one immutable snapshot', () => {
    const tabs = [tab(1, 10, 'feishu'), tab(2, 11), tab(3, -1, 'docs'), tab(4, 30, 'personal'), tab(5, -1, 'other')];
    const snapshot = structuredClone(tabs);
    const plan = planNativeGroups(tabs, [{ id: 10, title: 'Work' }, { id: 11, title: 'Work' }, { id: 30, title: 'Personal' }],
      [work], new Map([['docs', work]]), ['docs', 'other', 'feishu', 'personal']);
    expect(plan.groups.find((group) => group.key === 'section:work')).toMatchObject({ tabIds: [3, 1, 2], originalGroupIds: [10, 11] });
    expect(plan.groups.find((group) => group.key === 'native:30')?.tabIds).toEqual([4]);
    expect(plan.ungroupedTabIds).toEqual([5]);
    expect(new Set(plan.orderedTabIds)).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(tabs).toEqual(snapshot);
  });

  it('honors an explicit assignment to another section over native-group adoption', () => {
    const dev = { sectionId: 'dev', name: 'Dev' };
    const plan = planNativeGroups([tab(1, 10, 'github'), tab(2, 10, 'feishu')], [{ id: 10, title: 'Work' }],
      [dev, work], new Map([['github', dev]]), ['github', 'feishu']);
    expect(plan.groups.find((group) => group.key === 'section:dev')?.tabIds).toEqual([1]);
    expect(plan.groups.find((group) => group.key === 'section:work')?.tabIds).toEqual([2]);
  });

  it('does not guess the owner of an ambiguous same-name native group', () => {
    const second = { sectionId: 'work-2', name: 'Work' };
    const plan = planNativeGroups([tab(1, 10, 'feishu')], [{ id: 10, title: 'Work' }], [work, second], new Map(), []);
    expect(plan.groups).toEqual([{ key: 'native:10', originalGroupIds: [10], tabIds: [1] }]);
  });

  it('preserves internal-page order when a contiguous group crosses their original slots', () => {
    const tabs = [tab(1, -1, 'docs'), tab(2, -1, 'docs'), tab(3, -1, 'docs'),
      tab(4, -1), tab(5, -1), tab(6, -1, 'docs'), tab(7, -1, 'docs')];
    const plan = planNativeGroups(tabs, [], [work], new Map([['docs', work]]), ['docs']);
    expect(plan.orderedTabIds).toEqual([1, 2, 3, 6, 7, 4, 5]);
  });

  it('never includes pinned pages in a destination or sort plan', () => {
    const plan = planNativeGroups([{ ...tab(1, -1, 'docs'), pinned: true }], [], [work], new Map([['docs', work]]), ['docs']);
    expect(plan).toEqual({ groups: [], ungroupedTabIds: [], orderedTabIds: [] });
  });
});
