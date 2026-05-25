import React, { useRef, useEffect } from 'react';
import type { ManualGroup } from '../../types';
import { useI18n } from '../hooks/useI18n';

interface SpaceSwitcherProps {
  spaces: ManualGroup[];
  activeSpaceId: string | null;
  onChange: (id: string | null) => void;
  onCreateSpace: () => void;
  isFocused?: boolean;
}

export function SpaceSwitcher({
  spaces,
  activeSpaceId,
  onChange,
  onCreateSpace,
  isFocused,
}: SpaceSwitcherProps) {
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
          'button:not([title="' + t('spaceSwitcherNew') + '"])',
        ) || [],
      );
      const activeElement = document.activeElement as HTMLButtonElement;
      let currentIndex = buttons.indexOf(activeElement);

      if (currentIndex === -1) {
        const ids = [null, ...spaces.map((s) => s.id)];
        currentIndex = ids.indexOf(activeSpaceId);
      }

      let nextIndex = currentIndex;
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % buttons.length;
      } else {
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      }

      buttons[nextIndex]?.focus();

      const ids = [null, ...spaces.map((s) => s.id)];
      onChange(ids[nextIndex]);
      e.preventDefault();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap gap-2 items-center pt-3 pb-1 mb-2 outline-none"
      onKeyDown={handleKeyDown}
      role="toolbar"
      aria-label="Space Switcher"
    >
      <button
        onClick={() => onChange(null)}
        tabIndex={activeSpaceId === null ? 0 : -1}
        className={`px-4 py-1.5 rounded-none text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent-terracotta/40 outline-none ${
          activeSpaceId === null
            ? 'bg-accent-terracotta/10 text-accent-terracotta dark:bg-accent-terracotta/20 dark:text-terracotta-400 shadow-sm border border-accent-terracotta/20 dark:border-accent-terracotta/40'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
        }`}
      >
        {t('spaceSwitcherAll')}
      </button>

      {spaces.map((space) => (
        <button
          key={space.id}
          onClick={() => onChange(space.id)}
          tabIndex={activeSpaceId === space.id ? 0 : -1}
          className={`px-4 py-1.5 rounded-none text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent-terracotta/40 outline-none ${
            activeSpaceId === space.id
              ? 'bg-accent-terracotta/10 text-accent-terracotta dark:bg-accent-terracotta/20 dark:text-terracotta-400 shadow-sm border border-accent-terracotta/20 dark:border-accent-terracotta/40'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
          }`}
        >
          <span>{space.name}</span>
        </button>
      ))}

      <button
        onClick={onCreateSpace}
        tabIndex={-1}
        className="px-3 py-1.5 rounded-none text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors border border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-accent-terracotta/40 outline-none"
        aria-label={t('spaceSwitcherNew')}
        title={t('spaceSwitcherNew')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
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
