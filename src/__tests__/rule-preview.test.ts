import { describe, it, expect } from 'vitest';
import type { Section, TabGroup } from '../types';
import { previewRuleMatches } from '../lib/rule-preview';

function group(domain: string, productKey: string): TabGroup {
  return {
    id: productKey,
    domain,
    friendlyName: domain,
    productKey,
    tabs: [],
    collapsed: false,
    order: 0,
    color: '#000',
    hasDuplicates: false,
    duplicateCount: 0,
  };
}

const GITHUB = group('github.com', 'github');
const FIGMA = group('figma.com', 'figma');
const GIST = group('gist.github.com', 'gist');

const SECTIONS: Section[] = [
  { id: 'dev', name: 'Dev', order: 0, autoRules: [{ kind: 'keyword', value: 'github' }] },
  { id: 'design', name: 'Design', order: 1, autoRules: [{ kind: 'keyword', value: 'figma' }] },
];

const HOSTNAMES = new Map<string, readonly string[]>([
  ['github', ['github.com']],
  ['figma', ['figma.com']],
  ['gist', ['gist.github.com']],
]);

describe('previewRuleMatches', () => {
  it('lists an unassigned matching group as will-take', () => {
    const rows = previewRuleMatches({
      draftSectionId: 'dev',
      draftRules: [{ kind: 'keyword', value: 'github' }],
      products: [GITHUB, FIGMA],
      hostnamesByProductKey: HOSTNAMES,
      sections: SECTIONS,
      assignments: [],
      unsectionedProductKeys: [],
    });

    expect(rows).toEqual([
      { product: GITHUB, status: 'will-take', blockedBySectionId: null },
    ]);
  });

  it('marks a group already assigned elsewhere as blocked, not will-take', () => {
    const rows = previewRuleMatches({
      draftSectionId: 'dev',
      draftRules: [{ kind: 'keyword', value: 'figma' }],
      products: [FIGMA],
      hostnamesByProductKey: HOSTNAMES,
      sections: SECTIONS,
      assignments: [{ productKey: 'figma', sectionId: 'design' }],
      unsectionedProductKeys: [],
    });

    expect(rows).toEqual([
      { product: FIGMA, status: 'blocked', blockedBySectionId: 'design' },
    ]);
  });

  it('marks a pinned group as pinned', () => {
    const rows = previewRuleMatches({
      draftSectionId: 'dev',
      draftRules: [{ kind: 'keyword', value: 'github' }],
      products: [GIST],
      hostnamesByProductKey: HOSTNAMES,
      sections: SECTIONS,
      assignments: [],
      unsectionedProductKeys: ['gist'],
    });

    expect(rows).toEqual([
      { product: GIST, status: 'pinned', blockedBySectionId: null },
    ]);
  });

  it('treats a group already in the draft section as will-take', () => {
    const rows = previewRuleMatches({
      draftSectionId: 'dev',
      draftRules: [{ kind: 'keyword', value: 'github' }],
      products: [GITHUB],
      hostnamesByProductKey: HOSTNAMES,
      sections: SECTIONS,
      assignments: [{ productKey: 'github', sectionId: 'dev' }],
      unsectionedProductKeys: [],
    });

    expect(rows[0].status).toBe('will-take');
  });

  it('omits groups the draft rules do not match', () => {
    const rows = previewRuleMatches({
      draftSectionId: 'dev',
      draftRules: [{ kind: 'keyword', value: 'gitlab' }],
      products: [GITHUB, FIGMA],
      hostnamesByProductKey: HOSTNAMES,
      sections: SECTIONS,
      assignments: [],
      unsectionedProductKeys: [],
    });

    expect(rows).toEqual([]);
  });

  it('does not show a mid-label match', () => {
    // `git` no longer matches `digit.com`: section-membership.ts matches a
    // dotless keyword only when a whole hostname label starts with it, not
    // when it appears mid-label. previewRuleMatches must stay honest about
    // that — it must not surface a row the engine itself would not produce.
    const digit = group('digit.com', 'digit');
    const rows = previewRuleMatches({
      draftSectionId: 'dev',
      draftRules: [{ kind: 'keyword', value: 'git' }],
      products: [digit],
      hostnamesByProductKey: new Map([['digit', ['digit.com']]]),
      sections: SECTIONS,
      assignments: [],
      unsectionedProductKeys: [],
    });

    expect(rows).toEqual([]);
  });

  it('falls back to the productKey when no hostnames are known', () => {
    const rows = previewRuleMatches({
      draftSectionId: 'dev',
      draftRules: [{ kind: 'keyword', value: 'github' }],
      products: [GITHUB],
      hostnamesByProductKey: new Map(),
      sections: SECTIONS,
      assignments: [],
      unsectionedProductKeys: [],
    });

    expect(rows).toHaveLength(1);
  });
});
