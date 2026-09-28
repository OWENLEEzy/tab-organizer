/**
 * Regex auto-rules are the advanced escape hatch next to keywords. This module
 * is the single place that decides whether user text is a usable pattern, so
 * the editor, storage normalization, and backup import agree on it.
 */

/** Hostnames are short; a longer pattern is almost certainly a mistake. */
export const MAX_PATTERN_LENGTH = 200;

function isCompilablePattern(pattern: string): boolean {
  try {
    new RegExp(pattern, 'i');
    return true;
  } catch {
    return false;
  }
}

interface GroupScan {
  hasRepeat: boolean;
  hasAlternation: boolean;
  bodyStart: number;
}

/**
 * The common subdomain idiom `([a-z0-9-]+\.)*`: one repeated atom that can
 * never match a dot, then a mandatory literal dot. Each iteration must end on
 * a dot the atom cannot consume, so there is only one way to split the input
 * and the outer repeat cannot backtrack exponentially.
 */
const DOT_DELIMITED_LABEL = /^(?:\[[^\]\\.^]*\]|\[\^\.\]|\\w|\\d)(?:[+*]|\{\d+(?:,\d*)?\})\\\.$/;

/** Length of a `(?:`, `(?=`, `(?<name>` … group prefix after `(`, or 0. */
function groupPrefixLength(pattern: string, open: number): number {
  if (pattern[open + 1] !== '?') return 0;
  const kind = pattern[open + 2];
  if (kind === ':' || kind === '=' || kind === '!') return 2;
  if (kind === '<') {
    if (pattern[open + 3] === '=' || pattern[open + 3] === '!') return 3;
    const close = pattern.indexOf('>', open);
    return close === -1 ? 0 : close - open;
  }
  return 0;
}

/**
 * Reject the classic catastrophic-backtracking shape: a repeated group whose
 * body itself repeats or branches, e.g. `(a+)+`, `(a|aa)*`, `(\w+\s?){2,}`.
 * User regexes run synchronously on every tab event, so one such pattern would
 * freeze the dashboard on every load. Deliberately conservative.
 */
function hasNestedRepetition(pattern: string): boolean {
  const stack: GroupScan[] = [{ hasRepeat: false, hasAlternation: false, bodyStart: 0 }];
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    const current = stack[stack.length - 1];
    if (char === '\\') {
      i += 1;
    } else if (char === '[') {
      i += 1;
      if (pattern[i] === '^') i += 1;
      if (pattern[i] === ']') i += 1;
      while (i < pattern.length && pattern[i] !== ']') {
        if (pattern[i] === '\\') i += 1;
        i += 1;
      }
    } else if (char === '(') {
      i += groupPrefixLength(pattern, i);
      stack.push({ hasRepeat: false, hasAlternation: false, bodyStart: i + 1 });
    } else if (char === ')' && stack.length > 1) {
      const group = stack.pop() as GroupScan;
      const next = pattern[i + 1];
      const isRepeated = next === '*' || next === '+' || next === '{';
      const isSafeLabel = DOT_DELIMITED_LABEL.test(pattern.slice(group.bodyStart, i));
      if (isRepeated && !isSafeLabel && (group.hasRepeat || group.hasAlternation)) return true;
      const parent = stack[stack.length - 1];
      parent.hasRepeat ||= group.hasRepeat;
      parent.hasAlternation ||= group.hasAlternation;
    } else if (char === '|') {
      current.hasAlternation = true;
    } else if (char === '*' || char === '+' || char === '{') {
      current.hasRepeat = true;
    }
  }
  return false;
}

/**
 * The single gate for a user regex: non-blank (a blank pattern matches every
 * hostname), bounded in length, compilable, and free of nested repetition.
 */
export function isUsablePattern(pattern: string): boolean {
  return (
    pattern.trim() !== '' &&
    pattern.length <= MAX_PATTERN_LENGTH &&
    isCompilablePattern(pattern) &&
    !hasNestedRepetition(pattern)
  );
}

/**
 * Parse the one-pattern-per-line editor text, or return null if any line is
 * not a usable pattern. Blank lines are dropped rather than saved: an empty pattern
 * compiles and would match every hostname.
 */
export function parseRegexLines(text: string): string[] | null {
  const patterns: string[] = [];
  for (const line of text.split('\n')) {
    const pattern = line.trim();
    if (!pattern || patterns.includes(pattern)) continue;
    if (!isUsablePattern(pattern)) return null;
    patterns.push(pattern);
  }
  return patterns;
}
