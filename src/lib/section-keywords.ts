/**
 * Keyword normalization boundary for section auto-rules.
 *
 * Keywords are normalized exactly once, on write. Every read path then compares
 * lowercase-to-lowercase without re-processing case. See the design spec §3.5.
 *
 * Dots are kept literal: matching splits both sides on `.` and compares hostname
 * labels, so a dot is a label separator here, never regex syntax. See
 * `ruleMatchesHostnames` in `section-membership.ts`.
 */

export type KeywordRejection = 'empty' | 'whitespace' | 'invalid' | 'duplicate';

export type KeywordNormalizeResult =
  | { ok: true; value: string }
  | { ok: false; reason: KeywordRejection };

const PROTOCOL_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//;
const PATH_SEPARATORS = /[/?#]/;
const HOST_PREFIX = /^(?:www\.|m\.)/;
/** Pasted-host noise that hostname labels never carry: `:3000`, `*.`, a trailing dot. */
const PORT_SUFFIX = /:\d*$/;
const WILDCARD_PREFIX = /^\*\./;
const TRAILING_DOT = /\.$/;
/** Anything but letters, digits, hyphens, and dots can never match a hostname label. */
const NON_HOSTNAME_CHAR = /[^\p{L}\p{N}.-]/u;

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

  const withoutPrefix = hostPart.replace(HOST_PREFIX, '');
  if (withoutPrefix === '') return { ok: false, reason: 'empty' };

  const value = withoutPrefix.replace(PORT_SUFFIX, '').replace(WILDCARD_PREFIX, '').replace(TRAILING_DOT, '');
  const hasEmptyLabel = value.split('.').some((label) => label === '');
  if (hasEmptyLabel || NON_HOSTNAME_CHAR.test(value)) return { ok: false, reason: 'invalid' };
  if (existing.includes(value)) return { ok: false, reason: 'duplicate' };

  return { ok: true, value };
}
