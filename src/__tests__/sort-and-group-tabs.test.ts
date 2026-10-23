import { describe, it, expect, vi, afterEach } from 'vitest';
import type { TabGroup } from '../types';
import { nativeBrowser, nativeGroup, nativeTab } from './native-browser-fixture';
import { sortAndGroupTabs } from '../utils/sort-and-group-tabs';

vi.mock('../utils/storage', () => ({ readStorage: vi.fn(async () => ({ settings: { customGroups: [] } })) }));
afterEach(() => vi.unstubAllGlobals());

function products(...keys: string[]): TabGroup[] {
  return keys.map((key, order) => ({ id: key, domain: key, friendlyName: key, productKey: key,
    tabs: [], collapsed: false, order, color: '#000', hasDuplicates: false, duplicateCount: 0 }));
}
const work = { sectionId: 'work', name: 'Work' };
const options = { sectionByProductKey: new Map([['alpha.io', work]]), sectionRefs: [work] };
const success = { moveFailures: 0, groupFailures: 0 };

function permutations<T>(items: T[]): T[][] {
  return items.length === 0 ? [[]] : items.flatMap((item, index) =>
    permutations(items.filter((_, i) => i !== index)).map((rest) => [item, ...rest]));
}

describe('planned native grouping', () => {
  it.each(permutations(['old-work', 'new-work', 'other']).map((order) => [order]))(
    'preserves all intended members across moving, grouping and repeated organize: %s', async (order) => {
      const blocks: Record<string, chrome.tabs.Tab[]> = {
        'old-work': [nativeTab(1, 'gamma.io', 10), nativeTab(2, 'feishu.cn', 10),
          { ...nativeTab(6, 'internal', 10), url: 'chrome://newtab/' }],
        'new-work': [nativeTab(3, 'alpha.io', 20)],
        other: [nativeTab(4, 'beta.io'), nativeTab(5, 'delta.io')],
      };
      const browser = nativeBrowser([nativeTab(99, 'pinned.io', -1, 1, true),
        ...order.flatMap((key) => blocks[key])], [nativeGroup(10, 'Work'), nativeGroup(20, 'Work')]);
      vi.stubGlobal('chrome', browser.api);
      const requested = products('alpha.io', 'gamma.io', 'delta.io', 'beta.io', 'feishu.cn');
      let priorState: unknown;
      for (let run = 0; run < 3; run++) {
        expect(await sortAndGroupTabs(requested, options)).toEqual(success);
        const groups = [...browser.groups.values()].filter((group) => group.title === 'Work');
        expect(groups).toHaveLength(1);
        expect(browser.tabs().filter((tab) => tab.groupId === groups[0].id).map((tab) => tab.id).sort())
          .toEqual([1, 2, 3, 6]);
        expect(browser.tabs().filter((tab) => [4, 5, 99].includes(tab.id!)).every((tab) => tab.groupId === -1)).toBe(true);
        expect(browser.tabs()[0].id).toBe(99);
        expect(browser.api.tabs.remove).not.toHaveBeenCalled();
        const state = browser.tabs().map((tab) => [tab.id, tab.index, tab.groupId]);
        if (priorState) expect(state).toEqual(priorState);
        priorState = state;
      }
    },
  );

  it('models Chrome movement rather than treating move as a no-op', async () => {
    const browser = nativeBrowser([nativeTab(1, 'gamma.io', 10), nativeTab(2, 'feishu.cn', 10),
      nativeTab(3, 'alpha.io', 20), nativeTab(4, 'beta.io'), nativeTab(5, 'delta.io')],
    [nativeGroup(10, 'Work'), nativeGroup(20, 'Work')]);
    await browser.api.tabs.move(3, { index: 0 });
    await browser.api.tabs.move(5, { index: 2 });
    await browser.api.tabs.move(2, { index: 4 });
    expect(browser.tabs().find((tab) => tab.id === 2)?.groupId).toBe(-1);
    expect(browser.tabs().find((tab) => tab.id === 5)?.groupId).toBe(10);
  });

  it('reports a move that resolves without changing the browser order', async () => {
    const browser = nativeBrowser([nativeTab(1, 'beta.io'), nativeTab(2, 'alpha.io')]);
    vi.stubGlobal('chrome', browser.api);
    browser.api.tabs.move.mockImplementation(async (id) => ({ ...browser.tabs().find((tab) => tab.id === id)! }));
    // Also leave grouping without a mutation so it cannot incidentally repair order.
    browser.api.tabs.group.mockResolvedValue(100);
    const result = await sortAndGroupTabs(products('alpha.io', 'beta.io'), options);
    expect(result.moveFailures).toBeGreaterThan(0);
    expect(result.groupFailures).toBeGreaterThan(0);
  });

  it('converges across every product ordering without swallowing nonmembers', async () => {
    for (const order of permutations(['alpha.io', 'gamma.io', 'delta.io', 'beta.io', 'feishu.cn'])) {
      const browser = nativeBrowser([nativeTab(1, 'gamma.io', 10), nativeTab(2, 'feishu.cn', 10),
        nativeTab(3, 'alpha.io', 20), nativeTab(4, 'beta.io'), nativeTab(5, 'delta.io')],
      [nativeGroup(10, 'Work'), nativeGroup(20, 'Work')]);
      vi.stubGlobal('chrome', browser.api);
      for (let run = 0; run < 2; run++) {
        expect(await sortAndGroupTabs(products(...order), options), order.join(',')).toEqual(success);
        const target = [...browser.groups.values()].find((group) => group.title === 'Work')!;
        expect(browser.tabs().filter((tab) => tab.groupId === target.id).map((tab) => tab.id).sort()).toEqual([1, 2, 3]);
        expect(browser.tabs().filter((tab) => [4, 5].includes(tab.id!)).every((tab) => tab.groupId === -1)).toBe(true);
      }
    }
  });

  it('retains a single Work even with no remaining assigned products', async () => {
    const browser = nativeBrowser([nativeTab(1, 'feishu.cn', 10), nativeTab(2, 'beta.io')], [nativeGroup(10, 'Work')]);
    vi.stubGlobal('chrome', browser.api);
    expect(await sortAndGroupTabs(products('beta.io', 'feishu.cn'), { sectionByProductKey: new Map(), sectionRefs: [work] })).toEqual(success);
    expect(browser.tabs().find((tab) => tab.id === 1)?.groupId).toBe(10);
  });

  it('preserves unrelated native groups and their metadata', async () => {
    const original = { ...nativeGroup(30, 'Personal'), collapsed: true, color: 'purple' as const };
    const browser = nativeBrowser([nativeTab(1, 'beta.io', 30), nativeTab(2, 'gamma.io', 30), nativeTab(3, 'alpha.io')], [original]);
    vi.stubGlobal('chrome', browser.api);
    expect(await sortAndGroupTabs(products('alpha.io', 'gamma.io', 'beta.io'), options)).toEqual(success);
    const personal = [...browser.groups.values()].find((group) => group.title === 'Personal');
    expect(personal).toMatchObject({ color: 'purple', collapsed: true });
    expect(browser.tabs().filter((tab) => tab.groupId === personal?.id).map((tab) => tab.id)).toEqual([1, 2]);
  });

  it('keeps different sections with the same title separate', async () => {
    const second = { sectionId: 'work-b', name: 'Work' };
    const browser = nativeBrowser([nativeTab(1, 'alpha.io', 10), nativeTab(2, 'feishu.cn', 10), nativeTab(3, 'beta.io', 20)],
      [nativeGroup(10, 'Work'), nativeGroup(20, 'Work')]);
    vi.stubGlobal('chrome', browser.api);
    expect(await sortAndGroupTabs(products('alpha.io', 'beta.io', 'feishu.cn'), {
      sectionByProductKey: new Map([['alpha.io', work], ['beta.io', second]]), sectionRefs: [work, second],
    })).toEqual(success);
    expect(browser.tabs().find((tab) => tab.id === 1)?.groupId).toBe(browser.tabs().find((tab) => tab.id === 2)?.groupId);
    expect(browser.tabs().find((tab) => tab.id === 1)?.groupId).not.toBe(browser.tabs().find((tab) => tab.id === 3)?.groupId);
  });

  it('organizes each window independently and honors window scope', async () => {
    const browser = nativeBrowser([nativeTab(1, 'alpha.io', 10, 1), nativeTab(2, 'feishu.cn', 11, 1),
      nativeTab(3, 'alpha.io', 20, 2), nativeTab(4, 'feishu.cn', 21, 2)],
    [nativeGroup(10, 'Work', 1), nativeGroup(11, 'Work', 1), nativeGroup(20, 'Work', 2), nativeGroup(21, 'Work', 2)]);
    vi.stubGlobal('chrome', browser.api);
    expect(await sortAndGroupTabs(products('alpha.io', 'feishu.cn'), { ...options, windowId: 1 })).toEqual(success);
    expect(browser.groups.has(21)).toBe(true);
    expect(await sortAndGroupTabs(products('alpha.io', 'feishu.cn'), options)).toEqual(success);
    expect(browser.groups.size).toBe(2);
  });

  it('keeps an internal page ungrouped unless adopted from an existing native group', async () => {
    const browser = nativeBrowser([{ ...nativeTab(1, 'internal'), url: 'chrome://extensions/' }, nativeTab(2, 'alpha.io')]);
    vi.stubGlobal('chrome', browser.api);
    expect(await sortAndGroupTabs(products('alpha.io'), options)).toEqual(success);
    expect(browser.tabs().find((tab) => tab.id === 1)).toMatchObject({ groupId: -1, index: 0 });
  });

  it('does not mutate a window when its initial group snapshot fails', async () => {
    const browser = nativeBrowser([nativeTab(1, 'alpha.io')]);
    vi.stubGlobal('chrome', browser.api);
    browser.api.tabGroups.query.mockRejectedValue(new Error('cannot read'));
    expect((await sortAndGroupTabs(products('alpha.io'), options)).groupFailures).toBeGreaterThan(0);
    expect(browser.api.tabs.move).not.toHaveBeenCalled();
    expect(browser.api.tabs.group).not.toHaveBeenCalled();
  });

  it('detects a successful API call that did not apply the requested membership', async () => {
    const browser = nativeBrowser([nativeTab(1, 'alpha.io'), nativeTab(2, 'feishu.cn', 10)], [nativeGroup(10, 'Work')]);
    vi.stubGlobal('chrome', browser.api);
    browser.api.tabs.group.mockResolvedValue(10);
    expect((await sortAndGroupTabs(products('alpha.io'), options)).groupFailures).toBe(1);
    expect(browser.api.tabGroups.update).toHaveBeenCalled();
  });

  it.each(['pinned', 'closed', 'moved'] as const)('reports a page that was %s during execution without pulling it back', async (change) => {
    const browser = nativeBrowser([nativeTab(1, 'alpha.io'), nativeTab(2, 'feishu.cn', 10)], [nativeGroup(10, 'Work')]);
    vi.stubGlobal('chrome', browser.api);
    const query = browser.api.tabs.query.getMockImplementation()!;
    let hasChanged = false;
    browser.api.tabs.query.mockImplementationOnce(query).mockImplementation(async (info) => {
      if (!hasChanged) {
        const tabs = browser.tabs();
        const index = tabs.findIndex((tab) => tab.id === 2);
        if (change === 'pinned') { tabs[index].pinned = true; tabs[index].groupId = -1; }
        if (change === 'moved') { tabs[index].windowId = 2; tabs[index].groupId = -1; }
        if (change === 'closed') tabs.splice(index, 1);
        browser.normalize();
        hasChanged = true;
      }
      return query(info);
    });
    expect((await sortAndGroupTabs(products('alpha.io', 'feishu.cn'), options)).groupFailures).toBeGreaterThan(0);
    expect(browser.api.tabs.group.mock.calls.flatMap(([call]) => call.tabIds)).not.toContain(2);
  });

  it('takes the cross-context lock before reading or mutating browser state', async () => {
    const browser = nativeBrowser([nativeTab(1, 'alpha.io')]);
    vi.stubGlobal('chrome', browser.api);
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const request = vi.fn(async (_name: string, run: () => Promise<unknown>) => { await gate; return run(); });
    vi.stubGlobal('navigator', { locks: { request } });
    const pending = sortAndGroupTabs(products('alpha.io'), options);
    expect(browser.api.tabs.query).not.toHaveBeenCalled();
    release();
    expect(await pending).toEqual(success);
    expect(request).toHaveBeenCalledWith('tab-organizer-sort-and-group', expect.any(Function));
  });

  it('does not mutate a window whose initial tab and group snapshots disagree', async () => {
    const browser = nativeBrowser([nativeTab(1, 'alpha.io', 10)]);
    vi.stubGlobal('chrome', browser.api);
    expect((await sortAndGroupTabs(products('alpha.io'), options)).groupFailures).toBe(1);
    expect(browser.api.tabs.move).not.toHaveBeenCalled();
    expect(browser.api.tabs.group).not.toHaveBeenCalled();
  });

  it('keeps sort-only behavior when native grouping is not requested or unavailable', async () => {
    const browser = nativeBrowser([nativeTab(1, 'beta.io'), nativeTab(2, 'alpha.io')]);
    vi.stubGlobal('chrome', { tabs: browser.api.tabs });
    expect(await sortAndGroupTabs(products('alpha.io', 'beta.io'), options)).toEqual(success);
    expect(browser.tabs().map((tab) => tab.id)).toEqual([2, 1]);
    expect(browser.api.tabs.group).not.toHaveBeenCalled();
  });
});
