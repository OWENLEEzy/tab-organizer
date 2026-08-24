import React, { useCallback, useState } from 'react';
import { closestCenter, DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Section, TabGroup } from '../../../types';
import {
  NO_SECTION_ID,
  UNASSIGNED_SECTION_DROP_ID,
  fromProductItemId,
  fromSectionDropId,
  toSectionDropId,
} from '../../../lib/section-organizer';
import { getProductKey } from '../../../lib/product-key';
import { ProductGroupCard } from '../product-groups/ProductGroupCard';
import { SectionActionsDropdown } from './SectionActionsDropdown';
import { useI18n } from '../../hooks/useI18n';

// ─── Draggable card wrapper ────────────────────────────────────────────

interface DraggableProductGroupCardProps {
  group: TabGroup;
  draggableId: string;
  expanded?: boolean;
  maxChipsVisible: number;
  staleThresholdDays: number;
  lastUsedTabId?: number | null;
  focusedUrl?: string | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  selectedTabIds: Set<number>;
  onCloseProductGroup: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
  onToggleProductGroupExpanded?: (domain: string) => void;
  searchQuery?: string;
  sections: Section[];
  currentSectionId: string | null;
  onMoveProductToSection: (productKey: string, sectionId: string) => void;
  onMoveProductToNoSection: (productKey: string) => void;
  pinnedProductKeys: ReadonlySet<string>;
  onUnpinProduct: (productKey: string) => void;
}

function DraggableProductGroupCard({
  group,
  draggableId,
  expanded,
  maxChipsVisible,
  staleThresholdDays,
  lastUsedTabId,
  focusedUrl,
  closingUrls,
  selectedUrls,
  selectedTabIds,
  onCloseProductGroup,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  onChipClick,
  onToggleProductGroupExpanded,
  searchQuery = '',
  sections,
  currentSectionId,
  onMoveProductToSection,
  onMoveProductToNoSection,
  pinnedProductKeys,
  onUnpinProduct,
}: DraggableProductGroupCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: draggableId });
  const label = group.friendlyName || group.domain;
  const productKey = getProductKey(group);

  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0 : 1 }}>
      <ProductGroupCard
        group={group}
        dragHandleProps={{ ...attributes, ...listeners, 'aria-label': `Drag ${label} product` }}
        expanded={expanded}
        maxChipsVisible={maxChipsVisible}
        staleThresholdDays={staleThresholdDays}
        lastUsedTabId={lastUsedTabId}
        onCloseProductGroup={onCloseProductGroup}
        onCloseDuplicates={onCloseDuplicates}
        onCloseTab={onCloseTab}
        onFocusTab={onFocusTab}
        focusedUrl={focusedUrl}
        closingUrls={closingUrls}
        selectedUrls={selectedUrls}
        selectedTabIds={selectedTabIds}
        onChipClick={onChipClick}
        onToggleProductGroupExpanded={onToggleProductGroupExpanded}
        searchQuery={searchQuery}
        sections={sections}
        currentSectionId={currentSectionId}
        onMoveToSection={(sectionId) => onMoveProductToSection(productKey, sectionId)}
        onMoveToNoSection={() => onMoveProductToNoSection(productKey)}
        pinnedProductKeys={pinnedProductKeys}
        onUnpinProduct={() => onUnpinProduct(productKey)}
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
  expandedProductGroups: Set<string>;
  maxChipsVisible: number;
  staleThresholdDays: number;
  lastUsedTabId?: number | null;
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
  onToggleProductGroupExpanded: (domain: string) => void;
  searchQuery?: string;
  sections: Section[];
  onMoveProductToSection: (productKey: string, sectionId: string) => void;
  onMoveProductToNoSection: (productKey: string) => void;
  pinnedProductKeys: ReadonlySet<string>;
  onUnpinProduct: (productKey: string) => void;
}

export function DndGroupBoard({
  id,
  title,
  items,
  section,
  tabCount,
  expandedProductGroups,
  maxChipsVisible,
  staleThresholdDays,
  lastUsedTabId,
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
  onToggleProductGroupExpanded,
  searchQuery = '',
  sections,
  onMoveProductToSection,
  onMoveProductToNoSection,
  pinnedProductKeys,
  onUnpinProduct,
}: DndGroupBoardProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { t } = useI18n();
  const currentSectionId = section?.id ?? null;

  return (
    <section ref={setNodeRef} className={`organizer-group ${isOver ? 'is-over' : ''}`}>
      <div className="group-header">
        <div className="flex items-center gap-4 mb-1">
          <div className="flex items-baseline gap-3 shrink-0">
            <h2 className="font-heading text-xl text-text-primary font-medium">
              {title}
            </h2>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-text-secondary">
              {tabCount}
            </span>
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-border-color to-transparent opacity-80 mt-1"></div>
          <div className="section-actions flex items-center gap-1 shrink-0">
            <SectionActionsDropdown
              section={section}
              tabCount={tabCount}
              title={title}
              onRenameSection={onRenameSection}
              onDeleteSection={onDeleteSection}
              onCloseSection={onCloseSection}
              items={items}
            />
          </div>
        </div>
      </div>
      <div className="missions">
        {items.length === 0 ? (
          <div className="col-span-full rounded-card border border-dashed border-border-color px-4 py-6 text-center text-3xs font-mono uppercase tracking-wider text-text-secondary">
            {t('sectionEmptySlot')}
          </div>
        ) : (
          items.map((p) => (
            <DraggableProductGroupCard
              key={p.id}
              group={p}
              draggableId={itemIdForProduct(p)}
              expanded={expandedProductGroups.has(p.domain)}
              maxChipsVisible={maxChipsVisible}
              staleThresholdDays={staleThresholdDays}
              lastUsedTabId={lastUsedTabId}
              focusedUrl={focusedUrl}
              closingUrls={closingUrls}
              selectedUrls={selectedUrls}
              selectedTabIds={selectedTabIds}
              onCloseProductGroup={onCloseProduct}
              onCloseDuplicates={onCloseDuplicates}
              onCloseTab={onCloseTab}
              onFocusTab={onFocusTab}
              onChipClick={onChipClick}
              onToggleProductGroupExpanded={onToggleProductGroupExpanded}
              searchQuery={searchQuery}
              sections={sections}
              currentSectionId={currentSectionId}
              onMoveProductToSection={onMoveProductToSection}
              onMoveProductToNoSection={onMoveProductToNoSection}
              pinnedProductKeys={pinnedProductKeys}
              onUnpinProduct={onUnpinProduct}
            />
          ))
        )}
      </div>
    </section>
  );
}

