import React, { useMemo, useRef, useState } from 'react';
import type { Section, SectionAssignment, SectionAutoRule, TabGroup } from '../../../types';
import { previewRuleMatches } from '../../../lib/rule-preview';
import { getProductKey } from '../../../lib/product-key';
import { useI18n } from '../../hooks/useI18n';
import { KeywordEditor } from './KeywordEditor';
import { RuleMatchPreview } from './RuleMatchPreview';
import { RegexRulesEditor } from './RegexRulesEditor';

interface SectionRulesWorkbenchProps {
  sections: readonly Section[];
  products: readonly TabGroup[];
  hostnamesByProductKey: ReadonlyMap<string, readonly string[]>;
  assignments: readonly SectionAssignment[];
  unsectionedProductKeys: readonly string[];
  productCountBySectionId: ReadonlyMap<string, number>;
  onUpdateSection: (id: string, updates: Partial<Omit<Section, 'id'>>) => void;
  onCreateSection: (name: string) => void;
  onDeleteSection: (id: string) => void;
  onAssignProducts: (productKeys: readonly string[], sectionId: string) => void;
}

function keywordsOf(rules: readonly SectionAutoRule[] | undefined): string[] {
  return (rules ?? []).filter((r) => r.kind === 'keyword').map((r) => r.value);
}

function regexPatternsOf(rules: readonly SectionAutoRule[] | undefined): string[] {
  return (rules ?? []).filter((r) => r.kind === 'regex').map((r) => r.pattern);
}

function isDuplicateSectionName(sections: readonly Section[], name: string, exceptId?: string): boolean {
  const normalized = name.trim().toLowerCase();
  return sections.some((s) => s.id !== exceptId && s.name.trim().toLowerCase() === normalized);
}

/** An emoji can span several code points (👩‍💻); keep only the newest grapheme typed. */
function lastGrapheme(value: string): string {
  const graphemes = [...new Intl.Segmenter().segment(value)];
  return graphemes.at(-1)?.segment ?? '';
}

