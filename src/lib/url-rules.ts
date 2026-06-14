import { parseLocalAddress } from './local-address';

export const LOCAL_FILES_PRODUCT_KEY = 'local-files';

/**
 * Check if a URL is a real web page (not browser-internal).
 */
export function isRealTab(url: string): boolean {
  const browserInternalPrefixes = [
    'chrome://',
    'chrome-extension://',
    'chrome-search://',
    'devtools://',
    'about:',
    'edge://',
    'brave://',
  ];
  const normalized = url.trim().toLowerCase();
  const target = normalized.startsWith('view-source:')
    ? normalized.slice('view-source:'.length)
    : normalized;

  return (
    target !== '' &&
    !browserInternalPrefixes.some((prefix) => target.startsWith(prefix))
  );
}

/**
 * Sanitize a URL for safe use in HTML attributes (prevents XSS).
 */
export function sanitizeUrl(url: string): string {
  return url.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

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
  if (url.startsWith('file://')) return LOCAL_FILES_PRODUCT_KEY;
  // Local/loopback dev servers group by host+port (localhost:3000), with the
  // various names for the same machine (localhost, 127.0.0.1, ::1) collapsed.
  const local = parseLocalAddress(url);
  if (local) return local.key;
  return getHostname(url);
}

/**
 * Check if a URL is an extension page URL.
 */
export function isExtensionPageUrl(url: string, extensionBaseUrl: string): boolean {
  if (!url || !extensionBaseUrl) return false;
  return url.startsWith(extensionBaseUrl);
}
