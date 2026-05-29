import React from 'react';
import { ErrorBoundary } from './components/states/ErrorBoundary';
import { LoadingState } from './components/states/LoadingState';
import { ProductTableMemo as ProductTable } from './components/tabs/ProductTable';
import { SelectionBar } from './components/tabs/SelectionBar';
import { EmptyState } from './components/states/EmptyState';
import { Footer } from './components/Footer';
import { Toast } from './components/states/Toast';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { PromptDialog } from './components/PromptDialog';
import { DashboardShell } from './components/layout/DashboardShell';
import { DashboardHeader } from './components/layout/DashboardHeader';
import { HistoryPanel } from './components/history/HistoryPanel';
import type { FooterAlert } from './components/Footer';
import { useDashboardController } from './controllers/useDashboardController';
import { useI18n } from './hooks/useI18n';
import { useTheme } from './hooks/useTheme';
import { useSettingsImportExport } from './controllers/useSettingsImportExport';

// ─── Constants ────────────────────────────────────────────────────────

const SettingsPanel = React.lazy(() =>
  import('./components/settings/SettingsPanel').then((module) => ({ default: module.SettingsPanel })),
);

const DndOrganizer = React.lazy(() =>
  import('./components/organizer/DndOrganizer').then((module) => ({ default: module.DndOrganizer })),
);

// ─── Component ────────────────────────────────────────────────────────

