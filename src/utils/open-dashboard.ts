import { getDashboardUrl, isDashboardUrl } from '../background/dashboard';

/**
 * Focus an already-open dashboard tab (preferring the current window) or create
 * one if none exists. Returns the focused existing tab id, or null when a new
 * tab was created.
 *
 * Shared by the toolbar popup and the background icon handler so they never
 * diverge — the popup previously always spawned a NEW dashboard tab.
 */
export async function openOrFocusDashboard(
  getURL: (path: string) => string,
  createUrl?: string,
): Promise<number | null> {
  const dashboardUrl = getDashboardUrl(getURL);
  const urlToCreate = createUrl ?? dashboardUrl;

  try {
    const tabs = await chrome.tabs.query({});
    const candidates = tabs.filter((tab) => isDashboardUrl(tab.url, dashboardUrl));

    if (candidates.length > 0) {
      const currentWindow = await chrome.windows.getCurrent();
      const target = candidates.find((tab) => tab.windowId === currentWindow.id) ?? candidates[0];

      if (target.id != null) {
        await chrome.tabs.update(target.id, { active: true });
        await chrome.windows.update(target.windowId, { focused: true });
        return target.id;
      }
    }

    await chrome.tabs.create({ url: urlToCreate });
    return null;
  } catch {
    try {
      await chrome.tabs.create({ url: urlToCreate });
    } catch {
      // Ignore if the dashboard cannot be opened.
    }
    return null;
  }
}
