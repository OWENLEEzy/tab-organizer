import { describe, it, expect } from 'vitest';
import { normalizeKeyword } from '../lib/section-keywords';

describe('normalizeKeyword', () => {
  it('lowercases', () => {
    expect(normalizeKeyword('GitHub')).toEqual({ ok: true, value: 'github' });
  });

  it('trims ASCII and full-width whitespace', () => {
    expect(normalizeKeyword('　figma　')).toEqual({ ok: true, value: 'figma' });
    expect(normalizeKeyword('  linear  ')).toEqual({ ok: true, value: 'linear' });
  });

  it('strips protocol and path', () => {
    expect(normalizeKeyword('https://Notion.so/xyz')).toEqual({ ok: true, value: 'notion.so' });
    expect(normalizeKeyword('http://example.com/a?b=1#c')).toEqual({ ok: true, value: 'example.com' });
  });

  it('strips www. and m. prefixes', () => {
    expect(normalizeKeyword('www.Linear.app')).toEqual({ ok: true, value: 'linear.app' });
    expect(normalizeKeyword('m.youtube.com')).toEqual({ ok: true, value: 'youtube.com' });
  });

  it('rejects empty input', () => {
    expect(normalizeKeyword('')).toEqual({ ok: false, reason: 'empty' });
    expect(normalizeKeyword('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects input that becomes empty after stripping', () => {
    expect(normalizeKeyword('https://')).toEqual({ ok: false, reason: 'empty' });
    expect(normalizeKeyword('www.')).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects internal whitespace', () => {
    expect(normalizeKeyword('git hub')).toEqual({ ok: false, reason: 'whitespace' });
    expect(normalizeKeyword('azure ai')).toEqual({ ok: false, reason: 'whitespace' });
  });

  it('rejects a duplicate of an already-normalized existing keyword', () => {
    expect(normalizeKeyword('GitHub', ['github'])).toEqual({ ok: false, reason: 'duplicate' });
  });

  it('accepts when existing list does not contain the normalized value', () => {
    expect(normalizeKeyword('gitlab', ['github'])).toEqual({ ok: true, value: 'gitlab' });
  });

  it('keeps dots literal — they are label separators, not regex syntax', () => {
    expect(normalizeKeyword('x.com')).toEqual({ ok: true, value: 'x.com' });
  });
});
