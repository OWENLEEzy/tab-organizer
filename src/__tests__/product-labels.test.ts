import { describe, it, expect } from 'vitest';
import { clearProductLabel, normalizeProductLabels, setProductLabel } from '../lib/product-labels';

describe('setProductLabel', () => {
  it('adds a trimmed label keyed by product key', () => {
    expect(setProductLabel({}, 'youtube', '  Videos  ')).toEqual({ youtube: 'Videos' });
  });

  it('overwrites instead of stacking a second entry for the same product', () => {
    const once = setProductLabel({}, 'youtube', 'Videos');
    expect(setProductLabel(once, 'youtube', 'Watch later')).toEqual({ youtube: 'Watch later' });
  });

  it('treats a blank label as removing the override', () => {
    expect(setProductLabel({ youtube: 'Videos' }, 'youtube', '   ')).toEqual({});
  });

  it('treats renaming back to the built-in name as removing the override', () => {
    expect(setProductLabel({ youtube: 'Videos' }, 'youtube', ' YouTube ', 'YouTube')).toEqual({});
  });

  it('does not mutate its input', () => {
    const labels = { youtube: 'Videos' };
    setProductLabel(labels, 'github', 'Code');
    expect(labels).toEqual({ youtube: 'Videos' });
  });
});

describe('clearProductLabel', () => {
  it('removes only that product', () => {
    expect(clearProductLabel({ youtube: 'Videos', github: 'Code' }, 'youtube')).toEqual({ github: 'Code' });
  });
});

describe('normalizeProductLabels', () => {
  it('keeps string labels, trimmed', () => {
    expect(normalizeProductLabels({ youtube: ' Videos ' })).toEqual({ youtube: 'Videos' });
  });

  it('drops non-string and blank values', () => {
    expect(normalizeProductLabels({ a: 1, b: '', c: '  ', d: null, e: 'Ok' })).toEqual({ e: 'Ok' });
  });

  it('returns an empty map for anything that is not a plain object', () => {
    expect(normalizeProductLabels(undefined)).toEqual({});
    expect(normalizeProductLabels(['x'])).toEqual({});
    expect(normalizeProductLabels('x')).toEqual({});
  });
});
