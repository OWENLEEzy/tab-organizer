import React, { useCallback, useState } from 'react';
import { closestCenter, DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Section, TabGroup } from '../../types';
import { DomainCard } from './DomainCard';
import { useI18n } from '../hooks/useI18n';

const UNASSIGNED_SECTION_ID = 'section:unassigned';

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
  staleThresholdDays: number;
  focusedUrl?: string | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  selectedTabIds: Set<number>;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded?: (domain: string) => void;
  searchQuery?: string;
}

function DraggableDomainCard({
  group,
  draggableId,
  expanded,
  maxChipsVisible,
  staleThresholdDays,
  focusedUrl,
  closingUrls,
  selectedUrls,
  selectedTabIds,
  onCloseDomain,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  onChipClick,
  onToggleExpanded,
  searchQuery = '',
}: DraggableDomainCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: draggableId });
  const label = group.friendlyName || group.domain;

  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0 : 1 }}>
      <DomainCard
        group={group}
        dragHandleProps={{ ...attributes, ...listeners, 'aria-label': `Drag ${label} product` }}
        expanded={expanded}
        maxChipsVisible={maxChipsVisible}
        staleThresholdDays={staleThresholdDays}
        onCloseDomain={onCloseDomain}
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
    </div>
  );
}

// ─── Droppable group ────────────────────────────────────────────────

interface DndGroupBoardProps {
  id: string;
  title: string;
  items: TabGroup[];
  section?: Section;
  tabCount: number;
  expandedDomains: Set<string>;
  maxChipsVisible: number;
  staleThresholdDays: number;
  focusedUrl?: string | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  selectedTabIds: Set<number>;
  itemIdForProduct: (p: TabGroup) => string;
  onRenameSection?: (group: Section) => void;
  onDeleteSection?: (group: Section) => void;
  onCloseProduct: (p: TabGroup) => void;
  onCloseSection: (groups: TabGroup[], title: string) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded: (domain: string) => void;
  searchQuery?: string;
}

