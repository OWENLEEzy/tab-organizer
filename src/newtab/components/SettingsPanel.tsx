import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { CustomGroup, AppSettings, ManualGroup } from '../../types';
import { useI18n } from '../hooks/useI18n';

// ─── Constants ────────────────────────────────────────────────────────

const DEFAULT_EMPTY_GROUPS: ManualGroup[] = [];

// ─── Types ────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh' | 'system';
  soundEnabled: boolean;
  confettiEnabled: boolean;
  customGroups: CustomGroup[];
  onSetTheme: (theme: 'light' | 'dark' | 'system') => void;
  onSetLanguage: (language: 'en' | 'zh' | 'system') => void;
  onToggleSound: () => void;
  onToggleConfetti: () => void;
  onResetSortOrder: () => void;
  onAddCustomGroup: (group: CustomGroup) => void;
  onRemoveCustomGroup: (groupKey: string) => void;
  // Exposed settings
  maxChipsVisible: number;
  staleThresholdDays: number;
  onSetMaxChipsVisible: (count: number) => void;
  onSetStaleThresholdDays: (days: number) => void;
  // Backup / Sync
  onExportSettings: () => void;
  onImportSettings: (json: string) => Promise<void>;
  // Spaces & Rules props
  manualGroups?: ManualGroup[];
  onUpdateGroup?: (id: string, updates: Partial<Omit<ManualGroup, 'id'>>) => void;
  onDeleteGroup?: (id: string) => void;
  onCreateGroup?: (name: string) => void;
  // Keyboard Bindings props
  keyBindings?: AppSettings['keyBindings'];
  onUpdateKeyBinding?: (key: keyof AppSettings['keyBindings'], binding: string) => void;
  onResetKeyBindings?: () => void;
}

type TabId = 'general' | 'custom-groups' | 'spaces' | 'shortcuts';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────

