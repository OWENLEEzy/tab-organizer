import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTabStore } from '../../stores/tab-store';
import { useSettingsStore } from '../../stores/settings-store';
import { useKeyboard } from '../hooks/useKeyboard';
import { flattenVisibleTabs } from '../lib/visible-tabs';
import { isTabOrganizerPage } from '../../utils/browser-url';
import type { TabGroup, Section } from '../../types';
import { useUIState } from '../hooks/useUIState';
import { useTabActions } from './useTabActions';
import { useI18n } from '../hooks/useI18n';
import { DASHBOARD_SECTION_SWITCHER_FOCUS_HASH } from '../../background/dashboard';
import { isTabStale } from '../../lib/staleness';
import { analyzeDuplicates } from '../../lib/duplicate-analysis';
import { getProductKey } from '../../lib/product-key';
import { createSortComparator } from '../../lib/tab-grouper';
import { parseSearchQuery, resolveSectionQueryTarget } from '../lib/search-commands';

// ─── Helpers ────────────────────────────────────────────────────────────



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

  const focusSectionSwitcher = useCallback(() => {
    dispatch({ type: 'SET_SECTION_SWITCHER_FOCUSED', focused: true });
    window.setTimeout(() => {
      dispatch({ type: 'SET_SECTION_SWITCHER_FOCUSED', focused: false });
    }, 100);
  }, [dispatch]);

  // ─── Stores ────────────────────────────────────────────────────────
  const tabStore = useTabStore();
  const settingsStore = useSettingsStore();

  const { tabs, products, loading: tabsLoading, viewMode } = tabStore;
  const { sections, sectionAssignments } = tabStore;
  const { settings } = settingsStore;

  // ─── Derived state ──────────────────────────────────────────────────

  const itemIdForProduct = useCallback((p: TabGroup) => {
    return `product:${getProductKey(p)}`;
  }, []);

  // Inline helper — avoids an extra useCallback allocation per render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const groupAssignmentKey = (p: TabGroup) => `product:${getProductKey(p)}`;

  const assignmentByItemId = useMemo(() => {
    const map = new Map<string, string>();
    for (const assignment of sectionAssignments) {
      map.set(`product:${assignment.productKey}`, assignment.sectionId);
    }
    return map;
  }, [sectionAssignments]);

  const orderedSections = useMemo(
    () => [...sections].sort((a, b) => a.order - b.order),
    [sections],
  );

  const globalProductsBySection = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
       const sectionId = assignmentByItemId.get(groupAssignmentKey(p));
       if (sectionId) counts.set(sectionId, (counts.get(sectionId) || 0) + 1);
    }
    return counts;
  }, [products, assignmentByItemId, groupAssignmentKey]);

  const activeHeaderSections = useMemo(
    () => orderedSections.filter((s) => (globalProductsBySection.get(s.id) ?? 0) > 0),
    [orderedSections, globalProductsBySection]
  );

  // Debounce searchQuery for derived memos — avoids cascading recomputes on every keystroke.
  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearchQuery(searchQueryRef.current), 150);
    return () => window.clearTimeout(id);
  }, [searchQuery]);

  // Memoize the parsed query once — reused by filteredProducts and the returned state.
  const parsedQuery = useMemo(
    () => parseSearchQuery(debouncedSearchQuery),
    [debouncedSearchQuery],
  );

  const filteredProducts = useMemo(() => {
    let result = products;

    if (tabStore.activeSectionId) {
      result = result.filter(p => {
        const itemKey = groupAssignmentKey(p);
        return assignmentByItemId.get(itemKey) === tabStore.activeSectionId;
      });
    }

    // Apply sort order
    const sortComparator = createSortComparator(settings.groupSortBy ?? 'count');
    result = [...result].sort(sortComparator);

    if (!debouncedSearchQuery.trim()) return result;

    // 1. Process /section:SectionName command
    if (parsedQuery.type === 'section') {
      const targetSection = resolveSectionQueryTarget(parsedQuery.sectionToken ?? '', orderedSections);
      if (targetSection) {
        result = products.filter(p => {
          const itemKey = groupAssignmentKey(p);
          return assignmentByItemId.get(itemKey) === targetSection.id;
        });
      } else {
        result = [];
      }
    }

    // 2. Process /dupes command
    if (parsedQuery.type === 'dupes') {
      result = result
        .filter(p => p.duplicateCount > 0)
        .map(p => ({
          ...p,
          tabs: analyzeDuplicates(p.tabs).duplicateTabs
        }))
        .filter(p => p.tabs.length > 0);
    }

    // 3. Process /stale command
    if (parsedQuery.type === 'stale') {
      const stableNow = Math.floor(Date.now() / 1000) * 1000;

      result = result
        .map(p => ({
          ...p,
          tabs: p.tabs.filter(t => isTabStale(t, stableNow, settings.staleThresholdDays ?? 3))
        }))
        .filter(p => p.tabs.length > 0);
    }

    // 4. Substring filtering
    if (!parsedQuery.textQuery) return result;
    const query = parsedQuery.textQuery.toLowerCase();
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
  }, [products, debouncedSearchQuery, parsedQuery, tabStore.activeSectionId, assignmentByItemId, orderedSections, settings.staleThresholdDays, settings.groupSortBy]);

  const unassignedProducts = useMemo(
    () => filteredProducts.filter((p) => !assignmentByItemId.has(groupAssignmentKey(p))),
    [filteredProducts, assignmentByItemId, groupAssignmentKey],
  );

  const productsBySection = useMemo(() => {
    const result = new Map<string, TabGroup[]>();
    for (const group of orderedSections) {
      result.set(group.id, []);
    }

    for (const p of filteredProducts) {
      const sectionId = assignmentByItemId.get(groupAssignmentKey(p));
      if (!sectionId) continue;
      const bucket = result.get(sectionId);
      if (bucket) bucket.push(p);
    }

    for (const [sectionId, items] of result) {
      const orderMap = new Map<string, number>();
      for (const assignment of sectionAssignments) {
        if (assignment.sectionId === sectionId) {
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
  }, [assignmentByItemId, filteredProducts, groupAssignmentKey, orderedSections, sectionAssignments]);

  const flatChips = useMemo(() => {
    const visualProducts = viewMode === 'table'
      ? [...filteredProducts].sort((a, b) => a.order - b.order)
      : [
          ...unassignedProducts,
          ...orderedSections.flatMap((group) => productsBySection.get(group.id) ?? []),
        ];

    const isSearching = debouncedSearchQuery.trim().length > 0;
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
    orderedSections,
    productsBySection,
    viewMode,
    settings.maxChipsVisible,
    expandedDomains,
    debouncedSearchQuery,
  ]);

  const focusedUrl = focusedIndex !== null ? flatChips[focusedIndex]?.url ?? null : null;

  const filteredTabCount = useMemo(
    () => filteredProducts.reduce((sum, p) => sum + p.tabs.length, 0),
    [filteredProducts],
  );

  const dashboardCount = useMemo(
    () => tabs.filter((t) => isTabOrganizerPage(t.url)).length,
    [tabs],
  );

  const totalDupes = useMemo(
    () => products.reduce((sum, p) => sum + p.duplicateCount, 0),
    [products],
  );

  // ─── Handlers ──────────────────────────────────────────────────────
  const { t } = useI18n();
  const handlers = useTabActions({
    settings,
    dispatch,
    showToast,
    flatChips,
    visibleProducts: filteredProducts,
    selectedUrls,
    selectedTabIds: state.selectedTabIds,
    lastClickedIndex,
    t,
  });

  // ─── Init: fetch data ────────────────────────────────────────────────

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
      if (message.type === 'FOCUS_SECTION_SWITCHER') {
        focusSectionSwitcher();
      }
    };
    chrome.runtime?.onMessage?.addListener(handleMessage);
    return () => {
      chrome.runtime?.onMessage?.removeListener(handleMessage);
    };
  }, [focusSectionSwitcher]);

  useEffect(() => {
    if (window.location.hash !== DASHBOARD_SECTION_SWITCHER_FOCUS_HASH) {
      return;
    }

    focusSectionSwitcher();
    const cleanUrl = new URL(window.location.href);
    cleanUrl.hash = '';
    window.history.replaceState(null, '', cleanUrl.toString());
  }, [focusSectionSwitcher]);

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
    onSwitchSectionN: (n) => {
      if (n > 0 && n <= orderedSections.length) {
        tabStore.setActiveSection(orderedSections[n - 1].id);
      }
    },
    onSwitchSectionAll: () => {
      tabStore.setActiveSection(null);
    },
    onCycleSectionPrev: (() => {
      const getSectionIds = (groups: Section[]) => [null, ...groups.map((g) => g.id)];
      return () => {
        const ids = getSectionIds(orderedSections);
        const currentIndex = ids.indexOf(tabStore.activeSectionId);
        const nextIndex = (currentIndex - 1 + ids.length) % ids.length;
        tabStore.setActiveSection(ids[nextIndex]);
      };
    })(),
    onCycleSectionNext: (() => {
      const getSectionIds = (groups: Section[]) => [null, ...groups.map((g) => g.id)];
      return () => {
        const ids = getSectionIds(orderedSections);
        const currentIndex = ids.indexOf(tabStore.activeSectionId);
        const nextIndex = (currentIndex + 1) % ids.length;
        tabStore.setActiveSection(ids[nextIndex]);
      };
    })(),
    onClearFilter: () => {
      tabStore.setActiveSection(null);
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
      dashboardCount,
      showEmptyState: products.length === 0,
      visibleSectionCount: orderedSections.length + (products.length === 0 ? 0 : 1),
      focusedUrl,
      filteredTabCount,
      parsedQuery,
    },
    stores: {
      tabStore,
      settingsStore,
    },
    derived: {
      filteredProducts,
      unassignedProducts,
      orderedSections,
      activeHeaderSections,
      productsBySection,
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
