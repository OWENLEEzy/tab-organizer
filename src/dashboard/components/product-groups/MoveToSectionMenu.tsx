import React, { useEffect, useId, useRef, useState } from 'react';
import type { Section } from '../../../types';
import { useI18n } from '../../hooks/useI18n';

interface MoveToSectionMenuProps {
  sections: readonly Section[];
  currentSectionId: string | null;
  onMoveToSection: (sectionId: string) => void;
  onMoveToNoSection: () => void;
  groupName: string;
}

export function MoveToSectionMenu({
  sections,
  currentSectionId,
  onMoveToSection,
  onMoveToNoSection,
  groupName,
}: MoveToSectionMenuProps): React.ReactElement {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const menuLabel = t('moveToSectionFor', { name: groupName });

  const showNoSectionItem = currentSectionId !== null;
  const itemCount = sections.length + (showNoSectionItem ? 1 : 0);

  // Full ARIA menu keyboard pattern: move focus into the menu on open, and
  // restore it to the trigger on close — otherwise Tab/Escape strand focus
  // on an element that's about to unmount.
  useEffect(() => {
    if (!isOpen) return undefined;

    itemRefs.current[0]?.focus();

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  function closeAndReturnFocus(): void {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function moveActive(nextIndex: number): void {
    if (itemCount === 0) return;
    const wrapped = (nextIndex + itemCount) % itemCount;
    setActiveIndex(wrapped);
    itemRefs.current[wrapped]?.focus();
  }

  function handleMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveActive(activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(activeIndex - 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeAndReturnFocus();
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setActiveIndex(0);
          setIsOpen((prev) => !prev);
        }}
        className="rounded-chip text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark flex h-6 shrink-0 cursor-pointer items-center gap-1 px-1.5 text-3xs font-mono transition-colors focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none"
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
      >
        {t('moveToSection')}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-label={menuLabel}
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full mt-1 z-50 w-40 overflow-hidden rounded-md border border-border-color bg-bg-card shadow-lg flex flex-col font-body py-1"
        >
          {sections.map((section, index) => (
            <button
              key={section.id}
              ref={(el) => { itemRefs.current[index] = el; }}
              type="button"
              role="menuitem"
              tabIndex={index === activeIndex ? 0 : -1}
              aria-current={section.id === currentSectionId ? true : undefined}
              onClick={() => {
                setIsOpen(false);
                onMoveToSection(section.id);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-light dark:hover:bg-surface-dark cursor-pointer transition-colors"
            >
              {section.emoji ? `${section.emoji} ${section.name}` : section.name}
            </button>
          ))}
          {showNoSectionItem && (
            <>
              {sections.length > 0 && (
                <div className="mx-2 my-1 h-px bg-border-light dark:bg-border-dark opacity-50" />
              )}
              <button
                ref={(el) => { itemRefs.current[sections.length] = el; }}
                type="button"
                role="menuitem"
                tabIndex={sections.length === activeIndex ? 0 : -1}
                onClick={() => {
                  setIsOpen(false);
                  onMoveToNoSection();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-light dark:hover:bg-surface-dark cursor-pointer transition-colors"
              >
                {t('moveToNoSection')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
