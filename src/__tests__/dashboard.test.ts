import { describe, expect, it, vi } from 'vitest';
import {
  DASHBOARD_RELATIVE_PATH,
  DASHBOARD_SECTION_SWITCHER_FOCUS_HASH,
  getDashboardFocusUrl,
  getDashboardUrl,
  isDashboardUrl,
} from '../lib/dashboard-url';

describe('DASHBOARD_RELATIVE_PATH', () => {
  it('points at the built dashboard entry', () => {
    expect(DASHBOARD_RELATIVE_PATH).toBe('src/dashboard/index.html');
  });
});

describe('getDashboardUrl', () => {
  it('resolves the dashboard path without reading the extension manifest', () => {
    const getUrl = vi.fn((path: string) => `chrome-extension://tab-out/${path}`);

    expect(getDashboardUrl(getUrl)).toBe(`chrome-extension://tab-out/${DASHBOARD_RELATIVE_PATH}`);
    expect(getUrl).toHaveBeenCalledWith(DASHBOARD_RELATIVE_PATH);
  });

  it('builds a cold-start focus intent URL and still recognizes URL variants as the same dashboard', () => {
    const getUrl = vi.fn((path: string) => `chrome-extension://tab-out/${path}`);
    const baseUrl = getDashboardUrl(getUrl);
    const focusUrl = getDashboardFocusUrl(getUrl);

    expect(focusUrl).toBe(`${baseUrl}${DASHBOARD_SECTION_SWITCHER_FOCUS_HASH}`);
    expect(isDashboardUrl(baseUrl, baseUrl)).toBe(true);
    expect(isDashboardUrl(`${baseUrl}?v=1`, baseUrl)).toBe(true);
    expect(isDashboardUrl(focusUrl, baseUrl)).toBe(true);
    expect(isDashboardUrl('chrome-extension://tab-out/other.html#focus-section-switcher', baseUrl)).toBe(false);
  });
});

describe('isDashboardUrl', () => {
  it('returns false for undefined url', () => {
    expect(isDashboardUrl(undefined, 'chrome-extension://x/src/dashboard/index.html')).toBe(false);
  });

  it('falls back to string comparison when url is not a valid URL', () => {
    // Triggers the catch branch — non-parseable URL strings
    expect(isDashboardUrl('not-a-url/path', 'not-a-url/path')).toBe(true);
    expect(isDashboardUrl('not-a-url/path', 'not-a-url/other')).toBe(false);
  });
});
