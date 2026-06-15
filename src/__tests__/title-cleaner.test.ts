import { describe, it, expect } from 'vitest';
import {
  friendlyDomain,
  capitalize,
  stripTitleNoise,
  cleanTitle,
  smartTitle,
} from '../lib/title-cleaner';

// ---------------------------------------------------------------------------
// friendlyDomain
// ---------------------------------------------------------------------------
describe('friendlyDomain', () => {
  it('returns empty string for empty input', () => {
    expect(friendlyDomain('')).toBe('');
  });

  it('maps known hostnames to friendly names', () => {
    expect(friendlyDomain('github.com')).toBe('GitHub');
    expect(friendlyDomain('www.github.com')).toBe('GitHub');
    expect(friendlyDomain('youtube.com')).toBe('YouTube');
    expect(friendlyDomain('www.youtube.com')).toBe('YouTube');
    expect(friendlyDomain('x.com')).toBe('X');
    expect(friendlyDomain('reddit.com')).toBe('Reddit');
    expect(friendlyDomain('stackoverflow.com')).toBe('Stack Overflow');
    expect(friendlyDomain('news.ycombinator.com')).toBe('Hacker News');
    expect(friendlyDomain('local-files')).toBe('Local Files');
  });

  it('handles Substack subdomains', () => {
    expect(friendlyDomain('example.substack.com')).toBe("Example's Substack");
    expect(friendlyDomain('johnsmith.substack.com')).toBe("Johnsmith's Substack");
  });

  it('does not treat substack.com itself as a subdomain', () => {
    expect(friendlyDomain('substack.com')).toBe('Substack');
    expect(friendlyDomain('www.substack.com')).toBe('Substack');
  });

  it('handles github.io pages', () => {
    expect(friendlyDomain('myproject.github.io')).toBe('Myproject (GitHub Pages)');
    expect(friendlyDomain('user.github.io')).toBe('User (GitHub Pages)');
  });

  it('falls back to cleaned domain for unknown hostnames', () => {
    expect(friendlyDomain('www.example.com')).toBe('Example');
    expect(friendlyDomain('something.org')).toBe('Something');
    expect(friendlyDomain('myapp.dev')).toBe('Myapp');
    expect(friendlyDomain('cool.site.io')).toBe('Cool Site');
  });

  it('strips www prefix in fallback', () => {
    expect(friendlyDomain('www.unknown.com')).toBe('Unknown');
  });

  it('capitalizes multi-part domain names in fallback', () => {
    // .app is stripped by TLD regex, leaving "my.cool" -> "My Cool"
    expect(friendlyDomain('my.cool.app')).toBe('My Cool');
    // .com is stripped, leaving subdomain.domain -> two parts
    expect(friendlyDomain('sub.example.com')).toBe('Sub Example');
  });

  it('renders local-address keys verbatim (not "127 0 0 1")', () => {
    expect(friendlyDomain('localhost:3000')).toBe('localhost:3000');
    expect(friendlyDomain('localhost')).toBe('localhost');
    expect(friendlyDomain('127.0.0.1')).toBe('127.0.0.1');
    expect(friendlyDomain('192.168.1.5:5000')).toBe('192.168.1.5:5000');
  });
});

// ---------------------------------------------------------------------------
// capitalize
// ---------------------------------------------------------------------------
describe('capitalize', () => {
  it('capitalizes the first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
  });

  it('returns empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });

  it('handles single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('does not change already capitalized strings', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('only capitalizes the first character', () => {
    expect(capitalize('hello World')).toBe('Hello World');
  });
});

