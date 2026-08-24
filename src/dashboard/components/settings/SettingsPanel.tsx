import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { CustomGroup, AppSettings, Section, SectionAssignment, TabGroup } from '../../../types';
import type { AccentKey } from '../../../config/themes';
import { useI18n, type TranslationKey } from '../../hooks/useI18n';
import { ProductGroupRulesSection } from './ProductGroupRulesSection';
import { SectionRulesWorkbench } from './SectionRulesWorkbench';
import { KeyboardSection } from './KeyboardSection';
import { AppearanceSection } from './AppearanceSection';
import { BehaviorSection } from './BehaviorSection';
import { BackupSection } from './BackupSection';
import { SETTINGS_NAVIGATION, DEFAULT_SETTINGS_PAGE, type SettingsPageId } from './settings-navigation';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  theme: AccentKey;
  language: 'en' | 'zh' | 'system';
  soundEnabled: boolean;
  confettiEnabled: boolean;
  customGroups: CustomGroup[];
  onSetTheme: (theme: AccentKey) => void;
  onSetLanguage: (language: 'en' | 'zh' | 'system') => void;
  onToggleSound: () => void;
  onToggleConfetti: () => void;
  onResetSortOrder: () => void;
  onRenameProductGroup: (group: TabGroup, label: string) => void;
  onRevertProductGroup: (groupKey: string) => void;
  // Exposed settings
  maxChipsVisible: number;
  staleThresholdDays: number;
  onSetMaxChipsVisible: (count: number) => void;
  onSetStaleThresholdDays: (days: number) => void;
  // Backup / Sync
  onExportSettings: () => void;
  onImportSettings: (json: string) => Promise<void>;
  // Sections & Rules props
  sections?: Section[];
  products?: TabGroup[];
  hostnamesByProductKey?: ReadonlyMap<string, readonly string[]>;
  assignments?: SectionAssignment[];
  unsectionedProductKeys?: string[];
  productCountBySectionId?: ReadonlyMap<string, number>;
  onUpdateSection?: (id: string, updates: Partial<Omit<Section, 'id'>>) => void;
  onDeleteSection?: (id: string) => void;
  onCreateSection?: (name: string) => void;
  onAssignProducts?: (productKeys: readonly string[], sectionId: string) => void;
  // Keyboard Bindings props
  keyBindings?: AppSettings['keyBindings'];
  onUpdateKeyBinding?: (key: keyof AppSettings['keyBindings'], binding: string) => void;
  onResetKeyBindings?: () => void;
  // App version
  appVersion: string;
  // View Mode
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
}

