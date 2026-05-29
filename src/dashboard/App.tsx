import React from 'react';
import type { CustomGroup } from '../types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingState } from './components/LoadingState';
import { ProductGroupTableMemo as ProductGroupTable } from './components/product-groups/ProductGroupTable';
import { SelectionBar } from './components/SelectionBar';
import { EmptyState } from './components/EmptyState';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { PromptDialog } from './components/PromptDialog';
import { DashboardShell } from './components/layout/DashboardShell';
import { StatusStrip } from './components/layout/StatusStrip';
import type { StatusStripAlert } from './components/layout/StatusStrip';
import { DashboardHeader } from './components/layout/DashboardHeader';
import { HistoryPanel } from './components/HistoryPanel';
import { SectionSwitcher } from './components/SectionSwitcher';
import { useAppLogic } from './hooks/useAppLogic';
import { useI18n } from './hooks/useI18n';
import { useTheme } from './hooks/useTheme';
import { parseImportedSettings } from './lib/settings-import';

// ─── Constants ────────────────────────────────────────────────────────

const SettingsPanel = React.lazy(() =>
  import('./components/SettingsPanel').then((module) => ({ default: module.SettingsPanel })),
);

const DndOrganizer = React.lazy(() =>
  import('./components/DndOrganizer').then((module) => ({ default: module.DndOrganizer })),
);

// ─── Component ────────────────────────────────────────────────────────

