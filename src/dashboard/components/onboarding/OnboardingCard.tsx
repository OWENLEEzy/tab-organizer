import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { Section, SectionAssignment, TabGroup } from '../../../types';
import { templateAutoRules, type SectionTemplate } from '../../../config/sections';
import { previewRuleMatches, type RulePreviewRow } from '../../../lib/rule-preview';
import { autoAssignProducts } from '../../../lib/section-organizer';
import { KeywordEditor } from '../settings/KeywordEditor';
import { RuleMatchPreview } from '../settings/RuleMatchPreview';
import { ActionButton } from '../ui/ActionButton';
import { useI18n } from '../../hooks/useI18n';

interface OnboardingCardProps {
  templates: readonly SectionTemplate[];
  products: readonly TabGroup[];
  hostnamesByProductKey: ReadonlyMap<string, readonly string[]>;
  onConfirm: (sections: Section[], assignments: SectionAssignment[]) => void;
  onSkip: () => void;
}

interface TemplateRowState {
  checked: boolean;
  keywords: string[];
}

const NO_SECTIONS: Section[] = [];
const NO_ASSIGNMENTS: SectionAssignment[] = [];
const NO_UNSECTIONED: string[] = [];

/** Which open groups this template's current keywords would collect, standalone. */
function willTakeMatches(
  template: SectionTemplate,
  keywords: readonly string[],
  products: readonly TabGroup[],
  hostnamesByProductKey: ReadonlyMap<string, readonly string[]>,
): RulePreviewRow[] {
  return previewRuleMatches({
    draftSectionId: template.id,
    draftRules: templateAutoRules(template, keywords),
    products,
    hostnamesByProductKey,
    sections: NO_SECTIONS,
    assignments: NO_ASSIGNMENTS,
    unsectionedProductKeys: NO_UNSECTIONED,
  }).filter((row) => row.status === 'will-take');
}

function initRows(
  templates: readonly SectionTemplate[],
  products: readonly TabGroup[],
  hostnamesByProductKey: ReadonlyMap<string, readonly string[]>,
): Map<string, TemplateRowState> {
  const rows = new Map<string, TemplateRowState>();
  for (const template of templates) {
    const keywords = [...template.keywords];
    const matches = willTakeMatches(template, keywords, products, hostnamesByProductKey);
    rows.set(template.id, { checked: matches.length > 0, keywords });
  }
  return rows;
}

/** The draft sections implied by the currently-checked templates, in template order — the same shape `handleConfirm` will actually persist. */
function buildDraftSections(
  templates: readonly SectionTemplate[],
  rows: ReadonlyMap<string, TemplateRowState>,
): Section[] {
  return templates
    .filter((template) => rows.get(template.id)?.checked)
    .map((template, index) => ({
      id: template.id,
      name: template.name,
      order: index,
      emoji: template.emoji,
      autoRules: templateAutoRules(template, rows.get(template.id)?.keywords ?? []),
    }));
}

/**
 * What this template would actually collect right now, arbitrated against
 * every other currently-checked template — so two templates whose keywords
 * both match the same group cannot both claim it in the preview, matching
 * `handleConfirm`'s real first-checked-wins order (design principle in
 * `rule-preview.ts`: the UI can never promise something the engine won't do).
 */
function honestMatches(
  template: SectionTemplate,
  keywords: readonly string[],
  draftSections: readonly Section[],
  products: readonly TabGroup[],
  hostnamesByProductKey: ReadonlyMap<string, readonly string[]>,
): RulePreviewRow[] {
  return previewRuleMatches({
    draftSectionId: template.id,
    draftRules: templateAutoRules(template, keywords),
    products,
    hostnamesByProductKey,
    sections: draftSections,
    assignments: NO_ASSIGNMENTS,
    unsectionedProductKeys: NO_UNSECTIONED,
  }).filter((row) => row.status === 'will-take');
}

/**
 * One-time card that hands section auto-rule ownership to the user (spec §3.1).
 * Templates are onboarding candidates only — nothing is written to storage
 * until the user confirms, at which point only the checked templates (with
 * whatever keywords the user left in place) become real sections.
 */
