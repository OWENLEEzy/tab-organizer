import React, { useRef, useEffect } from 'react';
import type { ManualGroup } from '../../types';

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
  isFocused
}: SpaceSwitcherProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const ids = [null, ...spaces.map(s => s.id)];
      const currentIndex = ids.indexOf(activeSpaceId);
      let nextIndex = currentIndex;

      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % ids.length;
      } else {
        nextIndex = (currentIndex - 1 + ids.length) % ids.length;
      }

      onChange(ids[nextIndex]);
      e.preventDefault();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap gap-2 items-center mb-6 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="toolbar"
      aria-label="Space Switcher"
    >
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          activeSpaceId === null
            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200 shadow-sm border border-blue-200 dark:border-blue-800'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
        }`}
      >
        All
      </button>

      {spaces.map((space) => (
        <button
          key={space.id}
          onClick={() => onChange(space.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
            activeSpaceId === space.id
              ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200 shadow-sm border border-blue-200 dark:border-blue-800'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
          }`}
        >
          {space.emoji && <span>{space.emoji}</span>}
          <span>{space.name}</span>
        </button>
      ))}

      <button
        onClick={onCreateSpace}
        className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors border border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 flex items-center justify-center"
        aria-label="Create new Space"
        title="Create new Space"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}
