import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { OrganizerSection, TabGroup } from '../../types';
import { SortableDomainCard } from './SortableDomainCard';
import { DomainCard } from './DomainCard';

interface SectionBoardProps {
  id: string;
  title: string;
  items: TabGroup[];
  section?: OrganizerSection;
  dndItemIds: string[];
  dndEnabled: boolean;
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
  onSaveTab: (url: string, title: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded: (domain: string) => void;
}

export function SectionBoard({
  id,
  title,
  items,
  section,
  dndItemIds,
  dndEnabled,
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
  onSaveTab,
  onFocusTab,
  onChipClick,
  onToggleExpanded,
}: SectionBoardProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section ref={setNodeRef} className={`organizer-section ${isOver ? 'is-over' : ''}`}>
      <div className="section-header">
        <h2 className="font-heading text-text-primary-light dark:text-text-primary-dark text-base font-semibold">
          {title}
        </h2>
        <div className="border-border-light dark:border-border-dark mx-3 h-px flex-1" />
        <span className="text-text-secondary text-xs whitespace-nowrap">
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
        {items.map((group, index) => (
          dndEnabled ? (
            <SortableDomainCard
              key={group.id}
              group={group}
              sortableId={dndItemIds[index]}
              draggableTabs
              expanded={expandedDomains.has(group.domain)}
              maxChipsVisible={maxChipsVisible}
              onCloseDomain={onCloseDomain}
              onCloseDuplicates={onCloseDuplicates}
              onCloseTab={onCloseTab}
              onSaveTab={onSaveTab}
              onFocusTab={onFocusTab}
              focusedUrl={focusedUrl}
              closingUrls={closingUrls}
              selectedUrls={selectedUrls}
              onChipClick={onChipClick}
              onToggleExpanded={onToggleExpanded}
            />
          ) : (
            <DomainCard
              key={group.id}
              group={group}
              expanded={expandedDomains.has(group.domain)}
              maxChipsVisible={maxChipsVisible}
              onCloseDomain={onCloseDomain}
              onCloseDuplicates={onCloseDuplicates}
              onCloseTab={onCloseTab}
              onSaveTab={onSaveTab}
              onFocusTab={onFocusTab}
              focusedUrl={focusedUrl}
              closingUrls={closingUrls}
              selectedUrls={selectedUrls}
              onChipClick={onChipClick}
              onToggleExpanded={onToggleExpanded}
            />
          )
        ))}
      </div>
    </section>
  );
}
