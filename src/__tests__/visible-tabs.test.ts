import { describe, expect, it } from 'vitest';
import type { Tab, TabGroup } from '../types';
import { flattenVisibleTabs } from '../newtab/lib/visible-tabs';

function createTab(id: number, url: string, title: string): Tab {
  return {
    id,
    url,
    title,
    favIconUrl: '',
    domain: new URL(url).hostname,
    windowId: 1,
    active: false,
    isTabOut: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
  };
}

function createGroup(tabs: Tab[]): TabGroup {
  return {
    id: 'github.com',
    domain: 'github.com',
    friendlyName: 'GitHub',
    tabs,
    collapsed: false,
    order: 0,
    color: '#4DAB9A',
    hasDuplicates: true,
    duplicateCount: 1,
  };
}

describe('flattenVisibleTabs', () => {
  it('excludes duplicate URLs and collapsed overflow tabs from keyboard navigation', () => {
    const group = createGroup([
      createTab(1, 'https://github.com/openai/openai', 'OpenAI'),
      createTab(2, 'https://github.com/openai/openai', 'OpenAI duplicate'),
      createTab(3, 'https://github.com/vercel/next.js', 'Next.js'),
      createTab(4, 'https://github.com/vitejs/vite', 'Vite'),
    ]);

    const chips = flattenVisibleTabs([group], 2, new Set());

    expect(chips.map((chip) => chip.url)).toEqual([
      'https://github.com/openai/openai',
      'https://github.com/vercel/next.js',
    ]);
  });

  it('includes expanded unique tabs in keyboard navigation', () => {
    const group = createGroup([
      createTab(1, 'https://github.com/openai/openai', 'OpenAI'),
      createTab(2, 'https://github.com/openai/openai', 'OpenAI duplicate'),
      createTab(3, 'https://github.com/vercel/next.js', 'Next.js'),
      createTab(4, 'https://github.com/vitejs/vite', 'Vite'),
    ]);

    const chips = flattenVisibleTabs([group], 2, new Set(['github.com']));

    expect(chips.map((chip) => chip.url)).toEqual([
      'https://github.com/openai/openai',
      'https://github.com/vercel/next.js',
      'https://github.com/vitejs/vite',
    ]);
  });
});
