import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DomainCard } from './DomainCard';
import type { TabGroup } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────

interface SortableDomainCardProps {
  group: TabGroup;
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
}

// ─── Component ────────────────────────────────────────────────────────

export function SortableDomainCard({
  group,
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
}: SortableDomainCardProps): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.domain });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DomainCard
        group={group}
        dragHandleProps={listeners}
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
      />
    </div>
  );
}
