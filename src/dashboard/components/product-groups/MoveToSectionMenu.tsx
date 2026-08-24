import React, { useEffect, useRef, useState } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-chip text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark flex h-6 shrink-0 cursor-pointer items-center gap-1 px-1.5 text-3xs font-mono transition-colors focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none"
        aria-label={t('moveToSectionFor', { name: groupName })}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {t('moveToSection')}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-50 w-40 overflow-hidden rounded-md border border-border-color bg-bg-card shadow-lg flex flex-col font-body py-1"
        >
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              role="menuitem"
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
          {currentSectionId !== null && (
            <>
              {sections.length > 0 && (
                <div className="mx-2 my-1 h-px bg-border-light dark:bg-border-dark opacity-50" />
              )}
              <button
                type="button"
                role="menuitem"
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
