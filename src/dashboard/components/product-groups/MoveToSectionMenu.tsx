import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Section } from '../../../types';
import { useI18n } from '../../hooks/useI18n';
import { useFocusFollow } from '../../hooks/useFocusFollow';

interface MoveToSectionMenuProps {
  sections: readonly Section[];
  currentSectionId: string | null;
  onMoveToSection: (sectionId: string) => void;
  onMoveToNoSection: () => void;
  groupName: string;
  /** Tags the trigger so focus can find it again after the card moves sections. */
  productKey: string;
}

/** Matches the menu's `w-40`, needed before the menu exists to right-align it. */
const MENU_WIDTH = 160;
const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 4;

export function MoveToSectionMenu({
  sections,
  currentSectionId,
  onMoveToSection,
  onMoveToNoSection,
  groupName,
  productKey,
}: MoveToSectionMenuProps): React.ReactElement {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const menuLabel = t('moveToSectionFor', { name: groupName });
  // Choosing a section remounts this card elsewhere; focus goes with it.
  useFocusFollow(triggerRef, `[data-move-menu-trigger="${CSS.escape(productKey)}"]`);

  const showNoSectionItem = currentSectionId !== null;
  const itemCount = sections.length + (showNoSectionItem ? 1 : 0);

  function closeMenu(shouldReturnFocus: boolean): void {
    setIsOpen(false);
    if (shouldReturnFocus) triggerRef.current?.focus();
  }

  // Full ARIA menu keyboard pattern: move focus into the menu on open. Every
  // close goes through `closeMenu`, which decides whether focus returns to the
  // trigger — the focused item is about to unmount and would strand it.
  useEffect(() => {
    if (!isOpen) return undefined;

    itemRefs.current[0]?.focus();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // The menu is portalled out of the trigger's subtree, so both nodes have
      // to be excluded by hand or clicking an item would close the menu before
      // its click handler runs.
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      // The user has moved on to something else; don't pull focus back.
      setIsOpen(false);
    };
    // A fixed menu cannot follow its trigger, so close instead of drifting —
    // and if an item had focus, hand it back rather than drop it on the body.
    const handleViewportChange = () => {
      closeMenu(menuRef.current?.contains(document.activeElement) ?? false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [isOpen]);

  // Keep the opened menu inside the viewport. Its height is only known once
  // rendered, so clamp after layout rather than guessing from item count.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!isOpen || !menu) return;

    const rect = menu.getBoundingClientRect();
    const top = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.top, window.innerHeight - rect.height - VIEWPORT_MARGIN),
    );
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.left, window.innerWidth - rect.width - VIEWPORT_MARGIN),
    );
    if (top !== rect.top || left !== rect.left) setPosition({ top, left });
  }, [isOpen]);

  function openMenu(): void {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({ top: rect.bottom + TRIGGER_GAP, left: rect.right - MENU_WIDTH });
    }
    setActiveIndex(0);
    setIsOpen(true);
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
      // The dashboard's global Escape clears search and the section filter;
      // dismissing this menu must not do that too.
      e.stopPropagation();
      closeMenu(true);
    } else if (e.key === 'Tab') {
      // Let Tab move on naturally from the trigger's place in the page.
      closeMenu(true);
    }
  }

  // Nothing to move to: no sections exist and there's no "no section" item
  // to offer either. Render nothing rather than a trigger that opens an
  // empty, itemless ARIA menu.
  if (itemCount === 0) {
    return <></>;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? closeMenu(false) : openMenu())}
        className="rounded-chip text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark flex h-6 shrink-0 cursor-pointer items-center gap-1 px-1.5 text-3xs font-mono transition-colors focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none"
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        data-move-menu-trigger={productKey}
      >
        {t('moveToSection')}
      </button>

      {/* Portalled to the body: product cards clip their content and stack
          their header below their body, which would cut the menu in half. */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-label={menuLabel}
          onKeyDown={handleMenuKeyDown}
          style={{ top: position.top, left: position.left }}
          className="fixed z-50 w-40 overflow-hidden rounded-md border border-border-color bg-bg-card shadow-lg flex flex-col font-body py-1"
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
                closeMenu(true);
                // Already here: nothing to write, nothing to announce.
                if (section.id !== currentSectionId) onMoveToSection(section.id);
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
                  closeMenu(true);
                  onMoveToNoSection();
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-surface-light dark:hover:bg-surface-dark cursor-pointer transition-colors"
              >
                {t('moveToNoSection')}
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}
