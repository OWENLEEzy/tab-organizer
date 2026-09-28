import React, { useState } from 'react';
import { parseRegexLines } from '../../../lib/section-regex';
import { useI18n } from '../../hooks/useI18n';

interface RegexRulesEditorProps {
  patterns: readonly string[];
  onChange: (next: string[]) => void;
}

function isSamePatterns(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((pattern, i) => pattern === b[i]);
}

/**
 * One regex per line. While the user edits, the text is a local draft: a
 * half-typed `(` stays on screen, and nothing is saved until blur — a valid
 * prefix such as `.` would otherwise be saved and auto-assign every open
 * product. Outside editing the box shows the saved patterns, so changes made
 * elsewhere (a backup import) are never overwritten by a stale draft. Render it
 * with a `key` per section so switching sections starts fresh.
 */
export function RegexRulesEditor({ patterns, onChange }: RegexRulesEditorProps): React.ReactElement {
  const { t } = useI18n();
  const [draft, setDraft] = useState<string | null>(null);
  const hasError = draft !== null && parseRegexLines(draft) === null;

  function handleBlur(): void {
    if (draft === null) return;
    const next = parseRegexLines(draft);
    // Keep an invalid draft on screen with its error rather than dropping it.
    if (next === null) return;
    if (!isSamePatterns(next, patterns)) onChange(next);
    setDraft(null);
  }

  return (
    <>
      <textarea
        value={draft ?? patterns.join('\n')}
        placeholder={t('workbenchRegexPlaceholder')}
        aria-label={t('workbenchAdvancedRegex')}
        onFocus={() => setDraft((current) => current ?? patterns.join('\n'))}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        className="settings-input mt-2 h-16 w-full resize-none focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
      />
      {hasError && (
        <p className="text-accent-red text-3xs font-body" role="alert">
          {t('workbenchRegexInvalid')}
        </p>
      )}
    </>
  );
}
