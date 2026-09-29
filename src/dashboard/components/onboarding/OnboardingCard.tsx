import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Section, SectionAssignment, TabGroup } from '../../../types';
import { templateAutoRules, type SectionTemplate } from '../../../config/sections';
import { previewRuleMatches, type RulePreviewRow } from '../../../lib/rule-preview';
import { autoAssignProducts } from '../../../lib/section-organizer';
import { ActionButton } from '../ui/ActionButton';
import { useI18n } from '../../hooks/useI18n';
import { OnboardingTemplateRow } from './OnboardingTemplateRow';

interface OnboardingCardProps {
  templates: readonly SectionTemplate[];
  products: readonly TabGroup[];
  hostnamesByProductKey: ReadonlyMap<string, readonly string[]>;
  onConfirm: (sections: Section[], assignments: SectionAssignment[]) => void;
  onSkip: () => void;
}

export interface TemplateRowState {
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

  // Non-cancelable by design: unlike ConfirmationDialog/PromptDialog, Escape
  // does not skip. The only two exits are the explicit Confirm and Skip
  // buttons — a stray Escape press must not silently and irreversibly
  // discard the whole onboarding flow (nothing ever resets `onboardingDone`
  // back to false). Focus stays trapped inside the card below.

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

  const toggleChecked = useCallback((templateId: string) => {
    setRows((prev) => {
      const row = prev.get(templateId);
      if (!row) return prev;
      const next = new Map(prev);
      next.set(templateId, { ...row, checked: !row.checked });
      return next;
    });
  }, []);

  const setKeywords = useCallback((templateId: string, keywords: string[]) => {
    setRows((prev) => {
      const row = prev.get(templateId);
      if (!row) return prev;
      const next = new Map(prev);
      next.set(templateId, { ...row, keywords });
      return next;
    });
  }, []);

  const handleToggleExpanded = useCallback((templateId: string) => {
    setExpandedId((current) => (current === templateId ? null : templateId));
  }, []);

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
  const draftSections = useMemo(
    () => buildDraftSections(templates, rows),
    [templates, rows],
  );

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
          {templates.map((template) => (
            <OnboardingTemplateRow
              key={template.id}
              template={template}
              row={rows.get(template.id)}
              draftSections={draftSections}
              products={products}
              hostnamesByProductKey={hostnamesByProductKey}
              isExpanded={expandedId === template.id}
              onToggleChecked={toggleChecked}
              onKeywordsChange={setKeywords}
              onToggleExpanded={handleToggleExpanded}
            />
          ))}
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
