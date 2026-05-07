import React, { useCallback, useEffect, useMemo } from 'react';
import { useTabStore } from '../../stores/tab-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useKeyboard } from './useKeyboard';
import { flattenVisibleTabs } from '../lib/visible-tabs';
import { isTabOutPage } from '../../utils/url';
import type { TabGroup } from '../../types';
import { useUIState } from './useUIState';
import { useTabHandlers } from './useTabHandlers';

// ─── Helpers ────────────────────────────────────────────────────────────

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
  
  // ─── Modular Hooks ──────────────────────────────────────────────────
  const { state, dispatch, showToast } = useUIState();
  const {
    searchQuery,
    focusedIndex,
    expandedDomains,
    selectedUrls,
    lastClickedIndex,
  } = state;

  // ─── Stores ────────────────────────────────────────────────────────
  const tabStore = useTabStore();
  const settingsStore = useSettingsStore();

  const { tabs, products, loading: tabsLoading } = tabStore;
  const { manualGroups, groupAssignments } = tabStore;
  const { settings } = settingsStore;

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

  const flatChips = useMemo(() => flattenVisibleTabs(
    filteredProducts,
    settings.maxChipsVisible,
    expandedDomains,
  ), [filteredProducts, settings.maxChipsVisible, expandedDomains]);

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
  const handlers = useTabHandlers({
    settings,
    dispatch,
    showToast,
    flatChips,
    selectedUrls,
    lastClickedIndex,
  });

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
        handlers.handleFocusTab(flatChips[focusedIndex].url);
      }
    },
    onDClose: () => {
      if (focusedIndex !== null && flatChips[focusedIndex]) {
        handlers.handleCloseTabAnimated(flatChips[focusedIndex].url);
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
      ...handlers,
      showToast,
    },
  };
}
