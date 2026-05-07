import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTabStore } from '../../stores/tab-store';
import { useSettingsStore } from '../../stores/settings-store';
import { clearGroupOrder } from '../../utils/storage';
import { useKeyboard } from './useKeyboard';
import { flattenVisibleTabs } from '../lib/visible-tabs';
import { getChipCloseDelay, userPrefersReducedMotion } from '../lib/motion';
import { playCloseEffects } from '../../lib/close-effects';
import { isTabOutPage } from '../../utils/url';
import type { TabGroup, ManualGroup } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────

interface AppState {
  toast: { message: string; visible: boolean };
  searchQuery: string;
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  };
  settingsOpen: boolean;
  isSidebarExpanded: boolean;
  nudgeDismissed: boolean;
  focusedIndex: number | null;
  closingUrls: Set<string>;
  selectedUrls: Set<string>;
  lastClickedIndex: number | null;
  expandedDomains: Set<string>;
  promptDialog: {
    open: boolean;
    title: string;
    label: string;
    initialValue: string;
    confirmLabel: string;
    onConfirm: (value: string) => void;
  };
}

type AppAction =
  | { type: 'SET_TOAST'; message: string; visible: boolean }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_CONFIRM_DIALOG'; dialog: AppState['confirmDialog'] }
  | { type: 'CLOSE_CONFIRM_DIALOG' }
  | { type: 'SET_SETTINGS_OPEN'; open: boolean }
  | { type: 'SET_SIDEBAR_EXPANDED'; expanded: boolean }
  | { type: 'SET_NUDGE_DISMISSED'; dismissed: boolean }
  | { type: 'SET_FOCUSED_INDEX'; index: number | null | ((prev: number | null) => number | null) }
  | { type: 'SET_CLOSING_URLS'; urls: Set<string> | ((prev: Set<string>) => Set<string>) }
  | { type: 'SET_SELECTED_URLS'; urls: Set<string> | ((prev: Set<string>) => Set<string>) }
  | { type: 'SET_LAST_CLICKED_INDEX'; index: number | null }
  | { type: 'SET_EXPANDED_DOMAINS'; domains: Set<string> | ((prev: Set<string>) => Set<string>) }
  | { type: 'SET_PROMPT_DIALOG'; dialog: AppState['promptDialog'] }
  | { type: 'CLOSE_PROMPT_DIALOG' }
  | { type: 'RESET_INTERACTION' };

const initialState: AppState = {
  toast: { message: '', visible: false },
  searchQuery: '',
  confirmDialog: { open: false, title: '', message: '', confirmLabel: '', onConfirm: () => {} },
  settingsOpen: false,
  isSidebarExpanded: false,
  nudgeDismissed: false,
  focusedIndex: null,
  closingUrls: new Set(),
  selectedUrls: new Set(),
  lastClickedIndex: null,
  expandedDomains: new Set(),
  promptDialog: { open: false, title: '', label: '', initialValue: '', confirmLabel: '', onConfirm: () => {} },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TOAST':
      return { ...state, toast: { message: action.message, visible: action.visible } };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    case 'SET_CONFIRM_DIALOG':
      return { ...state, confirmDialog: action.dialog };
    case 'CLOSE_CONFIRM_DIALOG':
      return { ...state, confirmDialog: { ...state.confirmDialog, open: false } };
    case 'SET_SETTINGS_OPEN':
      return { ...state, settingsOpen: action.open };
    case 'SET_SIDEBAR_EXPANDED':
      return { ...state, isSidebarExpanded: action.expanded };
    case 'SET_NUDGE_DISMISSED':
      return { ...state, nudgeDismissed: action.dismissed };
    case 'SET_FOCUSED_INDEX':
      return { ...state, focusedIndex: typeof action.index === 'function' ? action.index(state.focusedIndex) : action.index };
    case 'SET_CLOSING_URLS':
      return { ...state, closingUrls: typeof action.urls === 'function' ? action.urls(state.closingUrls) : action.urls };
    case 'SET_SELECTED_URLS':
      return { ...state, selectedUrls: typeof action.urls === 'function' ? action.urls(state.selectedUrls) : action.urls };
    case 'SET_LAST_CLICKED_INDEX':
      return { ...state, lastClickedIndex: action.index };
    case 'SET_EXPANDED_DOMAINS':
      return { ...state, expandedDomains: typeof action.domains === 'function' ? action.domains(state.expandedDomains) : action.domains };
    case 'SET_PROMPT_DIALOG':
      return { ...state, promptDialog: action.dialog };
    case 'CLOSE_PROMPT_DIALOG':
      return { ...state, promptDialog: { ...state.promptDialog, open: false } };
    case 'RESET_INTERACTION':
      return { ...state, searchQuery: '', settingsOpen: false, focusedIndex: null, selectedUrls: new Set(), lastClickedIndex: null };
    default:
      return state;
  }
}

