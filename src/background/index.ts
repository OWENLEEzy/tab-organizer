import { updateBadge } from '../utils/badge';
import { isRealTab } from '../utils/url';
import { getDashboardUrl } from './dashboard';

/**
 * Count real web tabs and update the toolbar badge.
 * "Real" = not chrome://, not extension pages, not about:blank.
 */
async function refreshBadge(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    const count = tabs.filter((t) => isRealTab(t.url ?? '')).length;
    await updateBadge(count);
  } catch {
    try {
      await chrome.action.setBadgeText({ text: '' });
    } catch {
      // Silently fail
    }
  }
}

// Update badge on install
chrome.runtime.onInstalled.addListener(() => {
  refreshBadge();
});

// Update badge on browser startup
chrome.runtime.onStartup.addListener(() => {
  refreshBadge();
});

// Update badge when tabs change
chrome.tabs.onCreated.addListener(() => {
  refreshBadge();
});

chrome.tabs.onRemoved.addListener(() => {
  refreshBadge();
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
chrome.tabs.onUpdated.addListener(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refreshBadge, 300);
});

// Open Tab Out dashboard when toolbar icon is clicked.
async function openTabOutDashboard(): Promise<void> {
  const tabOutUrl = getDashboardUrl(chrome.runtime.getURL);

  try {
    const tabs = await chrome.tabs.query({});
    const candidates = tabs.filter((tab) => tab.url === tabOutUrl);

    if (candidates.length > 0) {
      const currentWindow = await chrome.windows.getCurrent();
      const currentTab = candidates.find((tab) => tab.windowId === currentWindow.id) ?? candidates[0];

      if (currentTab.id != null) {
        await chrome.tabs.update(currentTab.id, { active: true });
        await chrome.windows.update(currentTab.windowId, { focused: true });
        return;
      }
    }

    await chrome.tabs.create({ url: tabOutUrl });
  } catch {
    try {
      await chrome.tabs.create({ url: tabOutUrl });
    } catch {
      // Ignore if the dashboard cannot be opened.
    }
  }
}

chrome.action.onClicked.addListener(() => {
  void openTabOutDashboard();
});

// Initial run when service worker loads
refreshBadge();
