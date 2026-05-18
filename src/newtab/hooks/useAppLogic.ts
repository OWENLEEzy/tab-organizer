import React, { useCallback, useEffect, useMemo } from 'react';
import { useTabStore } from '../../stores/tab-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useKeyboard } from './useKeyboard';
import { flattenVisibleTabs } from '../lib/visible-tabs';
import { isTabOutPage } from '../../utils/url';
import type { TabGroup } from '../../types';
import { useUIState } from './useUIState';
import { useTabHandlers } from './useTabHandlers';
import { DASHBOARD_SPACE_SWITCHER_FOCUS_HASH } from '../../background/dashboard';
import { isTabStale, filterDuplicateTabs } from '../../lib/tab-utils';

// ─── Helpers ────────────────────────────────────────────────────────────

function productKeyForProduct(p: TabGroup): string {
  return p.productKey ?? p.itemKey ?? p.domain;
}

interface CommandParsed {
  type: 'dupes' | 'stale' | 'space' | 'text';
  arg?: string;
  textQuery: string;
}

function parseSearchQuery(query: string): CommandParsed {
  const trimmed = query.trim().toLowerCase();
  
  if (trimmed.startsWith('/dupes')) {
    const textQuery = trimmed.replace('/dupes', '').trim();
    return { type: 'dupes', textQuery };
  }
  
  if (trimmed.startsWith('/stale')) {
    const textQuery = trimmed.replace('/stale', '').trim();
    return { type: 'stale', textQuery };
  }
  
  const spaceMatch = trimmed.match(/^\/space:([^\s]+)/);
  if (spaceMatch) {
    const textQuery = trimmed.replace(spaceMatch[0], '').trim();
    return { 
      type: 'space', 
      arg: spaceMatch[1], 
      textQuery
    };
  }
  
  return { type: 'text', textQuery: trimmed };
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
  
  // ─── Modular Hooks ──────────────────────────────────────────────────
  const { state, dispatch, showToast } = useUIState();
  const {
    searchQuery,
    focusedIndex,
    expandedDomains,
    selectedUrls,
    lastClickedIndex,
  } = state;

  const focusSpaceSwitcher = useCallback(() => {
    dispatch({ type: 'SET_SPACE_SWITCHER_FOCUSED', focused: true });
    window.setTimeout(() => {
      dispatch({ type: 'SET_SPACE_SWITCHER_FOCUSED', focused: false });
    }, 100);
  }, [dispatch]);

  // ─── Stores ────────────────────────────────────────────────────────
  const tabStore = useTabStore();
  const settingsStore = useSettingsStore();

  const { tabs, products, loading: tabsLoading, viewMode } = tabStore;
  const { manualGroups, groupAssignments } = tabStore;
  const { settings } = settingsStore;

  // ─── Derived state ──────────────────────────────────────────────────

  const itemIdForProduct = useCallback((p: TabGroup) => {
    return `product:${productKeyForProduct(p)}`;
  }, []);

  const groupAssignmentKey = useCallback((p: TabGroup) => {
    return `product:${productKeyForProduct(p)}`;
  }, []);

  const assignmentByItemId = useMemo(() => {
    const map = new Map<string, string>();
    for (const assignment of groupAssignments) {
      map.set(`product:${assignment.productKey}`, assignment.groupId);
    }
    return map;
  }, [groupAssignments]);

  const orderedGroups = useMemo(
    () => [...manualGroups].sort((a, b) => a.order - b.order),
    [manualGroups],
  );

  const filteredProducts = useMemo(() => {
    let result = products;

    if (tabStore.activeSpaceId) {
      result = result.filter(p => {
        const itemKey = groupAssignmentKey(p);
        return assignmentByItemId.get(itemKey) === tabStore.activeSpaceId;
      });
    }

    if (!searchQuery.trim()) return result;
    const parsed = parseSearchQuery(searchQuery);

    // 1. Process /space:SpaceName command
    if (parsed.type === 'space' && parsed.arg) {
      const targetSpace = orderedGroups.find(
        (g) => g.name.toLowerCase().includes(parsed.arg!)
      );
      if (targetSpace) {
        result = products.filter(p => {
          const itemKey = groupAssignmentKey(p);
          return assignmentByItemId.get(itemKey) === targetSpace.id;
        });
      }
    }

    // 2. Process /dupes command
    if (parsed.type === 'dupes') {
      result = result
        .filter(p => p.duplicateCount > 0)
        .map(p => ({
          ...p,
          tabs: filterDuplicateTabs(p.tabs)
        }))
        .filter(p => p.tabs.length > 0);
    }

    // 3. Process /stale command
    if (parsed.type === 'stale') {
      // eslint-disable-next-line react-hooks/purity
      const stableNow = Math.floor(Date.now() / 1000) * 1000;
      
      result = result
        .map(p => ({
          ...p,
          tabs: p.tabs.filter(t => isTabStale(t, stableNow, 3))
        }))
        .filter(p => p.tabs.length > 0);
    }

    // 4. Substring filtering
    if (!parsed.textQuery) return result;
    const query = parsed.textQuery.toLowerCase();
    const finalResult: TabGroup[] = [];
    for (const p of result) {
      const filteredTabs = p.tabs.filter(
        (tab) =>
          (tab.title || '').toLowerCase().includes(query) ||
          tab.url.toLowerCase().includes(query) ||
          p.domain.toLowerCase().includes(query) ||
          (p.friendlyName || '').toLowerCase().includes(query),
      );
      if (filteredTabs.length > 0) {
        finalResult.push({ ...p, tabs: filteredTabs });
      }
    }
    return finalResult;
  }, [products, searchQuery, tabStore.activeSpaceId, assignmentByItemId, groupAssignmentKey, orderedGroups]);

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

  const flatChips = useMemo(() => {
    const visualProducts = viewMode === 'table'
      ? [...filteredProducts].sort((a, b) => a.order - b.order)
      : [
          ...unassignedProducts,
          ...orderedGroups.flatMap((group) => productsByGroup.get(group.id) ?? []),
        ];

    const isSearching = searchQuery.trim().length > 0;
    const activeExpanded = isSearching
      ? new Set(visualProducts.map(p => p.domain))
      : expandedDomains;

    return flattenVisibleTabs(
      visualProducts,
      settings.maxChipsVisible,
      activeExpanded,
    );
  }, [
    filteredProducts,
    unassignedProducts,
    orderedGroups,
    productsByGroup,
    viewMode,
    settings.maxChipsVisible,
    expandedDomains,
    searchQuery,
  ]);

  const focusedUrl = focusedIndex !== null ? flatChips[focusedIndex]?.url ?? null : null;

  const filteredTabCount = useMemo(
    () => filteredProducts.reduce((sum, p) => sum + p.tabs.length, 0),
    [filteredProducts],
  );

  const tabOutCount = useMemo(
    () => tabs.filter((t) => isTabOutPage(t.url)).length,
    [tabs],
  );

  const totalDupes = useMemo(
    () => products.reduce((sum, p) => sum + p.duplicateCount, 0),
    [products],
  );

  // ─── Handlers ──────────────────────────────────────────────────────
  const handlers = useTabHandlers({
    settings,
    dispatch,
    showToast,
    flatChips,
    selectedUrls,
    selectedTabIds: state.selectedTabIds,
    lastClickedIndex,
  });

  const theme = useSettingsStore((s) => s.settings.theme);

  // ─── Init: fetch data + dark mode ──────────────────────────────────

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
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

    return () => {
      mq.removeEventListener('change', applyTheme);
    };
  }, [theme]);

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

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      if (flatChips.length > 0) {
        dispatch({ type: 'SET_FOCUSED_INDEX', index: 0 });
      } else {
        dispatch({ type: 'SET_FOCUSED_INDEX', index: null });
      }
    } else {
      dispatch({ type: 'SET_FOCUSED_INDEX', index: null });
    }
  }, [searchQuery, flatChips.length, dispatch]);

  useEffect(() => {
    const handleMessage = (message: { type?: string }) => {
      if (message.type === 'FOCUS_SPACE_SWITCHER') {
        focusSpaceSwitcher();
      }
    };
    chrome.runtime?.onMessage?.addListener(handleMessage);
    return () => {
      chrome.runtime?.onMessage?.removeListener(handleMessage);
    };
  }, [focusSpaceSwitcher]);

  useEffect(() => {
    if (window.location.hash !== DASHBOARD_SPACE_SWITCHER_FOCUS_HASH) {
      return;
    }

    focusSpaceSwitcher();
    const cleanUrl = new URL(window.location.href);
    cleanUrl.hash = '';
    window.history.replaceState(null, '', cleanUrl.toString());
  }, [focusSpaceSwitcher]);

  // ─── Keyboard shortcuts ────────────────────────────────────────────

  useKeyboard({
    onSearch: () => {
      const input = document.querySelector<HTMLInputElement>('input[aria-label="Search tabs"]');
      input?.focus();
    },
    onEscape: () => {
      let handled = false;
      if (state.searchQuery) {
        dispatch({ type: 'SET_SEARCH_QUERY', query: '' });
        handled = true;
      }
      if (state.focusedIndex !== null) {
        dispatch({ type: 'SET_FOCUSED_INDEX', index: null });
        handled = true;
      }
      if (state.selectedUrls.size > 0) {
        dispatch({ type: 'SET_SELECTED_URLS', urls: new Set() });
        handled = true;
      }
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        active.blur();
        handled = true;
      }
      return handled;
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
        handlers.handleFocusTab(flatChips[focusedIndex].url);
      }
    },
    onDClose: () => {
      if (focusedIndex !== null && flatChips[focusedIndex]) {
        handlers.handleCloseTabAnimated(flatChips[focusedIndex].url);
      }
    },
    onSwitchSpaceN: (n) => {
      if (n > 0 && n <= orderedGroups.length) {
        tabStore.setActiveSpace(orderedGroups[n - 1].id);
      }
    },
    onSwitchSpaceAll: () => {
      tabStore.setActiveSpace(null);
    },
    onCycleSpacePrev: () => {
      const ids = [null, ...orderedGroups.map((g) => g.id)];
      const currentIndex = ids.indexOf(tabStore.activeSpaceId);
      const nextIndex = (currentIndex - 1 + ids.length) % ids.length;
      tabStore.setActiveSpace(ids[nextIndex]);
    },
    onCycleSpaceNext: () => {
      const ids = [null, ...orderedGroups.map((g) => g.id)];
      const currentIndex = ids.indexOf(tabStore.activeSpaceId);
      const nextIndex = (currentIndex + 1) % ids.length;
      tabStore.setActiveSpace(ids[nextIndex]);
    },
    onClearFilter: () => {
      tabStore.setActiveSpace(null);
    },
  }, settings.keyBindings, state.settingsOpen || state.confirmDialog.open || state.promptDialog.open);

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
      ...handlers,
      showToast,
    },
  };
}
