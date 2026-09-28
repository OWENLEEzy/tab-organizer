import React, { useState } from 'react';
import type { TabGroup } from '../../../types';
import type { ProductLabels } from '../../../lib/product-labels';
import { getProductKey } from '../../../lib/product-key';
import { useI18n, type TranslationKey } from '../../hooks/useI18n';
import { classifyProductGroup, type ProductGroupSource } from '../../lib/product-group-source';
import { getProductGroupIconUrl } from '../product-groups/product-group-icon';

interface ProductGroupRulesSectionProps {
  products: readonly TabGroup[];
  productLabels: ProductLabels;
  onRename: (productKey: string, label: string) => void;
  onRevert: (productKey: string) => void;
}

const SOURCE_LABEL_KEY: Record<ProductGroupSource, TranslationKey> = {
  'built-in': 'productRulesSourceBuiltIn',
  custom: 'productRulesSourceCustom',
  'domain-fallback': 'productRulesSourceFallback',
};

/**
 * Lists the product groups the user actually has open right now, in place of
 * two blank hostname/label inputs — see design spec §3.4. Renaming a row
 * sets a display-name override for its product key; reverting removes it.
 */
export function ProductGroupRulesSection({
  products,
  productLabels,
  onRename,
  onRevert,
}: ProductGroupRulesSectionProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3">
      <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
        {t('productRulesTitle')}
      </span>

      {products.length === 0 ? (
        <p className="font-body text-text-secondary text-xs italic">{t('productRulesEmpty')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {products.map((group) => (
            <ProductGroupRuleRow
              key={getProductKey(group)}
              group={group}
              source={classifyProductGroup(group, productLabels)}
              onRename={onRename}
              onRevert={onRevert}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface ProductGroupRuleRowProps {
  group: TabGroup;
  source: ProductGroupSource;
  onRename: (productKey: string, label: string) => void;
  onRevert: (productKey: string) => void;
}

function ProductGroupRuleRow({
  group,
  source,
  onRename,
  onRevert,
}: ProductGroupRuleRowProps): React.ReactElement {
  const { t } = useI18n();
  const displayName = group.friendlyName || group.domain;
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(displayName);
  const [iconFailed, setIconFailed] = useState(false);

  const iconUrl = getProductGroupIconUrl(group.tabs);
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';
  const isFallback = source === 'domain-fallback';
  const tabCountLabel = group.tabs.length === 1
    ? t('rulePreviewTabCountSingle')
    : t('rulePreviewTabCountPlural', { count: group.tabs.length });

  function handleStartEdit(): void {
    setDraftLabel(displayName);
    setIsEditing(true);
  }

  function handleSave(): void {
    const trimmed = draftLabel.trim();
    if (trimmed && trimmed !== displayName) {
      onRename(getProductKey(group), trimmed);
    }
    setIsEditing(false);
  }

  function handleCancel(): void {
    setDraftLabel(displayName);
    setIsEditing(false);
  }

  return (
    <li
      className={`flex items-center gap-3 rounded-chip px-3 py-2 ${
        isFallback
          ? 'bg-accent-terracotta/5'
          : 'bg-surface-light dark:bg-surface-dark'
      }`}
    >
      {iconFailed || !iconUrl ? (
        <span
          className="bg-bg-surface border-border-color/30 text-text-secondary flex size-5 shrink-0 items-center justify-center rounded-badge border text-xs font-semibold"
          aria-hidden="true"
        >
          {initial}
        </span>
      ) : (
        <img
          src={iconUrl}
          alt=""
          width={20}
          height={20}
          className="favicon size-5 shrink-0 rounded-badge"
          onError={() => setIconFailed(true)}
        />
      )}

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            type="text"
            value={draftLabel}
            autoFocus
            aria-label={t('productRulesRename')}
            data-handles-escape="true"
            onChange={(e) => setDraftLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            onBlur={handleSave}
            className="settings-input w-full focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
          />
        ) : (
          <span className="font-body text-text-primary-light dark:text-text-primary-dark block truncate text-xs font-medium">
            {displayName}
          </span>
        )}
        <span className="font-body text-text-secondary block truncate text-3xs">
          {group.domain}
        </span>
        {isFallback && (
          <span className="text-accent-terracotta font-body block text-3xs font-medium">
            {t('productRulesNameIt')}
          </span>
        )}
      </div>

      <span
        className="font-body text-text-secondary bg-border-color/20 shrink-0 rounded-badge px-1.5 text-3xs font-bold"
        title={tabCountLabel}
      >
        <span className="sr-only">{tabCountLabel}</span>
        <span aria-hidden="true">{group.tabs.length}</span>
      </span>

      <span className="font-body text-text-secondary border-border-color/30 shrink-0 rounded-badge border px-1.5 py-0.5 text-3xs font-medium">
        {t(SOURCE_LABEL_KEY[source])}
      </span>

      {!isEditing && (
        <button
          type="button"
          onClick={handleStartEdit}
          className="font-body text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-primary/40 shrink-0 cursor-pointer rounded-chip px-2 py-1 text-3xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('productRulesRename')}
        </button>
      )}

      {source === 'custom' && (
        <button
          type="button"
          onClick={() => onRevert(getProductKey(group))}
          className="font-body text-accent-red hover:bg-accent-red/10 focus-visible:ring-accent-red/40 shrink-0 cursor-pointer rounded-chip px-2 py-1 text-3xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('productRulesRevert')}
        </button>
      )}
    </li>
  );
}
