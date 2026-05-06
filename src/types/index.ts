// ─── Tab Data ────────────────────────────────────────────────────

export interface Tab {
  id: number;
  url: string;
  title: string;
  favIconUrl: string;
  domain: string;
  windowId: number;
  active: boolean;
  isTabOut: boolean;
  isDuplicate: boolean;
  isLandingPage: boolean;
  duplicateCount: number;
}

// ─── Tab Groups ──────────────────────────────────────────────────

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
}

export interface ProductInfo {
  key: string;
  label: string;
  iconDomain: string;
}

// ─── Saved for Later ─────────────────────────────────────────────

export interface SavedTab {
  id: string;
  url: string;
  title: string;
  domain: string;
  savedAt: string;
  completed: boolean;
  dismissed: boolean;
  completedAt?: string;
}

// ─── Workspaces ──────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  savedTabs: SavedTab[];
  createdAt: number;
  updatedAt: number;
  order: number;
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

export interface ManualGroup {
  id: string;
  name: string;
  order: number;
}

export interface GroupAssignment {
  productKey: string;
  groupId: string;
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
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  confettiEnabled: boolean;
  maxChipsVisible: number;
  customGroups: CustomGroup[];
  landingPagePatterns: LandingPagePattern[];
}

// ─── Storage Schema ──────────────────────────────────────────────

export interface StorageSchema {
  schemaVersion: number;
  deferred: SavedTab[];
  workspaces: Workspace[];
  settings: AppSettings;
  groupOrder: Record<string, number>;
  manualGroups: ManualGroup[];
  groupAssignments: GroupAssignment[];
  viewMode: ViewMode;
  historyCandidate: HistorySnapshot | null;
  history: HistorySnapshot[];
}

// ─── Store Types ─────────────────────────────────────────────────

export interface TabState {
  tabs: Tab[];
  products: TabGroup[];
  manualGroups: ManualGroup[];
  groupAssignments: GroupAssignment[];
  viewMode: ViewMode;
  loading: boolean;
  showAllWindows: boolean;
}

export interface SavedState {
  active: SavedTab[];
  archived: SavedTab[];
  archiveSearch: string;
}

export interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
}

export interface SettingsState extends AppSettings {
  _hydrated: boolean;
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
