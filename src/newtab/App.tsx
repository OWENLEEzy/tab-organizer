import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingState } from './components/LoadingState';
import { Header } from './components/Header';
import { DupeBanner } from './components/DupeBanner';
import { NudgeBanner } from './components/NudgeBanner';
import { SearchBar } from './components/SearchBar';
import { SortableDomainCard } from './components/SortableDomainCard';
import { DomainCard } from './components/DomainCard';
import { SelectionBar } from './components/SelectionBar';
import { DeferredColumn } from './components/DeferredColumn';
import { EmptyState } from './components/EmptyState';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { SettingsPanel } from './components/SettingsPanel';
import { useTabStore } from '../stores/tab-store';
import { useSavedStore } from '../stores/saved-store';
import { useSettingsStore } from '../stores/settings-store';
import { clearGroupOrder } from '../utils/storage';
import { useChromeStorage } from './hooks/useChromeStorage';
import { useKeyboard } from './hooks/useKeyboard';
import { flattenVisibleTabs } from './lib/visible-tabs';
import { getChipCloseDelay, userPrefersReducedMotion } from './lib/motion';
import { playCloseEffects } from '../lib/close-effects';
import { isTabOutPage } from '../utils/url';
import { LANDING_PAGES_KEY } from '../lib/tab-grouper';
import type { TabGroup } from '../types';

// ─── Constants ────────────────────────────────────────────────────────

