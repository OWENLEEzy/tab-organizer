import React, { useState } from 'react';
import { normalizeKeyword, type KeywordRejection } from '../../../lib/section-keywords';
import { useI18n, type TranslationKey } from '../../hooks/useI18n';

interface KeywordEditorProps {
  keywords: readonly string[];
  onChange: (next: string[]) => void;
  /** Unique id so the label binds correctly when several editors are on screen. */
  inputId: string;
}

const ERROR_KEY_BY_REASON: Record<KeywordRejection, TranslationKey> = {
  empty: 'keywordErrorEmpty',
  whitespace: 'keywordErrorWhitespace',
  duplicate: 'keywordErrorDuplicate',
};

export function KeywordEditor({ keywords, onChange, inputId }: KeywordEditorProps): React.ReactElement {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<KeywordRejection | null>(null);

  function commit(): void {
    const result = normalizeKeyword(draft, keywords);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setError(null);
    setDraft('');
    onChange([...keywords, result.value]);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="rounded-chip border border-border-color bg-surface-light dark:bg-surface-dark font-body text-text-primary-light dark:text-text-primary-dark inline-flex items-center gap-1.5 px-2 py-1 text-xs"
          >
            {keyword}
            <button
              type="button"
              onClick={() => onChange(keywords.filter((k) => k !== keyword))}
              aria-label={t('keywordEditorRemove', { word: keyword })}
              className="text-text-secondary hover:text-accent-red cursor-pointer leading-none transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <label htmlFor={inputId} className="sr-only">{t('keywordEditorLabel')}</label>
        <input
          id={inputId}
          type="text"
          value={draft}
          placeholder={t('keywordEditorPlaceholder')}
          onChange={(e) => { setDraft(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
          className="settings-input placeholder:text-text-secondary flex-1 focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={commit}
          className="rounded-chip font-body text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-primary/40 min-h-[var(--spacing-button-height)] cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('keywordEditorAdd')}
        </button>
      </div>

      {error && (
        <p className="text-accent-red text-3xs font-body" role="alert">
          {t(ERROR_KEY_BY_REASON[error])}
        </p>
      )}
    </div>
  );
}
