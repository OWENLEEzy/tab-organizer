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
  it('carries each template extra rules into the built section autoRules', () => {
    const sections = sectionsFromTemplates(SECTION_TEMPLATES);
    const social = sections.find((section) => section.id === 'section-social');
    expect(social?.autoRules).toContainEqual({ kind: 'regex', pattern: 'reddit\\.com/message' });
  });
});

describe('SECTION_TEMPLATES coverage', () => {
  /**
   * Regression guard: these patterns were silently dropped once already when
   * the preset regex strings were migrated to the keyword/extraRules shape.
   * Every one must still be reachable, as either a keyword or an extraRule,
   * on its original template — never delete a preset keyword to fix a match.
   */
  const mustStillCover: Record<string, string[]> = {
    'section-academic': ['阑'],
    'section-social': ['reddit\\.com/message'],
    'section-ai': ['aws[ _]bedrock', 'azure ai'],
    'section-devops': ['github\\.com/actions', 'gitlab\\.com/ci'],
    'section-productivity': ['microsoft[ _]onenote', 'apple[ _]notes'],
    'section-maps': ['google\\.com/maps', 'bing\\.com/maps'],
    'section-travel': ['american eagle'],
    'section-music': ['apple\\.com/music', 'youtube\\.com/music'],
  };

  for (const [templateId, expectedValues] of Object.entries(mustStillCover)) {
    it(`${templateId} still declares its original preset coverage`, () => {
      const template = SECTION_TEMPLATES.find((t) => t.id === templateId);
      expect(template).toBeDefined();

      const declared = new Set([
        ...(template?.keywords ?? []),
        ...(template?.extraRules ?? []).map((rule) => (rule.kind === 'regex' ? rule.pattern : rule.value)),
      ]);

      for (const value of expectedValues) {
        expect(declared.has(value)).toBe(true);
      }
    });
  }
});
