/**
 * Chrome tabs/windows adapter.
 *
 * Wraps chrome.tabs and chrome.windows API calls so stores and components never
 * reference the raw chrome namespace directly. Listener registration
 * (chrome.tabs.onCreated, etc.) stays in the store lifecycle wiring.
 */

export async function queryAllTabs(): Promise<chrome.tabs.Tab[]> {
  return chrome.tabs.query({});
}

export async function queryTabs(
  queryInfo: chrome.tabs.QueryInfo,
): Promise<chrome.tabs.Tab[]> {
  return chrome.tabs.query(queryInfo);
}

export async function getCurrentWindow(): Promise<chrome.windows.Window> {
  return chrome.windows.getCurrent();
}

export async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  return chrome.tabs.getCurrent();
}

export async function closeTabIds(
  tabIds: number | number[],
): Promise<void> {
  if (Array.isArray(tabIds)) {
    await chrome.tabs.remove(tabIds);
  } else {
    await chrome.tabs.remove(tabIds);
  }
}

export async function focusChromeTab(
  tabId: number,
  windowId: number,
): Promise<void> {
  await chrome.tabs.update(tabId, { active: true });
  await chrome.windows.update(windowId, { focused: true });
}

export async function createChromeTab(url: string): Promise<void> {
  await chrome.tabs.create({ url, active: false });
}

export async function moveChromeTab(
  tabId: number,
  index: number,
): Promise<void> {
  await chrome.tabs.move(tabId, { index });
}
