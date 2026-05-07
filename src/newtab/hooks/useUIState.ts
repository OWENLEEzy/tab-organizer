import { useReducer, useRef, useCallback } from 'react';

export interface UIState {
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

export type UIAction =
  | { type: 'SET_TOAST'; message: string; visible: boolean }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_CONFIRM_DIALOG'; dialog: UIState['confirmDialog'] }
  | { type: 'CLOSE_CONFIRM_DIALOG' }
  | { type: 'SET_SETTINGS_OPEN'; open: boolean }
  | { type: 'SET_SIDEBAR_EXPANDED'; expanded: boolean }
  | { type: 'SET_NUDGE_DISMISSED'; dismissed: boolean }
  | { type: 'SET_FOCUSED_INDEX'; index: number | null | ((prev: number | null) => number | null) }
  | { type: 'SET_CLOSING_URLS'; urls: Set<string> | ((prev: Set<string>) => Set<string>) }
  | { type: 'SET_SELECTED_URLS'; urls: Set<string> | ((prev: Set<string>) => Set<string>) }
  | { type: 'SET_LAST_CLICKED_INDEX'; index: number | null }
  | { type: 'SET_EXPANDED_DOMAINS'; domains: Set<string> | ((prev: Set<string>) => Set<string>) }
  | { type: 'SET_PROMPT_DIALOG'; dialog: UIState['promptDialog'] }
  | { type: 'CLOSE_PROMPT_DIALOG' }
  | { type: 'RESET_INTERACTION' };

const initialState: UIState = {
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

function uiReducer(state: UIState, action: UIAction): UIState {
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

export function useUIState() {
  const [state, dispatch] = useReducer(uiReducer, initialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    dispatch({ type: 'SET_TOAST', message, visible: true });
    toastTimer.current = setTimeout(() => {
      dispatch({ type: 'SET_TOAST', message, visible: false });
    }, TOAST_DURATION);
  }, []);

  return { state, dispatch, showToast };
}