export function OnboardingCard({
  templates,
  products,
  hostnamesByProductKey,
  onConfirm,
  onSkip,
}: OnboardingCardProps): React.ReactElement {
  const { t } = useI18n();
  const [rows, setRows] = useState<Map<string, TemplateRowState>>(() =>
    initRows(templates, products, hostnamesByProductKey),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const onSkipEffect = useEffectEvent(onSkip);

  // Close on Escape key, matching ConfirmationDialog/PromptDialog.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onSkipEffect();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Trap focus inside the dialog, matching ConfirmationDialog/PromptDialog.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    function handleTabKey(e: KeyboardEvent): void {
      if (e.key !== 'Tab') return;
      if (!dialog) return;

      const focusables = dialog.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    dialog.addEventListener('keydown', handleTabKey);
    return () => {
      dialog.removeEventListener('keydown', handleTabKey);
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, []);

  function toggleChecked(templateId: string): void {
    setRows((prev) => {
      const row = prev.get(templateId);
      if (!row) return prev;
      const next = new Map(prev);
      next.set(templateId, { ...row, checked: !row.checked });
      return next;
    });
  }

  function setKeywords(templateId: string, keywords: string[]): void {
    setRows((prev) => {
      const row = prev.get(templateId);
      if (!row) return prev;
      const next = new Map(prev);
      next.set(templateId, { ...row, keywords });
      return next;
    });
  }

  function handleConfirm(): void {
    const sections = buildDraftSections(templates, rows);
    const assignments = autoAssignProducts({
      products,
      sections,
      assignments: NO_ASSIGNMENTS,
      unsectionedProductKeys: NO_UNSECTIONED,
      hostnamesByProductKey,
    });

    onConfirm(sections, assignments);
  }

  const chosenCount = templates.filter((template) => rows.get(template.id)?.checked).length;
  const draftSections = buildDraftSections(templates, rows);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-card-title"
        className="border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark relative flex w-full max-w-lg animate-[fadeUp_var(--motion-enter)_ease_both] flex-col rounded-card border p-6"
        style={{ maxHeight: '85vh' }}
      >
        <h2
          id="onboarding-card-title"
          className="font-heading text-text-primary-light dark:text-text-primary-dark text-lg font-semibold"
        >
          {t('onboardingTitle')}
        </h2>
        <p className="text-text-secondary font-body mt-1 text-sm">{t('onboardingSubtitle')}</p>

        <ul className="-mx-1 mt-4 flex flex-1 flex-col gap-2 overflow-y-auto px-1">
          {templates.map((template) => {
            const row = rows.get(template.id);
            const keywords = row?.keywords ?? [];
            const matches = honestMatches(template, keywords, draftSections, products, hostnamesByProductKey);
            const isExpanded = expandedId === template.id;
            const checkboxId = `onboarding-check-${template.id}`;

            return (
              <li
                key={template.id}
                className="border-border-color rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={checkboxId}
                    checked={row?.checked ?? false}
                    onChange={() => toggleChecked(template.id)}
                    className="accent-accent-blue size-4 shrink-0 cursor-pointer"
                  />
                  <label
                    htmlFor={checkboxId}
                    className="font-body text-text-primary-light dark:text-text-primary-dark flex-1 cursor-pointer text-sm"
                  >
                    {template.emoji} {template.name}
                  </label>
                  <span className="text-text-secondary font-body text-xs whitespace-nowrap">
                    {matches.length > 0
                      ? t('onboardingCollects', { count: matches.length })
                      : t('onboardingNoMatch')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    aria-label={t('onboardingExpand', { name: template.name })}
                    aria-expanded={isExpanded}
                    className="text-text-secondary hover:text-accent-blue focus-visible:ring-accent-primary/40 shrink-0 cursor-pointer rounded p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`size-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-border-color/40 pt-3">
                    <KeywordEditor
                      keywords={keywords}
                      onChange={(next) => setKeywords(template.id, next)}
                      inputId={`onboarding-keywords-${template.id}`}
                    />
                    <RuleMatchPreview
                      rows={matches}
                      sectionNameById={new Map([[template.id, template.name]])}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="border-border-color/40 mt-4 flex items-center justify-between gap-3 border-t pt-4">
          <span className="text-text-secondary font-body text-3xs italic">{t('onboardingOnce')}</span>
          <div className="flex items-center gap-2">
            <ActionButton variant="quiet" onClick={onSkip}>
              {t('onboardingSkip')}
            </ActionButton>
            <ActionButton variant="primary" onClick={handleConfirm}>
              {t('onboardingConfirm', { count: chosenCount })}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
