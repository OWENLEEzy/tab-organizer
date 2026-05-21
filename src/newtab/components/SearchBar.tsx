import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n';

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { t } = useI18n();

  const commands = useMemo(() => [
    { key: '/dupes', label: t('cmdDupesLabel'), desc: t('cmdDupesDesc') },
    { key: '/stale', label: t('cmdStaleLabel'), desc: t('cmdStaleDesc') },
    { key: '/space:', label: t('cmdSpaceLabel'), desc: t('cmdSpaceDesc') },
  ], [t]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onChange(e.target.value);
      setSelectedIndex(0);
    },
    [onChange],
  );

  const handleClear = useCallback((): void => {
    onChange('');
    setSelectedIndex(0);
    inputRef.current?.focus();
  }, [onChange]);

  const handleSearchFocus = useCallback((): void => {
    setFocused(true);
  }, []);

  const handleSearchBlur = useCallback((): void => {
    // Small delay to let onMouseDown trigger choice
    setTimeout(() => setFocused(false), 150);
  }, []);

  // Show commands when focused AND:
  // 1. Value is empty (great for discoverability!)
  // 2. Or value starts with '/' and is not already a fully entered command
  const showCommands =
    focused &&
    (value === '' ||
      (value.startsWith('/') &&
        !value.includes(' ') &&
        !commands.some((cmd) => cmd.key === value)));

  // If value is empty, show all commands; otherwise filter by prefix
  const filteredCommands = commands.filter((cmd) =>
    value === '' ? true : cmd.key.startsWith(value)
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.currentTarget.blur();
        return;
      }

      if (!showCommands || filteredCommands.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const chosenCmd = filteredCommands[selectedIndex].key;
        // Append a space for /dupes and /stale to naturally close the menu and allow typing search term
        const finalCmd = chosenCmd === '/space:' ? chosenCmd : chosenCmd + ' ';
        onChange(finalCmd);
        setSelectedIndex(0);
      }
    },
    [showCommands, filteredCommands, selectedIndex, onChange],
  );

  const showResults = value.length > 0;

  return (
    <div className="relative flex flex-col w-full">
      <div className="relative flex items-center w-full">
        {/* Search icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="text-text-secondary pointer-events-none absolute left-3 size-4"
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
          role="searchbox"
          className="border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark rounded-chip placeholder:text-text-secondary focus:border-accent-sage focus-visible:ring-accent-blue/40 min-h-[--spacing-button-icon] w-full border py-2 pr-24 pl-9 text-sm transition-colors outline-none focus-visible:ring-2"
          placeholder={t('searchPlaceholderTabs')}
          value={value}
          onChange={handleInputChange}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          onKeyDown={handleKeyDown}
          aria-label="Search tabs"
        />

        {/* Right-side controls */}
        <div className="absolute right-3 flex items-center gap-2">
          {/* Result count */}
          {showResults && (
            <span className="text-text-secondary text-xs whitespace-nowrap">
              {t('searchMatchingOfPlural', { count: resultCount, total: totalCount })}
            </span>
          )}

          {/* Clear button */}
          {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-chip text-text-secondary hover:bg-surface-light hover:text-text-primary-light dark:hover:bg-surface-dark dark:hover:text-text-primary-dark focus-visible:ring-accent-blue/40 flex size-[--spacing-button-icon] cursor-pointer items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-3.5"
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

      {/* Floating suggestion panel */}
      {showCommands && filteredCommands.length > 0 && (
        <div
          className="absolute top-12 left-0 z-50 w-full rounded-lg border border-border-light bg-[#FFFDF9]/95 dark:bg-card-dark/95 p-1.5 shadow-lg backdrop-blur-md dark:border-border-dark font-body"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
        >
          <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-text-secondary uppercase select-none">
            {value === '' ? t('cmdPanelTitleHint') : t('cmdPanelTitle')}
          </div>
          <div className="flex flex-col gap-0.5 mt-1">
            {filteredCommands.map((cmd, idx) => {
              const active = idx === selectedIndex;
              return (
                <button
                  key={cmd.key}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevents input blur
                    const chosenCmd = cmd.key;
                    const finalCmd = chosenCmd === '/space:' ? chosenCmd : chosenCmd + ' ';
                    onChange(finalCmd);
                    setSelectedIndex(0);
                  }}
                  className={`flex items-center justify-between rounded px-2.5 py-2 text-left transition-colors duration-100 cursor-pointer ${
                    active
                      ? 'bg-accent-blue/10 text-accent-blue'
                      : 'hover:bg-surface-light dark:hover:bg-surface-dark text-text-primary-light dark:text-text-primary-dark'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-semibold">{cmd.key}</span>
                    <span className="text-[11px] text-text-secondary mt-0.5">{cmd.desc}</span>
                  </div>
                  {active && (
                    <span className="text-[10px] opacity-60 text-accent-blue font-medium">
                      {t('cmdHintEnter')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
