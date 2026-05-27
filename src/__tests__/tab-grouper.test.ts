import { describe, it, expect } from 'vitest';
import { groupTabsByDomain, autoAssignProductToSpace, createSortComparator } from '../lib/tab-grouper';
import type { Tab, ManualGroup, TabGroup } from '../types';

function makeTab(overrides: Partial<Tab> & Pick<Tab, 'id' | 'url'>): Tab {
  return {
    title: 'Test Tab',
    favIconUrl: '',
    domain: '',
    windowId: 1,
    active: false,
    isTabOut: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
    ...overrides,
  };
}

describe('groupTabsByDomain', () => {
  it('returns empty array for empty input', () => {
    expect(groupTabsByDomain([])).toEqual([]);
  });

  it('groups tabs by product key instead of raw hostname', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://www.youtube.com/' }),
      makeTab({ id: 2, url: 'https://m.youtube.com/watch?v=abc' }),
      makeTab({ id: 3, url: 'https://stackoverflow.com/questions/1' }),
    ];

    const groups = groupTabsByDomain(tabs);
    const youtubeGroup = groups.find((g) => g.domain === 'youtube');
    const soGroup = groups.find((g) => g.domain === 'stackoverflow.com');

    expect(groups).toHaveLength(2);
    expect(youtubeGroup).toBeDefined();
    expect(youtubeGroup!.tabs).toHaveLength(2);
    expect(youtubeGroup!.friendlyName).toBe('YouTube');
    expect(youtubeGroup!.iconDomain).toBe('youtube.com');
    expect(youtubeGroup!.itemType).toBe('product');
    expect(soGroup).toBeDefined();
    expect(soGroup!.tabs).toHaveLength(1);
  });

  it('keeps landing pages in their product group until manually assigned', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://www.youtube.com/' }),
      makeTab({ id: 2, url: 'https://www.youtube.com/watch?v=1' }),
      makeTab({ id: 3, url: 'https://github.com/' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups.find((g) => g.domain === '__landing-pages__')).toBeUndefined();
    expect(groups.find((g) => g.domain === 'youtube')!.tabs).toHaveLength(2);
    expect(groups.find((g) => g.domain === 'github')!.tabs).toHaveLength(1);
  });

  it('keeps Google products separated', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://mail.google.com/mail/u/0/#inbox' }),
      makeTab({ id: 2, url: 'https://docs.google.com/document/d/1/edit' }),
      makeTab({ id: 3, url: 'https://drive.google.com/drive/my-drive' }),
    ];

    const groups = groupTabsByDomain(tabs);
    const keys = groups.map((g) => g.domain).sort();

    expect(keys).toEqual(['gmail', 'google-docs', 'google-drive']);
    expect(groups.find((g) => g.domain === 'gmail')?.iconDomain).toBe('mail.google.com');
    expect(groups.find((g) => g.domain === 'google-docs')?.friendlyName).toBe('Google Docs');
  });

  it('merges YouTube and YouTube Music into one product', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://www.youtube.com/watch?v=1' }),
      makeTab({ id: 2, url: 'https://music.youtube.com/watch?v=2' }),
    ];

    const groups = groupTabsByDomain(tabs);
    const keys = groups.map((g) => g.domain).sort();

    expect(keys).toEqual(['youtube']);
    expect(groups.find((g) => g.domain === 'youtube')?.tabs).toHaveLength(2);
    expect(groups.find((g) => g.domain === 'youtube')?.iconDomain).toBe('youtube.com');
  });

  it('merges Vercel dashboard and vercel.app deployments into one product', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://vercel.com/dashboard' }),
      makeTab({ id: 2, url: 'https://my-product.vercel.app/' }),
      makeTab({ id: 3, url: 'https://preview-abc.my-product.vercel.app/path' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups).toHaveLength(1);
    expect(groups[0].domain).toBe('vercel');
    expect(groups[0].tabs).toHaveLength(3);
  });

  it('handles file:// URLs as local-files group', () => {
    const tabs = [
      makeTab({ id: 1, url: 'file:///Users/test/document.html' }),
      makeTab({ id: 2, url: 'file:///Users/test/other.pdf' }),
      makeTab({ id: 3, url: 'https://example.com/page' }),
    ];

    const groups = groupTabsByDomain(tabs);
    const localGroup = groups.find((g) => g.domain === 'local-files');

    expect(localGroup).toBeDefined();
    expect(localGroup!.tabs).toHaveLength(2);
    expect(localGroup!.friendlyName).toBe('Local Files');
  });

  it('assigns correct friendly names from product rules', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://github.com/user/repo' }),
    ];

    const groups = groupTabsByDomain(tabs);
    expect(groups[0].friendlyName).toBe('GitHub');
    expect(groups[0].domain).toBe('github');
  });

  it('detects duplicate tabs and sets color and flags inside product groups', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://www.youtube.com/watch?v=1' }),
      makeTab({ id: 2, url: 'https://m.youtube.com/watch?v=1' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups[0].hasDuplicates).toBe(false);
    expect(groups[0].duplicateCount).toBe(0);
    expect(groups[0].color).toBe('#4DAB9A');
  });

  it('preserves the active status of tabs during grouping', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/1', active: true }),
      makeTab({ id: 2, url: 'https://example.com/2', active: false }),
    ];

    const groups = groupTabsByDomain(tabs);
    const exampleGroup = groups[0];

    expect(exampleGroup.tabs.find((t) => t.id === 1)?.active).toBe(true);
    expect(exampleGroup.tabs.find((t) => t.id === 2)?.active).toBe(false);
  });

  it('detects exact duplicate URLs', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/page' }),
      makeTab({ id: 2, url: 'https://example.com/page' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups[0].hasDuplicates).toBe(true);
    expect(groups[0].duplicateCount).toBe(1);
    expect(groups[0].color).toBe('#DFAB01');
  });

  it('assigns sequential order values', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/a' }),
      makeTab({ id: 2, url: 'https://other.com/b' }),
      makeTab({ id: 3, url: 'https://third.com/c' }),
    ];

    const groups = groupTabsByDomain(tabs);
    expect(groups.map((g) => g.order)).toEqual([0, 1, 2]);
  });

  it('sets collapsed to false for all groups', () => {
    const groups = groupTabsByDomain([
      makeTab({ id: 1, url: 'https://example.com/a' }),
    ]);

    expect(groups.every((group) => group.collapsed === false)).toBe(true);
  });

  it('skips malformed URLs without crashing', () => {
    const groups = groupTabsByDomain([
      makeTab({ id: 1, url: 'not-a-url' }),
      makeTab({ id: 2, url: 'https://example.com/valid' }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].domain).toBe('example.com');
  });

  describe('customOrder', () => {
    it('behaves the same when customOrder is undefined', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://github.com/user/repo' }),
        makeTab({ id: 2, url: 'https://example.com/page' }),
        makeTab({ id: 3, url: 'https://x.com/status' }),
      ];

      const withoutOrder = groupTabsByDomain(tabs);
      const withEmpty = groupTabsByDomain(tabs, {});

      expect(withEmpty.map((g) => g.domain)).toEqual(withoutOrder.map((g) => g.domain));
    });

    it('applies custom order when all products are ordered', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://github.com/user/repo' }),
        makeTab({ id: 2, url: 'https://example.com/page' }),
        makeTab({ id: 3, url: 'https://x.com/status' }),
      ];

      const groups = groupTabsByDomain(tabs, {
        'example.com': 0,
        'x.com': 1,
        github: 2,
      });

      expect(groups.map((g) => g.domain)).toEqual(['example.com', 'x.com', 'github']);
    });

    it('sorts ordered products before unordered ones', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://github.com/user/repo' }),
        makeTab({ id: 2, url: 'https://example.com/page' }),
        makeTab({ id: 3, url: 'https://x.com/status' }),
      ];

      const groups = groupTabsByDomain(tabs, {
        'example.com': 0,
      });

      expect(groups[0].domain).toBe('example.com');
      expect(groups).toHaveLength(3);
    });
  });

  describe('domain consolidation', () => {
    it('consolidates localized Google domains into a single group', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://www.google.com/' }),
        makeTab({ id: 2, url: 'https://www.google.com.hk/' }),
        makeTab({ id: 3, url: 'https://www.google.co.uk/' }),
      ];

      const groups = groupTabsByDomain(tabs);

      expect(groups).toHaveLength(1);
      expect(groups[0].productKey).toBe('google');
      expect(groups[0].tabs).toHaveLength(3);
    });

    it('strips www and m prefixes when grouping unknown domains', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://example.com/' }),
        makeTab({ id: 2, url: 'https://www.example.com/' }),
        makeTab({ id: 3, url: 'https://m.example.com/' }),
      ];

      const groups = groupTabsByDomain(tabs);

      expect(groups).toHaveLength(1);
      expect(groups[0].productKey).toBe('example.com');
      expect(groups[0].tabs).toHaveLength(3);
    });
  });
});

