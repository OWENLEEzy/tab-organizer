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

  it('blocks a match an earlier-order section already auto-claims via its own rules', () => {
    // dev (order 0) already has a `github` keyword rule, which label-matches
    // gist.github.com. Drafting a `gist` rule on design (order 1) must not
    // promise will-take: findAutoSectionId would resolve this product to dev.
    const rows = previewRuleMatches({
      draftSectionId: 'design',
      draftRules: [{ kind: 'keyword', value: 'gist' }],
      products: [GIST],
      hostnamesByProductKey: HOSTNAMES,
      sections: SECTIONS,
      assignments: [],
      unsectionedProductKeys: [],
    });

    expect(rows).toEqual([
      { product: GIST, status: 'blocked', blockedBySectionId: 'dev' },
    ]);
  });

  it('reports will-take when the draft section itself sorts earlier and wins', () => {
    // A naive fix that just checks `membership.sectionId !== draftSectionId`
    // against the *unmodified* sections would see `other` (the only section
    // whose current rules match) and wrongly report blocked. The draft
    // section sorts earlier (order 0) and, once its draft rules are applied,
    // matches too — so it is the one the engine would actually pick.
    const sections: Section[] = [
      { id: 'dev', name: 'Dev', order: 0, autoRules: [] },
      { id: 'other', name: 'Other', order: 1, autoRules: [{ kind: 'keyword', value: 'github' }] },
    ];
    const rows = previewRuleMatches({
      draftSectionId: 'dev',
      draftRules: [{ kind: 'keyword', value: 'gist' }],
      products: [GIST],
      hostnamesByProductKey: HOSTNAMES,
      sections,
      assignments: [],
      unsectionedProductKeys: [],
    });

    expect(rows).toEqual([
      { product: GIST, status: 'will-take', blockedBySectionId: null },
    ]);
  });

  it('blocks when the draft section is brand new and not yet in sections', () => {
    // A not-yet-saved section has no known `order`, so we cannot honestly
    // claim it would win against a section that already auto-claims the
    // product. `blocked` is the honest answer here, not a guess.
    const rows = previewRuleMatches({
      draftSectionId: 'new-section',
      draftRules: [{ kind: 'keyword', value: 'gist' }],
      products: [GIST],
      hostnamesByProductKey: HOSTNAMES,
      sections: [SECTIONS[0]],
      assignments: [],
      unsectionedProductKeys: [],
    });

    expect(rows).toEqual([
      { product: GIST, status: 'blocked', blockedBySectionId: 'dev' },
    ]);
  });
});
