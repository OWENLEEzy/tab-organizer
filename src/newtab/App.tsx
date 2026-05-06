import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingState } from './components/LoadingState';
import { DndOrganizer } from './components/DndOrganizer';
import { ProductTable } from './components/ProductTable';
import { SelectionBar } from './components/SelectionBar';
import { EmptyState } from './components/EmptyState';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { DashboardShell } from './components/layout/DashboardShell';
import { StatusStrip } from './components/layout/StatusStrip';
import type { StatusStripAlert } from './components/layout/StatusStrip';
import { DashboardHeader } from './components/layout/DashboardHeader';
import { HistoryPanel } from './components/HistoryPanel';
import { useTabStore } from '../stores/tab-store';
import { useSettingsStore } from '../stores/settings-store';
import { clearGroupOrder } from '../utils/storage';
import { useKeyboard } from './hooks/useKeyboard';
import { flattenVisibleTabs } from './lib/visible-tabs';
import { getChipCloseDelay, userPrefersReducedMotion } from './lib/motion';
import { playCloseEffects } from '../lib/close-effects';
import { isTabOutPage } from '../utils/url';
import type { TabGroup } from '../types';

// ─── Constants ────────────────────────────────────────────────────────

const TOAST_DURATION = 2500;


const SettingsPanel = React.lazy(() =>
  import('./components/SettingsPanel').then((module) => ({ default: module.SettingsPanel })),
);

function productKeyForProduct(p: TabGroup): string {
  return p.productKey ?? p.itemKey ?? p.domain;
}

function focusTabChipWhenReady(direction: 'first' | 'last', attempts = 12): void {
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab-url]'));
  const target = direction === 'first' ? chips[0] : chips.at(-1);

  if (target) {
    target.focus({ preventScroll: false });
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }

  if (attempts > 0) {
    window.setTimeout(() => focusTabChipWhenReady(direction, attempts - 1), 50);
  }
}

// ─── Component ────────────────────────────────────────────────────────

