import { describe, it, expect } from 'vitest';
import { groupTabsByDomain } from '../lib/tab-grouper';
import type { Tab } from '../types';

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

describe('Grouping Consolidation', () => {
  it('consolidates localized Google domains using regex', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://www.google.com/' }),
      makeTab({ id: 2, url: 'https://www.google.com.hk/search?q=test' }),
      makeTab({ id: 3, url: 'https://google.co.jp/' }),
      makeTab({ id: 4, url: 'https://m.google.com.tw/' }),
    ];

    const groups = groupTabsByDomain(tabs);
    expect(groups).toHaveLength(1);
    expect(groups[0].domain).toBe('google');
    expect(groups[0].friendlyName).toBe('Google');
    expect(groups[0].tabs).toHaveLength(4);
  });

  it('consolidates localized Amazon domains using regex', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://amazon.com/dp/123' }),
      makeTab({ id: 2, url: 'https://www.amazon.co.jp/' }),
      makeTab({ id: 3, url: 'https://amazon.de/test' }),
    ];

    const groups = groupTabsByDomain(tabs);
    expect(groups).toHaveLength(1);
    expect(groups[0].domain).toBe('amazon');
    expect(groups[0].friendlyName).toBe('Amazon');
    expect(groups[0].tabs).toHaveLength(3);
  });

  it('consolidates localized Wikipedia domains using regex', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://en.wikipedia.org/wiki/Main_Page' }),
      makeTab({ id: 2, url: 'https://zh.wikipedia.org/wiki/Wikipedia' }),
      makeTab({ id: 3, url: 'https://ja.wikipedia.org/' }),
    ];

    const groups = groupTabsByDomain(tabs);
    expect(groups).toHaveLength(1);
    expect(groups[0].domain).toBe('wikipedia');
    expect(groups[0].friendlyName).toBe('Wikipedia');
    expect(groups[0].tabs).toHaveLength(3);
  });

  it('keeps unknown products with localized TLDs separate to prevent over-consolidation', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/' }),
      makeTab({ id: 2, url: 'https://example.com.hk/' }),
      makeTab({ id: 3, url: 'https://www.example.co.jp/' }),
    ];

    const groups = groupTabsByDomain(tabs);
    // Should NOT consolidate to "example" key; should remain separate
    expect(groups).toHaveLength(3);
    expect(groups.map(g => g.domain)).toContain('example.com');
    expect(groups.map(g => g.domain)).toContain('example.com.hk');
    expect(groups.map(g => g.domain)).toContain('example.co.jp');
  });

  it('still keeps distinct subdomains separate if they are not in rules', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://app.product.com/' }),
      makeTab({ id: 2, url: 'https://blog.product.com/' }),
    ];

    const groups = groupTabsByDomain(tabs);
    // Without a specific rule, "app.product.com" and "blog.product.com" remain separate keys.
    expect(groups).toHaveLength(2);
    expect(groups.find(g => g.domain === 'app.product.com')).toBeDefined();
    expect(groups.find(g => g.domain === 'blog.product.com')).toBeDefined();
  });
});
