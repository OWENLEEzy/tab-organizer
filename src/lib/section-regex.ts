/**
 * Regex auto-rules are the advanced escape hatch next to keywords. This module
 * is the single place that decides whether user text is a usable pattern, so
 * the editor, storage normalization, and backup import agree on it.
 */

/** Hostnames are short; a longer pattern is almost certainly a mistake. */
export const MAX_PATTERN_LENGTH = 200;

/**
 * Each variable quantifier (`*`, `+`, `?`, `{m,n}`) can multiply the ways a
 * hostname splits, even with no nested group: `a?` ×40 then `a` ×40 is
 * exponential. Capping the count keeps any pattern polynomial; real hostnames
 * are short, so a few quantifiers stay fast while `^[a-z]+-[a-z]+\.[a-z]+\.`
 * remains expressible.
 */
const MAX_VARIABLE_QUANTIFIERS = 3;

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

/** A `{m}` / `{m,}` / `{m,n}` quantifier starting at `open`, or null for a literal `{`. */
function readBraceQuantifier(pattern: string, open: number): { length: number; isVariable: boolean } | null {
  const match = /^\{(\d+)(,(\d*))?\}/.exec(pattern.slice(open));
  if (!match) return null;
  return { length: match[0].length, isVariable: Boolean(match[2]) && match[1] !== match[3] };
}

/**
 * Reject the catastrophic-backtracking shapes. User regexes run synchronously
 * on every tab event, so one such pattern would freeze the dashboard on every
 * load. Deliberately conservative:
 * - a repeated group whose body itself repeats or branches, e.g. `(a+)+`,
 *   `(a|aa)*`, `(\w+\s?){2,}`;
 * - more than `MAX_VARIABLE_QUANTIFIERS` variable quantifiers overall.
 */
function canBacktrackBadly(pattern: string): boolean {
  const stack: GroupScan[] = [{ hasRepeat: false, hasAlternation: false, bodyStart: 0 }];
  let variableQuantifiers = 0;
  let isAfterQuantifier = false;
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    const current = stack[stack.length - 1];
    const wasAfterQuantifier = isAfterQuantifier;
    isAfterQuantifier = false;
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
    } else if (char === '*' || char === '+') {
      current.hasRepeat = true;
      variableQuantifiers += 1;
      isAfterQuantifier = true;
    } else if (char === '{') {
      current.hasRepeat = true;
      const brace = readBraceQuantifier(pattern, i);
      if (brace) {
        if (brace.isVariable) variableQuantifiers += 1;
        i += brace.length - 1;
        isAfterQuantifier = true;
      }
    } else if (char === '?' && !wasAfterQuantifier) {
      // `?` right after another quantifier only makes that one lazy.
      variableQuantifiers += 1;
      isAfterQuantifier = true;
    }
  }
  return variableQuantifiers > MAX_VARIABLE_QUANTIFIERS;
}

/**
 * The single gate for a user regex: non-blank (a blank pattern matches every
 * hostname), bounded in length, compilable, and cannot backtrack badly.
 */
export function isUsablePattern(pattern: string): boolean {
  return (
    pattern.trim() !== '' &&
    pattern.length <= MAX_PATTERN_LENGTH &&
    isCompilablePattern(pattern) &&
    !canBacktrackBadly(pattern)
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
