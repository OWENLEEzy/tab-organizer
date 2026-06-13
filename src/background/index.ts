import { updateBadge } from '../utils/badge';
import { getTabDomain, isRealTab } from '../lib/url-rules';
import { getDashboardFocusUrl, getDashboardUrl, isDashboardUrl } from './dashboard';
import { buildRecoverySnapshot } from '../lib/recovery-snapshots';
import { promoteRecoveryCandidate, updateRecoveryCandidate } from '../utils/storage';
import type { Tab } from '../types';

function toRecoveryTab(raw: chrome.tabs.Tab): Tab {
  const url = raw.url ?? '';
  return {
    id: raw.id ?? -1,
    url,
    title: raw.title ?? '',
    favIconUrl: raw.favIconUrl ?? '',
    domain: getTabDomain(url),
    windowId: raw.windowId ?? -1,
    active: raw.active ?? false,
    isDashboard: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
  };
}

async function captureRecoveryCandidate(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    const snapshot = buildRecoverySnapshot(tabs.map(toRecoveryTab));
    await updateRecoveryCandidate(snapshot);
  } catch {
    // Recovery capture should never block core extension behavior.
  }
}

let recoveryDebounceTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRecoveryCapture(): void {
  if (recoveryDebounceTimer) clearTimeout(recoveryDebounceTimer);
  recoveryDebounceTimer = setTimeout(() => {
    void captureRecoveryCandidate();
  }, 1500);
}

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
  void captureRecoveryCandidate();
});

// Update badge on browser startup
chrome.runtime.onStartup.addListener(() => {
  refreshBadge();
  void promoteRecoveryCandidate().then(() => captureRecoveryCandidate());
});

// Update badge when tabs change
chrome.tabs.onCreated.addListener(() => {
  refreshBadge();
  scheduleRecoveryCapture();
});

chrome.tabs.onRemoved.addListener(() => {
  refreshBadge();
  void promoteRecoveryCandidate().then(() => scheduleRecoveryCapture());
});

let badgeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
chrome.tabs.onUpdated.addListener(() => {
  if (badgeDebounceTimer) clearTimeout(badgeDebounceTimer);
  badgeDebounceTimer = setTimeout(refreshBadge, 300);
  scheduleRecoveryCapture();
});

async function sendFocusSectionSwitcher(tabId: number): Promise<void> {
  const maxAttempts = 8;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'FOCUS_SECTION_SWITCHER' });
      return;
    } catch {
      if (attempt === maxAttempts - 1) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

// Open Tab Organizer dashboard when toolbar icon is clicked.
async function openTabOrganizerDashboard(options: { focusSectionSwitcher?: boolean } = {}): Promise<void> {
  const dashboardUrl = getDashboardUrl(chrome.runtime.getURL);
  const createUrl = options.focusSectionSwitcher
    ? getDashboardFocusUrl(chrome.runtime.getURL)
    : dashboardUrl;

  try {
    const tabs = await chrome.tabs.query({});
    const candidates = tabs.filter((tab) => isDashboardUrl(tab.url, dashboardUrl));

    if (candidates.length > 0) {
      const currentWindow = await chrome.windows.getCurrent();
      const currentTab = candidates.find((tab) => tab.windowId === currentWindow.id) ?? candidates[0];

      if (currentTab.id != null) {
        await chrome.tabs.update(currentTab.id, { active: true });
        await chrome.windows.update(currentTab.windowId, { focused: true });
        if (options.focusSectionSwitcher) {
          void sendFocusSectionSwitcher(currentTab.id);
        }
        return;
      }
    }

    await chrome.tabs.create({ url: createUrl });
  } catch {
    try {
      await chrome.tabs.create({ url: createUrl });
    } catch {
      // Ignore if the dashboard cannot be opened.
    }
  }
}

// Initial run when service worker loads
refreshBadge();
void captureRecoveryCandidate();

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-section-switcher') {
    void openTabOrganizerDashboard({ focusSectionSwitcher: true });
  }
});