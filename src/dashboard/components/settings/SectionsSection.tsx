import React, { useState } from 'react';
import type { Section } from '../../../types';
import { useI18n } from '../../hooks/useI18n';

interface SectionsSectionProps {
  sections: Section[];
  onUpdateSection: (id: string, updates: Partial<Omit<Section, 'id'>>) => void;
  onDeleteSection: (id: string) => void;
  onCreateSection?: (name: string) => void;
}

interface RuleValidation {
  errors: string[];
  warnings: string[];
}

function validateAutoRules(text: string, allSections: Section[], currentSectionId: string): RuleValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = text.split('\n');
  const currentKeywords: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // 1. Regex syntax check
    try {
      new RegExp(line, 'i');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`L${i + 1}: ${msg}`);
    }

    const segments = line.split('|');

    // 2. Empty segments (double pipes)
    if (segments.some(s => s === '')) {
      warnings.push(`L${i + 1}: empty segment (||) matches everything`);
    }

    for (const seg of segments) {
      if (!seg) continue;

      // 3. Leading/trailing whitespace in keywords
      if (seg !== seg.trim()) {
        warnings.push(`L${i + 1}: "${seg}" has extra spaces`);
      }

      currentKeywords.push(seg.trim().toLowerCase());
    }
  }

  // 4. Duplicates within this section
  const seen = new Set<string>();
  for (const kw of currentKeywords) {
    if (seen.has(kw)) {
      warnings.push(`duplicate keyword: "${kw}"`);
    }
    seen.add(kw);
  }

  // 5. Cross-section duplicates
  const otherSections = allSections.filter(s => s.id !== currentSectionId);
  for (const other of otherSections) {
    for (const rule of other.autoRules ?? []) {
      const otherKeywords = rule.pattern.split('|').map(s => s.trim().toLowerCase()).filter(Boolean);
      for (const kw of currentKeywords) {
        if (otherKeywords.includes(kw)) {
          warnings.push(`"${kw}" also in "${other.name}"`);
        }
      }
    }
  }

  return { errors, warnings };
}

export function SectionsSection({ sections, onUpdateSection, onDeleteSection, onCreateSection }: SectionsSectionProps): React.ReactElement {
  const { t } = useI18n();
  const [newSectionName, setNewSectionName] = useState('');
  const [ruleIssues, setRuleIssues] = useState<Map<string, RuleValidation>>(new Map());
  const [nameError, setNameError] = useState('');

  const handleAddSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    const duplicate = sections.some(s => s.name.trim().toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setNameError(t('settingsDuplicateSectionName'));
      return;
    }
    setNameError('');
    onCreateSection?.(name);
    setNewSectionName('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-accent-blue/15 bg-accent-blue/[0.03] p-3 text-xs text-text-secondary leading-relaxed font-body mb-1 flex gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="text-accent-blue size-4 shrink-0 mt-0.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
        <div>
          <strong className="text-text-primary-light dark:text-text-primary-dark block mb-0.5">
            {t('settingsSectionsExplanationTitle')}
          </strong>
          <p>
            {t('settingsSectionsExplanationDesc')}
          </p>
        </div>
      </div>

      {/* Add Section Form */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t('settingsPlaceholderSectionName')}
          aria-label={t('settingsPlaceholderSectionName')}
          value={newSectionName}
          onChange={(e) => { setNewSectionName(e.target.value); setNameError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
          className="flex-1 settings-input placeholder:text-text-secondary focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={handleAddSection}
          className="font-body text-xs text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-primary/40 rounded-chip px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none cursor-pointer min-h-[var(--spacing-button-height)] font-medium"
        >
          {t('settingsBtnAddSection')}
        </button>
      </div>
      {nameError && (
        <p className="text-accent-red text-3xs font-body -mt-2" role="alert">{nameError}</p>
      )}

      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
        {sections.length === 0 ? (
          <span className="text-text-secondary text-xs font-body italic py-4 text-center">
            {t('settingsNoSectionsCreated')}
          </span>
        ) : (
          sections.map((section) => {
            const rulesText = (section.autoRules ?? []).map(r => r.pattern).join('\n');
            return (
              <div key={section.id} className="border border-border-color rounded-md p-3 bg-surface-light dark:bg-surface-dark flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative w-10 shrink-0">
                    <label htmlFor={`section-emoji-${section.id}`} className="sr-only">
                      {t('settingsLabelEmoji')}
                    </label>
                    <input
                      id={`section-emoji-${section.id}`}
                      type="text"
                      maxLength={2}
                      value={section.emoji ?? ''}
                      onChange={(e) => onUpdateSection(section.id, { emoji: e.target.value })}
                      className="w-full h-full text-center settings-input focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
                      aria-label={t('settingsLabelEmoji')}
                    />
                    {!section.emoji && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none text-text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    aria-label={t('settingsPlaceholderSectionName')}
                    value={section.name}
                    onChange={(e) => onUpdateSection(section.id, { name: e.target.value })}
                    className="flex-1 settings-input focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => onDeleteSection(section.id)}
                    aria-label={t('settingsBtnDeleteSection')}
                    className="text-accent-red hover:bg-accent-red/10 rounded p-1 flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 12m-4.72 0-.34-12M4.75 6.75h14.5M3.375 5.25h17.25m-1.5 0-.825 15.6a2.25 2.25 0 0 1-2.247 2.13H7.43a2.25 2.25 0 0 1-2.247-2.13L4.35 5.25" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-body text-text-secondary text-3xs">
                    {t('settingsLabelAutoRules')}
                  </span>
                  <textarea
                    id={`settings-auto-rules-${section.id}`}
                    value={rulesText}
                    placeholder="e.g. github&#10;vercel"
                    onChange={(e) => {
                      const text = e.target.value;
                      const result = validateAutoRules(text, sections, section.id);
                      setRuleIssues(prev => {
                        const next = new Map(prev);
                        if (result.errors.length > 0 || result.warnings.length > 0) {
                          next.set(section.id, result);
                        } else {
                          next.delete(section.id);
                        }
                        return next;
                      });
                      const patterns = text.split('\n').filter(Boolean);
                      onUpdateSection(section.id, {
                        autoRules: patterns.map(p => ({ pattern: p, type: 'hostname' }))
                      });
                    }}
                    className="settings-input placeholder:text-text-secondary w-full h-16 resize-none focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
                    aria-label={t('settingsLabelAutoRules')}
                  />
                  {(ruleIssues.get(section.id)?.errors.length ?? 0) > 0 && (
                    <ul className="text-accent-red text-3xs font-body mt-0.5 space-y-0.5" role="alert">
                      {ruleIssues.get(section.id)!.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                  {(ruleIssues.get(section.id)?.warnings.length ?? 0) > 0 && (
                    <ul className="text-accent-amber text-3xs font-body mt-0.5 space-y-0.5">
                      {ruleIssues.get(section.id)!.warnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
