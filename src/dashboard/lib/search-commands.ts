import type { Section } from '../../types';

export interface CommandParsed {
  type: 'dupes' | 'stale' | 'section' | 'text';
  sectionToken?: string;
  textQuery: string;
}

type SectionTarget = Pick<Section, 'id' | 'name' | 'order'>;

export function parseSearchQuery(query: string): CommandParsed {
  const trimmed = query.trim().toLowerCase();

  const dupeMatch = trimmed.match(/^(\/?dupes?)(?:\s+(.*))?$/);
  if (dupeMatch) {
    const term = dupeMatch[1];
    if (term.startsWith('/') || term === 'dupe' || term === 'dupes') {
      return { type: 'dupes', textQuery: (dupeMatch[2] || '').trim() };
    }
  }

  const staleMatch = trimmed.match(/^(\/?stales?)(?:\s+(.*))?$/);
  if (staleMatch) {
    const term = staleMatch[1];
    if (term.startsWith('/') || term === 'stale' || term === 'stales') {
      return { type: 'stale', textQuery: (staleMatch[2] || '').trim() };
    }
  }

  const sectionMatch = trimmed.match(/^(\/?(?:section|sec|s|space):)([^\s]*)(?:\s+(.*))?$/);
  if (sectionMatch) {
    return {
      type: 'section',
      sectionToken: sectionMatch[2] || '',
      textQuery: (sectionMatch[3] || '').trim(),
    };
  }

  return { type: 'text', textQuery: trimmed };
}

export function resolveSectionQueryTarget(token: string, sections: SectionTarget[]): SectionTarget | null {
  const normalizedToken = token.trim().toLowerCase();
  if (!normalizedToken) return null;

  const idMatch = sections.find((section) => section.id.toLowerCase() === normalizedToken);
  if (idMatch) return idMatch;

  return [...sections]
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .find((section) => section.name.trim().toLowerCase().includes(normalizedToken)) ?? null;
}