const TOAST_DURATION = 2500;

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

export function useAppLogic() {
  const [loading, setLoading] = React.useState(true);
  const [state, dispatch] = React.useReducer(appReducer, initialState);

  const {
    toast,
    searchQuery,
    confirmDialog,
    settingsOpen,
    isSidebarExpanded,
    nudgeDismissed,
    focusedIndex,
    closingUrls,
    selectedUrls,
    lastClickedIndex,
    expandedDomains,
  } = state;

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
    dispatch({ type: 'SET_TOAST', message, visible: true });
    toastTimer.current = setTimeout(() => {
      dispatch({ type: 'SET_TOAST', message, visible: false });
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

  useEffect(() => {
    const cleanup = tabStore.startListeners();
    return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Derived state ──────────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    const result: TabGroup[] = [];
    for (const p of products) {
      const filteredTabs = p.tabs.filter(
        (tab) =>
          (tab.title || '').toLowerCase().includes(query) ||
          tab.url.toLowerCase().includes(query) ||
          p.domain.toLowerCase().includes(query) ||
          (p.friendlyName || '').toLowerCase().includes(query),
      );
      if (filteredTabs.length > 0) {
        result.push({ ...p, tabs: filteredTabs });
      }
    }
    return result;
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
      const orderMap = new Map<string, number>();
      for (const assignment of groupAssignments) {
        if (assignment.groupId === groupId) {
          orderMap.set(`product:${assignment.productKey}`, assignment.order);
        }
      }

      items.sort((a, b) => {
        const aOrder = orderMap.get(groupAssignmentKey(a)) ?? a.order;
        const bOrder = orderMap.get(groupAssignmentKey(b)) ?? b.order;
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

  const tabOutCount = useMemo(
    () => tabs.filter((t) => isTabOutPage(t.url)).length,
    [tabs],
  );

  const totalDupes = useMemo(
    () => products.reduce((sum, p) => sum + p.duplicateCount, 0),
    [products],
  );

  // ─── Handlers ──────────────────────────────────────────────────────

  const performBatchClose = useCallback(
    async (urls: string[], toastMessage: string) => {
      if (urls.length === 0) return;
      playCloseEffects(settings);
      await tabStore.closeTabsExact(urls);
      showToast(toastMessage);
      playCloseEffects(settings, {
        sound: false,
        confettiOrigin: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      });
    },
    [settings, tabStore, showToast],
  );

  const handleCloseProduct = useCallback(
    (p: TabGroup) => {
      dispatch({
        type: 'SET_CONFIRM_DIALOG',
        dialog: {
          open: true,
          title: `Close all ${p.friendlyName || p.domain} tabs`,
          message: `This will close all ${p.tabs.length} tabs for this product.`,
          confirmLabel: 'Close all',
          onConfirm: () => {
            const urls = p.tabs.map((t) => t.url);
            performBatchClose(urls, `Closed all ${p.tabs.length} ${p.friendlyName || p.domain} tabs`);
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
      });
    },
    [performBatchClose],
  );

  const handleCloseManualGroup = useCallback(
    (groups: TabGroup[], title: string) => {
      const urls = groups.flatMap((p) => p.tabs.map((t) => t.url));
      dispatch({
        type: 'SET_CONFIRM_DIALOG',
        dialog: {
          open: true,
          title: `Close all tabs in ${title}`,
          message: `This will close all ${urls.length} tabs in this section.`,
          confirmLabel: 'Close all',
          onConfirm: () => {
            performBatchClose(urls, `Closed all ${urls.length} tabs in ${title}`);
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
      });
    },
    [performBatchClose],
  );

  const handleCloseDuplicates = useCallback(
    (urls: string[]) => {
      dispatch({
        type: 'SET_CONFIRM_DIALOG',
        dialog: {
          open: true,
          title: 'Close duplicates',
          message: `This will close all ${urls.length} duplicate tabs, keeping one of each.`,
          confirmLabel: 'Close Duplicates',
          onConfirm: () => {
            playCloseEffects(settings);
            tabStore.closeDuplicates(urls, true).then(() => {
              showToast('Duplicates closed');
            });
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
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

      dispatch({ type: 'SET_CLOSING_URLS', urls: (prev) => new Set([...prev, url]) });
      setTimeout(() => {
        tabStore.closeTabByUrl(url).then(() => {
          showToast('Tab closed');
          dispatch({
            type: 'SET_CLOSING_URLS',
            urls: (prev) => {
              const next = new Set(prev);
              next.delete(url);
              return next;
            },
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
    dispatch({ type: 'SET_SETTINGS_OPEN', open: false });
  }, [tabStore, showToast]);

  const handleChipClick = useCallback(
    (url: string, event: React.MouseEvent) => {
      const chipIndex = flatChips.findIndex((c) => c.url === url);
      if (chipIndex === -1) return;

      if (event.shiftKey && lastClickedIndex !== null) {
        const start = Math.min(lastClickedIndex, chipIndex);
        const end = Math.max(lastClickedIndex, chipIndex);
        const rangeUrls = flatChips.slice(start, end + 1).map((c) => c.url);
        dispatch({
          type: 'SET_SELECTED_URLS',
          urls: (prev) => new Set([...prev, ...rangeUrls]),
        });
      } else if (event.metaKey || event.ctrlKey || selectedUrls.size > 0) {
        dispatch({
          type: 'SET_SELECTED_URLS',
          urls: (prev) => {
            const next = new Set(prev);
            if (next.has(url)) {
              next.delete(url);
            } else {
              next.add(url);
            }
            return next;
          },
        });
      }
      dispatch({ type: 'SET_LAST_CLICKED_INDEX', index: chipIndex });
    },
    [flatChips, lastClickedIndex, selectedUrls],
  );

  const handleClearSelection = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_URLS', urls: new Set() });
    dispatch({ type: 'SET_LAST_CLICKED_INDEX', index: null });
  }, []);

  const handleToggleExpanded = useCallback((domain: string) => {
    dispatch({
      type: 'SET_EXPANDED_DOMAINS',
      domains: (prev) => {
        const next = new Set(prev);
        if (next.has(domain)) {
          next.delete(domain);
        } else {
          next.add(domain);
        }
        return next;
      },
    });
  }, []);

  const handleCloseSelected = useCallback(() => {
    const urls = [...selectedUrls];
    const count = urls.length;
    
    const performClose = () => {
      playCloseEffects(settings);
      tabStore.closeOneTabPerUrl(urls).then(() => {
        showToast(`Closed ${count} tab${count !== 1 ? 's' : ''}`);
        dispatch({ type: 'SET_SELECTED_URLS', urls: new Set() });
        dispatch({ type: 'SET_LAST_CLICKED_INDEX', index: null });
      });
    };

    if (count > 2) {
      dispatch({
        type: 'SET_CONFIRM_DIALOG',
        dialog: {
          open: true,
          title: `Close ${count} selected tabs`,
          message: `Are you sure you want to close these ${count} tabs?`,
          confirmLabel: 'Close Selected',
          onConfirm: () => {
            performClose();
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
      });
    } else {
      performClose();
    }
  }, [selectedUrls, settings, tabStore, showToast]);

  const handleCloseAll = useCallback(() => {
    dispatch({
      type: 'SET_CONFIRM_DIALOG',
      dialog: {
        open: true,
        title: 'Close all tabs',
        message: `This will close all ${tabs.length} open tabs. This cannot be undone.`,
        confirmLabel: 'Close All',
        onConfirm: () => {
          const allUrls = tabs.map((t) => t.url);
          performBatchClose(allUrls, `Closed ${tabs.length} tabs`);
          dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
        },
      },
    });
  }, [tabs, performBatchClose]);

  const handleCreateGroup = useCallback(() => {
    dispatch({
      type: 'SET_PROMPT_DIALOG',
      dialog: {
        open: true,
        title: 'New Section',
        label: 'Section Name',
        initialValue: 'Work',
        confirmLabel: 'Create Section',
        onConfirm: (name) => {
          tabStore.createGroup(name).then(() => {
            showToast('Group created');
          });
          dispatch({ type: 'CLOSE_PROMPT_DIALOG' });
        },
      },
    });
  }, [tabStore, showToast]);

  const handleRenameGroup = useCallback((group: { id: string; name: string }) => {
    dispatch({
      type: 'SET_PROMPT_DIALOG',
      dialog: {
        open: true,
        title: 'Rename Section',
        label: 'Section Name',
        initialValue: group.name,
        confirmLabel: 'Save Changes',
        onConfirm: (name) => {
          tabStore.renameGroup(group.id, name).then(() => {
            showToast('Group renamed');
          });
          dispatch({ type: 'CLOSE_PROMPT_DIALOG' });
        },
      },
    });
  }, [tabStore, showToast]);

  const handleDeleteGroup = useCallback((group: { id: string; name: string }) => {
    dispatch({
      type: 'SET_CONFIRM_DIALOG',
      dialog: {
        open: true,
        title: `Delete ${group.name}`,
        message: 'Items in this group will return to Unsorted. No tabs will be closed.',
        confirmLabel: 'Delete group',
        onConfirm: () => {
          tabStore.deleteGroup(group.id).then(() => {
            showToast('Group deleted');
          });
          dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
        },
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

  // ─── Keyboard shortcuts ────────────────────────────────────────────

  useKeyboard({
    onSearch: () => {
      const input = document.querySelector<HTMLInputElement>('input[aria-label="Search tabs"]');
      input?.focus();
    },
    onEscape: () => {
      dispatch({ type: 'RESET_INTERACTION' });
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    },
    onArrowUp: () => {
      if (flatChips.length === 0) {
        focusTabChipWhenReady('last');
        return;
      }
      dispatch({
        type: 'SET_FOCUSED_INDEX',
        index: (prev) => (prev === null ? flatChips.length - 1 : (prev > 0 ? prev - 1 : flatChips.length - 1)),
      });
    },
    onArrowDown: () => {
      if (flatChips.length === 0) {
        focusTabChipWhenReady('first');
        return;
      }
      dispatch({
        type: 'SET_FOCUSED_INDEX',
        index: (prev) => (prev === null ? 0 : (prev < flatChips.length - 1 ? prev + 1 : 0)),
      });
    },
    onEnter: () => {
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

  return {
    state: {
      ...state,
      loading,
      tabsLoading,
      totalTabs: tabs.length,
      totalProducts: products.length,
      totalDupes,
      tabOutCount,
      showEmptyState: products.length === 0,
      visibleGroupCount: orderedGroups.length + (products.length === 0 ? 0 : 1),
      focusedUrl,
      filteredTabCount,
    },
    stores: {
      tabStore,
      settingsStore,
    },
    derived: {
      filteredProducts,
      unassignedProducts,
      orderedGroups,
      productsByGroup,
      assignmentByItemId,
      itemIdForProduct,
      flatChips,
    },
    dispatch,
    handlers: {
      showToast,
      handleCloseProduct,
      handleCloseManualGroup,
      handleCloseDuplicates,
      handleCloseTabAnimated,
      handleFocusTab,
      handleResetSortOrder,
      handleChipClick,
      handleClearSelection,
      handleToggleExpanded,
      handleCloseSelected,
      handleCloseAll,
      handleCreateGroup,
      handleRenameGroup,
      handleDeleteGroup,
      handleSetViewMode,
      handleRefresh,
      handleMoveTableItem,
      handleMoveProductToMain,
      handleMoveProductToGroup,
    },
  };
}
