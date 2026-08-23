/**
 * Keyword normalization boundary for section auto-rules.
 *
 * Keywords are normalized exactly once, on write. Every read path then compares
 * lowercase-to-lowercase without re-processing case. See the design spec §3.5.
 */

export type KeywordRejection = 'empty' | 'whitespace' | 'duplicate';

export type KeywordNormalizeResult =
  | { ok: true; value: string }
  | { ok: false; reason: KeywordRejection };

const PROTOCOL_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//;
const PATH_SEPARATORS = /[/?#]/;
const HOST_PREFIX = /^(?:www\.|m\.)/;

/**
 * Normalize one user-supplied keyword.
 *
 * @param raw       Whatever the user typed or pasted.
 * @param existing  Already-normalized keywords in the same section, for duplicate rejection.
 */
export function normalizeKeyword(
  raw: string,
  existing: readonly string[] = [],
): KeywordNormalizeResult {
  const lowered = raw.trim().toLowerCase();
  if (lowered === '') return { ok: false, reason: 'empty' };

  const withoutProtocol = lowered.replace(PROTOCOL_PREFIX, '');
  const hostPart = withoutProtocol.split(PATH_SEPARATORS)[0];

  if (/\s/.test(hostPart)) return { ok: false, reason: 'whitespace' };

  const value = hostPart.replace(HOST_PREFIX, '');
  if (value === '') return { ok: false, reason: 'empty' };
  if (existing.includes(value)) return { ok: false, reason: 'duplicate' };

  return { ok: true, value };
}
