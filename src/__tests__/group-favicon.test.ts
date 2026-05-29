import { describe, it, expect } from 'vitest';
import { getGroupFaviconSource } from '../lib/group-favicon';
import { makeAppTab } from './factories';

describe('getGroupFaviconSource', () => {
  it('uses a provided favicon or falls back to the first tab URL', () => {
    expect(getGroupFaviconSource([
      { ...makeAppTab({ id: 1, url: 'https://a.com' }), favIconUrl: '  https://cdn.example/icon.png  ' },
    ])).toBe('https://cdn.example/icon.png');

    expect(getGroupFaviconSource([makeAppTab({ id: 2, url: 'https://fallback.example/path' })])).toBe(
      'https://fallback.example/path',
    );
    expect(getGroupFaviconSource([])).toBe('');
  });
});