function DndGroupBoard({
  id,
  title,
  items,
  section,
  tabCount,
  expandedDomains,
  maxChipsVisible,
  staleThresholdDays,
  focusedUrl,
  closingUrls,
  selectedUrls,
  selectedTabIds,
  itemIdForProduct,
  onRenameSection,
  onDeleteSection,
  onCloseProduct,
  onCloseSection,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  onChipClick,
  onToggleExpanded,
  searchQuery = '',
}: DndGroupBoardProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { t } = useI18n();

  return (
    <section ref={setNodeRef} className={`organizer-group ${isOver ? 'is-over' : ''}`}>
      <div className="group-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg italic text-text-primary">
              {title}
            </h2>
            <span className="rounded-sm bg-surface-light px-2 py-0.5 font-body text-[var(--text-2xs)] font-bold uppercase tracking-widest text-text-secondary">
              {tabCount}
            </span>
          </div>
          <div className="section-actions flex items-center gap-1">
            {section && (
              <>
                <button
                  type="button"
                  onClick={() => onRenameSection?.(section)}
                  className="text-[var(--text-2xs)] font-semibold tracking-wider text-text-secondary hover:text-accent-blue transition-colors"
                >
                  {t('organizerBtnRename')}
                </button>
                <div className="h-3 w-px bg-border-light mx-1" />
                <button
                  type="button"
                  onClick={() => onDeleteSection?.(section)}
                  className="text-[var(--text-2xs)] font-semibold tracking-wider text-text-secondary hover:text-accent-red transition-colors"
                >
                  {t('organizerBtnDelete')}
                </button>
                <div className="h-3 w-px bg-border-light mx-1" />
              </>
            )}
            <button
              type="button"
              onClick={() => onCloseSection(items, title)}
              className="text-[var(--text-2xs)] font-semibold tracking-wider text-text-secondary hover:text-accent-red transition-colors"
              title={`Close all ${tabCount} tabs in ${title}`}
            >
              {t('organizerBtnCloseAll')}
            </button>
          </div>
        </div>
      </div>
      <div className="missions">
        {items.map((p) => (
          <DraggableDomainCard
            key={p.id}
            group={p}
            draggableId={itemIdForProduct(p)}
            expanded={expandedDomains.has(p.domain)}
            maxChipsVisible={maxChipsVisible}
            staleThresholdDays={staleThresholdDays}
            focusedUrl={focusedUrl}
            closingUrls={closingUrls}
            selectedUrls={selectedUrls}
            selectedTabIds={selectedTabIds}
            onCloseDomain={onCloseProduct}
            onCloseDuplicates={onCloseDuplicates}
            onCloseTab={onCloseTab}
            onFocusTab={onFocusTab}
            onChipClick={onChipClick}
            onToggleExpanded={onToggleExpanded}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Root organizer ───────────────────────────────────────────────────

interface DndOrganizerProps {
  filteredProducts: TabGroup[];
  unassignedProducts: TabGroup[];
  orderedSections: Section[];
  productsBySection: Map<string, TabGroup[]>;
  assignmentByItemId: Map<string, string>;
  itemIdForProduct: (p: TabGroup) => string;
  expandedDomains: Set<string>;
  maxChipsVisible: number;
  staleThresholdDays: number;
  focusedUrl?: string | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  selectedTabIds: Set<number>;
  onMoveProductToNoSection: (productKey: string) => void;
  onMoveProductToSection: (productKey: string, sectionId: string) => void;
  onRenameSection?: (group: Section) => void;
  onDeleteSection?: (group: Section) => void;
  onCloseProduct: (p: TabGroup) => void;
  onCloseSection: (groups: TabGroup[], title: string) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded: (domain: string) => void;
  searchQuery?: string;
}

export function DndOrganizer({
  filteredProducts,
  unassignedProducts,
  orderedSections,
  productsBySection,
  assignmentByItemId,
  itemIdForProduct,
  expandedDomains,
  maxChipsVisible,
  staleThresholdDays,
  focusedUrl,
  closingUrls,
  selectedUrls,
  selectedTabIds,
  onMoveProductToNoSection,
  onMoveProductToSection,
  onRenameSection,
  onDeleteSection,
  onCloseProduct,
  onCloseSection,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  onChipClick,
  onToggleExpanded,
  searchQuery = '',
}: DndOrganizerProps): React.ReactElement {
  const { t } = useI18n();
  const [activeGroup, setActiveGroup] = useState<TabGroup | null>(null);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setActiveGroup(filteredProducts.find((p) => itemIdForProduct(p) === id) ?? null);
    },
    [filteredProducts, itemIdForProduct],
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

      if (overId === UNASSIGNED_SECTION_ID) {
        onMoveProductToNoSection(productKey);
        return;
      }

      if (overId.startsWith('section:') && overId !== UNASSIGNED_SECTION_ID) {
        onMoveProductToSection(productKey, overId.slice('section:'.length));
        return;
      }

      // Dropped on a card — move to whichever group that card belongs to
      const overGroupId = assignmentByItemId.get(overId);
      if (overGroupId) {
        onMoveProductToSection(productKey, overGroupId);
      }
    },
    [assignmentByItemId, onMoveProductToNoSection, onMoveProductToSection],
  );

  const sharedProps = {
    expandedDomains,
    maxChipsVisible,
    staleThresholdDays,
    focusedUrl,
    closingUrls,
    selectedUrls,
    selectedTabIds,
    itemIdForProduct,
    onCloseProduct,
    onCloseSection,
    onCloseDuplicates,
    onCloseTab,
    onFocusTab,
    onChipClick,
    onToggleExpanded,
    searchQuery,
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <DndGroupBoard
        id={UNASSIGNED_SECTION_ID}
        title={t('organizerUnsorted')}
        items={unassignedProducts}
        tabCount={unassignedProducts.reduce((sum, p) => sum + p.tabs.length, 0)}
        {...sharedProps}
      />
      {orderedSections.map((group) => {
        const items = productsBySection.get(group.id) ?? [];
        return (
          <DndGroupBoard
            key={group.id}
            id={`section:${group.id}`}
            title={group.name}
            section={group}
            items={items}
            tabCount={items.reduce((sum, p) => sum + p.tabs.length, 0)}
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
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
