import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingState } from './components/LoadingState';
import { DndOrganizer } from './components/DndOrganizer';
import { ProductTable } from './components/ProductTable';
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
import { useAppLogic } from './hooks/useAppLogic';

// ─── Constants ────────────────────────────────────────────────────────

const SettingsPanel = React.lazy(() =>
  import('./components/SettingsPanel').then((module) => ({ default: module.SettingsPanel })),
);

// ─── Component ────────────────────────────────────────────────────────

export function App(): React.ReactElement {
  const { state, stores, derived, handlers, dispatch } = useAppLogic();

  const { tabStore, settingsStore } = stores;
  const { settings } = settingsStore;
  const { history, viewMode } = tabStore;

  if (state.loading || state.tabsLoading) {
    return <LoadingState />;
  }

  const statusAlerts: StatusStripAlert[] = [];

  if (state.tabOutCount > 1) {
    statusAlerts.push({
      id: 'extra-tab-out-pages',
      label: `${state.tabOutCount - 1} extra dashboard tab${state.tabOutCount - 1 === 1 ? '' : 's'}`,
      actionLabel: 'Close extras',
      onAction: () => {
        tabStore.closeExtraDashboards();
      },
    });
  }

  if (!state.nudgeDismissed && state.totalTabs > 15) {
    statusAlerts.push({
      id: 'tab-count-nudge',
      label: 'High tab count',
      actionLabel: 'Dismiss',
      onAction: () => dispatch({ type: 'SET_NUDGE_DISMISSED', dismissed: true }),
    });
  }

  return (
    <ErrorBoundary>
      {/* Skip to main content — keyboard accessibility */}
      <a
        href="#main-content"
        className="focus:rounded-chip focus:bg-accent-blue sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none"
        style={{ zIndex: 60 }}
      >
        Skip to main content
      </a>
      <DashboardShell
        top={
          <StatusStrip
            totalTabs={state.totalTabs}
            totalDupes={state.totalDupes}
            totalGroups={state.totalProducts}
            alerts={statusAlerts}
          />
        }
        header={
          <DashboardHeader
            title="Open Tabs by Product"
            hasGroups={!state.showEmptyState}
            groupCount={state.visibleGroupCount}
            searchQuery={state.searchQuery}
            onSearchChange={(q) => dispatch({ type: 'SET_SEARCH_QUERY', query: q })}
            resultCount={state.filteredTabCount}
            totalCount={state.totalTabs}
            viewMode={viewMode}
            onViewModeChange={handlers.handleSetViewMode}
            onRefresh={handlers.handleRefresh}
            onCreateGroup={handlers.handleCreateGroup}
            onCloseAll={handlers.handleCloseAll}
            onOpenSettings={() => dispatch({ type: 'SET_SETTINGS_OPEN', open: true })}
            isSidebarExpanded={state.isSidebarExpanded}
            onToggleSidebar={() => dispatch({ type: 'SET_SIDEBAR_EXPANDED', expanded: !state.isSidebarExpanded })}
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
        footer={<Footer tabCount={state.totalTabs} />}
      >
        {state.showEmptyState ? (
          <EmptyState />
        ) : (
          <main id="main-content" tabIndex={-1} className="active-section">
              {viewMode === 'table' ? (
                <ProductTable
                  items={derived.filteredProducts}
                  groups={derived.orderedGroups}
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
                  closingUrls={state.closingUrls}
                  focusedUrl={state.focusedUrl}
                />
              ) : (
                <ErrorBoundary>
                  <DndOrganizer
                    filteredProducts={derived.filteredProducts}
                    unassignedProducts={derived.unassignedProducts}
                    orderedGroups={derived.orderedGroups}
                    productsByGroup={derived.productsByGroup}
                    assignmentByItemId={derived.assignmentByItemId}
                    itemIdForProduct={derived.itemIdForProduct}
                    expandedDomains={state.expandedDomains}
                    maxChipsVisible={settings.maxChipsVisible}
                    focusedUrl={state.focusedUrl}
                    closingUrls={state.closingUrls}
                    selectedUrls={state.selectedUrls}
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
                    onToggleExpanded={handlers.handleToggleExpanded}
                  />
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
            soundEnabled={settings.soundEnabled}
            confettiEnabled={settings.confettiEnabled}
            customGroups={settings.customGroups}
            onSetTheme={settingsStore.setTheme}
            onToggleSound={settingsStore.toggleSound}
            onToggleConfetti={settingsStore.toggleConfetti}
            onResetSortOrder={handlers.handleResetSortOrder}
            onAddCustomGroup={settingsStore.addCustomGroup}
            onRemoveCustomGroup={settingsStore.removeCustomGroup}
          />
        </React.Suspense>
      )}

      {/* Toast overlay */}
      <Toast message={state.toast.message} visible={state.toast.visible} />

      {/* Batch selection bar */}
      {state.selectedUrls.size > 0 && (
        <SelectionBar
          count={state.selectedUrls.size}
          onClose={handlers.handleCloseSelected}
          onClear={handlers.handleClearSelection}
        />
      )}
    </ErrorBoundary>
  );
}
