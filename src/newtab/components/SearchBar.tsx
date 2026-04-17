import React, { useCallback, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
}

// ─── Component ────────────────────────────────────────────────────────

export function SearchBar({
  value,
  onChange,
  resultCount,
  totalCount,
}: SearchBarProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleClear = useCallback((): void => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleFocus = useCallback((): void => {
    setFocused(true);
  }, []);

  const handleBlur = useCallback((): void => {
    setFocused(false);
  }, []);

  const showResults = value.length > 0;

  return (
    <div className="relative flex items-center">
      {/* Search icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="text-text-secondary pointer-events-none absolute left-3 h-4 w-4"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        className="border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark rounded-chip placeholder:text-text-secondary focus:border-accent-sage focus-visible:ring-accent-blue/40 min-h-11 w-full border py-2 pr-24 pl-9 text-sm transition-colors outline-none focus-visible:ring-2"
        placeholder="Search tabs..."
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label="Search tabs"
      />

      {/* Right-side controls */}
      <div className="absolute right-3 flex items-center gap-2">
        {/* Result count */}
        {showResults && (
          <span className="text-text-secondary text-xs whitespace-nowrap">
            {resultCount} of {totalCount}
          </span>
        )}

        {/* Clear button */}
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-chip text-text-secondary hover:bg-surface-light hover:text-text-primary-light dark:hover:bg-surface-dark dark:hover:text-text-primary-dark focus-visible:ring-accent-blue/40 flex h-11 w-11 cursor-pointer items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Keyboard shortcut hint */}
        {!focused && value.length === 0 && (
          <kbd className="rounded-chip border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark font-body text-text-secondary border px-1.5 py-0.5 text-[11px]">
            /
          </kbd>
        )}
      </div>
    </div>
  );
}