export function SettingsPanel({
  open,
  onClose,
  theme,
  language,
  soundEnabled,
  confettiEnabled,
  customGroups,
  onSetTheme,
  onSetLanguage,
  onToggleSound,
  onToggleConfetti,
  onResetSortOrder,
  onAddCustomGroup,
  onRemoveCustomGroup,
  maxChipsVisible,
  staleThresholdDays,
  onSetMaxChipsVisible,
  onSetStaleThresholdDays,
  onExportSettings,
  onImportSettings,
  manualGroups = DEFAULT_EMPTY_GROUPS,
  onUpdateGroup = () => {},
  onDeleteGroup = () => {},
  onCreateGroup = () => {},
  keyBindings,
  onUpdateKeyBinding = () => {},
  onResetKeyBindings = () => {},
}: SettingsPanelProps): React.ReactElement | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const { t } = useI18n();

  const onCloseEffect = useEffectEvent(onClose);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onCloseEffect();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

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

  const TAB_ITEMS: TabItem[] = [
    {
      id: 'general',
      label: t('settingsTabGeneral'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
    },
    {
      id: 'custom-groups',
      label: t('settingsTabCustomGroups'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A9 9 0 0 1 11.25 3h1.5a9 9 0 0 1 9 9v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v.25C2.25 17.5 5.5 21 9.75 21h4.5c4.25 0 7.5-3.5 7.5-8v-.25m-18 0h18" />
        </svg>
      ),
    },
    {
      id: 'spaces',
      label: t('settingsTabSpaces'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.29.08.59.182.885.303l.244.1.243-.1a15.933 15.933 0 0 1 7.744-1.181M6 6.878c-.29.08-.59.182-.885.303l-.244.1-.243-.1A15.933 15.933 0 0 0 2.25 6v.878" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V21M9.75 21h4.5M6 10.5h12v7.5A2.25 2.25 0 0 1 15.75 20.25H8.25A2.25 2.25 0 0 1 6 18v-7.5Z" />
        </svg>
      ),
    },
    {
      id: 'shortcuts',
      label: t('settingsTabShortcuts'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5h15M4.5 13.5h15m-15-6h15m-15 12h15" />
        </svg>
      ),
    },
  ];

  const MAX_CHIPS_OPTIONS = [
    { value: 4, label: t('settingsOptionChipsCount', { count: 4 }) },
    { value: 6, label: t('settingsOptionChipsCount', { count: 6 }) },
    { value: 8, label: t('settingsOptionChipsCountDefault', { count: 8 }) },
    { value: 12, label: t('settingsOptionChipsCount', { count: 12 }) },
    { value: 16, label: t('settingsOptionChipsCount', { count: 16 }) },
    { value: 20, label: t('settingsOptionChipsCount', { count: 20 }) },
    { value: 24, label: t('settingsOptionChipsCount', { count: 24 }) },
  ];

  const STALE_THRESHOLD_OPTIONS = [
    { value: 1, label: t('settingsOptionDaysCount', { count: 1 }) },
    { value: 2, label: t('settingsOptionDaysCount', { count: 2 }) },
    { value: 3, label: t('settingsOptionDaysCountDefault', { count: 3 }) },
    { value: 5, label: t('settingsOptionDaysCount', { count: 5 }) },
    { value: 7, label: t('settingsOptionDaysCount', { count: 7 }) },
    { value: 14, label: t('settingsOptionDaysCount', { count: 14 }) },
    { value: 30, label: t('settingsOptionDaysCount', { count: 30 }) },
  ];

  const LANGUAGE_OPTIONS = [
    { value: 'system', label: t('settingsLangSystem') },
    { value: 'en', label: t('settingsLangEn') },
    { value: 'zh', label: t('settingsLangZh') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Dismiss backdrop"
        className="absolute inset-0 bg-black/35 transition-opacity"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark relative w-full max-w-2xl animate-[fadeUp_0.3s_ease_both] overflow-hidden max-h-[85vh] h-[550px] rounded-card shadow-2xl flex"
      >
        {/* Left Column - Navigation */}
        <div className="w-48 border-r border-border-light/40 dark:border-border-dark/40 bg-surface-light/40 dark:bg-surface-dark/40 flex flex-col p-4 gap-1 shrink-0 select-none overflow-y-auto">
          <h3
            id="settings-title"
            className="font-heading text-text-primary-light dark:text-text-primary-dark text-base font-semibold px-2 mb-4"
          >
            {t('settingsTitle')}
          </h3>
          {TAB_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left font-body text-xs rounded-chip px-3 py-2 transition-colors cursor-pointer flex items-center gap-2 min-h-10 outline-none ${
                  isActive
                    ? 'bg-accent-blue text-white font-medium shadow-sm'
                    : 'text-text-secondary hover:bg-surface-light hover:text-text-primary-light dark:hover:bg-surface-dark dark:hover:text-text-primary-dark'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Column - Active Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card-light dark:bg-card-dark">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border-light/20 dark:border-border-dark/20">
            <h4 className="font-heading text-text-primary-light dark:text-text-primary-dark text-sm font-semibold">
              {TAB_ITEMS.find((t) => t.id === activeTab)?.label}
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="rounded-chip text-text-secondary hover:bg-surface-light hover:text-text-primary-light dark:hover:bg-surface-dark dark:hover:text-text-primary-dark flex size-[--spacing-button-icon-sm] cursor-pointer items-center justify-center transition-colors focus-visible:ring-accent-blue/40 focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Close settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.0}
                stroke="currentColor"
                className="size-4"
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

          {/* Tab Viewport */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <div className="flex flex-col gap-6">
                <SelectRow
                  id="setting-language"
                  label={t('settingsLang')}
                  value={language}
                  options={LANGUAGE_OPTIONS}
                  onChange={(val) => onSetLanguage(val as 'en' | 'zh' | 'system')}
                />
                
                <ThemeRow value={theme} onChange={onSetTheme} />
                
                <ToggleRow
                  id="setting-sound"
                  label={t('settingsOptionsSound')}
                  checked={soundEnabled}
                  onChange={onToggleSound}
                />
                
                <ToggleRow
                  id="setting-confetti"
                  label={t('settingsOptionsConfetti')}
                  checked={confettiEnabled}
                  onChange={onToggleConfetti}
                />
                
                <SelectRow
                  id="setting-max-chips"
                  label={t('settingsMaxChips')}
                  value={maxChipsVisible}
                  options={MAX_CHIPS_OPTIONS}
                  onChange={onSetMaxChipsVisible}
                />

                <SelectRow
                  id="setting-stale-threshold"
                  label={t('settingsStaleThreshold')}
                  value={staleThresholdDays}
                  options={STALE_THRESHOLD_OPTIONS}
                  onChange={onSetStaleThresholdDays}
                />

                <hr className="border-border-light/20 dark:border-border-dark/20" />

                <div className="flex flex-col gap-2">
                  <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
                    {t('settingsBackupTitle')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onExportSettings}
                      className="flex-1 rounded-chip font-body border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark text-text-primary-light dark:text-text-primary-dark min-h-10 cursor-pointer text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      {t('settingsBackupExportBtn')}
                    </button>
                    <label
                      className="flex-1 rounded-chip font-body border border-border-light dark:border-border-dark hover:bg-surface-light dark:hover:bg-surface-dark text-text-primary-light dark:text-text-primary-dark min-h-10 cursor-pointer text-xs transition-colors flex items-center justify-center gap-1.5 text-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      {t('settingsBackupImportBtn')}
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (evt) => {
                            const txt = evt.target?.result as string;
                            if (txt) {
                              await onImportSettings(txt);
                            }
                          };
                          reader.readAsText(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>

                <hr className="border-border-light/20 dark:border-border-dark/20" />

                <div className="flex items-center justify-between">
                  <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm">
                    {t('settingsSortOrderTitle')}
                  </span>
                  <button
                    type="button"
                    onClick={onResetSortOrder}
                    className="rounded-chip font-body text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-blue/40 min-h-10 cursor-pointer px-3 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {t('settingsSortOrderBtn')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'custom-groups' && (
              <CustomGroupsSection
                groups={customGroups}
                onAdd={onAddCustomGroup}
                onRemove={onRemoveCustomGroup}
              />
            )}

            {activeTab === 'spaces' && (
              <SpacesSection
                spaces={manualGroups}
                onUpdateGroup={onUpdateGroup}
                onDeleteGroup={onDeleteGroup}
                onCreateGroup={onCreateGroup}
              />
            )}

            {activeTab === 'shortcuts' && keyBindings && (
              <KeyboardSection
                keyBindings={keyBindings}
                onUpdateKeyBinding={onUpdateKeyBinding}
                onResetKeyBindings={onResetKeyBindings}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dropdown Row helper sub-component ────────────────────────────────

interface SelectRowProps<T extends string | number> {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (val: T) => void;
}

function SelectRow<T extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
}: SelectRowProps<T>): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="font-body text-text-primary-light dark:text-text-primary-dark text-sm">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          const num = Number(val);
          onChange((isNaN(num) ? val : num) as T);
        }}
        className="font-body text-xs text-text-primary-light dark:text-text-primary-dark bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded px-2.5 py-1.5 focus-visible:ring-accent-blue/40 focus-visible:ring-2 focus-visible:outline-none min-h-10 min-w-[140px] cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Theme selector sub-component ────────────────────────────────────

interface ThemeRowProps {
  value: 'light' | 'dark' | 'system';
  onChange: (theme: 'light' | 'dark' | 'system') => void;
}

function ThemeRow({ value, onChange }: ThemeRowProps): React.ReactElement {
  const { t } = useI18n();

  const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string }[] = [
    { value: 'system', label: t('settingsThemeSystem') },
    { value: 'light', label: t('settingsThemeLight') },
    { value: 'dark', label: t('settingsThemeDark') },
  ];

  return (
    <div className="flex items-center justify-between">
      <span
        id="theme-label"
        className="font-body text-text-primary-light dark:text-text-primary-dark text-sm"
      >
        {t('settingsTheme')}
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
            className={`font-body min-h-[--spacing-button-height] min-w-11 cursor-pointer px-4 text-xs transition-colors ${
              value === opt.value
                ? 'bg-accent-blue text-white'
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
        className={`focus-visible:ring-accent-blue/40 relative inline-flex h-[--spacing-button-height] w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
          checked
            ? 'bg-accent-blue'
            : 'bg-border-light dark:bg-border-dark'
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
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
  const { t } = useI18n();
  const [hostname, setHostname] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const h = hostname.trim().toLowerCase();
    const l = label.trim();
    if (!h) { setError(t('settingsRuleRequiredHostname')); return; }
    if (!l) { setError(t('settingsRuleRequiredLabel')); return; }
    const key = h.replace(/[^a-z0-9]/g, '-');
    if (groups.some((g) => g.groupKey === key || g.hostname === h)) {
      setError(t('settingsRuleDuplicateHostname'));
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
        {t('settingsCustomRulesTitle')}
      </span>

      <div className="rounded-md border border-accent-blue/15 bg-accent-blue/[0.03] p-3 text-xs text-text-secondary leading-relaxed font-body mb-1 flex gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="text-accent-blue size-4 shrink-0 mt-0.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
        <div>
          <strong className="text-text-primary-light dark:text-text-primary-dark block mb-0.5">
            {t('settingsCustomRulesExplanationTitle')}
          </strong>
          <p>
            {t('settingsCustomRulesExplanationDesc')}
          </p>
        </div>
      </div>

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
                className="ml-2 shrink-0 text-accent-red hover:bg-accent-red/10 focus-visible:ring-accent-red/40 rounded-chip flex size-7 items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5" aria-hidden="true">
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
          placeholder={t('settingsPlaceholderHostname')}
          value={hostname}
          onChange={(e) => { setHostname(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          className="font-body text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-chip px-3 py-2 text-xs focus-visible:ring-accent-blue/40 focus-visible:ring-2 focus-visible:outline-none w-full"
        />
        <input
          type="text"
          placeholder={t('settingsPlaceholderLabel')}
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
          className="font-body text-xs text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-blue/40 rounded-chip px-3 py-1.5 self-end transition-colors focus-visible:ring-2 focus-visible:outline-none cursor-pointer min-h-[--spacing-button-height]"
        >
          {t('settingsBtnAddRule')}
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
  onCreateGroup?: (name: string) => void;
}

function SpacesSection({ spaces, onUpdateGroup, onDeleteGroup, onCreateGroup }: SpacesSectionProps): React.ReactElement {
  const { t } = useI18n();
  const [newSpaceName, setNewSpaceName] = useState('');

  const handleAddSpace = () => {
    const name = newSpaceName.trim();
    if (!name) return;
    onCreateGroup?.(name);
    setNewSpaceName('');
  };

  return (
    <div className="flex flex-col gap-4">
      <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
        {t('settingsSpacesTitle')}
      </span>

      <div className="rounded-md border border-accent-blue/15 bg-accent-blue/[0.03] p-3 text-xs text-text-secondary leading-relaxed font-body mb-1 flex gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="text-accent-blue size-4 shrink-0 mt-0.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
        <div>
          <strong className="text-text-primary-light dark:text-text-primary-dark block mb-0.5">
            {t('settingsSpacesExplanationTitle')}
          </strong>
          <p>
            {t('settingsSpacesExplanationDesc')}
          </p>
        </div>
      </div>

      {/* Add Space Form */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t('settingsPlaceholderSpaceName')}
          value={newSpaceName}
          onChange={(e) => setNewSpaceName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSpace()}
          className="flex-1 font-body text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-chip px-3 py-2 text-xs focus-visible:ring-accent-blue/40 focus-visible:ring-2 focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={handleAddSpace}
          className="font-body text-xs text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-blue/40 rounded-chip px-3 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none cursor-pointer min-h-[--spacing-button-height] font-medium"
        >
          {t('settingsBtnAddSpace')}
        </button>
      </div>

      <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
        {spaces.length === 0 ? (
          <span className="text-text-secondary text-xs font-body italic py-4 text-center">
            {t('settingsNoSpacesCreated')}
          </span>
        ) : (
          spaces.map((space) => {
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
                    title={t('settingsBtnDeleteSpace')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 12m-4.72 0-.34-12M4.75 6.75h14.5M3.375 5.25h17.25m-1.5 0-.825 15.6a2.25 2.25 0 0 1-2.247 2.13H7.43a2.25 2.25 0 0 1-2.247-2.13L4.35 5.25" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-body text-text-secondary text-[11px]">
                    {t('settingsLabelAutoRules')}
                  </span>
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
          })
        )}
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

function KeyboardSection({ keyBindings, onUpdateKeyBinding, onResetKeyBindings }: KeyboardSectionProps): React.ReactElement {
  const { t } = useI18n();
  const [recordingKey, setRecordingKey] = useState<keyof AppSettings['keyBindings'] | null>(null);

  const SHORTCUT_LABELS: Record<string, string> = {
    switchSpaceN: t('settingsShortcutLabelSwitchSpaceN'),
    switchSpaceAll: t('settingsShortcutLabelSwitchSpaceAll'),
    cyclePrev: t('settingsShortcutLabelCyclePrev'),
    cycleNext: t('settingsShortcutLabelCycleNext'),
    focusSearch: t('settingsShortcutLabelFocusSearch'),
    clearFilter: t('settingsShortcutLabelClearFilter'),
  };

  const onUpdateKeyBindingEffect = useEffectEvent(onUpdateKeyBinding);

  useEffect(() => {
    if (!recordingKey) return;

    function handleKeyDown(e: KeyboardEvent) {
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
        if (recordingKey) {
          onUpdateKeyBindingEffect(recordingKey, formatted);
        }
        setRecordingKey(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingKey]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
          {t('settingsShortcutsTitle')}
        </span>
        <button
          type="button"
          onClick={onResetKeyBindings}
          className="rounded-chip font-body text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-blue/40 px-2 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none min-h-[--spacing-button-height]"
        >
          {t('settingsShortcutsResetBtn')}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {Object.entries(SHORTCUT_LABELS).map(([key, label]) => {
          const binding = keyBindings[key as keyof typeof keyBindings] || 'None';
          const isRecording = recordingKey === key;

          return (
            <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded bg-surface-light dark:bg-surface-dark border border-border-light/50 dark:border-border-dark/50 min-h-[--spacing-button-height]">
              <span className="font-body text-xs text-text-primary-light dark:text-text-primary-dark">{label}</span>
              <button
                type="button"
                onClick={() => setRecordingKey(isRecording ? null : (key as keyof AppSettings['keyBindings']))}
                className={`font-body text-xs px-2.5 py-1 rounded border transition-all cursor-pointer min-h-[--spacing-button-height-sm] min-w-[70px] ${
                  isRecording
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 animate-pulse'
                    : 'bg-white dark:bg-card-dark text-text-secondary border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                {isRecording ? t('settingsShortcutRecording') : binding}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
