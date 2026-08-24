import React, { useMemo } from 'react';
import type { Section, TabGroup } from '../../../types';
import { templateAutoRules, type SectionTemplate } from '../../../config/sections';
import { previewRuleMatches, type RulePreviewRow } from '../../../lib/rule-preview';
import { KeywordEditor } from '../settings/KeywordEditor';
import { RuleMatchPreview } from '../settings/RuleMatchPreview';
import { useI18n } from '../../hooks/useI18n';
import type { TemplateRowState } from './OnboardingCard';

const NO_ASSIGNMENTS: readonly [] = [];
const NO_UNSECTIONED: readonly [] = [];
const NO_KEYWORDS: readonly string[] = [];

interface OnboardingTemplateRowProps {
  template: SectionTemplate;
  row: TemplateRowState | undefined;
  draftSections: readonly Section[];
  products: readonly TabGroup[];
  hostnamesByProductKey: ReadonlyMap<string, readonly string[]>;
  isExpanded: boolean;
  onToggleChecked: (templateId: string) => void;
  onKeywordsChange: (templateId: string, keywords: string[]) => void;
  onToggleExpanded: (templateId: string) => void;
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

function OnboardingTemplateRowImpl({
  template,
  row,
  draftSections,
  products,
  hostnamesByProductKey,
  isExpanded,
  onToggleChecked,
  onKeywordsChange,
  onToggleExpanded,
}: OnboardingTemplateRowProps): React.ReactElement {
  const { t } = useI18n();
  const keywords = row?.keywords ?? NO_KEYWORDS;
  const checkboxId = `onboarding-check-${template.id}`;

  const matches = useMemo(
    () => honestMatches(template, keywords, draftSections, products, hostnamesByProductKey),
    [template, keywords, draftSections, products, hostnamesByProductKey],
  );

  return (
    <li className="border-border-color rounded-md border px-3 py-2">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id={checkboxId}
          checked={row?.checked ?? false}
          onChange={() => onToggleChecked(template.id)}
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
          onClick={() => onToggleExpanded(template.id)}
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
            onChange={(next) => onKeywordsChange(template.id, next)}
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
}

export const OnboardingTemplateRow = React.memo(OnboardingTemplateRowImpl);
