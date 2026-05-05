import React, { useEffect, useRef, useState } from 'react';
import type { CustomGroup } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  confettiEnabled: boolean;
  customGroups: CustomGroup[];
  onSetTheme: (theme: 'light' | 'dark' | 'system') => void;
  onToggleSound: () => void;
  onToggleConfetti: () => void;
  onResetSortOrder: () => void;
  onAddCustomGroup: (group: CustomGroup) => void;
  onRemoveCustomGroup: (groupKey: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────

export function SettingsPanel({
  open,
  onClose,
  theme,
  soundEnabled,
  confettiEnabled,
  customGroups,
  onSetTheme,
  onToggleSound,
  onToggleConfetti,
  onResetSortOrder,
  onAddCustomGroup,
  onRemoveCustomGroup,
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
        className="border-2 border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark relative w-full max-w-sm animate-[fadeUp_0.3s_ease_both] overflow-y-auto max-h-[90vh] p-6"
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

          {/* Divider */}
          <hr className="border-border-light dark:border-border-dark" />

          {/* Custom Groups */}
          <CustomGroupsSection
            groups={customGroups}
            onAdd={onAddCustomGroup}
            onRemove={onRemoveCustomGroup}
          />
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

// ─── Custom Groups sub-component ──────────────────────────────────────

interface CustomGroupsSectionProps {
  groups: CustomGroup[];
  onAdd: (group: CustomGroup) => void;
  onRemove: (groupKey: string) => void;
}

function CustomGroupsSection({
  groups,
  onAdd,
  onRemove,
}: CustomGroupsSectionProps): React.ReactElement {
  const [hostname, setHostname] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const h = hostname.trim().toLowerCase();
    const l = label.trim();
    if (!h) { setError('Hostname is required'); return; }
    if (!l) { setError('Label is required'); return; }
    const key = h.replace(/[^a-z0-9]/g, '-');
    if (groups.some((g) => g.groupKey === key || g.hostname === h)) {
      setError('A rule for this hostname already exists');
      return;
    }
    onAdd({ hostname: h, groupKey: key, groupLabel: l });
    setHostname('');
    setLabel('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
        Custom groups
      </span>

      {/* Existing rules */}
      {groups.length > 0 && (
        <ul className="flex flex-col gap-1">
          {groups.map((g) => (
            <li
              key={g.groupKey}
              className="flex items-center justify-between rounded-chip bg-surface-light dark:bg-surface-dark px-3 py-1.5"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-body text-text-primary-light dark:text-text-primary-dark text-xs font-medium truncate">
                  {g.groupLabel}
                </span>
                <span className="font-body text-text-secondary text-xs truncate">
                  {g.hostname ?? g.hostnameEndsWith}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(g.groupKey)}
                aria-label={`Remove ${g.groupLabel} group`}
                className="ml-2 shrink-0 text-accent-red hover:bg-accent-red/10 focus-visible:ring-accent-red/40 rounded-chip flex h-7 w-7 items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add form */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Hostname (e.g. notion.so)"
          value={hostname}
          onChange={(e) => { setHostname(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          className="font-body text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-chip px-3 py-2 text-xs focus-visible:ring-accent-blue/40 focus-visible:ring-2 focus-visible:outline-none w-full"
        />
        <input
          type="text"
          placeholder="Label (e.g. Notion)"
          value={label}
          onChange={(e) => { setLabel(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          className="font-body text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-chip px-3 py-2 text-xs focus-visible:ring-accent-blue/40 focus-visible:ring-2 focus-visible:outline-none w-full"
        />
        {error && (
          <span className="text-accent-red text-xs font-body">{error}</span>
        )}
        <button
          type="button"
          onClick={handleAdd}
          className="font-body text-xs text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-blue/40 rounded-chip px-3 py-1.5 self-end transition-colors focus-visible:ring-2 focus-visible:outline-none cursor-pointer min-h-11"
        >
          Add rule
        </button>
      </div>
    </div>
  );
}
