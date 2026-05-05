import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DomainCard } from './DomainCard';
import type { TabGroup } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────

interface SortableDomainCardProps {
  group: TabGroup;
  sortableId?: string;
  expanded?: boolean;
  maxChipsVisible?: number;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onSaveTab: (url: string, title: string) => void;
  onFocusTab: (url: string) => void;
  focusedUrl?: string | null;
  closingUrls?: Set<string>;
  selectedUrls?: Set<string>;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded?: (domain: string) => void;
  draggableTabs?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────

export function SortableDomainCard({
  group,
  sortableId,
  expanded,
  maxChipsVisible,
  onCloseDomain,
  onCloseDuplicates,
  onCloseTab,
  onSaveTab,
  onFocusTab,
  focusedUrl,
  closingUrls,
  selectedUrls,
  onChipClick,
  onToggleExpanded,
  draggableTabs,
}: SortableDomainCardProps): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId ?? group.domain });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <DomainCard
        group={group}
        dragHandleProps={{ ...attributes, ...listeners }}
        expanded={expanded}
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
        draggableTabs={draggableTabs}
      />
    </div>
  );
}
