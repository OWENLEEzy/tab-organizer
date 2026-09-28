/**
 * Regex auto-rules are the advanced escape hatch next to keywords. This module
 * is the single place that decides whether user text is a usable pattern, so
 * the editor, storage normalization, and backup import agree on it.
 */

export function isCompilablePattern(pattern: string): boolean {
  try {
    new RegExp(pattern, 'i');
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse the one-pattern-per-line editor text, or return null if any line does
 * not compile. Blank lines are dropped rather than saved: an empty pattern
 * compiles and would match every hostname.
 */
export function parseRegexLines(text: string): string[] | null {
  const patterns: string[] = [];
  for (const line of text.split('\n')) {
    const pattern = line.trim();
    if (!pattern || patterns.includes(pattern)) continue;
    if (!isCompilablePattern(pattern)) return null;
    patterns.push(pattern);
  }
  return patterns;
}
