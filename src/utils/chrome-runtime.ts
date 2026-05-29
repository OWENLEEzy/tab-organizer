/**
 * Chrome extension runtime adapter.
 *
 * Wraps chrome.runtime calls so stores and components never reference the raw
 * chrome namespace directly.
 */

export function getExtensionVersion(fallback = '2.0.0'): string {
  if (typeof chrome === 'undefined' || !chrome.runtime?.getManifest) {
    return fallback;
  }

  return chrome.runtime.getManifest().version;
}
