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
  it('matches a keyword against a hostname label, case-insensitively', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'github' }, ['API.GitHub.com'])).toBe(true);
  });

  it('matches an already-lowercase hostname against a lowercase keyword', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'github' }, ['github.com'])).toBe(true);
  });

  it('matches a dotless keyword as a label prefix', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'steam' }, ['store.steampowered.com'])).toBe(true);
  });

  it('does not match a dotless keyword in the middle of a label', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'git' }, ['digit.com'])).toBe(false);
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'irc' }, ['circleci.com'])).toBe(false);
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'mega' }, ['omega.com'])).toBe(false);
  });

  it('matches a dotted keyword against a contiguous run of labels', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'x.com' }, ['x.com'])).toBe(true);
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'google.com' }, ['docs.google.com'])).toBe(true);
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'scholar.google' }, ['scholar.google.com'])).toBe(true);
  });

  it('does not allow a dotted keyword to match a label prefix or a split run', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'ba.com' }, ['alibaba.com'])).toBe(false);
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'box.com' }, ['dropbox.com'])).toBe(false);
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'aws.com' }, ['aws.amazon.com'])).toBe(false);
  });

  it('still matches local dev-server keys, which carry a port instead of a TLD', () => {
    // getTabDomain groups loopback servers as `localhost:<port>`, so the Dev
    // template's `localhost` keyword has to survive the label-prefix rule.
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'localhost' }, ['localhost:3000'])).toBe(true);
  });

  it('matches when any one of several hostnames matches', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: 'figma' }, ['example.org', 'figma.com'])).toBe(true);
  });

  it('returns false for an empty keyword', () => {
    expect(ruleMatchesHostnames({ kind: 'keyword', value: '' }, ['github.com'])).toBe(false);
    expect(ruleMatchesHostnames({ kind: 'keyword', value: '' }, [''])).toBe(false);
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

  it('treats any non-null assignedSectionId as assigned, including the empty string', () => {
    // The contract is a `!== null` check, not a truthiness check. Loosening it to
    // truthiness would silently re-enable auto-assignment for assigned products.
    expect(resolveMembership({
      hostnames: ['github.com'],
      sections: SECTIONS,
      assignedSectionId: '',
      isPinnedUnsectioned: false,
    })).toEqual({ kind: 'assigned', sectionId: '' });
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
