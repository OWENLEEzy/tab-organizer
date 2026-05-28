import type { AccentKey } from '../config/themes';

// ─── Tab Data ────────────────────────────────────────────────────

export interface Tab {
  id: number;
  url: string;
  title: string;
  favIconUrl: string;
  domain: string;
  windowId: number;
  active: boolean;
  isDashboard: boolean;
  isDuplicate: boolean;
  isLandingPage: boolean;
  duplicateCount: number;
  lastAccessed?: number;
  pinned?: boolean;
  audible?: boolean;
}

// ─── Tab Groups ──────────────────────────────────────────────────

export type GroupSortOption = 'count' | 'name' | 'lastAccessed';

export interface TabGroup {
  id: string;
  domain: string;
  friendlyName: string;
  label?: string;
  itemType?: 'product';
  itemKey?: string;
  productKey?: string;
  iconDomain?: string;
  tabs: Tab[];
  collapsed: boolean;
  order: number;
  color: string;
  hasDuplicates: boolean;
  duplicateCount: number;
  lastAccessed?: number;
}

export interface ProductInfo {
  key: string;
  label: string;
  iconDomain: string;
}


// ─── Custom Groups ───────────────────────────────────────────────

export interface CustomGroup {
  hostname?: string;
  hostnameEndsWith?: string;
  groupKey: string;
  groupLabel: string;
  pathPrefix?: string;
}

// ─── Landing Page Detection ──────────────────────────────────────

export interface LandingPagePattern {
  hostname?: string;
  hostnameEndsWith?: string;
  pathExact?: string[];
  pathPrefix?: string;
  test?: (path: string, url: string) => boolean;
}

// ─── Hybrid Organizer ──────────────────────────────────────────────

export type ViewMode = 'cards' | 'table';

interface SectionAutoRule {
  pattern: string;
  type: 'hostname';
}

export interface Section {
  id: string;
  name: string;
  order: number;
  emoji?: string;
  autoRules?: SectionAutoRule[];
}

export interface SectionAssignment {
  productKey: string;
  sectionId: string;
  order: number;
}

export interface HistoryProductSummary {
  productKey: string;
  label: string;
  iconDomain: string;
  tabCount: number;
}

export interface HistoryTab {
  url: string;
  title: string;
  domain: string;
  productKey: string;
  productLabel: string;
  iconDomain: string;
  favIconUrl: string;
  capturedAt: string;
  windowId?: number;
  active?: boolean;
}

export interface HistorySnapshot {
  id: string;
  capturedAt: string;
  tabCount: number;
  products: HistoryProductSummary[];
  tabs: HistoryTab[];
}

// ─── App Settings ────────────────────────────────────────────────

export interface AppSettings {
  theme: AccentKey;
  language?: 'en' | 'zh' | 'system';
  soundEnabled: boolean;
  confettiEnabled: boolean;
  maxChipsVisible: number;
  staleThresholdDays: number;
  customGroups: CustomGroup[];
  landingPagePatterns: LandingPagePattern[];
  keyBindings: {
    switchSectionN: string;
    switchSectionAll: string;
    cyclePrev: string;
    cycleNext: string;
    focusSearch: string;
    clearFilter: string;
  };
  groupSortBy: GroupSortOption;
}

// ─── Storage Schema ──────────────────────────────────────────────

export interface StorageSchema {
  schemaVersion: number;
  settings: AppSettings;
  groupOrder: Record<string, number>;
  sections: Section[];
  sectionAssignments: SectionAssignment[];
  /** Product keys explicitly moved to No section by the user — immune to auto-assignment. */
  unsortedOverrides: string[];
  viewMode: ViewMode;
  historyCandidate: HistorySnapshot | null;
  history: HistorySnapshot[];
}

// ─── Component Props ─────────────────────────────────────────────

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface PromptDialogProps {
  open: boolean;
  title: string;
  label: string;
  initialValue: string;
  placeholder?: string;
  confirmLabel: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}
