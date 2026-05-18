import React, { useEffect, useRef, useState } from 'react';
import type { CustomGroup, AppSettings, ManualGroup } from '../../types';

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
  // Spaces & Rules props
  manualGroups?: ManualGroup[];
  onUpdateGroup?: (id: string, updates: Partial<Omit<ManualGroup, 'id'>>) => void;
  onDeleteGroup?: (id: string) => void;
  // Keyboard Bindings props
  keyBindings?: AppSettings['keyBindings'];
  onUpdateKeyBinding?: (key: keyof AppSettings['keyBindings'], binding: string) => void;
  onResetKeyBindings?: () => void;
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
  manualGroups = [],
  onUpdateGroup = () => {},
  onDeleteGroup = () => {},
  keyBindings,
  onUpdateKeyBinding = () => {},
  onResetKeyBindings = () => {},
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

          {/* Divider */}
          {manualGroups.length > 0 && (
            <>
              <hr className="border-border-light dark:border-border-dark" />
              <SpacesSection
                spaces={manualGroups}
                onUpdateGroup={onUpdateGroup}
                onDeleteGroup={onDeleteGroup}
              />
            </>
          )}

          {/* Divider */}
          {keyBindings && (
            <>
              <hr className="border-border-light dark:border-border-dark" />
              <KeyboardSection
                keyBindings={keyBindings}
                onUpdateKeyBinding={onUpdateKeyBinding}
                onResetKeyBindings={onResetKeyBindings}
              />
            </>
          )}
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

// ─── Spaces Section sub-component ─────────────────────────────────────

interface SpacesSectionProps {
  spaces: ManualGroup[];
  onUpdateGroup: (id: string, updates: Partial<Omit<ManualGroup, 'id'>>) => void;
  onDeleteGroup: (id: string) => void;
}

function SpacesSection({ spaces, onUpdateGroup, onDeleteGroup }: SpacesSectionProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
        Spaces & Rules
      </span>
      <div className="flex flex-col gap-4">
        {spaces.map((space) => {
          const rulesText = (space.autoRules ?? []).map(r => r.pattern).join('\n');
          return (
            <div key={space.id} className="border border-border-light dark:border-border-dark rounded-md p-3 bg-surface-light dark:bg-surface-dark flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={2}
                  value={space.emoji ?? ''}
                  placeholder="✨"
                  onChange={(e) => onUpdateGroup(space.id, { emoji: e.target.value })}
                  className="w-10 text-center font-body text-text-primary-light dark:text-text-primary-dark bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded px-1.5 py-1 text-sm focus-visible:ring-accent-blue/40 focus-visible:ring-2 focus-visible:outline-none"
                />
                <input
                  type="text"
                  value={space.name}
                  onChange={(e) => onUpdateGroup(space.id, { name: e.target.value })}
                  className="flex-1 font-body text-text-primary-light dark:text-text-primary-dark bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded px-2 py-1 text-sm focus-visible:ring-accent-blue/40 focus-visible:ring-2 focus-visible:outline-none"
                />
                <button
                  type="button"
                  onClick={() => onDeleteGroup(space.id)}
                  className="text-accent-red hover:bg-accent-red/10 rounded p-1 flex items-center justify-center cursor-pointer shrink-0"
                  title="Delete Space"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 12m-4.72 0-.34-12M4.75 6.75h14.5M3.375 5.25h17.25m-1.5 0-.825 15.6a2.25 2.25 0 0 1-2.247 2.13H7.43a2.25 2.25 0 0 1-2.247-2.13L4.35 5.25" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-body text-text-secondary text-[11px]">Auto-assignment rules (one pattern per line)</span>
                <textarea
                  value={rulesText}
                  placeholder="e.g. github&#10;vercel"
                  onChange={(e) => {
                    const patterns = e.target.value.split('\n').filter(Boolean);
                    onUpdateGroup(space.id, {
                      autoRules: patterns.map(p => ({ pattern: p, type: 'hostname' }))
                    });
                  }}
                  className="font-body text-xs text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded px-2 py-1.5 focus-visible:ring-accent-blue/40 focus-visible:ring-2 focus-visible:outline-none w-full h-16 resize-none"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Keyboard Shortcuts Section sub-component ─────────────────────────

interface KeyboardSectionProps {
  keyBindings: AppSettings['keyBindings'];
  onUpdateKeyBinding: (key: keyof AppSettings['keyBindings'], binding: string) => void;
  onResetKeyBindings: () => void;
}

const SHORTCUT_LABELS: Record<string, string> = {
  switchSpaceN: 'Switch to Space 1-9',
  switchSpaceAll: 'Switch to "All"',
  cyclePrev: 'Cycle Space Left',
  cycleNext: 'Cycle Space Right',
  focusSearch: 'Focus Search',
  clearFilter: 'Clear Space Filter',
};

function KeyboardSection({ keyBindings, onUpdateKeyBinding, onResetKeyBindings }: KeyboardSectionProps): React.ReactElement {
  const [recordingKey, setRecordingKey] = useState<keyof AppSettings['keyBindings'] | null>(null);

  useEffect(() => {
    if (!recordingKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingKey(null);
        return;
      }

      const parts: string[] = [];
      if (e.metaKey) parts.push('Meta');
      if (e.ctrlKey) parts.push('Control');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');

      let mainKey = e.key;
      if (mainKey === ' ') mainKey = 'Space';
      if (mainKey.length === 1) mainKey = mainKey.toUpperCase();

      if (!['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
        parts.push(mainKey);
        const formatted = parts.join('+');
        onUpdateKeyBinding(recordingKey, formatted);
        setRecordingKey(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingKey, onUpdateKeyBinding]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
          Keyboard Shortcuts
        </span>
        <button
          type="button"
          onClick={onResetKeyBindings}
          className="rounded-chip font-body text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-blue/40 px-2 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none min-h-11"
        >
          Reset keys
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {Object.entries(SHORTCUT_LABELS).map(([key, label]) => {
          const binding = keyBindings[key as keyof typeof keyBindings] || 'None';
          const isRecording = recordingKey === key;

          return (
            <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded bg-surface-light dark:bg-surface-dark border border-border-light/50 dark:border-border-dark/50 min-h-11">
              <span className="font-body text-xs text-text-primary-light dark:text-text-primary-dark">{label}</span>
              <button
                type="button"
                onClick={() => setRecordingKey(isRecording ? null : (key as keyof AppSettings['keyBindings']))}
                className={`font-body text-xs px-2.5 py-1 rounded border transition-all cursor-pointer min-h-8 min-w-[70px] ${
                  isRecording
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 animate-pulse'
                    : 'bg-white dark:bg-card-dark text-text-secondary border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                {isRecording ? 'Press key...' : binding}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
