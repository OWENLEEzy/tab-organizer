import { describe, expect, it, vi } from 'vitest';
import {
  DASHBOARD_RELATIVE_PATH,
  getDashboardUrl,
} from '../background/dashboard';

describe('DASHBOARD_RELATIVE_PATH', () => {
  it('points at the built dashboard entry', () => {
    expect(DASHBOARD_RELATIVE_PATH).toBe('src/newtab/index.html');
  });
});

describe('getDashboardUrl', () => {
  it('resolves the dashboard path without reading the extension manifest', () => {
    const getUrl = vi.fn((path: string) => `chrome-extension://tab-out/${path}`);

    expect(getDashboardUrl(getUrl)).toBe(`chrome-extension://tab-out/${DASHBOARD_RELATIVE_PATH}`);
    expect(getUrl).toHaveBeenCalledWith(DASHBOARD_RELATIVE_PATH);
  });
});
