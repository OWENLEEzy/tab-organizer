import { describe, expect, it } from 'vitest';
import { parseSearchQuery, resolveSpaceQueryTarget } from '../dashboard/hooks/useAppLogic';

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

  describe('Space Command parsing (/space:SpaceName, space:SpaceName)', () => {
    it('parses space filter with slash and argument', () => {
      expect(parseSearchQuery('/space:work')).toEqual({ type: 'space', spaceToken: 'work', textQuery: '' });
      expect(parseSearchQuery('/space:social reddit')).toEqual({ type: 'space', spaceToken: 'social', textQuery: 'reddit' });
    });

    it('parses slash-less space filter with argument', () => {
      expect(parseSearchQuery('space:personal')).toEqual({ type: 'space', spaceToken: 'personal', textQuery: '' });
      expect(parseSearchQuery('space:work slack')).toEqual({ type: 'space', spaceToken: 'work', textQuery: 'slack' });
    });

    it('parses shorthand /s: and /spac: aliases', () => {
      expect(parseSearchQuery('/s:work')).toEqual({ type: 'space', spaceToken: 'work', textQuery: '' });
      expect(parseSearchQuery('/spac:work')).toEqual({ type: 'space', spaceToken: 'work', textQuery: '' });
      expect(parseSearchQuery('s:work slack')).toEqual({ type: 'space', spaceToken: 'work', textQuery: 'slack' });
      expect(parseSearchQuery('spac:personal')).toEqual({ type: 'space', spaceToken: 'personal', textQuery: '' });
      expect(parseSearchQuery('/s:')).toEqual({ type: 'space', spaceToken: '', textQuery: '' });
    });

    it('handles empty space arguments gracefully', () => {
      expect(parseSearchQuery('/space:')).toEqual({ type: 'space', spaceToken: '', textQuery: '' });
      expect(parseSearchQuery('space: ')).toEqual({ type: 'space', spaceToken: '', textQuery: '' });
    });

    it('resolves space ids before falling back to normalized names', () => {
      const spaces = [
        { id: 'space-work-2', name: 'Work', order: 2 },
        { id: 'space-work-1', name: 'Work', order: 1 },
        { id: 'space-social', name: 'Social', order: 0 },
      ];

      expect(resolveSpaceQueryTarget('space-work-2', spaces)?.id).toBe('space-work-2');
      expect(resolveSpaceQueryTarget('work', spaces)?.id).toBe('space-work-1');
      expect(resolveSpaceQueryTarget('WORK', spaces)?.id).toBe('space-work-1');
      expect(resolveSpaceQueryTarget('missing', spaces)).toBeNull();
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
