import React, { useCallback, useState } from 'react';
import { closestCenter, DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { OrganizerSection, TabGroup } from '../../types';
import { DomainCard } from './DomainCard';

const MAIN_SECTION_ID = 'section:main';

function productKeyFromDragId(itemId: string): string | null {
  if (!itemId.startsWith('product:')) return null;
  const productKey = itemId.slice('product:'.length);
  return productKey === '' ? null : productKey;
}

// ─── Draggable card wrapper ────────────────────────────────────────────

interface DraggableDomainCardProps {
  group: TabGroup;
  draggableId: string;
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

function DraggableDomainCard({
  group,
  draggableId,
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
}: DraggableDomainCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: draggableId });
  const label = group.friendlyName || group.domain;

  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0 : 1 }}>
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

// ─── Droppable section ────────────────────────────────────────────────

interface DndSectionBoardProps {
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
  itemIdForGroup: (group: TabGroup) => string;
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
  tabCount,
  expandedDomains,
  maxChipsVisible,
  focusedUrl,
  closingUrls,
  selectedUrls,
  itemIdForGroup,
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
      <div className="section-header border-b-2 border-border-light pb-2 mb-5 dark:border-border-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-body text-xs font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
              {title}
            </h2>
            <span className="rounded-sm bg-surface-light px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-widest text-text-secondary dark:bg-surface-dark">
              {tabCount}
            </span>
          </div>
          {section && (
            <div className="section-actions flex items-center gap-1">
              <button
                type="button"
                onClick={() => onRenameSection?.(section)}
                className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-accent-blue transition-colors"
              >
                Rename
              </button>
              <div className="h-3 w-px bg-border-light dark:bg-border-dark mx-1" />
              <button
                type="button"
                onClick={() => onDeleteSection?.(section)}
                className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-accent-red transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="missions">
        {items.map((group) => (
          <DraggableDomainCard
            key={group.id}
            group={group}
            draggableId={itemIdForGroup(group)}
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

// ─── Root organizer ───────────────────────────────────────────────────

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
  onRenameSection?: (section: OrganizerSection) => void;
  onDeleteSection?: (section: OrganizerSection) => void;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded: (domain: string) => void;
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
  onRenameSection,
  onDeleteSection,
  onCloseDomain,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  onChipClick,
  onToggleExpanded,
}: DndOrganizerProps): React.ReactElement {
  const [activeGroup, setActiveGroup] = useState<TabGroup | null>(null);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setActiveGroup(filteredGroups.find((g) => itemIdForGroup(g) === id) ?? null);
    },
    [filteredGroups, itemIdForGroup],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveGroup(null);
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

      // Dropped on a card — move to whichever section that card belongs to
      const overSectionId = assignmentByItemId.get(overId);
      if (overSectionId) {
        onMoveProductToSection(productKey, overSectionId);
      }
    },
    [assignmentByItemId, onMoveProductToMain, onMoveProductToSection],
  );

  const sharedProps = {
    expandedDomains,
    maxChipsVisible,
    focusedUrl,
    closingUrls,
    selectedUrls,
    itemIdForGroup,
    onCloseDomain,
    onCloseDuplicates,
    onCloseTab,
    onFocusTab,
    onChipClick,
    onToggleExpanded,
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <DndSectionBoard
        id={MAIN_SECTION_ID}
        title="Unsorted"
        items={unsectionedGroups}
        tabCount={unsectionedGroups.reduce((sum, g) => sum + g.tabs.length, 0)}
        {...sharedProps}
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
            tabCount={items.reduce((sum, g) => sum + g.tabs.length, 0)}
            onRenameSection={onRenameSection}
            onDeleteSection={onDeleteSection}
            {...sharedProps}
          />
        );
      })}
      <DragOverlay>
        {activeGroup ? (
          <DomainCard
            group={activeGroup}
            expanded={expandedDomains.has(activeGroup.domain)}
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
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