const TOAST_DURATION = 2500;

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
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [closingUrls, setClosingUrls] = useState<Set<string>>(new Set());
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Stores ────────────────────────────────────────────────────────
  const tabStore = useTabStore();
  const savedStore = useSavedStore();
  const settingsStore = useSettingsStore();

  const { tabs, groups, loading: tabsLoading } = tabStore;
  const { active: savedActive, archived: savedArchived, archiveSearch } = savedStore;
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
      await Promise.all([tabStore.fetchTabs(), savedStore.fetchSaved(), settingsStore.fetchSettings()]);
      setLoading(false);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Real-time tab listeners ───────────────────────────────────────

  useEffect(() => {
    const cleanup = tabStore.startListeners();
    return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sync saved data on storage changes ────────────────────────────

  useChromeStorage(() => {
    savedStore.fetchSaved();
  });

  // ─── Keyboard shortcuts ────────────────────────────────────────────

  useKeyboard({
    onSearch: () => {
      const input = document.querySelector<HTMLInputElement>('input[aria-label="Search tabs"]');
      input?.focus();
    },
    onSave: () => {
      showToast('No tab selected');
    },
    onEscape: () => {
      setSearchQuery('');
      setSettingsOpen(false);
      setFocusedIndex(null);
      setSelectedUrls(new Set());
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    },
    onArrowUp: () => {
      setFocusedIndex((prev) => {
        if (flatChips.length === 0) return null;
        if (prev === null) return flatChips.length - 1;
        return prev > 0 ? prev - 1 : flatChips.length - 1;
      });
    },
    onArrowDown: () => {
      setFocusedIndex((prev) => {
        if (flatChips.length === 0) return null;
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
    onDSave: () => {
      if (focusedIndex !== null && flatChips[focusedIndex]) {
        handleSaveTab(flatChips[focusedIndex].url, flatChips[focusedIndex].title);
      }
    },
  });

  // ─── Search filtering ──────────────────────────────────────────────

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        tabs: group.tabs.filter(
          (tab) =>
            (tab.title || '').toLowerCase().includes(query) ||
            tab.url.toLowerCase().includes(query) ||
            group.domain.toLowerCase().includes(query) ||
            (group.friendlyName || '').toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.tabs.length > 0);
  }, [groups, searchQuery]);

  const filteredTabCount = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.tabs.length, 0),
    [filteredGroups],
  );

  const flatChips = flattenVisibleTabs(
    filteredGroups,
    settings.maxChipsVisible,
    expandedDomains,
  );

  const focusedUrl = focusedIndex !== null ? flatChips[focusedIndex]?.url ?? null : null;

  // ─── Tab Out dupe count ────────────────────────────────────────────

  const tabOutCount = useMemo(
    () => tabs.filter((t) => isTabOutPage(t.url)).length,
    [tabs],
  );

  // Cache the current tab ID once (doesn't change during NTP lifetime)
  const currentTabIdRef = useRef<number>(-1);
  useEffect(() => {
    chrome.tabs.getCurrent().then((tab) => {
      if (tab?.id != null) currentTabIdRef.current = tab.id;
    }).catch(() => {});
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleCloseDomain = useCallback(
    (group: TabGroup) => {
      const urls = group.tabs.map((t) => t.url);
      playCloseEffects(settings);
      // Landing pages use exact-match close to avoid closing non-landing tabs on the same domain
      const closeFn =
        group.domain === LANDING_PAGES_KEY
          ? tabStore.closeTabsExact
          : tabStore.closeTabsByUrls;
      closeFn(urls).then(() => {
        showToast(`Closed all ${group.tabs.length} ${group.friendlyName || group.domain} tabs`);
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

  const handleSaveTab = useCallback(
    (url: string, title: string) => {
      savedStore.saveTab(url, title).then(() => {
        showToast('Saved for later');
      });
    },
    [savedStore, showToast],
  );

  const handleFocusTab = useCallback(
    (url: string) => {
      tabStore.focusTab(url);
    },
    [tabStore],
  );

  const handleCloseExtras = useCallback(() => {
    const tabOutUrls = tabs
      .filter((t) => isTabOutPage(t.url) && t.id !== currentTabIdRef.current)
      .map((t) => t.url);

    if (tabOutUrls.length === 0) return;

    tabStore.closeTabsExact(tabOutUrls).then(() => {
      showToast('Extra Tab Out tabs closed');
    });
  }, [tabs, tabStore, showToast]);

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
    });
  }, [selectedUrls, settings, tabStore, showToast]);

  const handleSaveSelected = useCallback(() => {
    const chipsToSave = flatChips.filter((c) => selectedUrls.has(c.url));
    Promise.all(chipsToSave.map((c) => savedStore.saveTab(c.url, c.title))).then(() => {
      showToast(`Saved ${chipsToSave.length} tab${chipsToSave.length !== 1 ? 's' : ''}`);
      setSelectedUrls(new Set());
    });
  }, [selectedUrls, flatChips, savedStore, showToast]);

  const handleCloseAll = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: 'Close all tabs',
      message: `This will close all ${tabs.length} open tabs. This cannot be undone.`,
      confirmLabel: 'Close all',
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

  const handleCheckOff = useCallback(
    (id: string) => {
      savedStore.checkOff(id).then(() => {
        showToast('Checked off');
      });
    },
    [savedStore, showToast],
  );

  const handleDismiss = useCallback(
    (id: string) => {
      savedStore.dismiss(id).then(() => {
        showToast('Dismissed');
      });
    },
    [savedStore, showToast],
  );

  const handleArchiveSearch = useCallback(
    (query: string) => {
      savedStore.setArchiveSearch(query);
    },
    [savedStore],
  );

  // ─── Drag-and-drop handler ───────────────────────────────────────

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = filteredGroups.findIndex((g) => g.domain === active.id);
      const newIndex = filteredGroups.findIndex((g) => g.domain === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(filteredGroups, oldIndex, newIndex);
      tabStore.reorderGroups(reordered);
    },
    [filteredGroups, tabStore],
  );

  // ─── Derived state (must be before early return to satisfy rules-of-hooks) ──

  const totalDupes = useMemo(
    () => groups.reduce((sum, g) => sum + g.duplicateCount, 0),
    [groups],
  );

  // ─── Render ────────────────────────────────────────────────────────

  if (loading || tabsLoading) {
    return <LoadingState />;
  }

  const totalTabs = tabs.length;
  const totalDomains = groups.length;
  const hasDeferredContent = savedActive.length > 0 || savedArchived.length > 0;
  const showEmptyState = groups.length === 0 && !hasDeferredContent;

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
      <div className="tab-out-container">
        {/* Header */}
        <Header totalTabs={totalTabs} totalDupes={totalDupes} totalDomains={totalDomains} />

        {/* Tab Out duplicates banner */}
        <DupeBanner count={tabOutCount} onClose={handleCloseExtras} />

        {/* Nudge banner for too many tabs */}
        {!nudgeDismissed && (
          <NudgeBanner
            tabCount={totalTabs}
            onDismiss={() => setNudgeDismissed(true)}
          />
        )}

        {/* Search bar */}
        {groups.length > 0 && (
          <div className="mb-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={filteredTabCount}
              totalCount={totalTabs}
            />
          </div>
        )}

        {/* Dashboard — two-column layout */}
        {showEmptyState ? (
          <EmptyState />
        ) : (
          <div className={`dashboard-columns ${hasDeferredContent ? 'has-sidebar' : ''}`}>
            {/* Left column: open tabs */}
            <main id="main-content" tabIndex={-1} className="active-section">
              {filteredGroups.length > 0 && (
                <div className="section-header">
                  <h2 className="font-heading text-text-primary-light dark:text-text-primary-dark text-base font-semibold">
                    Right now
                  </h2>
                  <div className="border-border-light dark:border-border-dark mx-3 h-px flex-1" />
                  <span className="text-text-secondary text-xs whitespace-nowrap">
                    {filteredTabCount} tab{filteredTabCount !== 1 ? 's' : ''}
                  </span>
                  {/* Close all button */}
                  <button
                    type="button"
                    className="rounded-chip text-text-secondary hover:bg-accent-red/10 hover:text-accent-red focus-visible:ring-accent-blue/40 ml-2 min-h-11 cursor-pointer px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    onClick={handleCloseAll}
                  >
                    Close all
                  </button>
                </div>
              )}
              {selectedUrls.size > 0 ? (
                <div className="missions">
                  {filteredGroups.map((group) => (
                    <DomainCard
                      key={group.domain}
                      group={group}
                      expanded={expandedDomains.has(group.domain)}
                      maxChipsVisible={settings.maxChipsVisible}
                      focusedUrl={focusedUrl}
                      closingUrls={closingUrls}
                      selectedUrls={selectedUrls}
                      onChipClick={handleChipClick}
                      onToggleExpanded={handleToggleExpanded}
                      onCloseDomain={handleCloseDomain}
                      onCloseDuplicates={handleCloseDuplicates}
                      onCloseTab={handleCloseTabAnimated}
                      onSaveTab={handleSaveTab}
                      onFocusTab={handleFocusTab}
                    />
                  ))}
                </div>
              ) : (
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={filteredGroups.map((g) => g.domain)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="missions">
                      {filteredGroups.map((group) => (
                        <SortableDomainCard
                          key={group.domain}
                          group={group}
                          expanded={expandedDomains.has(group.domain)}
                          maxChipsVisible={settings.maxChipsVisible}
                          onCloseDomain={handleCloseDomain}
                          onCloseDuplicates={handleCloseDuplicates}
                          onCloseTab={handleCloseTabAnimated}
                          onSaveTab={handleSaveTab}
                          onFocusTab={handleFocusTab}
                          focusedUrl={focusedUrl}
                          closingUrls={closingUrls}
                          selectedUrls={selectedUrls}
                          onChipClick={handleChipClick}
                          onToggleExpanded={handleToggleExpanded}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </main>

            {/* Right column: Saved for Later */}
            <DeferredColumn
              active={savedActive}
              archived={savedArchived}
              archiveSearch={archiveSearch}
              onCheckOff={handleCheckOff}
              onDismiss={handleDismiss}
              onArchiveSearch={handleArchiveSearch}
            />
          </div>
        )}

        {/* Footer */}
        <Footer tabCount={totalTabs} />

        {/* Settings gear (bottom-right) */}
        <button
          type="button"
          className="border-border-light bg-bg-light text-text-secondary shadow-card hover:shadow-card-hover hover:text-text-primary-light focus-visible:ring-accent-blue/40 dark:border-border-dark dark:bg-bg-dark dark:hover:text-text-primary-dark fixed right-5 bottom-5 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border transition-all focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
        </button>
      </div>

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
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={settings.theme}
        soundEnabled={settings.soundEnabled}
        confettiEnabled={settings.confettiEnabled}
        onSetTheme={settingsStore.setTheme}
        onToggleSound={settingsStore.toggleSound}
        onToggleConfetti={settingsStore.toggleConfetti}
        onResetSortOrder={handleResetSortOrder}
      />

      {/* Toast overlay */}
      <Toast message={toast.message} visible={toast.visible} />

      {/* Batch selection bar */}
      {selectedUrls.size > 0 && (
        <SelectionBar
          count={selectedUrls.size}
          onClose={handleCloseSelected}
          onSave={handleSaveSelected}
          onClear={handleClearSelection}
        />
      )}
    </ErrorBoundary>
  );
}
