import React, { useCallback } from 'react';
import { closestCenter, DndContext, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OrganizerSection, TabGroup } from '../../types';
import { DomainCard } from './DomainCard';

const MAIN_SECTION_ID = 'section:main';

function productKeyFromDragId(itemId: string): string | null {
  if (!itemId.startsWith('product:')) return null;
  const productKey = itemId.slice('product:'.length);
  return productKey === '' ? null : productKey;
}

interface DndOrganizerProps {
  filteredGroups: TabGroup[];
  unsectionedGroups: TabGroup[];
  orderedSections: OrganizerSection[];
  groupsBySection: Map<string, TabGroup[]>;
  assignmentByItemId: Map<string, string>;
  itemIdForGroup: (group: TabGroup) => string;
  expandedDomains: Set<string>;
  maxChipsVisible: number;
  focusedUrl?: string | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  onMoveProductToMain: (productKey: string) => void;
  onMoveProductToSection: (productKey: string, sectionId: string) => void;
  onReorderGroups: (groups: TabGroup[]) => void;
  onRenameSection?: (section: OrganizerSection) => void;
  onDeleteSection?: (section: OrganizerSection) => void;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded: (domain: string) => void;
}

interface SortableDomainCardProps {
  group: TabGroup;
  sortableId: string;
  expanded?: boolean;
  maxChipsVisible: number;
  focusedUrl?: string | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded?: (domain: string) => void;
}

function SortableDomainCard({
  group,
  sortableId,
  expanded,
  maxChipsVisible,
  focusedUrl,
  closingUrls,
  selectedUrls,
  onCloseDomain,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  onChipClick,
  onToggleExpanded,
}: SortableDomainCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const label = group.friendlyName || group.domain;

  return (
    <div ref={setNodeRef} style={style}>
      <DomainCard
        group={group}
        dragHandleProps={{ ...attributes, ...listeners, 'aria-label': `Drag ${label} group` }}
        expanded={expanded}
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
    </div>
  );
}

interface DndSectionBoardProps {
  id: string;
  title: string;
  items: TabGroup[];
  section?: OrganizerSection;
  dndItemIds: string[];
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

function DndSectionBoard({
  id,
  title,
  items,
  section,
  dndItemIds,
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
}: DndSectionBoardProps): React.ReactElement {
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
            <button type="button" onClick={() => onRenameSection?.(section)}>Rename</button>
            <button type="button" onClick={() => onDeleteSection?.(section)}>Delete</button>
          </div>
        )}
      </div>
      <div className="missions">
        {items.map((group, index) => (
          <SortableDomainCard
            key={group.id}
            group={group}
            sortableId={dndItemIds[index]}
            expanded={expandedDomains.has(group.domain)}
            maxChipsVisible={maxChipsVisible}
            focusedUrl={focusedUrl}
            closingUrls={closingUrls}
            selectedUrls={selectedUrls}
            onCloseDomain={onCloseDomain}
            onCloseDuplicates={onCloseDuplicates}
            onCloseTab={onCloseTab}
            onFocusTab={onFocusTab}
            onChipClick={onChipClick}
            onToggleExpanded={onToggleExpanded}
          />
        ))}
      </div>
    </section>
  );
}

export function DndOrganizer({
  filteredGroups,
  unsectionedGroups,
  orderedSections,
  groupsBySection,
  assignmentByItemId,
  itemIdForGroup,
  expandedDomains,
  maxChipsVisible,
  focusedUrl,
  closingUrls,
  selectedUrls,
  onMoveProductToMain,
  onMoveProductToSection,
  onReorderGroups,
  onRenameSection,
  onDeleteSection,
  onCloseDomain,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  onChipClick,
  onToggleExpanded,
}: DndOrganizerProps): React.ReactElement {
  const allDndItemIds = filteredGroups.map(itemIdForGroup);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const productKey = productKeyFromDragId(activeId);
    if (!productKey) return;

    if (overId === MAIN_SECTION_ID) {
      onMoveProductToMain(productKey);
      return;
    }

    if (overId.startsWith('section:') && overId !== MAIN_SECTION_ID) {
      onMoveProductToSection(productKey, overId.slice('section:'.length));
      return;
    }

    const overSectionId = assignmentByItemId.get(overId);
    if (overSectionId) {
      onMoveProductToSection(productKey, overSectionId);
      return;
    }

    const oldIndex = unsectionedGroups.findIndex((group) => itemIdForGroup(group) === activeId);
    const newIndex = unsectionedGroups.findIndex((group) => itemIdForGroup(group) === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorderGroups(arrayMove(unsectionedGroups, oldIndex, newIndex));
  }, [assignmentByItemId, itemIdForGroup, onMoveProductToMain, onMoveProductToSection, onReorderGroups, unsectionedGroups]);

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={allDndItemIds} strategy={verticalListSortingStrategy}>
        <DndSectionBoard
          id={MAIN_SECTION_ID}
          title="Unsorted"
          items={unsectionedGroups}
          dndItemIds={unsectionedGroups.map(itemIdForGroup)}
          tabCount={unsectionedGroups.reduce((sum, group) => sum + group.tabs.length, 0)}
          expandedDomains={expandedDomains}
          maxChipsVisible={maxChipsVisible}
          focusedUrl={focusedUrl}
          closingUrls={closingUrls}
          selectedUrls={selectedUrls}
          onCloseDomain={onCloseDomain}
          onCloseDuplicates={onCloseDuplicates}
          onCloseTab={onCloseTab}
          onFocusTab={onFocusTab}
          onChipClick={onChipClick}
          onToggleExpanded={onToggleExpanded}
        />
        {orderedSections.map((section) => {
          const items = groupsBySection.get(section.id) ?? [];
          return (
            <DndSectionBoard
              key={section.id}
              id={`section:${section.id}`}
              title={section.name}
              section={section}
              items={items}
              dndItemIds={items.map(itemIdForGroup)}
              tabCount={items.reduce((sum, group) => sum + group.tabs.length, 0)}
              expandedDomains={expandedDomains}
              maxChipsVisible={maxChipsVisible}
              focusedUrl={focusedUrl}
              closingUrls={closingUrls}
              selectedUrls={selectedUrls}
              onRenameSection={onRenameSection}
              onDeleteSection={onDeleteSection}
              onCloseDomain={onCloseDomain}
              onCloseDuplicates={onCloseDuplicates}
              onCloseTab={onCloseTab}
              onFocusTab={onFocusTab}
              onChipClick={onChipClick}
              onToggleExpanded={onToggleExpanded}
            />
          );
        })}
      </SortableContext>
    </DndContext>
  );
}
