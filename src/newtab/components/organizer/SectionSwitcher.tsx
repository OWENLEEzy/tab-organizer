import React, { useRef, useEffect } from 'react';
import type { Section } from '../../../types';
import { useI18n } from '../../hooks/useI18n';

interface SectionSwitcherProps {
  sections: Section[];
  sectionIds?: (string | null)[];
  activeSectionId: string | null;
  onChange: (id: string | null) => void;
  onCreateSection: () => void;
  isFocused?: boolean;
}

export function SectionSwitcher({
  sections,
  sectionIds,
  activeSectionId,
  onChange,
  onCreateSection,
  isFocused,
}: SectionSwitcherProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (isFocused && containerRef.current) {
      const activeBtn = containerRef.current.querySelector<HTMLButtonElement>('[tabindex="0"]');
      activeBtn?.focus();
    }
  }, [isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const buttons = Array.from(
        containerRef.current?.querySelectorAll<HTMLButtonElement>(
          'button:not([title="' + t('sectionSwitcherNew') + '"])',
        ) || [],
      );
      const activeElement = document.activeElement as HTMLButtonElement;
      let currentIndex = buttons.indexOf(activeElement);

      const ids = sectionIds ?? [null, ...sections.map((s) => s.id)];

      if (currentIndex === -1) {
        currentIndex = ids.indexOf(activeSectionId);
      }

      let nextIndex = currentIndex;
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % buttons.length;
      } else {
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      }

      buttons[nextIndex]?.focus();

      onChange(ids[nextIndex]);
      e.preventDefault();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap gap-3 items-center outline-none"
      onKeyDown={handleKeyDown}
      role="toolbar"
      aria-label="Section Switcher"
      tabIndex={0}
    >
      <button
        type="button"
        onClick={() => onChange(null)}
        tabIndex={activeSectionId === null ? 0 : -1}
        className={`px-4 py-1.5 rounded-chip text-xs transition-colors duration-[var(--motion-fast)] focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none ${
          activeSectionId === null
            ? 'border border-[var(--border-accent-subtle)] bg-[var(--bg-accent-subtle)] text-text-primary font-semibold'
            : 'border border-transparent text-text-secondary hover:bg-bg-surface font-medium'
        }`}
      >
        {t('sectionSwitcherAll')}
      </button>

      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onChange(section.id)}
          tabIndex={activeSectionId === section.id ? 0 : -1}
          className={`px-4 py-1.5 rounded-chip text-xs transition-colors duration-[var(--motion-fast)] focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none ${
            activeSectionId === section.id
              ? 'border border-[var(--border-accent-subtle)] bg-[var(--bg-accent-subtle)] text-text-primary font-semibold'
              : 'border border-transparent text-text-secondary hover:bg-bg-surface font-medium'
          }`}
        >
          <span>{section.name}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={onCreateSection}
        tabIndex={-1}
        className="px-3 py-1.5 rounded-chip text-xs font-medium text-text-muted hover:bg-bg-surface hover:text-text-primary transition-colors duration-[var(--motion-fast)] border border-dashed border-border-color flex items-center justify-center focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none"
        aria-label={t('sectionSwitcherNew')}
        title={t('sectionSwitcherNew')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}
