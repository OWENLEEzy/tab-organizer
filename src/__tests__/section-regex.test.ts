import { describe, it, expect } from 'vitest';
import { isCompilablePattern, parseRegexLines } from '../lib/section-regex';

describe('isCompilablePattern', () => {
  it('accepts a valid pattern and rejects an unterminated group', () => {
    expect(isCompilablePattern('^docs\\.')).toBe(true);
    expect(isCompilablePattern('(')).toBe(false);
  });
});

describe('parseRegexLines', () => {
  it('returns one pattern per non-empty line', () => {
    expect(parseRegexLines('^docs\\.\n(wiki|kb)\\.')).toEqual(['^docs\\.', '(wiki|kb)\\.']);
  });

  it('ignores blank and whitespace-only lines instead of saving a match-everything pattern', () => {
    expect(parseRegexLines('\n  \nfoo\n\n')).toEqual(['foo']);
    expect(parseRegexLines('')).toEqual([]);
  });

  it('trims each line', () => {
    expect(parseRegexLines('  foo  ')).toEqual(['foo']);
  });

  it('drops duplicate lines', () => {
    expect(parseRegexLines('foo\nfoo\nbar')).toEqual(['foo', 'bar']);
  });

  it('returns null when any line does not compile', () => {
    expect(parseRegexLines('foo\n(\nbar[')).toBeNull();
  });
});