export function App(): React.ReactElement {
  const { state, stores, derived, handlers, dispatch } = useAppLogic();
  const { t } = useI18n();

  const { tabStore, settingsStore } = stores;
  const { settings } = settingsStore;
  const { history, viewMode } = tabStore;

  useTheme(settings.theme);

  const handleExportConfig = () => {
    const config = {
      version: '1.0',
      settings: settingsStore.settings,
      manualGroups: tabStore.manualGroups,
      groupAssignments: tabStore.groupAssignments,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `tab-organizer-settings-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
    handlers.showToast(t('toastSettingsExported'));
  };

  const handleImportConfig = async (jsonText: string) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON');
      }

      // Version validation for migration support
      const configVersion = parsed.version;
      if (typeof configVersion !== 'string' || !/^\d+\.\d+$/.test(configVersion)) {
        throw new Error('Invalid or missing config version');
      }

      // Restore preferences
      if (parsed.settings && typeof parsed.settings === 'object') {
        const importedSettings = parseImportedSettings(parsed.settings);
        if (importedSettings.theme) await settingsStore.setTheme(importedSettings.theme);
        if (importedSettings.soundEnabled !== undefined && importedSettings.soundEnabled !== settingsStore.settings.soundEnabled) await settingsStore.toggleSound();
        if (importedSettings.confettiEnabled !== undefined && importedSettings.confettiEnabled !== settingsStore.settings.confettiEnabled) await settingsStore.toggleConfetti();
        if (importedSettings.maxChipsVisible !== undefined) await settingsStore.setMaxChipsVisible(importedSettings.maxChipsVisible);
        if (importedSettings.staleThresholdDays !== undefined) await settingsStore.setStaleThresholdDays(importedSettings.staleThresholdDays);
        if (importedSettings.groupSortBy) await settingsStore.setGroupSortBy(importedSettings.groupSortBy);

        if (importedSettings.customGroups) {
          // Clear all existing custom groups (parallel)
          await Promise.all(settingsStore.settings.customGroups.map(cg =>
            settingsStore.removeCustomGroup(cg.groupKey)
          ));
          // Add imported custom groups (parallel)
          await Promise.all(importedSettings.customGroups.map((cg: CustomGroup) =>
            settingsStore.addCustomGroup(cg)
          ));
        }

        if (importedSettings.keyBindings) {
          const updates: Promise<void>[] = [];
          for (const [key, binding] of Object.entries(importedSettings.keyBindings)) {
            updates.push(settingsStore.updateKeyBinding(key as keyof typeof settings.keyBindings, binding));
          }
          await Promise.all(updates);
        }
      }

      // Restore spaces and assignments
      if (Array.isArray(parsed.manualGroups)) {
        const manualGroups = parsed.manualGroups;
        const groupAssignments = Array.isArray(parsed.groupAssignments) ? parsed.groupAssignments : [];
        await tabStore.importBackup(manualGroups, groupAssignments);
      }

      handlers.showToast(t('toastSettingsImported'));
    } catch (err) {
      console.error('[Tab Organizer] Failed to import settings:', err);
      handlers.showToast(t('toastImportFailed'));
    }
  };

  if (state.loading || state.tabsLoading) {
    return <LoadingState />;
  }

  const statusAlerts: StatusStripAlert[] = [];

  if (state.dashboardCount > 1) {
    statusAlerts.push({
      id: 'extra-tab-organizer-pages',
      label: state.dashboardCount - 1 === 1
        ? t('alertExtraTabOrganizerSingle')
        : t('alertExtraTabOrganizerPlural', { count: state.dashboardCount - 1 }),
      actionLabel: t('actionCloseExtras'),
      onAction: () => {
        tabStore.closeExtraDashboards();
      },
    });
  }

  if (!state.nudgeDismissed && state.totalTabs > 15) {
    statusAlerts.push({
      id: 'tab-count-nudge',
      label: t('alertHighTabCount'),
      actionLabel: t('actionDismiss'),
      onAction: () => dispatch({ type: 'SET_NUDGE_DISMISSED', dismissed: true }),
    });
  }

  return (
    <ErrorBoundary>
      <div className="noise-overlay" aria-hidden="true" />
      {/* Skip to main content — keyboard accessibility */}
      <a
        href="#main-content"
        className="focus:rounded-chip focus:bg-accent-blue sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none"
      >
        {t('skipToContent')}
      </a>
      <DashboardShell
        top={
          <StatusStrip
            totalTabs={state.totalTabs}
            totalDupes={state.totalDupes}
            totalGroups={state.visibleSpaceCount}
            alerts={statusAlerts}
          />
        }
        header={
          <>
            <SectionSwitcher
              sections={derived.orderedGroups}
              sectionIds={[null, ...derived.orderedGroups.map((g) => g.id)]}
              activeSectionId={tabStore.activeSpaceId}
              onChange={tabStore.setActiveSpace}
              onCreateSection={handlers.handleCreateGroup}
              isFocused={state.sectionSwitcherFocused}
            />
            <DashboardHeader
              title={t('titleOpenTabs')}
              hasGroups={!state.showEmptyState}
              searchQuery={state.searchQuery}
              onSearchChange={(q) => dispatch({ type: 'SET_SEARCH_QUERY', query: q })}
              resultCount={state.filteredTabCount}
              totalCount={state.totalTabs}
              viewMode={viewMode}
              onViewModeChange={handlers.handleSetViewMode}
              groupSortBy={settings.groupSortBy}
              onGroupSortByChange={settingsStore.setGroupSortBy}
              onRefresh={handlers.handleRefresh}
              onCreateGroup={handlers.handleCreateGroup}
              onCloseAll={handlers.handleCloseAll}
              onOpenSettings={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: true })}
              isSidebarExpanded={state.isSidebarExpanded}
              onToggleSidebar={() => dispatch({ type: 'SET_SIDEBAR_EXPANDED', expanded: !state.isSidebarExpanded })}
              spaces={derived.orderedGroups}
            />
          </>
        }
        isSidebarExpanded={state.isSidebarExpanded}
        onToggleSidebar={() => dispatch({ type: 'SET_SIDEBAR_EXPANDED', expanded: !state.isSidebarExpanded })}
        utilities={
          <HistoryPanel
            snapshots={history}
            onRestoreSnapshot={tabStore.restoreHistorySnapshot}
            onRestoreProduct={tabStore.restoreHistoryProduct}
            onDeleteSnapshot={tabStore.deleteHistorySnapshot}
            onClearSnapshots={tabStore.clearHistory}
          />
        }
        toolbar={null}
        footer={<Footer tabCount={state.totalTabs} />}
      >
        {state.showEmptyState ? (
          <EmptyState />
        ) : (
          <main id="main-content" tabIndex={-1} className="active-section">
              {state.parsedQuery.type === 'dupes' && (
                <div
                  role="alert"
                  className="rounded-card border-accent-amber/20 from-accent-amber/[0.04] to-accent-amber/[0.09] mb-4 flex animate-[fadeUp_0.5s_ease_both] items-center justify-between border bg-gradient-to-br px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-accent-amber/10 flex size-9 shrink-0 items-center justify-center rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="text-accent-amber size-[18px]"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-heading text-sm font-normal text-text-primary-light dark:text-text-primary-dark">
                        {t('sweepDupeTitle')}
                      </h4>
                      <p className="text-text-secondary text-xs mt-0.5">
                        {t('sweepDupeDesc')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlers.handleSelectDuplicateTabs()}
                    className="rounded-chip bg-accent-amber font-body focus-visible:ring-accent-amber/50 min-h-[var(--spacing-button-height)] cursor-pointer px-5 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all duration-200 hover:opacity-85 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {t('sweepDupeBtn')}
                  </button>
                </div>
              )}

              {state.parsedQuery.type === 'stale' && (
                <div
                  role="alert"
                  className="rounded-card border-accent-blue/20 from-accent-blue/[0.04] to-accent-blue/[0.09] mb-4 flex animate-[fadeUp_0.5s_ease_both] items-center justify-between border bg-gradient-to-br px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-accent-blue/10 flex size-9 shrink-0 items-center justify-center rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="text-accent-blue size-[18px]"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-heading text-sm font-normal text-text-primary-light dark:text-text-primary-dark">
                        {t('sweepStaleTitle')}
                      </h4>
                      <p className="text-text-secondary text-xs mt-0.5">
                        {t('sweepStaleDesc', { days: settings.staleThresholdDays ?? 3 })}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlers.handleSelectStaleTabs(settings.staleThresholdDays ?? 3)}
                    className="rounded-chip bg-accent-blue font-body focus-visible:ring-accent-primary/50 min-h-[var(--spacing-button-height)] cursor-pointer px-5 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all duration-200 hover:opacity-85 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {t('sweepStaleBtn')}
                  </button>
                </div>
              )}

              {derived.filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-[fadeIn_0.3s_ease]">
                  <div className="bg-surface-light dark:bg-surface-dark mb-4 flex size-16 items-center justify-center rounded-full border border-dashed border-border-light dark:border-border-dark text-text-secondary">
                    {state.parsedQuery.type === 'stale' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8 text-accent-blue"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    ) : state.parsedQuery.type === 'dupes' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8 text-accent-amber"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" /></svg>
                    )}
                  </div>
                  <h3 className="font-heading text-lg font-normal text-text-primary-light dark:text-text-primary-dark">
                    {state.parsedQuery.type === 'stale'
                      ? t('emptySweepStaleTitle')
                      : state.parsedQuery.type === 'dupes'
                      ? t('emptySweepDupeTitle')
                      : state.parsedQuery.type === 'space'
                      ? (state.parsedQuery.spaceToken ? t('emptySweepSpaceTitle') : t('emptySweepSpaceNoArg'))
                      : t('emptySweepSearchTitle')}
                  </h3>
                  <p className="text-text-secondary text-sm mt-1 max-w-sm px-4">
                    {state.parsedQuery.type === 'stale'
                      ? t('emptySweepStaleDesc', { days: settings.staleThresholdDays ?? 3 })
                      : state.parsedQuery.type === 'dupes'
                      ? t('emptySweepDupeDesc')
                      : state.parsedQuery.type === 'space'
                      ? (state.parsedQuery.spaceToken
                          ? t('emptySweepSpaceDesc', { name: state.parsedQuery.spaceToken })
                          : t('emptySweepSpaceNoArg'))
                      : t('emptySweepSearchDesc', { query: state.searchQuery })}
                  </p>
                </div>
              ) : viewMode === 'table' ? (
                <ProductGroupTable
                  items={derived.filteredProducts}
                  groups={derived.orderedGroups}
                  assignmentByItemId={derived.assignmentByItemId}
                  onMoveItem={handlers.handleMoveTableItem}
                  onCloseProduct={handlers.handleCloseProduct}
                  onCloseDuplicates={handlers.handleCloseDuplicates}
                  onFocusTab={handlers.handleFocusTab}
                  expandedProductGroups={state.expandedDomains}
                  onToggleProductGroupExpanded={handlers.handleToggleExpanded}
                  onCloseTab={handlers.handleCloseTabAnimated}
                  onChipClick={handlers.handleChipClick}
                  selectedUrls={state.selectedUrls}
                  selectedTabIds={state.selectedTabIds}
                  closingUrls={state.closingUrls}
                  focusedUrl={state.focusedUrl}
                  searchQuery={state.searchQuery}
                />
              ) : (
                <ErrorBoundary>
                  <React.Suspense fallback={<LoadingState />}>
                    <DndOrganizer
                      filteredProducts={derived.filteredProducts}
                      unassignedProducts={derived.unassignedProducts}
                      orderedGroups={derived.orderedGroups}
                      productsByGroup={derived.productsByGroup}
                      assignmentByItemId={derived.assignmentByItemId}
                      itemIdForProduct={derived.itemIdForProduct}
                      expandedProductGroups={state.expandedDomains}
                      maxChipsVisible={settings.maxChipsVisible}
                      focusedUrl={state.focusedUrl}
                      closingUrls={state.closingUrls}
                      selectedUrls={state.selectedUrls}
                      selectedTabIds={state.selectedTabIds}
                      onMoveProductToMain={handlers.handleMoveProductToMain}
                      onMoveProductToGroup={handlers.handleMoveProductToGroup}
                      onRenameGroup={handlers.handleRenameGroup}
                      onDeleteGroup={handlers.handleDeleteGroup}
                      onCloseProduct={handlers.handleCloseProduct}
                      onCloseManualGroup={handlers.handleCloseManualGroup}
                      onCloseDuplicates={handlers.handleCloseDuplicates}
                      onCloseTab={handlers.handleCloseTabAnimated}
                      onFocusTab={handlers.handleFocusTab}
                      onChipClick={handlers.handleChipClick}
                      onToggleProductGroupExpanded={handlers.handleToggleExpanded}
                      searchQuery={state.searchQuery}
                    />
                  </React.Suspense>
                </ErrorBoundary>
              )}
          </main>
        )}
      </DashboardShell>

      {/* Confirmation dialog */}
      <ConfirmationDialog
        key={state.confirmDialog.id || 'confirm-closed'}
        open={state.confirmDialog.open}
        title={state.confirmDialog.title}
        message={state.confirmDialog.message}
        confirmLabel={state.confirmDialog.confirmLabel}
        onConfirm={state.confirmDialog.onConfirm}
        onCancel={() => dispatch({ type: 'CLOSE_CONFIRM_DIALOG' })}
      />

      {/* Prompt dialog */}
      <PromptDialog
        key={state.promptDialog.open ? `open-${state.promptDialog.title}-${state.promptDialog.initialValue}` : 'closed'}
        open={state.promptDialog.open}
        title={state.promptDialog.title}
        label={state.promptDialog.label}
        initialValue={state.promptDialog.initialValue}
        confirmLabel={state.promptDialog.confirmLabel}
        onConfirm={state.promptDialog.onConfirm}
        onCancel={() => dispatch({ type: 'CLOSE_PROMPT_DIALOG' })}
      />

      {/* Settings panel */}
      {state.settingsOpen && (
        <React.Suspense fallback={null}>
          <SettingsPanel
            open={state.settingsOpen}
            onClose={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: false })}
            theme={settings.theme}
            language={settings.language || 'system'}
            soundEnabled={settings.soundEnabled}
            confettiEnabled={settings.confettiEnabled}
            customGroups={settings.customGroups}
            onSetTheme={settingsStore.setTheme}
            onSetLanguage={settingsStore.setLanguage}
            onToggleSound={settingsStore.toggleSound}
            onToggleConfetti={settingsStore.toggleConfetti}
            onResetSortOrder={handlers.handleResetSortOrder}
            onAddCustomGroup={async (group) => {
              await settingsStore.addCustomGroup(group);
              await tabStore.fetchTabs();
            }}
            onRemoveCustomGroup={async (groupKey) => {
              await settingsStore.removeCustomGroup(groupKey);
              await tabStore.fetchTabs();
            }}
            maxChipsVisible={settings.maxChipsVisible}
            staleThresholdDays={settings.staleThresholdDays}
            onSetMaxChipsVisible={settingsStore.setMaxChipsVisible}
            onSetStaleThresholdDays={settingsStore.setStaleThresholdDays}
            onExportSettings={handleExportConfig}
            onImportSettings={handleImportConfig}
            manualGroups={tabStore.manualGroups}
            onUpdateGroup={tabStore.updateGroup}
            onDeleteGroup={tabStore.deleteGroup}
            onCreateGroup={tabStore.createGroup}
            keyBindings={settings.keyBindings}
            onUpdateKeyBinding={settingsStore.updateKeyBinding}
            onResetKeyBindings={settingsStore.resetKeyBindings}
          />
        </React.Suspense>
      )}

      {/* Toast overlay */}
      <Toast message={state.toast.message} visible={state.toast.visible} />

      {/* Batch selection bar */}
      {(state.selectedUrls.size > 0 || state.selectedTabIds.size > 0) && (
        <SelectionBar
          count={state.selectedTabIds.size > 0 ? state.selectedTabIds.size : state.selectedUrls.size}
          onClose={handlers.handleCloseSelected}
          onClear={handlers.handleClearSelection}
        />
      )}
    </ErrorBoundary>
  );
}
