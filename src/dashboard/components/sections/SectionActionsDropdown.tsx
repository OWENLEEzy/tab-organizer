import React, { useState, useEffect, useRef } from 'react';
import type { Section, TabGroup } from '../../../types';
import { useI18n } from '../../hooks/useI18n';

interface SectionActionsDropdownProps {
  section?: Section;
  tabCount: number;
  title: string;
  onRenameSection?: (group: Section) => void;
  onDeleteSection?: (group: Section) => void;
  onCloseSection: (groups: TabGroup[], title: string) => void;
  items: TabGroup[];
}

export function SectionActionsDropdown({
  section,
  tabCount,
  title,
  onRenameSection,
  onDeleteSection,
  onCloseSection,
  items,
}: SectionActionsDropdownProps): React.ReactElement | null {
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

  if (!section && tabCount === 0) return null;

  return (
    <div className="relative flex items-center gap-1" ref={menuRef}>
      {section && tabCount === 0 && onDeleteSection && (
        <button
          type="button"
          onClick={() => onDeleteSection(section)}
          aria-label={`${t('organizerBtnDelete')} ${title}`}
          className="rounded-chip text-accent-red hover:bg-accent-red/10 min-h-[var(--spacing-button-height)] cursor-pointer px-2 text-xs focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none"
        >
          {t('organizerBtnDelete')}
        </button>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-chip text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark flex min-h-[var(--spacing-button-height)] cursor-pointer items-center justify-center gap-1 px-2 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none"
        aria-label={`${t('organizerBtnManage')} ${title}`}
        aria-expanded={isOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
        <span>{t('organizerBtnManage')}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 overflow-hidden rounded-md border border-border-color bg-bg-card shadow-lg flex flex-col font-body py-1">
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
