import { describe, expect, it } from 'vitest';
import { parseImportedSettings } from '../newtab/lib/settings-import';

describe('parseImportedSettings', () => {
  it('accepts supported accent themes', () => {
    expect(parseImportedSettings({ theme: 'sage' })).toEqual({ theme: 'sage' });
  });

  it('rejects legacy and unknown theme strings', () => {
    expect(parseImportedSettings({ theme: 'dark' })).toEqual({});
    expect(parseImportedSettings({ theme: 'system' })).toEqual({});
    expect(parseImportedSettings({ theme: 'not-real' })).toEqual({});
  });

  it('normalizes legacy sort settings while ignoring unknown values', () => {
    expect(parseImportedSettings({ groupSortBy: 'default' })).toEqual({ groupSortBy: 'count' });
    expect(parseImportedSettings({ groupSortBy: 'lastAccessed' })).toEqual({ groupSortBy: 'lastAccessed' });
    expect(parseImportedSettings({ groupSortBy: 'not-real' })).toEqual({});
  });
});