// ---------------------------------------------------------------------------
// stripTitleNoise
// ---------------------------------------------------------------------------
describe('stripTitleNoise', () => {
  it('returns empty string for empty input', () => {
    expect(stripTitleNoise('')).toBe('');
  });

  it('strips leading notification counts', () => {
    expect(stripTitleNoise('(2) GitHub')).toBe('GitHub');
    expect(stripTitleNoise('(10+) Slack')).toBe('Slack');
    expect(stripTitleNoise('(1) Gmail')).toBe('Gmail');
  });

  it('strips inline counts like "Inbox (16,359)"', () => {
    expect(stripTitleNoise('Inbox (16,359) - Gmail')).toBe('Inbox - Gmail');
    expect(stripTitleNoise('Messages (5) - Slack')).toBe('Messages - Slack');
  });

  it('strips email addresses', () => {
    expect(stripTitleNoise('Share - user@example.com')).toBe('Share');
    expect(stripTitleNoise('Contact user@example.com')).toBe('Contact');
  });

  it('strips dash-separated email addresses', () => {
    expect(stripTitleNoise('Invitation - user@example.com')).toBe('Invitation');
  });

  it('cleans X/Twitter format artifacts', () => {
    expect(stripTitleNoise('Hello on X: World')).toBe('Hello: World');
    expect(stripTitleNoise('Tweet text / X')).toBe('Tweet text');
  });

  it('returns clean titles unchanged', () => {
    expect(stripTitleNoise('My GitHub Page')).toBe('My GitHub Page');
  });
});

// ---------------------------------------------------------------------------
// cleanTitle
// ---------------------------------------------------------------------------
describe('cleanTitle', () => {
  it('strips site name suffix with " - " separator', () => {
    expect(cleanTitle('My Pull Request - GitHub', 'github.com')).toBe('My Pull Request');
  });

  it('strips site name suffix with " | " separator', () => {
    expect(cleanTitle('My Video | YouTube', 'youtube.com')).toBe('My Video');
  });

  it('strips site name suffix with em-dash separator', () => {
    expect(cleanTitle('Some Page \u2014 Stack Overflow', 'stackoverflow.com')).toBe(
      'Some Page',
    );
  });

  it('strips site name suffix with middle dot separator', () => {
    expect(cleanTitle('Reddit Post \u00B7 Reddit', 'reddit.com')).toBe('Reddit Post');
  });

  it('strips site name suffix with en-dash separator', () => {
    expect(cleanTitle('Cool Article \u2013 Medium', 'medium.com')).toBe('Cool Article');
  });

  it('does not strip if remaining title is less than 5 characters', () => {
    expect(cleanTitle('Hi - GitHub', 'github.com')).toBe('Hi - GitHub');
  });

  it('returns original title when no separator matches', () => {
    expect(cleanTitle('GitHub', 'github.com')).toBe('GitHub');
  });

  it('returns original title when hostname is empty', () => {
    expect(cleanTitle('My Title - GitHub', '')).toBe('My Title - GitHub');
  });

  it('returns empty string when title is empty', () => {
    expect(cleanTitle('', 'github.com')).toBe('');
  });

  it('handles friendly name matching', () => {
    // "Stack Overflow" is the friendly name for stackoverflow.com
    expect(cleanTitle('How to fix bug - Stack Overflow', 'stackoverflow.com')).toBe(
      'How to fix bug',
    );
  });

  it('strips using last separator occurrence', () => {
    // If title has multiple separators, uses lastIndexOf
    expect(
      cleanTitle('Part 1 - Part 2 - YouTube', 'youtube.com'),
    ).toBe('Part 1 - Part 2');
  });
});

