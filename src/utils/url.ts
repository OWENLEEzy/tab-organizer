/**
 * Check if a URL is a real web page (not browser-internal).
 */
export function isRealTab(url: string): boolean {
  return (
    !url.startsWith('chrome://') &&
    !url.startsWith('chrome-extension://') &&
    !url.startsWith('about:') &&
    !url.startsWith('edge://') &&
    !url.startsWith('brave://')
  );
}

/**
 * Sanitize a URL for safe use in HTML attributes (prevents XSS).
 */
export function sanitizeUrl(url: string): string {
  return url.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const LOCAL_FILES_KEY = 'local-files';

/**
 * Extract hostname from a URL, returns empty string on failure.
 */
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Get the logical domain for a tab URL.
 * Maps file:// URLs to a stable 'local-files' key.
 */
export function getTabDomain(url: string): string {
  if (!url) return '';
  if (url.startsWith('file://')) return LOCAL_FILES_KEY;
  return getHostname(url);
}

/**
 * Check if a URL is a Tab Out new tab page.
 */
export function isTabOutPage(url: string): boolean {
  if (!url) return false;
  if (url === 'chrome://newtab/') return true;
  try {
    const extensionPrefix = chrome.runtime.getURL('');
    return url.startsWith(extensionPrefix);
  } catch {
    return false;
  }
}