const DEFAULT_SECTIONS: Section[] = [];
const DEFAULT_PRODUCTS: TabGroup[] = [];
const DEFAULT_HOSTNAMES_BY_PRODUCT_KEY: ReadonlyMap<string, readonly string[]> = new Map();
const DEFAULT_ASSIGNMENTS: SectionAssignment[] = [];
const DEFAULT_UNSECTIONED_PRODUCT_KEYS: string[] = [];
const DEFAULT_PRODUCT_COUNT_BY_SECTION_ID: ReadonlyMap<string, number> = new Map();

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
  onRenameProductGroup,
  onRevertProductGroup,
  maxChipsVisible,
  staleThresholdDays,
  onSetMaxChipsVisible,
  onSetStaleThresholdDays,
  onExportSettings,
  onImportSettings,
  sections = DEFAULT_SECTIONS,
  products = DEFAULT_PRODUCTS,
  hostnamesByProductKey = DEFAULT_HOSTNAMES_BY_PRODUCT_KEY,
  assignments = DEFAULT_ASSIGNMENTS,
  unsectionedProductKeys = DEFAULT_UNSECTIONED_PRODUCT_KEYS,
  productCountBySectionId = DEFAULT_PRODUCT_COUNT_BY_SECTION_ID,
  onUpdateSection = () => {},
  onDeleteSection = () => {},
  onCreateSection = () => {},
  onAssignProducts = () => {},
  keyBindings,
  onUpdateKeyBinding = () => {},
  onResetKeyBindings = () => {},
  appVersion,
  viewMode,
  onViewModeChange,
}: SettingsPanelProps): React.ReactElement | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [activePage, setActivePage] = useState<SettingsPageId>(DEFAULT_SETTINGS_PAGE);
  const { t } = useI18n();

  const onCloseEffect = useEffectEvent(onClose);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        const target = e.target instanceof Element ? e.target : null;
        if (target?.closest('[data-recording-shortcut="true"]')) return;
        onCloseEffect();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
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
        className="border border-border-color bg-card-light dark:bg-card-dark relative w-full max-w-2xl animate-[fadeUp_var(--motion-enter)_ease_both] overflow-hidden max-h-[85vh] h-[550px] rounded-card shadow-2xl flex"
      >
        {/* Left Column - Navigation */}
        <div className="w-48 border-r border-border-color/40 bg-surface-light/40 dark:bg-surface-dark/40 flex flex-col p-4 gap-1 shrink-0 select-none overflow-y-auto">
          <h3
            id="settings-title"
            className="font-heading text-text-primary-light dark:text-text-primary-dark text-base font-semibold px-2 mb-4"
          >
            {t('settingsTitle')}
          </h3>
          {SETTINGS_NAVIGATION.map((group) => {
            const groupHeadingId = `settings-nav-group-${group.labelKey}`;
            return (
              <div
                key={group.labelKey}
                role="group"
                aria-labelledby={groupHeadingId}
                className="flex flex-col gap-1"
              >
                <span
                  id={groupHeadingId}
                  className="font-body text-text-secondary px-3 pt-3 pb-1 text-3xs font-bold uppercase tracking-wider"
                >
                  {t(group.labelKey as TranslationKey)}
                </span>
                {group.pages.map((page) => {
                  const isActive = activePage === page.id;
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => setActivePage(page.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full text-left font-body text-xs rounded-chip px-3 py-2 transition-all cursor-pointer flex items-center gap-2 min-h-[var(--spacing-button-height)] outline-none ${
                        isActive
                          ? 'bg-accent-blue/10 text-accent-blue dark:bg-accent-blue/15 dark:text-accent-blue font-semibold border-l border-accent-blue pl-[11px]'
                          : 'text-text-secondary hover:bg-surface-light hover:text-text-primary-light dark:hover:bg-surface-dark dark:hover:text-text-primary-dark'
                      }`}
                    >
                      <span>{t(page.labelKey as TranslationKey)}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        {/* Right Column - Active Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card-light dark:bg-card-dark">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border-color/20">
            <h4 className="font-heading text-text-primary-light dark:text-text-primary-dark text-sm font-semibold">
              {t((SETTINGS_NAVIGATION.flatMap((g) => g.pages).find((p) => p.id === activePage)?.labelKey ?? 'settingsTitle') as TranslationKey)}
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="rounded-chip text-text-secondary hover:bg-surface-light hover:text-text-primary-light dark:hover:bg-surface-dark dark:hover:text-text-primary-dark flex size-[var(--spacing-button-icon-sm)] cursor-pointer items-center justify-center transition-colors focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
              aria-label="Close settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.0} stroke="currentColor" className="size-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Page Viewport */}
          <div className="flex-1 overflow-y-auto p-6">
            {activePage === 'appearance' && (
              <AppearanceSection
                theme={theme}
                language={language}
                viewMode={viewMode}
                maxChipsVisible={maxChipsVisible}
                onSetTheme={onSetTheme}
                onSetLanguage={onSetLanguage}
                onViewModeChange={onViewModeChange}
                onSetMaxChipsVisible={onSetMaxChipsVisible}
              />
            )}
            {activePage === 'behavior' && (
              <BehaviorSection
                staleThresholdDays={staleThresholdDays}
                onSetStaleThresholdDays={onSetStaleThresholdDays}
                soundEnabled={soundEnabled}
                onToggleSound={onToggleSound}
                confettiEnabled={confettiEnabled}
                onToggleConfetti={onToggleConfetti}
                onResetSortOrder={onResetSortOrder}
              />
            )}
            {activePage === 'shortcuts' && keyBindings && (
              <KeyboardSection
                keyBindings={keyBindings}
                onUpdateKeyBinding={onUpdateKeyBinding}
                onResetKeyBindings={onResetKeyBindings}
              />
            )}
            {activePage === 'section-rules' && (
              <SectionRulesWorkbench
                sections={sections}
                products={products}
                hostnamesByProductKey={hostnamesByProductKey}
                assignments={assignments}
                unsectionedProductKeys={unsectionedProductKeys}
                productCountBySectionId={productCountBySectionId}
                onUpdateSection={onUpdateSection}
                onCreateSection={onCreateSection}
                onDeleteSection={onDeleteSection}
                onAssignProducts={onAssignProducts}
              />
            )}
            {activePage === 'product-rules' && (
              <ProductGroupRulesSection
                products={products}
                customGroups={customGroups}
                onRename={onRenameProductGroup}
                onRevert={onRevertProductGroup}
              />
            )}
            {activePage === 'backup' && (
              <BackupSection
                onExportSettings={onExportSettings}
                onImportSettings={onImportSettings}
                appVersion={appVersion}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