describe('autoAssignProductToSpace', () => {
  const mockSpaces: ManualGroup[] = [
    {
      id: 'dev',
      name: 'Dev',
      order: 0,
      autoRules: [{ pattern: 'github|vercel|localhost', type: 'hostname' }],
    },
    {
      id: 'media',
      name: 'Media',
      order: 1,
      autoRules: [{ pattern: 'youtube|bilibili', type: 'hostname' }],
    },
  ];

  it('matches hostname against regex rules', () => {
    expect(autoAssignProductToSpace(['github.com'], mockSpaces)).toBe('dev');
    expect(autoAssignProductToSpace(['vercel.com'], mockSpaces)).toBe('dev');
    expect(autoAssignProductToSpace(['youtube.com'], mockSpaces)).toBe('media');
  });

  it('matches canonical Google products through their source hostnames', () => {
    const spaces: ManualGroup[] = [
      {
        id: 'work',
        name: 'Work',
        order: 0,
        autoRules: [{ pattern: 'google\\.com', type: 'hostname' }],
      },
    ];

    expect(autoAssignProductToSpace(['mail.google.com'], spaces)).toBe('work');
    expect(autoAssignProductToSpace(['docs.google.com'], spaces)).toBe('work');
  });

  it('returns null if no rule matches', () => {
    expect(autoAssignProductToSpace(['google.com'], mockSpaces)).toBeNull();
  });

  it('safely ignores invalid regex patterns', () => {
    const spacesWithInvalidRegex: ManualGroup[] = [
      {
        id: 'bad-regex',
        name: 'Bad',
        order: 0,
        autoRules: [{ pattern: '[invalid', type: 'hostname' }],
      },
      ...mockSpaces,
    ];
    expect(autoAssignProductToSpace(['github.com'], spacesWithInvalidRegex)).toBe('dev');
  });
});

