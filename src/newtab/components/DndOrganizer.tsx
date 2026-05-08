import React, { useCallback, useState } from 'react';
import { closestCenter, DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { ManualGroup, TabGroup } from '../../types';
import { DomainCard } from './DomainCard';

const UNASSIGNED_GROUP_ID = 'group:unassigned';

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
        dragHandleProps={{ ...attributes, ...listeners, 'aria-label': `Drag ${label} product` }}
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

// ─── Droppable group ────────────────────────────────────────────────

interface DndGroupBoardProps {
  id: string;
  title: string;
  items: TabGroup[];
  manualGroup?: ManualGroup;
  tabCount: number;
  expandedDomains: Set<string>;
  maxChipsVisible: number;
  focusedUrl?: string | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  itemIdForProduct: (p: TabGroup) => string;
  onRenameGroup?: (group: ManualGroup) => void;
  onDeleteGroup?: (group: ManualGroup) => void;
  onCloseProduct: (p: TabGroup) => void;
  onCloseManualGroup: (groups: TabGroup[], title: string) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded: (domain: string) => void;
}

function DndGroupBoard({
  id,
  title,
  items,
  manualGroup,
  tabCount,
  expandedDomains,
  maxChipsVisible,
  focusedUrl,
  closingUrls,
  selectedUrls,
  itemIdForProduct,
  onRenameGroup,
  onDeleteGroup,
  onCloseProduct,
  onCloseManualGroup,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  onChipClick,
  onToggleExpanded,
}: DndGroupBoardProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section ref={setNodeRef} className={`organizer-group ${isOver ? 'is-over' : ''}`}>
      <div className="group-header border-b-2 border-border-light pb-2 mb-5 dark:border-border-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-body text-xs font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
              {title}
            </h2>
            <span className="rounded-sm bg-surface-light px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-widest text-text-secondary dark:bg-surface-dark">
              {tabCount}
            </span>
          </div>
          {manualGroup && (
            <div className="group-actions flex items-center gap-1">
              <button
                type="button"
                onClick={() => onRenameGroup?.(manualGroup)}
                className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-accent-blue transition-colors"
              >
                Rename
              </button>
              <div className="h-3 w-px bg-border-light dark:bg-border-dark mx-1" />
              <button
                type="button"
                onClick={() => onDeleteGroup?.(manualGroup)}
                className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-accent-red transition-colors"
              >
                Delete
              </button>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onCloseManualGroup(items, title)}
              className="text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-accent-red transition-colors"
              title={`Close all ${tabCount} tabs in ${title}`}
            >
              Close all
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
            focusedUrl={focusedUrl}
            closingUrls={closingUrls}
            selectedUrls={selectedUrls}
            onCloseDomain={onCloseProduct}
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
  filteredProducts: TabGroup[];
  unassignedProducts: TabGroup[];
  orderedGroups: ManualGroup[];
  productsByGroup: Map<string, TabGroup[]>;
  assignmentByItemId: Map<string, string>;
  itemIdForProduct: (p: TabGroup) => string;
  expandedDomains: Set<string>;
  maxChipsVisible: number;
  focusedUrl?: string | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  onMoveProductToMain: (productKey: string) => void;
  onMoveProductToGroup: (productKey: string, groupId: string) => void;
  onRenameGroup?: (group: ManualGroup) => void;
  onDeleteGroup?: (group: ManualGroup) => void;
  onCloseProduct: (p: TabGroup) => void;
  onCloseManualGroup: (groups: TabGroup[], title: string) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded: (domain: string) => void;
}

export function DndOrganizer({
  filteredProducts,
  unassignedProducts,
  orderedGroups,
  productsByGroup,
  assignmentByItemId,
  itemIdForProduct,
  expandedDomains,
  maxChipsVisible,
  focusedUrl,
  closingUrls,
  selectedUrls,
  onMoveProductToMain,
  onMoveProductToGroup,
  onRenameGroup,
  onDeleteGroup,
  onCloseProduct,
  onCloseManualGroup,
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

      if (overId === UNASSIGNED_GROUP_ID) {
        onMoveProductToMain(productKey);
        return;
      }

      if (overId.startsWith('group:') && overId !== UNASSIGNED_GROUP_ID) {
        onMoveProductToGroup(productKey, overId.slice('group:'.length));
        return;
      }

      // Dropped on a card — move to whichever group that card belongs to
      const overGroupId = assignmentByItemId.get(overId);
      if (overGroupId) {
        onMoveProductToGroup(productKey, overGroupId);
      }
    },
    [assignmentByItemId, onMoveProductToMain, onMoveProductToGroup],
  );

  const sharedProps = {
    expandedDomains,
    maxChipsVisible,
    focusedUrl,
    closingUrls,
    selectedUrls,
    itemIdForProduct,
    onCloseProduct,
    onCloseManualGroup,
    onCloseDuplicates,
    onCloseTab,
    onFocusTab,
    onChipClick,
    onToggleExpanded,
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <DndGroupBoard
        id={UNASSIGNED_GROUP_ID}
        title="Unsorted"
        items={unassignedProducts}
        tabCount={unassignedProducts.reduce((sum, p) => sum + p.tabs.length, 0)}
        {...sharedProps}
      />
      {orderedGroups.map((group) => {
        const items = productsByGroup.get(group.id) ?? [];
        return (
          <DndGroupBoard
            key={group.id}
            id={`group:${group.id}`}
            title={group.name}
            manualGroup={group}
            items={items}
            tabCount={items.reduce((sum, p) => sum + p.tabs.length, 0)}
            onRenameGroup={onRenameGroup}
            onDeleteGroup={onDeleteGroup}
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
            onCloseDomain={onCloseProduct}
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
