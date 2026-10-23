import { vi } from 'vitest';

export function nativeTab(id: number, hostname: string, groupId = -1, windowId = 1, pinned = false): chrome.tabs.Tab {
  return { id, url: `https://${hostname}/`, title: hostname, index: 0, groupId, windowId, pinned,
    active: false, highlighted: false, selected: false, incognito: false, discarded: false,
    autoDiscardable: true, frozen: false };
}

export function nativeGroup(id: number, title: string, windowId = 1): chrome.tabGroups.TabGroup {
  return { id, title, windowId, color: 'blue', collapsed: false, shared: false };
}

/** Stateful Chrome model: moves change indices AND group membership. */
export function nativeBrowser(inputTabs: chrome.tabs.Tab[], inputGroups: chrome.tabGroups.TabGroup[] = []) {
  let tabs = structuredClone(inputTabs);
  const groups = new Map(inputGroups.map((group) => [group.id, { ...group }]));
  let nextGroupId = Math.max(0, ...groups.keys()) + 1;
  const normalize = () => {
    const indices = new Map<number, number>();
    for (const tab of tabs) {
      tab.index = indices.get(tab.windowId) ?? 0;
      indices.set(tab.windowId, tab.index + 1);
    }
    for (const id of groups.keys()) if (!tabs.some((tab) => tab.groupId === id)) groups.delete(id);
  };
  normalize();
  const api = {
    tabs: {
      query: vi.fn(async (query: chrome.tabs.QueryInfo) => structuredClone(tabs.filter((tab) =>
        (query.windowId == null || tab.windowId === query.windowId)
        && (query.groupId == null || tab.groupId === query.groupId)))),
      move: vi.fn(async (id: number, { index }: { index: number }) => {
        const tab = tabs.find((candidate) => candidate.id === id);
        if (!tab || tab.pinned) throw new Error('cannot move');
        const windowTabs = tabs.filter((candidate) => candidate.windowId === tab.windowId);
        const from = windowTabs.indexOf(tab);
        if (from === index) return { ...tab };
        // Chromium TabStripModel::GetGroupToAssign: joining the middle of a
        // group changes membership; splitting one's own group ungroups the tab.
        const left = windowTabs[index > from ? index : index - 1]?.groupId ?? -1;
        const right = windowTabs[index > from ? index + 1 : index]?.groupId ?? -1;
        if (tab.groupId !== left && tab.groupId !== right) {
          if (left === right && left !== -1) tab.groupId = left;
          else if (tab.groupId !== -1 && windowTabs.filter((candidate) => candidate.groupId === tab.groupId).length > 1) tab.groupId = -1;
        }
        windowTabs.splice(from, 1);
        windowTabs.splice(index, 0, tab);
        tabs = [...tabs.filter((candidate) => candidate.windowId !== tab.windowId), ...windowTabs];
        normalize();
        return { ...tab };
      }),
      group: vi.fn(async ({ tabIds, groupId }: { tabIds: number[]; groupId?: number }) => {
        const selected = tabs.filter((tab) => tabIds.includes(tab.id!));
        if (selected.length !== tabIds.length || selected.some((tab) => tab.pinned)
          || new Set(selected.map((tab) => tab.windowId)).size !== 1) throw new Error('invalid group members');
        const id = groupId ?? nextGroupId++;
        if (groupId != null && !groups.has(id)) throw new Error('group disappeared');
        if (groups.has(id) && groups.get(id)!.windowId !== selected[0].windowId) throw new Error('group is in another window');
        if (!groups.has(id)) groups.set(id, nativeGroup(id, '', selected[0].windowId));
        const windowTabs = tabs.filter((tab) => tab.windowId === selected[0].windowId);
        const members = windowTabs.filter((tab) => tabIds.includes(tab.id!) || tab.groupId === id);
        const first = windowTabs.findIndex((tab) => members.includes(tab));
        const rest = windowTabs.filter((tab) => !members.includes(tab));
        for (const tab of members) tab.groupId = id;
        rest.splice(first, 0, ...members);
        tabs = [...tabs.filter((tab) => tab.windowId !== selected[0].windowId), ...rest];
        normalize();
        return id;
      }),
      ungroup: vi.fn(async (ids: number[]) => {
        for (const groupId of new Set(tabs.filter((tab) => ids.includes(tab.id!)).map((tab) => tab.groupId))) {
          if (groupId === -1) continue;
          const members = tabs.filter((tab) => tab.groupId === groupId);
          const first = tabs.indexOf(members[0]);
          const staying = members.filter((tab) => !ids.includes(tab.id!));
          const leaving = members.filter((tab) => ids.includes(tab.id!));
          for (const tab of leaving) tab.groupId = -1;
          tabs = tabs.filter((tab) => !members.includes(tab));
          tabs.splice(first, 0, ...staying, ...leaving);
        }
        normalize();
      }),
      remove: vi.fn(async () => { throw new Error('organization must not close tabs'); }),
    },
    tabGroups: {
      query: vi.fn(async ({ windowId }: { windowId: number }) => [...groups.values()]
        .filter((group) => group.windowId === windowId).map((group) => ({ ...group }))),
      update: vi.fn(async (id: number, updates: chrome.tabGroups.UpdateProperties) => {
        const group = groups.get(id);
        if (!group) throw new Error('group missing');
        Object.assign(group, updates);
        return { ...group };
      }),
    },
  };
  return { api, groups, tabs: () => tabs, normalize };
}