export function SectionRulesWorkbench({
  sections,
  products,
  hostnamesByProductKey,
  assignments,
  unsectionedProductKeys,
  productCountBySectionId,
  onUpdateSection,
  onCreateSection,
  onDeleteSection,
  onAssignProducts,
}: SectionRulesWorkbenchProps): React.ReactElement {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(sections[0]?.id ?? null);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [showRegex, setShowRegex] = useState(false);
  // Name of a section just created via `handleCreate`, so it can be selected
  // once `onCreateSection` round-trips and it actually appears in `sections`.
  // `onCreateSection` is fire-and-forget and does not hand back the new id.
  const [pendingSelectName, setPendingSelectName] = useState<string | null>(null);
  // Tracks the `sections` identity we last reacted to, so the adjustment
  // below runs only once per actual prop change — the React-recommended
  // "adjust state during render" pattern instead of a setState-in-effect.
  const [sectionsSeenForSelect, setSectionsSeenForSelect] = useState(sections);
  const newSectionInputRef = useRef<HTMLInputElement>(null);

  if (sections !== sectionsSeenForSelect) {
    setSectionsSeenForSelect(sections);
    if (pendingSelectName) {
      const created = sections.find((s) => s.name === pendingSelectName);
      if (created) setSelectedId(created.id);
      setPendingSelectName(null);
    }
  }

  const selected = sections.find((s) => s.id === selectedId) ?? sections[0] ?? null;

  const sectionNameById = useMemo(
    () => new Map(sections.map((s) => [s.id, s.name])),
    [sections],
  );

  const rows = useMemo(() => {
    if (!selected) return [];
    return previewRuleMatches({
      draftSectionId: selected.id,
      draftRules: selected.autoRules ?? [],
      products,
      hostnamesByProductKey,
      sections,
      assignments,
      unsectionedProductKeys,
    });
  }, [selected, products, hostnamesByProductKey, sections, assignments, unsectionedProductKeys]);

  // Only rows another section's rules currently claim are a bulk-fix target.
  // Pinned rows are a deliberate user veto (unsectioned) and must never be
  // silently reassigned by this button.
  const blockedKeys = useMemo(
    () => rows.filter((r) => r.status === 'blocked').map((r) => getProductKey(r.product)),
    [rows],
  );

  function writeRules(keywords: readonly string[], patterns: readonly string[]): void {
    if (!selected) return;
    const autoRules: SectionAutoRule[] = [
      ...keywords.map((value): SectionAutoRule => ({ kind: 'keyword', value })),
      ...patterns.map((pattern): SectionAutoRule => ({ kind: 'regex', pattern })),
    ];
    onUpdateSection(selected.id, { autoRules });
  }

  function handleCreate(): void {
    const name = newName.trim();
    if (!name) return;
    if (isDuplicateSectionName(sections, name)) {
      setNameError(t('settingsDuplicateSectionName'));
      return;
    }
    setNameError('');
    onCreateSection(name);
    setPendingSelectName(name);
    setNewName('');
  }

  function handleDelete(id: string): void {
    onDeleteSection(id);
    // The delete button stays mounted for the next section; leaving focus on
    // it would let a repeated Enter delete that one too.
    newSectionInputRef.current?.focus();
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left: section list */}
      <div className="border-border-color/40 flex w-40 shrink-0 flex-col gap-1 overflow-y-auto border-r pr-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setSelectedId(section.id)}
            aria-pressed={section.id === selected?.id}
            className={`rounded-chip font-body flex w-full cursor-pointer items-center justify-between px-2 py-1.5 text-left text-xs transition-colors ${
              section.id === selected?.id
                ? 'bg-accent-blue/10 text-accent-blue font-semibold'
                : 'text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
            }`}
          >
            <span className="truncate">{section.emoji} {section.name}</span>
            <SectionGroupCount count={productCountBySectionId.get(section.id) ?? 0} />
          </button>
        ))}

        <input
          ref={newSectionInputRef}
          type="text"
          value={newName}
          placeholder={t('workbenchNewSection')}
          aria-label={t('workbenchNewSection')}
          onChange={(e) => { setNewName(e.target.value); setNameError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
          className="settings-input placeholder:text-text-secondary mt-2 w-full focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
        />
        {nameError && (
          <p className="text-accent-red text-3xs font-body" role="alert">
            {nameError}
          </p>
        )}
      </div>

      {/* Right: editor */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {!selected && (
          <p className="font-body text-text-secondary text-xs italic">
            {sections.length === 0 ? t('workbenchNoSections') : t('workbenchPickSection')}
          </p>
        )}

        {selected && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={selected.emoji ?? ''}
                aria-label={t('settingsLabelEmoji')}
                onChange={(e) => onUpdateSection(selected.id, { emoji: lastGrapheme(e.target.value) })}
                className="settings-input w-10 text-center focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
              />
              <SectionNameInput
                key={selected.id}
                name={selected.name}
                isDuplicate={(name) => isDuplicateSectionName(sections, name, selected.id)}
                onRename={(name) => onUpdateSection(selected.id, { name })}
              />
              <button
                type="button"
                onClick={() => handleDelete(selected.id)}
                aria-label={t('settingsBtnDeleteSection')}
                className="text-accent-red hover:bg-accent-red/10 cursor-pointer rounded p-1"
              >
                ×
              </button>
            </div>

            <KeywordEditor
              key={selected.id}
              inputId={`section-keywords-${selected.id}`}
              keywords={keywordsOf(selected.autoRules)}
              onChange={(next) => writeRules(next, regexPatternsOf(selected.autoRules))}
            />

            <RuleMatchPreview
              rows={rows}
              sectionNameById={sectionNameById}
              onMoveBlockedHere={
                blockedKeys.length > 0
                  ? () => onAssignProducts(blockedKeys, selected.id)
                  : undefined
              }
            />

            <details open={showRegex} onToggle={(e) => setShowRegex(e.currentTarget.open)}>
              <summary className="font-body text-text-secondary cursor-pointer text-xs">
                {t('workbenchAdvancedRegex')}
              </summary>
              <RegexRulesEditor
                key={selected.id}
                patterns={regexPatternsOf(selected.autoRules)}
                onChange={(next) => writeRules(keywordsOf(selected.autoRules), next)}
              />
            </details>
          </>
        )}
      </div>
    </div>
  );
}

function SectionGroupCount({ count }: { count: number }): React.ReactElement {
  const { t } = useI18n();
  return (
    <span className="text-text-secondary shrink-0 pl-1">
      <span aria-hidden="true">{t('workbenchGroupCount', { count })}</span>
      <span className="sr-only">
        {count === 1 ? t('workbenchGroupCountSingle') : t('workbenchGroupCountPlural', { count })}
      </span>
    </span>
  );
}

interface SectionNameInputProps {
  name: string;
  isDuplicate: (name: string) => boolean;
  onRename: (name: string) => void;
}

/** Edits a draft and saves once on blur/Enter, so a half-typed or clashing name is never persisted. */
function SectionNameInput({ name, isDuplicate, onRename }: SectionNameInputProps): React.ReactElement {
  const { t } = useI18n();
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState('');
  const [savedName, setSavedName] = useState(name);

  // A rename saved elsewhere (e.g. a backup import) replaces the draft.
  if (name !== savedName) {
    setSavedName(name);
    setDraft(name);
  }

  function commit(): void {
    const trimmed = draft.trim();
    if (trimmed && isDuplicate(trimmed)) {
      setError(t('settingsDuplicateSectionName'));
    }
    if (!trimmed || isDuplicate(trimmed)) {
      setDraft(name);
      return;
    }
    setError('');
    setDraft(trimmed);
    if (trimmed !== name) onRename(trimmed);
  }

  return (
    <div className="flex flex-1 flex-col gap-1">
      <input
        type="text"
        value={draft}
        aria-label={t('workbenchSectionName')}
        onChange={(e) => { setDraft(e.target.value); setError(''); }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
        className="settings-input w-full focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
      />
      {error && (
        <p className="text-accent-red text-3xs font-body" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
