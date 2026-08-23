import { describe, it, expect } from 'vitest';
import type { Section } from '../types';
import {
  ruleMatchesHostnames,
  rulesMatchHostnames,
  resolveMembership,
} from '../lib/section-membership';

const SECTIONS: Section[] = [
  { id: 'dev', name: 'Dev', order: 0, autoRules: [{ kind: 'keyword', value: 'github' }] },
  { id: 'design', name: 'Design', order: 1, autoRules: [{ kind: 'keyword', value: 'figma' }] },
  { id: 'ops', name: 'Ops', order: 2, autoRules: [{ kind: 'regex', pattern: '^(aws|gcp)\\.' }] },
];

describe('ruleMatchesHostnames', () => {
  it('matches a keyword as a case-insensitive substring', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'github' }, ['api.github.com'])).toBe(true);
  });

  it('matches an already-lowercase hostname against a lowercase keyword', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'github' }, ['github.com'])).toBe(true);
  });

  it('accepts substring false positives as the documented behavior', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'git' }, ['digit.com'])).toBe(true);
  });

  it('needs no dot escaping', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'x.com' }, ['x.com'])).toBe(true);
  });

  it('matches a regex rule case-insensitively', () => {
    expect(ruleMatchesHostnames({ kind: 'regex', pattern: '^AWS\\.' }, ['aws.amazon.com'])).toBe(true);
  });

  it('returns false for an uncompilable regex instead of throwing', () => {
    expect(ruleMatchesHostnames({ kind: 'regex', pattern: '[' }, ['anything.com'])).toBe(false);
  });

  it('rulesMatchHostnames returns false for undefined or empty rules', () => {
    expect(rulesMatchHostnames(undefined, ['github.com'])).toBe(false);
    expect(rulesMatchHostnames([], ['github.com'])).toBe(false);
  });
});

describe('resolveMembership priority', () => {
  it('explicit assignment beats a rule pointing elsewhere', () => {
    expect(resolveMembership({
      hostnames: ['github.com'],
      sections: SECTIONS,
      assignedSectionId: 'design',
      isPinnedUnsectioned: false,
    })).toEqual({ kind: 'assigned', sectionId: 'design' });
  });

  it('explicit assignment beats the pin', () => {
    expect(resolveMembership({
      hostnames: ['github.com'],
      sections: SECTIONS,
      assignedSectionId: 'dev',
      isPinnedUnsectioned: true,
    })).toEqual({ kind: 'assigned', sectionId: 'dev' });
  });

  it('the pin beats rule inference', () => {
    expect(resolveMembership({
      hostnames: ['github.com'],
      sections: SECTIONS,
      assignedSectionId: null,
      isPinnedUnsectioned: true,
    })).toEqual({ kind: 'pinned-unsectioned' });
  });

  it('falls back to rule inference', () => {
    expect(resolveMembership({
      hostnames: ['github.com'],
      sections: SECTIONS,
      assignedSectionId: null,
      isPinnedUnsectioned: false,
    })).toEqual({ kind: 'auto', sectionId: 'dev' });
  });

  it('returns none when nothing matches', () => {
    expect(resolveMembership({
      hostnames: ['example.org'],
      sections: SECTIONS,
      assignedSectionId: null,
      isPinnedUnsectioned: false,
    })).toEqual({ kind: 'none' });
  });

  it('evaluates sections in order, first match wins', () => {
    const both: Section[] = [
      { id: 'second', name: 'Second', order: 1, autoRules: [{ kind: 'keyword', value: 'github' }] },
      { id: 'first', name: 'First', order: 0, autoRules: [{ kind: 'keyword', value: 'github' }] },
    ];
    expect(resolveMembership({
      hostnames: ['github.com'],
      sections: both,
      assignedSectionId: null,
      isPinnedUnsectioned: false,
    })).toEqual({ kind: 'auto', sectionId: 'first' });
  });
});
