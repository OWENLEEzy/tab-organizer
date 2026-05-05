import React, { useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  confettiEnabled: boolean;
  onSetTheme: (theme: 'light' | 'dark' | 'system') => void;
  onToggleSound: () => void;
  onToggleConfetti: () => void;
  onResetSortOrder: () => void;
}

// ─── Component ────────────────────────────────────────────────────────

export function SettingsPanel({
  open,
  onClose,
  theme,
  soundEnabled,
  confettiEnabled,
  onSetTheme,
  onToggleSound,
  onToggleConfetti,
  onResetSortOrder,
}: SettingsPanelProps): React.ReactElement | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const activePanel = panelRef.current;
    if (!activePanel) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = activePanel.querySelectorAll<HTMLElement>(focusableSelector);
    focusables[0]?.focus();

    function handleTabKey(e: KeyboardEvent): void {
      if (e.key !== 'Tab') return;

      const currentFocusables = activePanel!.querySelectorAll<HTMLElement>(focusableSelector);
      if (currentFocusables.length === 0) return;

      const firstFocusable = currentFocusables[0];
      const lastFocusable = currentFocusables[currentFocusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
        return;
      }

      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }

    activePanel.addEventListener('keydown', handleTabKey);
    return () => {
      activePanel.removeEventListener('keydown', handleTabKey);
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Dismiss backdrop"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="border-2 border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark relative w-full max-w-sm animate-[fadeUp_0.3s_ease_both] p-6"
      >
        {/* Title + Close */}
        <div className="mb-6 flex items-center justify-between">
          <h3
            id="settings-title"
            className="font-heading text-text-primary-light dark:text-text-primary-dark text-lg font-semibold"
          >
            Settings
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-chip text-text-secondary hover:bg-surface-light hover:text-text-primary-light focus-visible:ring-accent-blue/40 dark:hover:bg-surface-dark dark:hover:text-text-primary-dark flex h-11 w-11 cursor-pointer items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Close settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-4">
          <ThemeRow value={theme} onChange={onSetTheme} />
          <ToggleRow
            id="setting-sound"
            label="Sound effects"
            checked={soundEnabled}
            onChange={onToggleSound}
          />
          <ToggleRow
            id="setting-confetti"
            label="Confetti animation"
            checked={confettiEnabled}
            onChange={onToggleConfetti}
          />
          {/* Sort order reset */}
          <div className="flex items-center justify-between">
            <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm">
              Sort order
            </span>
            <button
              type="button"
              onClick={onResetSortOrder}
              className="rounded-chip font-body text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-blue/40 min-h-11 cursor-pointer px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              Reset to default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Theme selector sub-component ────────────────────────────────────

interface ThemeRowProps {
  value: 'light' | 'dark' | 'system';
  onChange: (theme: 'light' | 'dark' | 'system') => void;
}

const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function ThemeRow({ value, onChange }: ThemeRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <span
        id="theme-label"
        className="font-body text-text-primary-light dark:text-text-primary-dark text-sm"
      >
        Theme
      </span>
      <div
        role="group"
        aria-labelledby="theme-label"
        className="rounded-chip border-border-light dark:border-border-dark inline-flex overflow-hidden border"
      >
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`font-body min-h-11 min-w-11 cursor-pointer px-4 text-xs transition-colors ${
              value === opt.value
                ? 'bg-accent-sage text-white'
                : 'text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Toggle sub-component ─────────────────────────────────────────────

interface ToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleRow({ id, label, checked, onChange }: ToggleRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <label
        htmlFor={id}
        className="font-body text-text-primary-light dark:text-text-primary-dark text-sm"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`focus-visible:ring-accent-blue/40 relative inline-flex h-11 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
          checked
            ? 'bg-accent-sage'
            : 'bg-border-light dark:bg-border-dark'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-7' : 'translate-x-1.5'
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