export function App(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: '', onConfirm: () => {} });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // Collapsed by default as requested
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [closingUrls, setClosingUrls] = useState<Set<string>>(new Set());
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());



  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Stores ────────────────────────────────────────────────────────
  const tabStore = useTabStore();
  const settingsStore = useSettingsStore();

  const { tabs, products, loading: tabsLoading } = tabStore;
  const { manualGroups, groupAssignments, viewMode, history } = tabStore;
  const { settings } = settingsStore;

  // ─── Toast helper ──────────────────────────────────────────────────

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, TOAST_DURATION);
  }, []);

  // ─── Init: fetch data + dark mode ──────────────────────────────────

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const { theme } = useSettingsStore.getState().settings;
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.toggle('dark', mq.matches);
      }
    };

    applyTheme();
    mq.addEventListener('change', applyTheme);

    // Re-apply when settings change
    const unsub = useSettingsStore.subscribe(applyTheme);

    return () => {
      mq.removeEventListener('change', applyTheme);
      unsub();
    };
  }, []);

  useEffect(() => {
    async function init() {
      await Promise.all([
        tabStore.fetchTabs(),
        settingsStore.fetchSettings(),
        tabStore.fetchHistory(),
      ]);
      setLoading(false);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Real-time tab listeners ───────────────────────────────────────

  useEffect(() => {
    const cleanup = tabStore.startListeners();
    return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Keyboard shortcuts ────────────────────────────────────────────

  useKeyboard({
    onSearch: () => {
      const input = document.querySelector<HTMLInputElement>('input[aria-label="Search tabs"]');
      input?.focus();
    },
    onEscape: () => {
      setSearchQuery('');
      setSettingsOpen(false);
      setFocusedIndex(null);
      setSelectedUrls(new Set());
      setLastClickedIndex(null);
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    },
    onArrowUp: () => {
      if (flatChips.length === 0) {
        focusTabChipWhenReady('last');
        return;
      }
      setFocusedIndex((prev) => {
        if (prev === null) return flatChips.length - 1;
        return prev > 0 ? prev - 1 : flatChips.length - 1;
      });
    },
    onArrowDown: () => {
      if (flatChips.length === 0) {
        focusTabChipWhenReady('first');
        return;
      }
      setFocusedIndex((prev) => {
        if (prev === null) return 0;
        return prev < flatChips.length - 1 ? prev + 1 : 0;
      });
    },
    onEnter: () => {
      // Skip if focus is on a TabChip (it handles its own Enter via onKeyDown)
      const active = document.activeElement;
      if (active?.closest('[data-tab-url]')) return;
      if (focusedIndex !== null && flatChips[focusedIndex]) {
        handleFocusTab(flatChips[focusedIndex].url);
      }
    },
    onDClose: () => {
      if (focusedIndex !== null && flatChips[focusedIndex]) {
        handleCloseTabAnimated(flatChips[focusedIndex].url);
      }
    },
  });

  // ─── Search filtering ──────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products
      .map((p) => ({
        ...p,
        tabs: p.tabs.filter(
          (tab) =>
            (tab.title || '').toLowerCase().includes(query) ||
            tab.url.toLowerCase().includes(query) ||
            p.domain.toLowerCase().includes(query) ||
            (p.friendlyName || '').toLowerCase().includes(query),
        ),
      }))
      .filter((p) => p.tabs.length > 0);
  }, [products, searchQuery]);

  const filteredTabCount = useMemo(
    () => filteredProducts.reduce((sum, p) => sum + p.tabs.length, 0),
    [filteredProducts],
  );

  const itemIdForProduct = useCallback((p: TabGroup) => {
    return `product:${productKeyForProduct(p)}`;
  }, []);

  const assignmentByItemId = useMemo(() => {
    const map = new Map<string, string>();
    for (const assignment of groupAssignments) {
      map.set(`product:${assignment.productKey}`, assignment.groupId);
    }
    return map;
  }, [groupAssignments]);

  const groupAssignmentKey = useCallback((p: TabGroup) => {
    return `product:${productKeyForProduct(p)}`;
  }, []);

  const orderedGroups = useMemo(
    () => [...manualGroups].sort((a, b) => a.order - b.order),
    [manualGroups],
  );

  const unassignedProducts = useMemo(
    () => filteredProducts.filter((p) => !assignmentByItemId.has(groupAssignmentKey(p))),
    [filteredProducts, assignmentByItemId, groupAssignmentKey],
  );

  const productsByGroup = useMemo(() => {
    const result = new Map<string, TabGroup[]>();
    for (const group of orderedGroups) {
      result.set(group.id, []);
    }

    for (const p of filteredProducts) {
      const groupId = assignmentByItemId.get(groupAssignmentKey(p));
      if (!groupId) continue;
      const bucket = result.get(groupId);
      if (bucket) bucket.push(p);
    }

    for (const [groupId, items] of result) {
      const assignmentsForGroup = groupAssignments.filter((assignment) => assignment.groupId === groupId);
      items.sort((a, b) => {
        const aOrder = assignmentsForGroup.find(
          (assignment) => `product:${assignment.productKey}` === groupAssignmentKey(a),
        )?.order ?? a.order;
        const bOrder = assignmentsForGroup.find(
          (assignment) => `product:${assignment.productKey}` === groupAssignmentKey(b),
        )?.order ?? b.order;
        return aOrder - bOrder;
      });
    }

    return result;
  }, [assignmentByItemId, filteredProducts, groupAssignmentKey, orderedGroups, groupAssignments]);

  const flatChips = flattenVisibleTabs(
    filteredProducts,
    settings.maxChipsVisible,
    expandedDomains,
  );

  const focusedUrl = focusedIndex !== null ? flatChips[focusedIndex]?.url ?? null : null;


  // ─── Tab Out dupe count ────────────────────────────────────────────

  const tabOutCount = useMemo(
    () => tabs.filter((t) => isTabOutPage(t.url)).length,
    [tabs],
  );

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleCloseProduct = useCallback(
    (p: TabGroup) => {
      const urls = p.tabs.map((t) => t.url);
      playCloseEffects(settings);
      tabStore.closeTabsExact(urls).then(() => {
        showToast(`Closed all ${p.tabs.length} ${p.friendlyName || p.domain} tabs`);
        playCloseEffects(settings, {
          sound: false,
          confettiOrigin: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        });
      });
    },
    [settings, tabStore, showToast],
  );

  const handleCloseDuplicates = useCallback(
    (urls: string[]) => {
      playCloseEffects(settings);
      tabStore.closeDuplicates(urls, true).then(() => {
        showToast('Duplicates closed');
      });
    },
    [settings, tabStore, showToast],
  );

  const handleCloseTabAnimated = useCallback(
    (url: string) => {
      const closeDelay = getChipCloseDelay(userPrefersReducedMotion());

      playCloseEffects(settings);

      if (closeDelay === 0) {
        tabStore.closeTabByUrl(url).then(() => {
          showToast('Tab closed');
        });
        return;
      }

      setClosingUrls((prev) => new Set([...prev, url]));
      setTimeout(() => {
        tabStore.closeTabByUrl(url).then(() => {
          showToast('Tab closed');
          setClosingUrls((prev) => {
            const next = new Set(prev);
            next.delete(url);
            return next;
          });
        });
      }, closeDelay);
    },
    [settings, tabStore, showToast],
  );

  const handleFocusTab = useCallback(
    (url: string) => {
      tabStore.focusTab(url);
    },
    [tabStore],
  );



  const handleResetSortOrder = useCallback(async () => {
    await clearGroupOrder();
    await tabStore.fetchTabs();
    showToast('Sort order reset');
    setSettingsOpen(false);
  }, [tabStore, showToast]);

  // ─── Batch selection handlers ───────────────────────────────────────

  const handleChipClick = useCallback(
    (url: string, event: React.MouseEvent) => {
      const chipIndex = flatChips.findIndex((c) => c.url === url);
      if (chipIndex === -1) {
        return;
      }

      if (event.shiftKey && lastClickedIndex !== null) {
        const start = Math.min(lastClickedIndex, chipIndex);
        const end = Math.max(lastClickedIndex, chipIndex);
        const rangeUrls = flatChips.slice(start, end + 1).map((c) => c.url);
        setSelectedUrls((prev) => new Set([...prev, ...rangeUrls]));
      } else if (event.metaKey || event.ctrlKey || selectedUrls.size > 0) {
        setSelectedUrls((prev) => {
          const next = new Set(prev);
          if (next.has(url)) {
            next.delete(url);
          } else {
            next.add(url);
          }
          return next;
        });
      }
      setLastClickedIndex(chipIndex);
    },
    [flatChips, lastClickedIndex, selectedUrls],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedUrls(new Set());
    setLastClickedIndex(null);
  }, []);

  const handleToggleExpanded = useCallback((domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);

      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }

      return next;
    });
  }, []);

  const handleCloseSelected = useCallback(() => {
    const urls = [...selectedUrls];
    playCloseEffects(settings);
    tabStore.closeOneTabPerUrl(urls).then(() => {
      showToast(`Closed ${urls.length} tab${urls.length !== 1 ? 's' : ''}`);
      setSelectedUrls(new Set());
      setLastClickedIndex(null);
    });
  }, [selectedUrls, settings, tabStore, showToast]);

  const handleCloseAll = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: 'Close all tabs',
      message: `This will close all ${tabs.length} open tabs. This cannot be undone.`,
      confirmLabel: 'Close All',
      onConfirm: () => {
        playCloseEffects(settings);
        const allUrls = tabs.map((t) => t.url);
        tabStore.closeTabsExact(allUrls).then(() => {
          showToast(`Closed ${tabs.length} tabs`);
          playCloseEffects(settings, {
            sound: false,
            confettiOrigin: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
          });
        });
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  }, [settings, tabs, tabStore, showToast]);

  const handleCreateGroup = useCallback(() => {
    const name = window.prompt('Group name', 'Work');
    if (name == null) return;
    tabStore.createGroup(name).then(() => {
      showToast('Group created');
    });
  }, [tabStore, showToast]);

  const handleRenameGroup = useCallback((group: { id: string; name: string }) => {
    const name = window.prompt('Group name', group.name);
    if (name == null) return;
    tabStore.renameGroup(group.id, name).then(() => {
      showToast('Group renamed');
    });
  }, [tabStore, showToast]);

  const handleDeleteGroup = useCallback((group: { id: string; name: string }) => {
    setConfirmDialog({
      open: true,
      title: `Delete ${group.name}`,
      message: 'Items in this group will return to Unsorted. No tabs will be closed.',
      confirmLabel: 'Delete group',
      onConfirm: () => {
        tabStore.deleteGroup(group.id).then(() => {
          showToast('Group deleted');
        });
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  }, [tabStore, showToast]);

  const handleSetViewMode = useCallback((mode: 'cards' | 'table') => {
    tabStore.setViewMode(mode).then(() => {
      showToast(mode === 'cards' ? 'Cards view' : 'Table view');
    });
  }, [tabStore, showToast]);




  const handleRefresh = useCallback(async () => {
    await tabStore.fetchTabs();
    showToast('Refreshed');
  }, [tabStore, showToast]);

  const handleMoveTableItem = useCallback((p: TabGroup, groupId: string) => {
    const productKey = productKeyForProduct(p);
    const move = groupId
      ? tabStore.moveProductToGroup(productKey, groupId)
      : tabStore.moveProductToMain(productKey);

    move.then(() => {
      showToast(groupId ? 'Moved to group' : 'Moved to Unsorted');
    });
  }, [tabStore, showToast]);

  const handleMoveProductToMain = useCallback((productKey: string) => {
    tabStore.moveProductToMain(productKey).then(() => {
      showToast('Moved to Unsorted');
    });
  }, [tabStore, showToast]);

  const handleMoveProductToGroup = useCallback((productKey: string, groupId: string) => {
    tabStore.moveProductToGroup(productKey, groupId).then(() => {
      showToast('Moved to group');
    });
  }, [tabStore, showToast]);


  // ─── Derived state (must be before early return to satisfy rules-of-hooks) ──

  const totalDupes = useMemo(
    () => products.reduce((sum, p) => sum + p.duplicateCount, 0),
    [products],
  );

  // ─── Render ────────────────────────────────────────────────────────

  if (loading || tabsLoading) {
    return <LoadingState />;
  }

  const totalTabs = tabs.length;
  const totalProducts = products.length;
  const showEmptyState = products.length === 0;
  const visibleGroupCount = orderedGroups.length + (showEmptyState ? 0 : 1);
  const statusAlerts: StatusStripAlert[] = [];

  if (tabOutCount > 1) {
    statusAlerts.push({
      id: 'extra-tab-out-pages',
      label: `${tabOutCount - 1} extra dashboard tab${tabOutCount - 1 === 1 ? '' : 's'}`,
      actionLabel: 'Close extras',
      onAction: () => {
        chrome.tabs.getCurrent().then((currentTab) => {
          const currentTabId = currentTab?.id ?? -1;
          const tabOutUrls = tabs
            .filter((t) => isTabOutPage(t.url) && t.id !== currentTabId)
            .map((t) => t.url);
          if (tabOutUrls.length > 0) {
            tabStore.closeTabsExact(tabOutUrls).catch(() => {});
          }
        }).catch(() => {});
      },
    });
  }

  if (!nudgeDismissed && totalTabs > 15) {
    statusAlerts.push({
      id: 'tab-count-nudge',
      label: 'High tab count',
      actionLabel: 'Dismiss',
      onAction: () => setNudgeDismissed(true),
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
            totalTabs={totalTabs}
            totalDupes={totalDupes}
            totalGroups={totalProducts}
            alerts={statusAlerts}
          />
        }
        header={
          <DashboardHeader
            title="Open Tabs by Product"
            hasGroups={!showEmptyState}
            groupCount={visibleGroupCount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            resultCount={filteredTabCount}
            totalCount={totalTabs}
            viewMode={viewMode}
            onViewModeChange={handleSetViewMode}
            onRefresh={handleRefresh}
            onCreateGroup={handleCreateGroup}
            onCloseAll={handleCloseAll}
            onOpenSettings={() => setSettingsOpen(true)}
            isSidebarExpanded={isSidebarExpanded}
            onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
          />
        }
        isSidebarExpanded={isSidebarExpanded}
        onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
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
        footer={<Footer tabCount={totalTabs} />}
      >
        {showEmptyState ? (
          <EmptyState />
        ) : (
          <main id="main-content" tabIndex={-1} className="active-section">
              {viewMode === 'table' ? (
                <ProductTable
                  items={filteredProducts}
                  groups={orderedGroups}
                  assignmentByItemId={assignmentByItemId}
                  onMoveItem={handleMoveTableItem}
                  onCloseProduct={handleCloseProduct}
                  onCloseDuplicates={handleCloseDuplicates}
                  onFocusTab={handleFocusTab}
                  expandedDomains={expandedDomains}
                  onToggleExpanded={handleToggleExpanded}
                  onCloseTab={handleCloseTabAnimated}
                  onChipClick={handleChipClick}
                  selectedUrls={selectedUrls}
                  closingUrls={closingUrls}
                  focusedUrl={focusedUrl}
                />
              ) : (
                <ErrorBoundary>
                  <DndOrganizer
                    filteredProducts={filteredProducts}
                    unassignedProducts={unassignedProducts}
                    orderedGroups={orderedGroups}
                    productsByGroup={productsByGroup}
                    assignmentByItemId={assignmentByItemId}
                    itemIdForProduct={itemIdForProduct}
                    expandedDomains={expandedDomains}
                    maxChipsVisible={settings.maxChipsVisible}
                    focusedUrl={focusedUrl}
                    closingUrls={closingUrls}
                    selectedUrls={selectedUrls}
                    onMoveProductToMain={handleMoveProductToMain}
                    onMoveProductToGroup={handleMoveProductToGroup}
                    onRenameGroup={handleRenameGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onCloseProduct={handleCloseProduct}
                    onCloseDuplicates={handleCloseDuplicates}
                    onCloseTab={handleCloseTabAnimated}
                    onFocusTab={handleFocusTab}
                    onChipClick={handleChipClick}
                    onToggleExpanded={handleToggleExpanded}
                  />
                </ErrorBoundary>
              )}
          </main>
        )}
      </DashboardShell>

      {/* Confirmation dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />

      {/* Settings panel */}
      {settingsOpen && (
        <React.Suspense fallback={null}>
          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            theme={settings.theme}
            soundEnabled={settings.soundEnabled}
            confettiEnabled={settings.confettiEnabled}
            customGroups={settings.customGroups}
            onSetTheme={settingsStore.setTheme}
            onToggleSound={settingsStore.toggleSound}
            onToggleConfetti={settingsStore.toggleConfetti}
            onResetSortOrder={handleResetSortOrder}
            onAddCustomGroup={settingsStore.addCustomGroup}
            onRemoveCustomGroup={settingsStore.removeCustomGroup}
          />
        </React.Suspense>
      )}

      {/* Toast overlay */}
      <Toast message={toast.message} visible={toast.visible} />

      {/* Batch selection bar */}
      {selectedUrls.size > 0 && (
        <SelectionBar
          count={selectedUrls.size}
          onClose={handleCloseSelected}
          onClear={handleClearSelection}
        />
      )}
    </ErrorBoundary>
  );
}
