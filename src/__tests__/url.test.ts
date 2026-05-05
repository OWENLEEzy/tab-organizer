import { describe, it, expect } from 'vitest';
import { isRealTab, sanitizeUrl, getHostname } from '../utils/url';

describe('isRealTab', () => {
  it('returns true for https URLs', () => {
    expect(isRealTab('https://github.com')).toBe(true);
  });

  it('returns false for chrome:// URLs', () => {
    expect(isRealTab('chrome://extensions/')).toBe(false);
  });

  it('returns false for chrome-extension:// URLs', () => {
    expect(isRealTab('chrome-extension://abc123/popup.html')).toBe(false);
  });

  it('returns false for about: URLs', () => {
    expect(isRealTab('about:blank')).toBe(false);
  });

  it('returns false for edge:// URLs', () => {
    expect(isRealTab('edge://settings/')).toBe(false);
  });

  it('returns false for brave:// URLs', () => {
    expect(isRealTab('brave://settings/')).toBe(false);
  });
});

describe('sanitizeUrl', () => {
  it('escapes double quotes', () => {
    expect(sanitizeUrl('test"url')).toBe('test&quot;url');
  });

  it('escapes angle brackets', () => {
    expect(sanitizeUrl('<script>')).toBe('&lt;script&gt;');
  });
});

describe('getHostname', () => {
  it('extracts hostname from valid URL', () => {
    expect(getHostname('https://www.github.com/user/repo')).toBe('www.github.com');
  });

  it('returns empty string for invalid URL', () => {
    expect(getHostname('not-a-url')).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(getHostname('')).toBe('');
  });
});
