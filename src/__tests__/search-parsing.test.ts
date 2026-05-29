import { describe, expect, it } from 'vitest';
import { parseSearchQuery, resolveSectionQueryTarget } from '../dashboard/lib/search-commands';

describe('parseSearchQuery', () => {
  describe('Duplicate Command parsing (/dupes, /dupe, dupes, dupe)', () => {
    it('parses standard /dupes command', () => {
      expect(parseSearchQuery('/dupes')).toEqual({ type: 'dupes', textQuery: '' });
      expect(parseSearchQuery('/dupes github')).toEqual({ type: 'dupes', textQuery: 'github' });
    });

    it('parses standard /dupe command (singular synonym)', () => {
      expect(parseSearchQuery('/dupe')).toEqual({ type: 'dupes', textQuery: '' });
      expect(parseSearchQuery('/dupe vercel')).toEqual({ type: 'dupes', textQuery: 'vercel' });
    });

    it('parses slash-less dupes/dupe commands', () => {
      expect(parseSearchQuery('dupes')).toEqual({ type: 'dupes', textQuery: '' });
      expect(parseSearchQuery('dupe google')).toEqual({ type: 'dupes', textQuery: 'google' });
    });

    it('parses mixed case commands', () => {
      expect(parseSearchQuery('/Dupes')).toEqual({ type: 'dupes', textQuery: '' });
      expect(parseSearchQuery('DuPe Figma')).toEqual({ type: 'dupes', textQuery: 'figma' });
    });
  });

  describe('Stale Command parsing (/stale, /stales, stale, stales)', () => {
    it('parses standard /stale command', () => {
      expect(parseSearchQuery('/stale')).toEqual({ type: 'stale', textQuery: '' });
      expect(parseSearchQuery('/stale react')).toEqual({ type: 'stale', textQuery: 'react' });
    });

    it('parses plural /stales synonym', () => {
      expect(parseSearchQuery('/stales')).toEqual({ type: 'stale', textQuery: '' });
      expect(parseSearchQuery('/stales tailwind')).toEqual({ type: 'stale', textQuery: 'tailwind' });
    });

    it('parses slash-less stale/stales commands', () => {
      expect(parseSearchQuery('stale')).toEqual({ type: 'stale', textQuery: '' });
      expect(parseSearchQuery('stales vite')).toEqual({ type: 'stale', textQuery: 'vite' });
    });
  });

  describe('Section Command parsing (/section:SectionName, section:SectionName)', () => {
    it('parses section filter with slash and argument', () => {
      expect(parseSearchQuery('/section:work')).toEqual({ type: 'section', sectionToken: 'work', textQuery: '' });
      expect(parseSearchQuery('/section:social reddit')).toEqual({ type: 'section', sectionToken: 'social', textQuery: 'reddit' });
    });

    it('parses slash-less section filter with argument', () => {
      expect(parseSearchQuery('section:personal')).toEqual({ type: 'section', sectionToken: 'personal', textQuery: '' });
      expect(parseSearchQuery('section:work slack')).toEqual({ type: 'section', sectionToken: 'work', textQuery: 'slack' });
    });

    it('parses shorthand /s: and /sec: aliases', () => {
      expect(parseSearchQuery('/s:work')).toEqual({ type: 'section', sectionToken: 'work', textQuery: '' });
      expect(parseSearchQuery('/sec:work')).toEqual({ type: 'section', sectionToken: 'work', textQuery: '' });
      expect(parseSearchQuery('s:work slack')).toEqual({ type: 'section', sectionToken: 'work', textQuery: 'slack' });
      expect(parseSearchQuery('sec:personal')).toEqual({ type: 'section', sectionToken: 'personal', textQuery: '' });
      expect(parseSearchQuery('/s:')).toEqual({ type: 'section', sectionToken: '', textQuery: '' });
    });

    it('handles empty section arguments gracefully', () => {
      expect(parseSearchQuery('/section:')).toEqual({ type: 'section', sectionToken: '', textQuery: '' });
      expect(parseSearchQuery('section: ')).toEqual({ type: 'section', sectionToken: '', textQuery: '' });
    });

    it('resolves section ids before falling back to normalized names', () => {
      const sections = [
        { id: 'section-work-2', name: 'Work', order: 2 },
        { id: 'section-work-1', name: 'Work', order: 1 },
        { id: 'section-social', name: 'Social', order: 0 },
      ];

      expect(resolveSectionQueryTarget('section-work-2', sections)?.id).toBe('section-work-2');
      expect(resolveSectionQueryTarget('work', sections)?.id).toBe('section-work-1');
      expect(resolveSectionQueryTarget('WORK', sections)?.id).toBe('section-work-1');
      expect(resolveSectionQueryTarget('missing', sections)).toBeNull();
    });
  });

  describe('Fallback to Text queries', () => {
    it('treats random queries as plain text searches', () => {
      expect(parseSearchQuery('hello')).toEqual({ type: 'text', textQuery: 'hello' });
      expect(parseSearchQuery('closures stale')).toEqual({ type: 'text', textQuery: 'closures stale' });
      expect(parseSearchQuery('/random-slash')).toEqual({ type: 'text', textQuery: '/random-slash' });
    });
  });
});