describe('createSortComparator', () => {
  function makeGroup(overrides: Partial<TabGroup> & { domain: string; friendlyName: string; tabs: Tab[] }): TabGroup {
    const { domain, friendlyName, tabs } = overrides;
    return {
      id: domain,
      domain,
      friendlyName,
      itemType: 'product',
      itemKey: domain,
      productKey: domain,
      iconDomain: domain,
      tabs,
      collapsed: false,
      order: 0,
      color: '#4DAB9A',
      hasDuplicates: false,
      duplicateCount: 0,
      lastAccessed: overrides.lastAccessed,
    };
  }

  function makeTabWithLastAccessed(url: string, lastAccessed: number): Tab {
    return makeTab({ id: Math.random(), url, lastAccessed });
  }

  it('sorts by tab count desc then alphabet when sortBy is "default"', () => {
    const groups: TabGroup[] = [
      makeGroup({ domain: 'z.com', friendlyName: 'Zee', tabs: [makeTab({ id: 1, url: 'https://z.com/1' })] }),
      makeGroup({ domain: 'a.com', friendlyName: 'Aee', tabs: [makeTab({ id: 2, url: 'https://a.com/1' }), makeTab({ id: 3, url: 'https://a.com/2' }), makeTab({ id: 4, url: 'https://a.com/3' })] }),
      makeGroup({ domain: 'm.com', friendlyName: 'Mee', tabs: [makeTab({ id: 5, url: 'https://m.com/1' }), makeTab({ id: 6, url: 'https://m.com/2' })] }),
    ];

    const sorted = [...groups].sort(createSortComparator('count'));

    expect(sorted.map((g) => g.domain)).toEqual(['a.com', 'm.com', 'z.com']);
  });

  it('sorts by name A→Z when sortBy is "name"', () => {
    const groups: TabGroup[] = [
      makeGroup({ domain: 'z.com', friendlyName: 'Zee', tabs: [makeTab({ id: 1, url: 'https://z.com/1' })] }),
      makeGroup({ domain: 'a.com', friendlyName: 'Aee', tabs: [makeTab({ id: 2, url: 'https://a.com/1' })] }),
      makeGroup({ domain: 'm.com', friendlyName: 'Mee', tabs: [makeTab({ id: 3, url: 'https://m.com/1' })] }),
    ];

    const sorted = [...groups].sort(createSortComparator('name'));

    expect(sorted.map((g) => g.domain)).toEqual(['a.com', 'm.com', 'z.com']);
  });

  it('sorts by lastAccessed descending when sortBy is "lastAccessed"', () => {
    const now = Date.now();
    const groups: TabGroup[] = [
      makeGroup({ domain: 'old.com', friendlyName: 'Old', tabs: [makeTabWithLastAccessed('https://old.com/', now - 10000)], lastAccessed: now - 10000 }),
      makeGroup({ domain: 'new.com', friendlyName: 'New', tabs: [makeTabWithLastAccessed('https://new.com/', now), makeTabWithLastAccessed('https://new.com/2', now - 5000)], lastAccessed: now }),
      makeGroup({ domain: 'mid.com', friendlyName: 'Mid', tabs: [makeTabWithLastAccessed('https://mid.com/', now - 5000)], lastAccessed: now - 5000 }),
    ];

    const sorted = [...groups].sort(createSortComparator('lastAccessed'));

    expect(sorted.map((g) => g.domain)).toEqual(['new.com', 'mid.com', 'old.com']);
  });

  it('sorts groups without lastAccessed after those with it when sortBy is "lastAccessed"', () => {
    const now = Date.now();
    const groups: TabGroup[] = [
      makeGroup({ domain: 'no-time.com', friendlyName: 'No Time', tabs: [makeTab({ id: 1, url: 'https://no-time.com/' })] }),
      makeGroup({ domain: 'has-time.com', friendlyName: 'Has Time', tabs: [makeTabWithLastAccessed('https://has-time.com/', now)], lastAccessed: now }),
    ];

    const sorted = [...groups].sort(createSortComparator('lastAccessed'));

    expect(sorted[0].domain).toBe('has-time.com');
    expect(sorted[1].domain).toBe('no-time.com');
  });

  it('uses alphabetical tie-breaker when lastAccessed values are equal', () => {
    const now = Date.now();
    const groups: TabGroup[] = [
      makeGroup({ domain: 'zebra.com', friendlyName: 'Zebra', tabs: [makeTabWithLastAccessed('https://zebra.com/', now)], lastAccessed: now }),
      makeGroup({ domain: 'apple.com', friendlyName: 'Apple', tabs: [makeTabWithLastAccessed('https://apple.com/', now)], lastAccessed: now }),
      makeGroup({ domain: 'middle.com', friendlyName: 'Middle', tabs: [makeTabWithLastAccessed('https://middle.com/', now)], lastAccessed: now }),
    ];

    const sorted = [...groups].sort(createSortComparator('lastAccessed'));

    expect(sorted.map((g) => g.domain)).toEqual(['apple.com', 'middle.com', 'zebra.com']);
  });
});
