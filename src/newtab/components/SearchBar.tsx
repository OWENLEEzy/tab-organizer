import React, { useCallback, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
}

const COMMANDS = [
  { key: '/dupes', label: 'Filter duplicate tabs', desc: 'Find duplicate tabs and keep the active one' },
  { key: '/stale', label: 'Filter stale tabs', desc: 'Find tabs idle for more than 3 days' },
  { key: '/space:', label: 'Switch Space view', desc: 'Filter by manual space name (e.g. /space:work)' },
];

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

  const handleFocus = useCallback((): void => {
    setFocused(true);
  }, []);

  const handleBlur = useCallback((): void => {
    // Small delay to let onMouseDown trigger choice
    setTimeout(() => setFocused(false), 150);
  }, []);

  const showCommands = focused && value.startsWith('/') && !value.includes(' ');
  const filteredCommands = COMMANDS.filter((cmd) => cmd.key.startsWith(value));

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
        onChange(chosenCmd);
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
          type="search"
          className="border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark rounded-chip placeholder:text-text-secondary focus:border-accent-sage focus-visible:ring-accent-blue/40 min-h-11 w-full border py-2 pr-24 pl-9 text-sm transition-colors outline-none focus-visible:ring-2"
          placeholder="Search tabs or type / for commands..."
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
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

      {/* Floating suggestion panel */}
      {showCommands && filteredCommands.length > 0 && (
        <div
          className="absolute top-12 left-0 z-50 w-full rounded-lg border border-border-light bg-[#FFFDF9]/95 dark:bg-card-dark/95 p-1.5 shadow-lg backdrop-blur-md dark:border-border-dark font-body"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
        >
          <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-text-secondary uppercase select-none">
            Quick Commands
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
                    onChange(cmd.key);
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
                      Press Enter / Tab
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
