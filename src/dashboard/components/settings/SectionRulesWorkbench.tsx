import React, { useMemo, useState } from 'react';
import type { Section, SectionAssignment, SectionAutoRule, TabGroup } from '../../../types';
import { previewRuleMatches } from '../../../lib/rule-preview';
import { getProductKey } from '../../../lib/product-key';
import { useI18n } from '../../hooks/useI18n';
import { KeywordEditor } from './KeywordEditor';
import { RuleMatchPreview } from './RuleMatchPreview';

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
  const [regexError, setRegexError] = useState(false);
  // Name of a section just created via `handleCreate`, so it can be selected
  // once `onCreateSection` round-trips and it actually appears in `sections`.
  // `onCreateSection` is fire-and-forget and does not hand back the new id.
  const [pendingSelectName, setPendingSelectName] = useState<string | null>(null);
  // Tracks the `sections` identity we last reacted to, so the adjustment
  // below runs only once per actual prop change — the React-recommended
  // "adjust state during render" pattern instead of a setState-in-effect.
  const [sectionsSeenForSelect, setSectionsSeenForSelect] = useState(sections);

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
    const duplicate = sections.some((s) => s.name.trim().toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setNameError(t('settingsDuplicateSectionName'));
      return;
    }
    setNameError('');
    onCreateSection(name);
    setPendingSelectName(name);
    setNewName('');
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
            className={`rounded-chip font-body flex w-full cursor-pointer items-center justify-between px-2 py-1.5 text-left text-xs transition-colors ${
              section.id === selected?.id
                ? 'bg-accent-blue/10 text-accent-blue font-semibold'
                : 'text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
            }`}
          >
            <span className="truncate">{section.emoji} {section.name}</span>
            <span className="text-text-secondary shrink-0 pl-1">
              {t('workbenchGroupCount', { count: productCountBySectionId.get(section.id) ?? 0 })}
            </span>
          </button>
        ))}

        <input
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
                maxLength={2}
                value={selected.emoji ?? ''}
                aria-label={t('settingsLabelEmoji')}
                onChange={(e) => onUpdateSection(selected.id, { emoji: e.target.value })}
                className="settings-input w-10 text-center focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
              />
              <input
                type="text"
                value={selected.name}
                aria-label={t('settingsPlaceholderSectionName')}
                onChange={(e) => onUpdateSection(selected.id, { name: e.target.value })}
                className="settings-input flex-1 focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => onDeleteSection(selected.id)}
                aria-label={t('settingsBtnDeleteSection')}
                className="text-accent-red hover:bg-accent-red/10 cursor-pointer rounded p-1"
              >
                ×
              </button>
            </div>

            <KeywordEditor
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
              <textarea
                value={regexPatternsOf(selected.autoRules).join('\n')}
                placeholder={t('workbenchRegexPlaceholder')}
                aria-label={t('workbenchAdvancedRegex')}
                onChange={(e) => {
                  const patterns = e.target.value.split('\n').filter(Boolean);
                  const invalid = patterns.some((p) => {
                    try { new RegExp(p, 'i'); return false; } catch { return true; }
                  });
                  setRegexError(invalid);
                  if (!invalid) writeRules(keywordsOf(selected.autoRules), patterns);
                }}
                className="settings-input mt-2 h-16 w-full resize-none focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
              />
              {regexError && (
                <p className="text-accent-red text-3xs font-body" role="alert">
                  {t('workbenchRegexInvalid')}
                </p>
              )}
            </details>
          </>
        )}
      </div>
    </div>
  );
}