// ---------------------------------------------------------------------------
// smartTitle
// ---------------------------------------------------------------------------
describe('smartTitle', () => {
  it('returns title when URL is empty', () => {
    expect(smartTitle('My Page', '')).toBe('My Page');
  });

  it('returns empty string when both title and URL are empty', () => {
    expect(smartTitle('', '')).toBe('');
  });

  // GitHub
  describe('GitHub', () => {
    it('generates smart title for issues', () => {
      expect(
        smartTitle('http://github.com', 'https://github.com/owner/repo/issues/123'),
      ).toBe('owner/repo Issue #123');
    });

    it('generates smart title for pull requests', () => {
      expect(
        smartTitle('http://github.com', 'https://github.com/owner/repo/pull/456'),
      ).toBe('owner/repo PR #456');
    });

    it('generates smart title for repo root when title is URL', () => {
      expect(
        smartTitle('http://github.com', 'https://github.com/facebook/react'),
      ).toBe('facebook/react');
    });

    it('returns original title for repo root when title is meaningful', () => {
      expect(
        smartTitle('React: A JavaScript library', 'https://github.com/facebook/react'),
      ).toBe('React: A JavaScript library');
    });

    it('generates smart title for blob/file views', () => {
      expect(
        smartTitle(
          'http://github.com',
          'https://github.com/owner/repo/blob/main/src/index.ts',
        ),
      ).toBe('owner/repo \u2014 src/index.ts');
    });

    it('generates smart title for tree/directory views', () => {
      expect(
        smartTitle(
          'http://github.com',
          'https://github.com/owner/repo/tree/main/src',
        ),
      ).toBe('owner/repo \u2014 src');
    });
  });

  // X / Twitter
  describe('X / Twitter', () => {
    it('generates smart title for X posts when title is URL', () => {
      expect(
        smartTitle('https://x.com', 'https://x.com/elonmusk/status/123456789'),
      ).toBe('Post by @elonmusk');
    });

    it('returns original title for X posts when title is meaningful', () => {
      expect(
        smartTitle(
          'Some interesting thought',
          'https://x.com/elonmusk/status/123456789',
        ),
      ).toBe('Some interesting thought');
    });

    it('handles twitter.com URLs', () => {
      expect(
        smartTitle('http://twitter.com', 'https://twitter.com/user/status/999'),
      ).toBe('Post by @user');
    });

    it('handles www.x.com URLs', () => {
      expect(
        smartTitle('http://x.com', 'https://www.x.com/johndoe/status/111'),
      ).toBe('Post by @johndoe');
    });
  });

  // YouTube
  describe('YouTube', () => {
    it('returns "YouTube Video" when title is URL', () => {
      expect(
        smartTitle('https://youtube.com', 'https://www.youtube.com/watch?v=abc123'),
      ).toBe('YouTube Video');
    });

    it('returns original title when title is meaningful', () => {
      expect(
        smartTitle(
          'Amazing Tutorial - Full Course',
          'https://www.youtube.com/watch?v=abc123',
        ),
      ).toBe('Amazing Tutorial - Full Course');
    });

    it('handles youtube.com without www', () => {
      expect(
        smartTitle('http://youtube.com', 'https://youtube.com/watch?v=abc123'),
      ).toBe('YouTube Video');
    });
  });

  // Reddit
  describe('Reddit', () => {
    it('generates smart title for Reddit posts when title is URL', () => {
      expect(
        smartTitle(
          'https://reddit.com',
          'https://www.reddit.com/r/programming/comments/abc123/some_post/',
        ),
      ).toBe('r/programming post');
    });

    it('returns original title for Reddit posts when title is meaningful', () => {
      expect(
        smartTitle(
          'Check out this cool thing',
          'https://www.reddit.com/r/programming/comments/abc123/some_post/',
        ),
      ).toBe('Check out this cool thing');
    });

    it('handles old.reddit.com', () => {
      expect(
        smartTitle(
          'http://reddit.com',
          'https://old.reddit.com/r/javascript/comments/xyz/hello/',
        ),
      ).toBe('r/javascript post');
    });

    it('handles reddit.com without www', () => {
      expect(
        smartTitle(
          'http://reddit.com',
          'https://reddit.com/r/typescript/comments/abc/test/',
        ),
      ).toBe('r/typescript post');
    });
  });

  // Unknown URLs
  describe('unknown URLs', () => {
    it('returns original title for unknown sites', () => {
      expect(
        smartTitle('Welcome', 'https://example.com/page'),
      ).toBe('Welcome');
    });

    it('returns URL when title is empty for unknown sites', () => {
      expect(smartTitle('', 'https://example.com/page')).toBe('https://example.com/page');
    });
  });
});
