import React from 'react';
import type { OrganizerSection, TabGroup } from '../../types';
import { DomainCard } from './DomainCard';

export interface SectionBoardProps {
  id: string;
  title: string;
  items: TabGroup[];
  section?: OrganizerSection;
  tabCount: number;
  expandedDomains: Set<string>;
  maxChipsVisible: number;
  focusedUrl?: string | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  onRenameSection?: (section: OrganizerSection) => void;
  onDeleteSection?: (section: OrganizerSection) => void;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded: (domain: string) => void;
}

export function SectionBoard({
  id,
  title,
  items,
  section,
  tabCount,
  expandedDomains,
  maxChipsVisible,
  focusedUrl,
  closingUrls,
  selectedUrls,
  onRenameSection,
  onDeleteSection,
  onCloseDomain,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  onChipClick,
  onToggleExpanded,
}: SectionBoardProps): React.ReactElement {
  return (
    <section className="organizer-section" data-section-id={id}>
      <div className="section-header">
        <h2 className="font-body text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">
          {title}
        </h2>
        <div className="mx-3 h-[2px] flex-1 border-t-2 border-border-light dark:border-border-dark" />
        <span className="whitespace-nowrap font-body text-xs font-semibold uppercase text-text-secondary">
          {tabCount} tab{tabCount !== 1 ? 's' : ''}
        </span>
        {section && (
          <div className="section-actions">
            <button type="button" onClick={() => onRenameSection?.(section)}>
              Rename
            </button>
            <button type="button" onClick={() => onDeleteSection?.(section)}>
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="missions">
        {items.map((group) => (
          <DomainCard
            key={group.id}
            group={group}
            expanded={expandedDomains.has(group.domain)}
            maxChipsVisible={maxChipsVisible}
            onCloseDomain={onCloseDomain}
            onCloseDuplicates={onCloseDuplicates}
            onCloseTab={onCloseTab}
            onFocusTab={onFocusTab}
            focusedUrl={focusedUrl}
            closingUrls={closingUrls}
            selectedUrls={selectedUrls}
            onChipClick={onChipClick}
            onToggleExpanded={onToggleExpanded}
          />
        ))}
      </div>
    </section>
  );
}
