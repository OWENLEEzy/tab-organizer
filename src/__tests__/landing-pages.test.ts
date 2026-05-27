import { describe, it, expect } from 'vitest';
import { LANDING_PAGE_PATTERNS, isLandingPage } from '../lib/landing-pages';
import type { LandingPagePattern } from '../types';

// ─── Gmail ────────────────────────────────────────────────────────

describe('isLandingPage — Gmail', () => {
  it('matches Gmail inbox root', () => {
    expect(isLandingPage('https://mail.google.com/')).toBe(true);
    expect(isLandingPage('https://mail.google.com/mail/u/0/')).toBe(true);
  });

  it('rejects Gmail inbox thread', () => {
    expect(isLandingPage('https://mail.google.com/mail/u/0/#inbox/abc123')).toBe(false);
  });

  it('rejects Gmail sent folder', () => {
    expect(isLandingPage('https://mail.google.com/mail/u/0/#sent/abc123')).toBe(false);
  });

  it('rejects Gmail search', () => {
    expect(isLandingPage('https://mail.google.com/mail/u/0/#search/important')).toBe(false);
  });
});

// ─── X (Twitter) ──────────────────────────────────────────────────

describe('isLandingPage — X', () => {
  it('matches X home feed', () => {
    expect(isLandingPage('https://x.com/home')).toBe(true);
  });

  it('rejects X profile page', () => {
    expect(isLandingPage('https://x.com/someuser')).toBe(false);
  });

  it('rejects X root (no /home)', () => {
    expect(isLandingPage('https://x.com/')).toBe(false);
  });
});

// ─── LinkedIn ──────────────────────────────────────────────────────

describe('isLandingPage — LinkedIn', () => {
  it('matches LinkedIn root', () => {
    expect(isLandingPage('https://www.linkedin.com/')).toBe(true);
  });

  it('rejects LinkedIn feed', () => {
    expect(isLandingPage('https://www.linkedin.com/feed/')).toBe(false);
  });

  it('rejects LinkedIn profile', () => {
    expect(isLandingPage('https://www.linkedin.com/in/someuser/')).toBe(false);
  });
});

// ─── GitHub ────────────────────────────────────────────────────────

describe('isLandingPage — GitHub', () => {
  it('matches GitHub root', () => {
    expect(isLandingPage('https://github.com/')).toBe(true);
  });

  it('rejects GitHub repository page', () => {
    expect(isLandingPage('https://github.com/user/repo')).toBe(false);
  });

  it('rejects GitHub pull request', () => {
    expect(isLandingPage('https://github.com/user/repo/pull/123')).toBe(false);
  });
});

// ─── YouTube ───────────────────────────────────────────────────────

describe('isLandingPage — YouTube', () => {
  it('matches YouTube root', () => {
    expect(isLandingPage('https://www.youtube.com/')).toBe(true);
  });

  it('rejects YouTube watch page', () => {
    expect(isLandingPage('https://www.youtube.com/watch?v=abc123')).toBe(false);
  });

  it('rejects YouTube channel page', () => {
    expect(isLandingPage('https://www.youtube.com/@channel')).toBe(false);
  });
});

// ─── Edge cases ────────────────────────────────────────────────────

describe('isLandingPage — edge cases', () => {
  it('returns false for non-landing URLs', () => {
    expect(isLandingPage('https://docs.google.com/document/d/abc')).toBe(false);
    expect(isLandingPage('https://stackoverflow.com/questions/12345')).toBe(false);
    expect(isLandingPage('https://example.com/')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isLandingPage('not-a-url')).toBe(false);
    expect(isLandingPage('')).toBe(false);
  });

  it('returns false for browser-internal URLs', () => {
    expect(isLandingPage('chrome://newtab/')).toBe(false);
    expect(isLandingPage('about:blank')).toBe(false);
  });

  it('supports suffix, prefix, and root-only landing page patterns', () => {
    const patterns = LANDING_PAGE_PATTERNS as unknown as LandingPagePattern[];

    patterns.push(
      { hostnameEndsWith: '.example.test', pathPrefix: '/home' },
      { hostname: 'root-only.example.test' },
    );

    try {
      expect(isLandingPage('https://app.example.test/home/today')).toBe(true);
      expect(isLandingPage('https://app.example.test/settings')).toBe(false);
      expect(isLandingPage('https://root-only.example.test/')).toBe(true);
      expect(isLandingPage('https://root-only.example.test/not-root')).toBe(false);
    } finally {
      patterns.pop();
      patterns.pop();
    }
  });
});
