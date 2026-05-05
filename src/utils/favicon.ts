/**
 * Generates a URL for the Chrome favicon service.
 * Requires the "favicon" permission in manifest.json.
 */
export function getFaviconUrl(pageUrl: string, size: number = 32): string {
  try {
    const url = new URL(chrome.runtime.getURL('/_favicon/'));
    url.searchParams.set('pageUrl', pageUrl);
    url.searchParams.set('size', size.toString());
    return url.toString();
  } catch {
    // Fallback for non-extension environments (like tests)
    return '';
  }
}
