import { describe, it, expect, vi } from 'vitest';
import { isTabOutPage, getTabDomain } from '../utils/url';

describe('isTabOutPage extra', () => {
  it('returns true for chrome://newtab/', () => {
    expect(isTabOutPage('chrome://newtab/')).toBe(true);
  });

  it('returns false for empty URL', () => {
    expect(isTabOutPage('')).toBe(false);
  });

  it('returns false when chrome API throws', () => {
    vi.stubGlobal('chrome', {
      runtime: {
        getURL: () => { throw new Error('fail'); }
      }
    });
    expect(isTabOutPage('https://example.com')).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe('getTabDomain extra', () => {
  it('returns local-files for file://', () => {
    expect(getTabDomain('file:///path/to/file')).toBe('local-files');
  });

  it('returns empty string for empty URL', () => {
    // Line 39 in url.ts
    expect(getTabDomain('')).toBe('');
  });
});