export function App(): React.ReactElement {
  const { state, stores, derived, handlers, dispatch } = useDashboardController();
  const { t } = useI18n();

  const { tabStore, settingsStore } = stores;
  const { settings } = settingsStore;
  const { history, viewMode } = tabStore;

  const appVersion = (typeof chrome !== 'undefined' && chrome.runtime?.getManifest)
    ? chrome.runtime.getManifest().version
    : '2.0.0';

  useTheme(settings.theme);

  const { handleExportConfig, handleImportConfig } = useSettingsImportExport({
    settingsStore,
    tabStore,
    showToast: handlers.showToast,
  });

  if (state.loading || state.tabsLoading) {
    return <LoadingState />;
  }

  const footerAlerts: FooterAlert[] = [];

  if (state.dashboardCount > 1) {
    footerAlerts.push({
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
    footerAlerts.push({
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
      <nav aria-label="Skip links">
        <a
          href="#main-content"
          className="focus:rounded-chip focus:bg-accent-blue sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none"
        >
          {t('skipToContent')}
        </a>
      </nav>
      <DashboardShell
        top={null}
        header={
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
            onCreateSection={handlers.handleCreateSection}
            onOpenSettings={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: true })}
            isSidebarExpanded={state.isSidebarExpanded}
            onToggleSidebar={() => dispatch({ type: 'SET_SIDEBAR_EXPANDED', expanded: !state.isSidebarExpanded })}
            sections={derived.navigableSections}
            sectionIds={derived.sectionNavigationIds}
            activeSectionId={tabStore.activeSectionId}
            onSectionChange={tabStore.setActiveSection}
            isSectionSwitcherFocused={state.sectionSwitcherFocused}
            sortButtonDisabled={state.sortButtonDisabled}
            onSortWindow={handlers.handleSortWindow}
          />
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
        footer={<Footer tabCount={state.totalTabs} duplicateCount={state.totalDupes} groupCount={derived.filteredProducts.length} sectionCount={state.visibleSectionCount} alerts={footerAlerts} />}
      >
        <div id="main-content" tabIndex={-1} className="active-section">
          {state.showEmptyState ? (
            <EmptyState />
          ) : (
            <>
                {state.parsedQuery.type === 'dupes' && (
                <div
                  role="alert"
                  className="rounded-card border-accent-amber/20 from-accent-amber/[0.04] to-accent-amber/[0.09] mb-4 flex animate-[fadeUp_var(--motion-banner)_ease_both] items-center justify-between border bg-gradient-to-br px-6 py-4"
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
                    className="rounded-chip bg-accent-amber font-body focus-visible:ring-accent-amber/50 min-h-[var(--spacing-button-height)] cursor-pointer px-5 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all duration-[var(--motion-standard)] hover:opacity-85 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {t('sweepDupeBtn')}
                  </button>
                </div>
              )}

              {state.parsedQuery.type === 'stale' && (
                <div
                  role="alert"
                  className="rounded-card border-accent-blue/20 from-accent-blue/[0.04] to-accent-blue/[0.09] mb-4 flex animate-[fadeUp_var(--motion-banner)_ease_both] items-center justify-between border bg-gradient-to-br px-6 py-4"
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
                    className="rounded-chip bg-accent-blue font-body focus-visible:ring-accent-primary/50 min-h-[var(--spacing-button-height)] cursor-pointer px-5 py-2 text-xs font-semibold whitespace-nowrap text-white transition-all duration-[var(--motion-standard)] hover:opacity-85 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {t('sweepStaleBtn')}
                  </button>
                </div>
              )}

              {derived.filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-[fadeIn_var(--motion-enter)_ease]">
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
                      : state.parsedQuery.type === 'section'
                      ? (state.parsedQuery.sectionToken ? t('emptySweepSectionTitle') : t('emptySweepSectionNoArg'))
                      : t('emptySweepSearchTitle')}
                  </h3>
                  <p className="text-text-secondary text-sm mt-1 max-w-sm px-4">
                    {state.parsedQuery.type === 'stale'
                      ? t('emptySweepStaleDesc', { days: settings.staleThresholdDays ?? 3 })
                      : state.parsedQuery.type === 'dupes'
                      ? t('emptySweepDupeDesc')
                      : state.parsedQuery.type === 'section'
                      ? (state.parsedQuery.sectionToken
                          ? t('emptySweepSectionDesc', { name: state.parsedQuery.sectionToken })
                          : t('emptySweepSectionNoArg'))
                      : t('emptySweepSearchDesc', { query: state.searchQuery })}
                  </p>
                </div>
              ) : viewMode === 'table' ? (
                <ProductTable
                  items={derived.filteredProducts}
                  sections={derived.manageableSections}
                  assignmentByItemId={derived.assignmentByItemId}
                  onMoveItem={handlers.handleMoveTableItem}
                  onCloseProduct={handlers.handleCloseProduct}
                  onCloseDuplicates={handlers.handleCloseDuplicates}
                  onFocusTab={handlers.handleFocusTab}
                  expandedDomains={state.expandedDomains}
                  onToggleExpanded={handlers.handleToggleExpanded}
                  onCloseTab={handlers.handleCloseTabAnimated}
                  onChipClick={handlers.handleChipClick}
                  selectedUrls={state.selectedUrls}
                  selectedTabIds={state.selectedTabIds}
                  closingUrls={state.closingUrls}
                  focusedUrl={state.focusedUrl}
                  searchQuery={state.searchQuery}
                  staleThresholdDays={settings.staleThresholdDays ?? 3}
                />
              ) : viewMode === 'cards' ? (
                <ErrorBoundary>
                  <React.Suspense fallback={<LoadingState />}>
                    <DndOrganizer
                      filteredProducts={derived.filteredProducts}
                      unassignedProducts={derived.unassignedProducts}
                      orderedSections={derived.cardsSections}
                      productsBySection={derived.productsBySection}
                      assignmentByItemId={derived.assignmentByItemId}
                      itemIdForProduct={derived.itemIdForProduct}
                      expandedDomains={state.expandedDomains}
                      maxChipsVisible={settings.maxChipsVisible}
                      staleThresholdDays={settings.staleThresholdDays ?? 3}
                      focusedUrl={state.focusedUrl}
                      closingUrls={state.closingUrls}
                      selectedUrls={state.selectedUrls}
                      selectedTabIds={state.selectedTabIds}
                      onMoveProductToNoSection={handlers.handleMoveProductToNoSection}
                      onMoveProductToSection={handlers.handleMoveProductToSection}
                      onRenameSection={handlers.handleRenameSection}
                      onDeleteSection={handlers.handleDeleteSection}
                      onCloseProduct={handlers.handleCloseProduct}
                      onCloseSection={handlers.handleCloseSection}
                      onCloseDuplicates={handlers.handleCloseDuplicates}
                      onCloseTab={handlers.handleCloseTabAnimated}
                      onFocusTab={handlers.handleFocusTab}
                      onChipClick={handlers.handleChipClick}
                      onToggleExpanded={handlers.handleToggleExpanded}
                      searchQuery={state.searchQuery}
                      activeSectionId={tabStore.activeSectionId}
                    />
                  </React.Suspense>
                </ErrorBoundary>
              ) : null}
            </>
          )}
        </div>
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
            sections={tabStore.sections}
            onUpdateSection={tabStore.updateSection}
            onDeleteSection={tabStore.deleteSection}
            onCreateSection={tabStore.createSection}
            keyBindings={settings.keyBindings}
            onUpdateKeyBinding={settingsStore.updateKeyBinding}
            onResetKeyBindings={settingsStore.resetKeyBindings}
            appVersion={appVersion}
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
