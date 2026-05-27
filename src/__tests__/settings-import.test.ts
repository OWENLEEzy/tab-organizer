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
});
