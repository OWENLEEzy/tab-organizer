import React, { useCallback, useState, useEffect, useRef } from 'react';
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
import { ProductGroupCard } from '../product-groups/ProductGroupCard';
import { useI18n } from '../../hooks/useI18n';

// ─── Draggable card wrapper ────────────────────────────────────────────

interface DraggableProductGroupCardProps {
  group: TabGroup;
  draggableId: string;
  expanded?: boolean;
  maxChipsVisible: number;
  staleThresholdDays: number;
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
}

function DraggableProductGroupCard({
  group,
  draggableId,
  expanded,
  maxChipsVisible,
  staleThresholdDays,
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
}: DraggableProductGroupCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: draggableId });
  const label = group.friendlyName || group.domain;

  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0 : 1 }}>
      <ProductGroupCard
        group={group}
        dragHandleProps={{ ...attributes, ...listeners, 'aria-label': `Drag ${label} product` }}
        expanded={expanded}
        maxChipsVisible={maxChipsVisible}
        staleThresholdDays={staleThresholdDays}
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
}

interface SectionActionsDropdownProps {
  section?: Section;
  tabCount: number;
  title: string;
  onRenameSection?: (group: Section) => void;
  onDeleteSection?: (group: Section) => void;
  onCloseSection: (groups: TabGroup[], title: string) => void;
  items: TabGroup[];
}

function SectionActionsDropdown({
  section,
  tabCount,
  title,
  onRenameSection,
  onDeleteSection,
  onCloseSection,
  items,
}: SectionActionsDropdownProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!section && tabCount === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-chip text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark flex h-6 w-6 cursor-pointer items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none"
        aria-label="Section options"
        aria-expanded={isOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 overflow-hidden rounded-md border border-border-light bg-bg-card shadow-lg dark:border-border-dark flex flex-col font-body py-1">
          {section && (
            <>
              <button
                type="button"
                onClick={() => { setIsOpen(false); onRenameSection?.(section); }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-light dark:hover:bg-surface-dark cursor-pointer transition-colors"
              >
                {t('organizerBtnRename')}
              </button>
              <button
                type="button"
                onClick={() => { setIsOpen(false); onDeleteSection?.(section); }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-light dark:hover:bg-surface-dark cursor-pointer transition-colors"
              >
                {t('organizerBtnDelete')}
              </button>
            </>
          )}
          {section && tabCount > 0 && <div className="mx-2 my-1 h-px bg-border-light dark:bg-border-dark opacity-50" />}
          {tabCount > 0 && (
            <button
              type="button"
              onClick={() => { setIsOpen(false); onCloseSection(items, title); }}
              className="w-full text-left px-3 py-1.5 text-xs text-accent-red hover:bg-accent-red/10 cursor-pointer transition-colors"
            >
              {t('organizerBtnCloseAll')}
            </button>
          )}
        </div>
      )}
    </div>
  );
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
}: DndGroupBoardProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section ref={setNodeRef} className={`organizer-group ${isOver ? 'is-over' : ''}`}>
      <div className="group-header">
        <div className="flex items-center gap-4 mb-1">
          <div className="flex items-baseline gap-3 shrink-0">
            <h2 className="font-heading text-xl italic text-text-primary font-normal">
              {title}
            </h2>
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] text-text-muted">
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
        {items.map((p) => (
          <DraggableProductGroupCard
            key={p.id}
            group={p}
            draggableId={itemIdForProduct(p)}
            expanded={expandedProductGroups.has(p.domain)}
            maxChipsVisible={maxChipsVisible}
            staleThresholdDays={staleThresholdDays}
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
  expandedProductGroups: Set<string>;
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
  onToggleProductGroupExpanded: (domain: string) => void;
  searchQuery?: string;
  activeSectionId?: string | null;
}

export function DndOrganizer({
  filteredProducts,
  unassignedProducts,
  orderedSections,
  productsBySection,
  assignmentByItemId,
  itemIdForProduct,
  expandedProductGroups,
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
  onToggleProductGroupExpanded,
  searchQuery = '',
  activeSectionId = null,
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