import { describe, it, expect } from 'vitest';
import { SECTION_TEMPLATES, sectionsFromTemplates, templateAutoRules } from '../config/sections';

describe('templateAutoRules', () => {
  it('combines editable keywords with a template fixed extra rules', () => {
    const template = {
      id: 'section-x',
      name: 'X',
      emoji: '❓',
      keywords: ['foo'],
      extraRules: [{ kind: 'regex' as const, pattern: 'foo/bar' }],
    };

    expect(templateAutoRules(template, ['foo', 'baz'])).toEqual([
      { kind: 'keyword', value: 'foo' },
      { kind: 'keyword', value: 'baz' },
      { kind: 'regex', pattern: 'foo/bar' },
    ]);
  });

  it('defaults to the template own keywords when none are given', () => {
    const template = { id: 'section-x', name: 'X', emoji: '❓', keywords: ['foo'] };
    expect(templateAutoRules(template)).toEqual([{ kind: 'keyword', value: 'foo' }]);
  });
});

describe('sectionsFromTemplates', () => {
  it('carries a template fixed extra rules into the built section autoRules', () => {
    // None of the shipped SECTION_TEMPLATES carry extraRules today (every
    // preset use of it targeted a URL path or contained whitespace, which
    // can never match a bare hostname — see the coverage guard below). The
    // field and this wiring stay: a future preset could still validly add a
    // hostname-safe regex, so `extraRules` must keep flowing through.
    const template = { id: 'section-x', name: 'X', emoji: '❓', keywords: ['foo'], extraRules: [{ kind: 'regex' as const, pattern: 'foo-bar' }] };
    const sections = sectionsFromTemplates([template]);
    expect(sections[0]?.autoRules).toContainEqual({ kind: 'regex', pattern: 'foo-bar' });
  });
});

describe('SECTION_TEMPLATES coverage', () => {
  /**
   * Regression guard: matching only ever sees a group's bare hostnames
   * (`hostnamesByProductKey`, built from `Tab.domain`). A keyword or
   * extraRule that targets a URL path or contains a space/non-hostname
   * character can never match a hostname, so it can never fire — deleting
   * dead rules like that is correct, not a regression. What must never
   * regress is a *live* preset keyword or extraRule silently disappearing.
   * See git history for the 13 structurally-dead entries (and the stray
   * '阑' typo) this guard used to lock in, and why they were removed instead
   * of fixed: routing by URL path would require splitting one hostname's
   * tabs across sections, which conflicts with this repo's "sections
   * contain groups, never individual URLs" contract.
   */
  const deadEntries: Record<string, string[]> = {
    'section-academic': ['阑'],
    'section-social': ['reddit\\.com/message'],
    'section-ai': ['aws[ _]bedrock', 'azure ai'],
    'section-devops': ['github\\.com/actions', 'gitlab\\.com/ci'],
    'section-productivity': ['microsoft[ _]onenote', 'apple[ _]notes'],
    'section-maps': ['google\\.com/maps', 'bing\\.com/maps'],
    'section-travel': ['american eagle'],
    'section-music': ['apple\\.com/music', 'youtube\\.com/music'],
  };

  for (const [templateId, removedValues] of Object.entries(deadEntries)) {
    it(`${templateId} no longer declares its structurally-dead preset entries`, () => {
      const template = SECTION_TEMPLATES.find((t) => t.id === templateId);
      expect(template).toBeDefined();

      const declared = new Set([
        ...(template?.keywords ?? []),
        ...(template?.extraRules ?? []).map((rule) => (rule.kind === 'regex' ? rule.pattern : rule.value)),
      ]);

      for (const value of removedValues) {
        expect(declared.has(value)).toBe(false);
      }
    });
  }

  it('no template keyword or extraRule can ever match a bare hostname', () => {
    // hostnamesByProductKey only ever holds hostnames: no path segment, no
    // whitespace, no characters outside what a registrable domain allows.
    const hostnameSafe = /^[a-z0-9.-]+$/;

    for (const template of SECTION_TEMPLATES) {
      for (const keyword of template.keywords) {
        expect(hostnameSafe.test(keyword)).toBe(true);
      }
      for (const rule of template.extraRules ?? []) {
        const value = rule.kind === 'regex' ? rule.pattern : rule.value;
        expect(value).not.toContain('/');
        expect(value).not.toMatch(/\s/);
      }
    }
  });
});
