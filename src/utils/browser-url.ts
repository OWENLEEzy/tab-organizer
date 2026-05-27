import { isExtensionPageUrl } from '../lib/url-rules';

export function isTabOrganizerPage(url: string): boolean {
  if (!url) return false;
  if (url === 'chrome://newtab/') return true;
  if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) return false;
  try {
    return isExtensionPageUrl(url, chrome.runtime.getURL(''));
  } catch {
    return false;
  }
}