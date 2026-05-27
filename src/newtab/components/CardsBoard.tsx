import React from 'react';
import type { ManualGroup, TabGroup } from '../../types';
import { DomainCard } from './DomainCard';
import { useI18n } from '../hooks/useI18n';

interface CardsBoardProps {
  unassignedProducts: TabGroup[];
  orderedGroups: ManualGroup[];
  productsByGroup: Map<string, TabGroup[]>;
  expandedDomains: Set<string>;
  maxChipsVisible: number;
  staleThresholdDays: number;
  focusedUrl?: string | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  selectedTabIds: Set<number>;
  onRenameGroup?: (group: ManualGroup) => void;
  onDeleteGroup?: (group: ManualGroup) => void;
  onCloseProduct: (p: TabGroup) => void;
  onCloseManualGroup: (groups: TabGroup[], title: string) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded: (domain: string) => void;
  searchQuery?: string;
}

interface CardGroupSectionProps {
  title: string;
  items: TabGroup[];
  manualGroup?: ManualGroup;
  expandedDomains: Set<string>;
  maxChipsVisible: number;
  staleThresholdDays: number;
  focusedUrl?: string | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  selectedTabIds: Set<number>;
  onRenameGroup?: (group: ManualGroup) => void;
  onDeleteGroup?: (group: ManualGroup) => void;
  onCloseProduct: (p: TabGroup) => void;
  onCloseManualGroup: (groups: TabGroup[], title: string) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded: (domain: string) => void;
  searchQuery?: string;
}

function CardGroupSection({
  title,
  items,
  manualGroup,
  expandedDomains,
  maxChipsVisible,
  staleThresholdDays,
  focusedUrl,
  closingUrls,
  selectedUrls,
  selectedTabIds,
  onRenameGroup,
  onDeleteGroup,
  onCloseProduct,
  onCloseManualGroup,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  onChipClick,
  onToggleExpanded,
  searchQuery = '',
}: CardGroupSectionProps): React.ReactElement | null {
  const { t } = useI18n();
  if (items.length === 0 && !manualGroup) return null;

  const tabCount = items.reduce((sum, product) => sum + product.tabs.length, 0);

  return (
    <section className="organizer-group">
      <div className="group-header mb-5 border-b border-border-light pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-body text-xs font-semibold tracking-wider text-text-primary uppercase">
              {title}
            </h2>
            <span className="rounded-sm bg-surface-light px-2 py-0.5 font-body text-[var(--text-2xs)] font-bold tracking-widest text-text-secondary uppercase">
              {tabCount}
            </span>
          </div>
          <div className="section-actions flex items-center gap-1">
            {manualGroup ? (
              <>
                <button
                  type="button"
                  onClick={() => onRenameGroup?.(manualGroup)}
                  className="text-[var(--text-2xs)] font-semibold tracking-wider text-text-secondary transition-colors hover:text-accent-blue"
                >
                  {t('organizerBtnRename')}
                </button>
                <div className="mx-1 h-3 w-px bg-border-light" />
                <button
                  type="button"
                  onClick={() => onDeleteGroup?.(manualGroup)}
                  className="text-[var(--text-2xs)] font-semibold tracking-wider text-text-secondary transition-colors hover:text-accent-red"
                >
                  {t('organizerBtnDelete')}
                </button>
                <div className="mx-1 h-3 w-px bg-border-light" />
              </>
            ) : null}
            {items.length > 0 ? (
              <button
                type="button"
                onClick={() => onCloseManualGroup(items, title)}
                className="text-[var(--text-2xs)] font-semibold tracking-wider text-text-secondary transition-colors hover:text-accent-red"
                title={`Close all ${tabCount} tabs in ${title}`}
              >
                {t('organizerBtnCloseAll')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="missions">
        {items.map((product) => (
          <DomainCard
            key={product.id}
            group={product}
            expanded={expandedDomains.has(product.domain)}
            maxChipsVisible={maxChipsVisible}
            staleThresholdDays={staleThresholdDays}
            onCloseDomain={onCloseProduct}
            onCloseDuplicates={onCloseDuplicates}
            onCloseTab={onCloseTab}
            onFocusTab={onFocusTab}
            focusedUrl={focusedUrl}
            closingUrls={closingUrls}
            selectedUrls={selectedUrls}
            selectedTabIds={selectedTabIds}
            onChipClick={onChipClick}
            onToggleExpanded={onToggleExpanded}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </section>
  );
}

export function CardsBoard({
  unassignedProducts,
  orderedGroups,
  productsByGroup,
  expandedDomains,
  maxChipsVisible,
  staleThresholdDays,
  focusedUrl,
  closingUrls,
  selectedUrls,
  selectedTabIds,
  onRenameGroup,
  onDeleteGroup,
  onCloseProduct,
  onCloseManualGroup,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  onChipClick,
  onToggleExpanded,
  searchQuery = '',
}: CardsBoardProps): React.ReactElement {
  const { t } = useI18n();
  const sharedProps = {
    expandedDomains,
    maxChipsVisible,
    staleThresholdDays,
    focusedUrl,
    closingUrls,
    selectedUrls,
    selectedTabIds,
    onCloseProduct,
    onCloseManualGroup,
    onCloseDuplicates,
    onCloseTab,
    onFocusTab,
    onChipClick,
    onToggleExpanded,
    searchQuery,
  };

  return (
    <>
      <CardGroupSection
        title={t('organizerUnsorted')}
        items={unassignedProducts}
        {...sharedProps}
      />
      {orderedGroups.map((group) => (
        <CardGroupSection
          key={group.id}
          title={group.name}
          items={productsByGroup.get(group.id) ?? []}
          manualGroup={group}
          onRenameGroup={onRenameGroup}
          onDeleteGroup={onDeleteGroup}
          {...sharedProps}
        />
      ))}
    </>
  );
}