// ─── Root organizer ───────────────────────────────────────────────────

interface DndSectionOrganizerProps {
  filteredProducts: TabGroup[];
  unassignedProducts: TabGroup[];
  orderedSections: Section[];
  productsBySection: Map<string, TabGroup[]>;
  assignmentByItemId: Map<string, string>;
  itemIdForProduct: (p: TabGroup) => string;
  expandedProductGroups: Set<string>;
  maxChipsVisible: number;
  staleThresholdDays: number;
  lastUsedTabId?: number | null;
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
  onToggleProductGroupExpanded: (domain: string) => void;
  searchQuery?: string;
  activeSectionId?: string | null;
  pinnedProductKeys: ReadonlySet<string>;
  onUnpinProduct: (productKey: string) => void;
}

export function DndSectionOrganizer({
  filteredProducts,
  unassignedProducts,
  orderedSections,
  productsBySection,
  assignmentByItemId,
  itemIdForProduct,
  expandedProductGroups,
  maxChipsVisible,
  staleThresholdDays,
  lastUsedTabId,
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
  onToggleProductGroupExpanded,
  searchQuery = '',
  activeSectionId = null,
  pinnedProductKeys,
  onUnpinProduct,
}: DndSectionOrganizerProps): React.ReactElement {
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

      const productKey = fromProductItemId(String(active.id));
      if (!productKey) return;

      const overId = String(over.id);
      const sectionDropId = fromSectionDropId(overId);
      if (sectionDropId === NO_SECTION_ID) {
        onMoveProductToNoSection(productKey);
        return;
      }
      if (sectionDropId) {
        onMoveProductToSection(productKey, sectionDropId);
        return;
      }

      const overSectionId = assignmentByItemId.get(overId);
      if (overSectionId) {
        onMoveProductToSection(productKey, overSectionId);
      }
    },
    [assignmentByItemId, onMoveProductToNoSection, onMoveProductToSection],
  );

  const sharedProps = {
    expandedProductGroups,
    maxChipsVisible,
    staleThresholdDays,
    lastUsedTabId,
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
    onToggleProductGroupExpanded,
    searchQuery,
    sections: orderedSections,
    onMoveProductToSection,
    onMoveProductToNoSection,
    pinnedProductKeys,
    onUnpinProduct,
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="organizer-flow">
        {(!activeSectionId || activeSectionId === UNASSIGNED_SECTION_DROP_ID) && unassignedProducts.length > 0 && (
          <DndGroupBoard
            id={UNASSIGNED_SECTION_DROP_ID}
            title={t('organizerUnsectioned')}
            items={unassignedProducts}
            tabCount={unassignedProducts.reduce((sum, p) => sum + p.tabs.length, 0)}
            {...sharedProps}
          />
        )}
        {orderedSections.map((group) => {
          if (activeSectionId && activeSectionId !== group.id) return null;

          const items = productsBySection.get(group.id) ?? [];

          return (
            <DndGroupBoard
              key={group.id}
              id={toSectionDropId(group.id)}
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
      </div>
      <DragOverlay>
        {activeGroup ? (
          <ProductGroupCard
            group={activeGroup}
            expanded={expandedProductGroups.has(activeGroup.domain)}
            maxChipsVisible={maxChipsVisible}
            staleThresholdDays={staleThresholdDays}
            lastUsedTabId={lastUsedTabId}
            onCloseProductGroup={onCloseProduct}
            onCloseDuplicates={onCloseDuplicates}
            onCloseTab={onCloseTab}
            onFocusTab={onFocusTab}
            focusedUrl={focusedUrl}
            closingUrls={closingUrls}
            selectedUrls={selectedUrls}
            selectedTabIds={selectedTabIds}
            onChipClick={onChipClick}
            onToggleProductGroupExpanded={onToggleProductGroupExpanded}
            searchQuery={searchQuery}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
