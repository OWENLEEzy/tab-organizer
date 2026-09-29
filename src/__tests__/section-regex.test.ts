import { describe, it, expect } from 'vitest';
import { isUsablePattern, MAX_PATTERN_LENGTH, parseRegexLines } from '../lib/section-regex';

describe('isUsablePattern', () => {
  it('accepts ordinary hostname patterns', () => {
    for (const pattern of [
      '^docs\\.',
      '^(docs|wiki)\\.',
      '[a-z]+\\.corp\\.com$',
      '^git(hub|lab)\\.com$',
      '(ab)+',
      '\\(a+\\)+',
      '[(a+)]+',
      '(?:www\\.)?example\\.com',
    ]) {
      expect(isUsablePattern(pattern), pattern).toBe(true);
    }
  });

  it('accepts the common subdomain idiom: a repeated label that must end in a dot', () => {
    for (const pattern of [
      '^([a-z0-9-]+\\.)*corp\\.com$',
      '(\\w+\\.)+example\\.com',
      '(?:[^.]+\\.){2}example\\.com',
    ]) {
      expect(isUsablePattern(pattern), pattern).toBe(true);
    }
  });

  it('still rejects a repeated label whose class can also eat the dot', () => {
    for (const pattern of ['([a-z.]+\\.)+x', '(.+\\.)+x', '(\\W+\\.)+x', '([^a]+\\.)+x']) {
      expect(isUsablePattern(pattern), pattern).toBe(false);
    }
  });

  it('rejects patterns that do not compile', () => {
    expect(isUsablePattern('(')).toBe(false);
  });

  it('rejects blank patterns, which would match every hostname', () => {
    expect(isUsablePattern('')).toBe(false);
    expect(isUsablePattern('   ')).toBe(false);
  });

  it('rejects over-long patterns', () => {
    expect(isUsablePattern('a'.repeat(MAX_PATTERN_LENGTH + 1))).toBe(false);
  });

  it('rejects a repeated group that itself repeats or branches, which can backtrack for minutes', () => {
    for (const pattern of [
      '^(a+)+$',
      '(a*)*',
      '^([a-z0-9]+-?)+\\.corp\\.com$',
      '(a|aa)+',
      '(\\w+\\s?){2,}',
      '((ab)*c)+',
      '(?:x+)*y',
    ]) {
      expect(isUsablePattern(pattern), pattern).toBe(false);
    }
  });
});

describe('isUsablePattern: sequences of variable quantifiers', () => {
  it('rejects many ambiguous quantifiers in a row, which backtrack without any nested group', () => {
    for (const pattern of [
      `${'a?'.repeat(40)}${'a'.repeat(40)}`,
      '.*.*.*.*x',
      '[a-z]+[a-z]*[a-z]+[a-z]*\\.',
      'a{1,9}b{1,9}c{1,9}d{1,9}',
    ]) {
      expect(isUsablePattern(pattern), pattern).toBe(false);
    }
  });

  it('allows a few variable quantifiers and any number of fixed counts', () => {
    for (const pattern of [
      '^[a-z]+-[a-z]+\\.[a-z]+\\.corp$',
      '^.*\\.corp\\.(com|net)$',
      'a{3}b{2}c{4}d{5}e{6}',
      'a+?b*?',
    ]) {
      expect(isUsablePattern(pattern), pattern).toBe(true);
    }
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

  it('returns null when any line could hang the page', () => {
    expect(parseRegexLines('foo\n^(a+)+$')).toBeNull();
  });
});
