import { describe, it, expect, vi } from 'vitest';
import { getTabDomain, LOCAL_FILES_PRODUCT_KEY } from '../lib/url-rules';
import { isTabOrganizerPage } from '../utils/browser-url';

describe('isTabOrganizerPage extra', () => {
  it('returns true for chrome://newtab/', () => {
    expect(isTabOrganizerPage('chrome://newtab/')).toBe(true);
  });

  it('returns false for empty URL', () => {
    expect(isTabOrganizerPage('')).toBe(false);
  });

  it('returns false when chrome API throws', () => {
    vi.stubGlobal('chrome', {
      runtime: {
        getURL: () => { throw new Error('fail'); }
      }
    });
    expect(isTabOrganizerPage('https://example.com')).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe('getTabDomain extra', () => {
  it('returns local-files for file://', () => {
    expect(getTabDomain('file:///path/to/file')).toBe(LOCAL_FILES_PRODUCT_KEY);
  });

  it('returns empty string for empty URL', () => {
    // Line 39 in url.ts
    expect(getTabDomain('')).toBe('');
  });

  it('canonicalizes local addresses by host+port (localhost === 127.0.0.1)', () => {
    expect(getTabDomain('http://localhost:3000/x')).toBe('localhost:3000');
    expect(getTabDomain('http://127.0.0.1:3000/x')).toBe('localhost:3000');
    expect(getTabDomain('http://localhost:8080/x')).toBe('localhost:8080');
  });

  it('leaves normal hostnames unchanged (no port appended)', () => {
    expect(getTabDomain('https://github.com/foo')).toBe('github.com');
    expect(getTabDomain('https://example.com')).toBe('example.com');
  });
});
