export const locales = {
  en: {
    // Global accessibility
    skipToContent: 'Skip to main content',

    // Dashboard Header
    titleOpenTabs: 'Tab Organizer',
    settings: 'Settings',
    historyHide: 'Hide History',
    historyShow: 'History',

    // Sort Options
    sortCount: 'By Tab Count',
    sortByName: 'By Name',
    sortByLastAccessed: 'By Last Used',
    sortButtonLabel: 'Sort window',
    sortButtonTooltip: 'Apply current sort to current Chrome window',
    sortButtonDisabledTooltip: 'Clear filters to sort window',
    confirmSortTitle: 'Sort current window',
    confirmSortMessage: 'This will reorder tabs in the current Chrome window to match the dashboard sort order and gather each product into a native Chrome tab group. Pinned tabs will stay pinned. Other windows are unaffected.',
    confirmSortBtn: 'Sort tabs',
    toastSortComplete: 'Tabs sorted',
    toastSortNoTabs: 'No tabs to sort in current window',

    // Toolbar Popup
    popupLoading: 'Loading…',
    popupWindowCount: '{count} windows',
    popupUnassigned: 'Unassigned',
    popupUnassignedCount: '{count} groups',
    popupOrganize: 'Organize',
    popupOrganizing: 'Organizing…',
    popupOrganized: 'Organized',
    popupRetry: 'Retry',
    popupOrganizeDone: 'Organized',
    popupOrganizeError: 'Organize failed, please retry',
    popupOrganizePartial: 'Partly organized — open the dashboard for details',
    popupConfirmLead: 'Organize will:',
    popupConfirmSort: 'Sort & group tabs by section',
    popupConfirmAssign: 'Groups to assign: {count}',
    popupConfirmDedupe: 'Duplicates to close: {count}',
    popupConfirm: 'Confirm',
    popupCancel: 'Cancel',
    popupDuplicateWarning: '{count} duplicate tabs found',
    popupOpenDashboard: 'Open dashboard',

    // Status Strip Metrics
    metricTabs: 'tabs',
    metricDuplicates: 'duplicates',
    metricGroups: 'groups',
    metricSections: 'sections',
    alertExtraTabOrganizerSingle: '1 extra dashboard tab',
    alertExtraTabOrganizerPlural: '{count} extra dashboard tabs',
    actionCloseExtras: 'Close extras',
    alertHighTabCount: 'High tab count',
    actionDismiss: 'Dismiss',

    // Search Bar
    searchPlaceholderTabs: 'Search tabs or type / for commands...',
    cmdDupesLabel: 'Filter duplicate tabs',
    cmdDupesDesc: 'Find duplicate tabs and keep the active one',
    cmdStaleLabel: 'Filter stale tabs',
    cmdStaleDesc: 'Find tabs idle for more than 3 days',
    cmdSectionLabel: 'Switch Section view',
    cmdSectionDesc: 'Filter by section label (e.g. /section:work)',
    cmdPanelTitle: 'Quick Commands',
    cmdPanelTitleHint: 'Quick Commands (type / or choose below)',
    cmdHintEnter: 'Press Enter / Tab',
    searchMatchingOfPlural: '{count} of {total}',

    // Empty States
    emptyStateTitle: 'No tabs to organize',
    emptyStateText: 'Open some pages or click refresh to sync with your active Chrome tabs.',

    // Section Switcher
    sectionSwitcherAll: 'All sections',
    sectionSwitcherNew: 'New section',

    // Sweeps / Banners
    sweepDupeTitle: 'Duplicate Tabs Sweep',
    sweepDupeDesc: 'Clean up duplicate tab instances and keep one active copy.',
    sweepDupeBtn: 'Select Duplicates for Sweeping',
    sweepStaleTitle: 'Stale Tabs Sweep',
    sweepStaleDesc: 'Find and select tabs that have been idle for {days}+ days. Pinned and active/audible tabs are preserved.',
    sweepStaleBtn: 'Select Stale Tabs for Sweeping',

    // Dialog Buttons
    dialogCancel: 'Cancel',

    // Confirmation dialog titles, messages and buttons
    confirmCloseProductTitle: 'Close all {name} tabs',
    confirmCloseProductMsg: 'This will close all {count} tabs for this product.',
    confirmCloseProductBtn: 'Close all',

    confirmCloseSectionTitle: 'Close all tabs in {title}',
    confirmCloseSectionMsg: 'This will close all {count} tabs in this section.',
    confirmCloseSectionBtn: 'Close all',

    confirmCloseDupesTitle: 'Close duplicates',
    confirmCloseDupesMsg: 'This will close all {count} duplicate tabs, keeping one of each.',
    confirmCloseDupesBtn: 'Close Duplicates',

    confirmCloseSelectedTitle: 'Close {count} selected tabs',
    confirmCloseSelectedMsg: 'Are you sure you want to close these {count} tabs?',
    confirmCloseSelectedBtn: 'Close Selected',

    confirmCloseAllTitle: 'Close all tabs',
    confirmCloseAllMsg: 'This will close all {count} open tabs. This cannot be undone.',
    confirmCloseAllBtn: 'Close All',

    confirmDeleteGroupTitle: 'Delete {name}',
    confirmDeleteGroupMsg: 'Product groups in this section will return to No section. No tabs will be closed.',
    confirmDeleteGroupBtn: 'Delete section',

    // Prompts
    promptCreateGroupTitle: 'New Section',
    promptCreateGroupLabel: 'Section Name',
    promptCreateGroupValue: 'Work',
    promptCreateGroupBtn: 'Create Section',

    promptRenameGroupTitle: 'Rename Section',
    promptRenameGroupLabel: 'Section Name',
    promptRenameGroupBtn: 'Save Changes',

    // History Sidebar
    historyTitle: 'History',
    historyClear: 'Clear',
    historyRestoreAll: 'Restore all',
    historyRestoreProduct: 'Restore {product}',
    historyShowDetails: 'Show details',
    historyHideDetails: 'Hide details',
    historyDelete: 'Delete',
    historyNoSnapshotsTitle: 'No snapshots yet',
    historyNoSnapshotsDesc: 'Create your first snapshots by closing some tabs.',
    historyCountTabsSingle: '1 tab',
    historyCountTabsPlural: '{count} tabs',
    historyLoadingDetails: 'Loading details...',

    // Selection Bar
    selectedCount: '{count} selected',
    selectedClose: 'Close',
    selectedCancel: 'Cancel',

    // Product Table
    tableHeaderName: 'Name',
    tableHeaderGroup: 'Section',
    tableHeaderTabs: 'Tabs',
    tableHeaderDuplicates: 'Duplicates',
    tableHeaderActions: 'Actions',
    tableUnsectioned: 'Unsorted',
    tableBtnClose: 'Close',
    tableBtnDedupe: 'Dedupe',
    tableExpandLabel: 'Expand {name}',
    tableCollapseLabel: 'Collapse {name}',

    // Domain Card
    cardBtnShowLess: 'Show less',
    cardBtnShowMore: '+{count} more',
    cardCloseDupesTitle: 'Close duplicate tabs',
    cardCollapseMoreLabel: 'Collapse {count} more tabs',
    cardShowMoreLabel: 'Show {count} more tabs',

    // DnD Organizer
    organizerUnsectioned: 'No section',
    organizerBtnRename: 'Rename',
    organizerBtnDelete: 'Delete',
    organizerBtnCloseAll: 'Close all',
    moveToSection: 'Move to section',
    moveToSectionFor: 'Move {name} to a section',
    moveToNoSection: 'Remove from section',
    sectionEmptySlot: 'Empty — drag a product group here',
    pinnedUnsectioned: 'Pinned',
    pinnedUnsectionedHint: 'You moved it out of a section — rules will not collect it',
    unpinAction: 'Unpin {name}',

    // Settings Panel
    settingsTitle: 'Settings',
    settingsClose: 'Close settings',
    settingsTabShortcuts: 'Shortcuts',
    settingsGroupPreferences: 'Preferences',
    settingsGroupCustomize: 'Customize',
    settingsGroupAbout: 'About',
    settingsNavAppearance: 'Appearance',
    settingsNavBehavior: 'Behavior',
    settingsNavSectionRules: 'Sections & Rules',
    settingsNavProductRules: 'Product Group Rules',
    settingsNavBackup: 'Backup & Version',
    settingsVersionTitle: 'Version',
    settingsVersionDesc: 'Local extension build and update information.',

    // Settings - Language Option
    settingsLang: 'Language',
    settingsLangSystem: 'System Default',
    settingsLangEn: 'English',
    settingsLangZh: '简体中文',

    // Settings - View Mode
    settingsViewMode: 'Default View',
    settingsViewModeCards: 'Cards',
    settingsViewModeTable: 'Table',

    // Settings - Theme & Options
    settingsTheme: 'Visual Theme',

    // Theme names
    themeClay: 'Clay Paper',
    themeSage: 'Sage Herb',
    themeFrost: 'Ice Frost',
    themeOchre: 'Chalk Ochre',
    themeLavender: 'Lavender Haze',
    themeRosewood: 'Rosewood Blush',
    themeSeagrass: 'Sea Glass',
    themeObsidian: 'Obsidian Ink',
    themePine: 'Deep Pine',
    themeAmethyst: 'Amethyst Night',
    themeEmber: 'Roast Ember',

    settingsOptionsSound: 'Sound Effects',
    settingsOptionsConfetti: 'Confetti Burst',

    settingsMaxChips: 'Maximum visible tabs per product',
    settingsStaleThreshold: 'Stale Tabs Definition',
    settingsSortOrderTitle: 'Product Group Order',
    settingsSortOrderBtn: 'Reset Card Order',

    // Settings - Shortcuts
    settingsShortcutsTitle: 'Keyboard Shortcuts',
    settingsShortcutsResetBtn: 'Reset Shortcuts',

    // Settings - Backup & Import
    settingsBackupTitle: 'Backup & Portability',
    settingsBackupExportBtn: 'Export Config',
    settingsBackupImportBtn: 'Import Config',

    // Toasts / Alerts
    toastTabClosed: 'Tab closed',
    toastSettingsExported: 'Settings exported successfully! 📤',
    toastSettingsImported: 'Settings imported successfully! 📥',
    toastImportFailed: 'Import failed. Verify JSON backup file format. ⚠️',
    toastOnboardingFailed: 'Could not save your sections. Please try again. ⚠️',
    toastSaveFailed: 'Could not save that change. Please try again. ⚠️',
    toastSortOrderReset: 'Sort order reset',
    toastDuplicatesClosed: 'Duplicates closed',
    toastClosedProductTabs: 'Closed all {count} {name} tabs',
    toastClosedSectionTabs: 'Closed all {count} tabs in {title}',
    toastClosedSelectedSingle: 'Closed 1 tab',
    toastClosedSelectedPlural: 'Closed {count} tabs',
    toastGroupCreated: 'Section created',
    toastGroupRenamed: 'Section renamed',
    toastGroupDeleted: 'Section deleted',
    toastViewModeCards: 'Cards view',
    toastViewModeTable: 'Table view',
    toastRefreshed: 'Refreshed',
    toastMovedToGroup: 'Moved to section',
    toastMovedToUnsorted: 'Moved to No section',
    toastSelectedStaleSingle: 'Selected 1 stale tab. Press close to clear.',
    toastSelectedStalePlural: 'Selected {count} stale tabs. Press close to clear.',
    toastNoStaleTabs: 'No stale tabs found 🧹',
    toastSelectedDuplicatesSingle: 'Selected 1 duplicate tab. Press close to clear.',
    toastSelectedDuplicatesPlural: 'Selected {count} duplicate tabs. Press close to clear.',
    toastNoDuplicates: 'No duplicate tabs found 🧹',

    // Sweeps Empty States
    emptySweepStaleTitle: 'No stale tabs found',
    emptySweepStaleDesc: 'All your tabs have been active recently (within the last {days} days).',
    emptySweepDupeTitle: 'No duplicate tabs found',
    emptySweepDupeDesc: 'Your dashboard is clean. There are no duplicate URLs!',
    emptySweepSectionTitle: 'No section matches found',
    emptySweepSectionDesc: 'Could not find any section named "{name}" or the section has no tabs.',
    emptySweepSectionNoArg: 'Please specify a section name (e.g., /section:work)',
    emptySweepSearchTitle: 'No tabs match your search',
    emptySweepSearchDesc: 'We couldn\'t find any open tabs matching "{query}".',

    // Additional settings and shortcut options
    settingsOptionChipsCount: '{count} chips',
    settingsOptionChipsCountDefault: '8 chips (Default)',
    settingsOptionDaysCount: '{count} days',
    settingsOptionDaysCountDefault: '3 days (Default)',
    productRulesTitle: 'Product groups you have open',
    productRulesSourceBuiltIn: 'Built-in',
    productRulesSourceCustom: 'Yours',
    productRulesSourceFallback: 'Domain fallback',
    productRulesNameIt: 'Give it a good name',
    productRulesRename: 'Rename',
    productRulesRevert: 'Revert',
    productRulesEmpty: 'No product groups open right now',
    hostnameRulesTitle: 'Hostname grouping rules',
    hostnameRulesHint: 'These merge matching sites into one group. Remove one to split them again.',
    hostnameRulesRemove: 'Remove rule {name}',
    hostnameRulesRemoveShort: 'Remove',
    settingsDuplicateSectionName: 'A section with this name already exists.',
    settingsBtnDeleteSection: 'Delete Section',
    settingsLabelEmoji: 'Section emoji',
    settingsShortcutRecording: 'Press key...',
    settingsShortcutLabelSwitchSectionN: 'Switch to Section 1-9',
    settingsShortcutLabelSwitchSectionAll: 'Switch to "All"',
    settingsShortcutLabelCycleSectionPrev: 'Cycle Section Left',
    settingsShortcutLabelCycleSectionNext: 'Cycle Section Right',
    settingsShortcutLabelFocusSearch: 'Focus Search',
    settingsShortcutLabelClearSectionFilter: 'Clear Section Filter',

    // Keyword Editor / Rule Match Preview
    keywordEditorLabel: 'Keywords',
    keywordEditorAdd: 'Add word',
    keywordEditorPlaceholder: 'e.g. github',
    keywordEditorRemove: 'Remove keyword {word}',
    keywordErrorEmpty: 'Cannot be empty',
    keywordErrorWhitespace: 'Cannot contain spaces',
    keywordErrorInvalid: 'Use letters, digits, hyphens, and dots only',
    keywordErrorDuplicate: 'This section already has that word',
    rulePreviewTitle: 'What happens now',
    rulePreviewWillTake: 'Will move here',
    rulePreviewBlocked: '"{section}" claims it — rules here will not move it',
    rulePreviewPinned: 'Pinned out of sections — rules will not collect it',
    rulePreviewMoveThemSingle: 'Move it here too',
    rulePreviewMoveThemPlural: 'Move these {count} here too',
    rulePreviewNone: 'No groups match yet',
    rulePreviewTabCountSingle: '1 tab',
    rulePreviewTabCountPlural: '{count} tabs',

    // Onboarding
    onboardingTitle: 'Pick a few sections — the rules are yours',
    onboardingSubtitle: 'These words are my guess. Delete the wrong ones, add your own.',
    onboardingCollectsSingle: 'collects 1 group',
    onboardingCollectsPlural: 'collects {count} groups',
    onboardingClaimedElsewhere: 'Already claimed by a section above',
    onboardingNoMatch: 'No groups matched',
    onboardingConfirm: 'Create these {count}',
    onboardingSkip: 'Start empty',
    onboardingOnce: 'This will not show again',
    onboardingExpand: 'Show keywords for {name}',

    // Sections & Rules workbench
    workbenchNewSection: 'New section',
    workbenchNoSections: 'No sections yet — create one on the left to get started',
    workbenchPickSection: 'Pick a section on the left',
    workbenchAdvancedRegex: 'Advanced: use a regex',
    workbenchRegexPlaceholder: 'Regular expression, one per line',
    workbenchRegexInvalid: 'Invalid regular expression, or too slow — avoid nested repeats like (a+)+',
    workbenchGroupCount: '{count}',
    workbenchGroupCountSingle: '1 group',
    workbenchGroupCountPlural: '{count} groups',
    workbenchSectionName: 'Section name',
  },
  zh: {
    // Global accessibility
    skipToContent: '跳过并直达主内容',

    // Dashboard Header
    titleOpenTabs: '正在运行的页面',
    settings: '设置',
    historyHide: '隐藏历史',
    historyShow: '历史记录',

    // Sort Options
    sortCount: '按页面数量',
    sortByName: '按名称',
    sortByLastAccessed: '按最近使用',
    sortButtonLabel: '整理窗口',
    sortButtonTooltip: '将当前排序应用到当前 Chrome 窗口',
    sortButtonDisabledTooltip: '清除筛选后再整理',
    confirmSortTitle: '整理当前窗口',
    confirmSortMessage: '将按当前仪表盘排序重排当前 Chrome 窗口的页面，并把每个产品归入原生 Chrome 标签组。已固定的页面保持不动，其他窗口不受影响。',
    confirmSortBtn: '整理页面',
    toastSortComplete: '整理完成',
    toastSortNoTabs: '当前窗口无页面可整理',

    // Toolbar Popup
    popupLoading: '加载中…',
    popupWindowCount: '{count} 个窗口',
    popupUnassigned: '未分配',
    popupUnassignedCount: '{count} 个区域',
    popupOrganize: '一键整理',
    popupOrganizing: '整理中…',
    popupOrganized: '已整理',
    popupRetry: '重试',
    popupOrganizeDone: '整理完成',
    popupOrganizeError: '整理失败，请重试',
    popupOrganizePartial: '部分整理完成 — 详情请打开管理界面',
    popupConfirmLead: '整理将：',
    popupConfirmSort: '按分区排序并建组',
    popupConfirmAssign: '待归类区域：{count}',
    popupConfirmDedupe: '待关闭重复：{count}',
    popupConfirm: '确认整理',
    popupCancel: '取消',
    popupDuplicateWarning: '检测到 {count} 个重复页面',
    popupOpenDashboard: '打开管理界面',

    // Status Strip Metrics
    metricTabs: '页面',
    metricDuplicates: '重复项',
    metricGroups: '区域',
    metricSections: '分区',
    alertExtraTabOrganizerSingle: '1 个多余的整理面板页面',
    alertExtraTabOrganizerPlural: '{count} 个多余的整理面板页面',
    actionCloseExtras: '关闭多余面板',
    alertHighTabCount: '页面数量过高',
    actionDismiss: '忽略警告',

    // Search Bar
    searchPlaceholderTabs: '搜索页面，或输入 / 触发快捷命令...',
    cmdDupesLabel: '筛选重复的页面',
    cmdDupesDesc: '查找重复的页面并保留当前激活的页面',
    cmdStaleLabel: '筛选闲置的页面',
    cmdStaleDesc: '查找超过 3 天未使用的页面',
    cmdSectionLabel: '切换分区视图',
    cmdSectionDesc: '按分区标签筛选（例如 /section:工作）',
    cmdPanelTitle: '快捷命令',
    cmdPanelTitleHint: '快捷命令 (输入 / 或在下方选择)',
    cmdHintEnter: '按 Enter / Tab 键',
    searchMatchingOfPlural: '{count} 个匹配（共 {total} 个页面）',

    // Empty States
    emptyStateTitle: '没有需要整理的页面',
    emptyStateText: '在浏览器中打开一些网页，或点击“刷新同步”以同步当前的 Chrome 页面。',

    // Section Switcher
    sectionSwitcherAll: '全部分区',
    sectionSwitcherNew: '新建分区',

    // Sweeps / Banners
    sweepDupeTitle: '重复页面清理',
    sweepDupeDesc: '一键扫描所有重复开启的页面，只保留一个活跃副本。',
    sweepDupeBtn: '选中所有重复页面以清理',
    sweepStaleTitle: '闲置页面清理',
    sweepStaleDesc: '发现并整理已闲置 {days} 天以上的页面。固定页面和发声/活动中的页面将受保护。',
    sweepStaleBtn: '选中所有闲置页面以清理',

    // Dialog Buttons
    dialogCancel: '取消',

    // Confirmation dialog titles, messages and buttons
    confirmCloseProductTitle: '关闭所有 {name} 页面',
    confirmCloseProductMsg: '这将关闭此产品下的全部 {count} 个页面。',
    confirmCloseProductBtn: '确认关闭',

    confirmCloseSectionTitle: '关闭 {title} 中的所有页面',
    confirmCloseSectionMsg: '这将关闭此分区下的全部 {count} 个页面。',
    confirmCloseSectionBtn: '确认关闭',

    confirmCloseDupesTitle: '清理重复页面',
    confirmCloseDupesMsg: '这将关闭全部 {count} 个重复的页面，只保留每个网址的最新版本。',
    confirmCloseDupesBtn: '清理重复项',

    confirmCloseSelectedTitle: '关闭 {count} 个选中的页面',
    confirmCloseSelectedMsg: '您确定要关闭这 {count} 个页面吗？',
    confirmCloseSelectedBtn: '关闭选中项',

    confirmCloseAllTitle: '关闭所有页面',
    confirmCloseAllMsg: '这将关闭浏览器中的所有 {count} 个页面，且不可撤销。',
    confirmCloseAllBtn: '关闭全部',

    confirmDeleteGroupTitle: '删除分区 {name}',
    confirmDeleteGroupMsg: '此分区内的所有区域将退回“未分配分区”，不会关闭任何页面。',
    confirmDeleteGroupBtn: '确认删除',

    // Prompts
    promptCreateGroupTitle: '新建分区',
    promptCreateGroupLabel: '分区名称',
    promptCreateGroupValue: '工作',
    promptCreateGroupBtn: '创建分区',

    promptRenameGroupTitle: '重命名分区',
    promptRenameGroupLabel: '分区名称',
    promptRenameGroupBtn: '保存修改',

    // History Sidebar
    historyTitle: '历史备份',
    historyClear: '清空历史',
    historyRestoreAll: '恢复全部',
    historyRestoreProduct: '恢复 {product}',
    historyShowDetails: '显示详情',
    historyHideDetails: '隐藏详情',
    historyDelete: '删除记录',
    historyNoSnapshotsTitle: '暂无历史快照',
    historyNoSnapshotsDesc: '关闭部分页面即可自动创建首个历史快照。',
    historyCountTabsSingle: '1 个页面',
    historyCountTabsPlural: '{count} 个页面',
    historyLoadingDetails: '加载详情中...',

    // Selection Bar
    selectedCount: '已选中 {count} 项',
    selectedClose: '关闭选中',
    selectedCancel: '取消选择',

    // Product Table
    tableHeaderName: '名称',
    tableHeaderGroup: '所属分区',
    tableHeaderTabs: '页面数量',
    tableHeaderDuplicates: '重复项',
    tableHeaderActions: '操作',
    tableUnsectioned: '未分配分区',
    tableBtnClose: '关闭',
    tableBtnDedupe: '去重',
    tableExpandLabel: '展开 {name}',
    tableCollapseLabel: '收起 {name}',

    // Domain Card
    cardBtnShowLess: '收起隐藏',
    cardBtnShowMore: '+{count} 个更多',
    cardCloseDupesTitle: '关闭重复页面',
    cardCollapseMoreLabel: '收起额外的 {count} 个页面',
    cardShowMoreLabel: '显示额外的 {count} 个页面',

    // DnD Organizer
    organizerUnsectioned: '未分配分区',
    organizerBtnRename: '重命名',
    organizerBtnDelete: '删除分区',
    organizerBtnCloseAll: '关闭全部',
    moveToSection: '移到分区',
    moveToSectionFor: '把 {name} 移到分区',
    moveToNoSection: '移出分区',
    sectionEmptySlot: '空着 · 把区域拖进来',
    pinnedUnsectioned: '已固定',
    pinnedUnsectionedHint: '你把它移出过分区，规则不会再收它',
    unpinAction: '取消固定 {name}',

    // Settings Panel
    settingsTitle: '设置选项',
    settingsClose: '关闭设置',
    settingsTabShortcuts: '快捷键',
    settingsGroupPreferences: '偏好',
    settingsGroupCustomize: '自定义',
    settingsGroupAbout: '关于',
    settingsNavAppearance: '外观',
    settingsNavBehavior: '行为',
    settingsNavSectionRules: '分区与规则',
    settingsNavProductRules: '区域规则',
    settingsNavBackup: '备份与版本',
    settingsVersionTitle: '版本信息',
    settingsVersionDesc: '当前本地扩展构建与更新信息。',

    // Settings - Language Option
    settingsLang: '界面语言',
    settingsLangSystem: '系统默认',
    settingsLangEn: 'English (英文)',
    settingsLangZh: '简体中文',

    // Settings - View Mode
    settingsViewMode: '默认视图',
    settingsViewModeCards: '卡片',
    settingsViewModeTable: '列表',

    // Settings - Theme & Options
    settingsTheme: '界面视觉风格',

    // Theme names
    themeClay: '暖沙陶土',
    themeSage: '草本鼠尾草',
    themeFrost: '冰川冷蓝',
    themeOchre: '白垩赭石',
    themeLavender: '薰衣草紫',
    themeRosewood: '玫瑰木粉',
    themeSeagrass: '海草青',
    themeObsidian: '黑曜石墨',
    themePine: '暗针长青',
    themeAmethyst: '紫曜晚霞',
    themeEmber: '焦糖暗火',

    settingsOptionsSound: '清理音效',
    settingsOptionsConfetti: '撒花特效',

    settingsMaxChips: '单个区域内最大可见页面数',
    settingsStaleThreshold: '闲置页面判定标准',
    settingsSortOrderTitle: '卡片排序位置',
    settingsSortOrderBtn: '重置卡片位置',

    // Settings - Shortcuts
    settingsShortcutsTitle: '键盘快捷键',
    settingsShortcutsResetBtn: '重置快捷键',

    // Settings - Backup & Import
    settingsBackupTitle: '数据备份与迁移',
    settingsBackupExportBtn: '导出备份文件',
    settingsBackupImportBtn: '导入备份文件',

    // Toasts / Alerts
    toastTabClosed: '页面已关闭',
    toastSettingsExported: '设置已成功导出！📤',
    toastSettingsImported: '设置已成功导入！📥',
    toastImportFailed: '导入失败，请检查 JSON 备份文件格式是否正确。⚠️',
    toastOnboardingFailed: '无法保存你的分区，请重试。⚠️',
    toastSaveFailed: '无法保存这次更改，请重试。⚠️',
    toastSortOrderReset: '排序位置已恢复默认',
    toastDuplicatesClosed: '重复页面已清理完毕',
    toastClosedProductTabs: '已关闭 {name} 的全部 {count} 个页面',
    toastClosedSectionTabs: '已关闭 {title} 分区下的全部 {count} 个页面',
    toastClosedSelectedSingle: '已关闭 1 个页面',
    toastClosedSelectedPlural: '已关闭 {count} 个页面',
    toastGroupCreated: '分区已成功创建',
    toastGroupDeleted: '分区已成功删除',
    toastGroupRenamed: '分区已重命名',
    toastViewModeCards: '卡片视图',
    toastViewModeTable: '表格视图',
    toastRefreshed: '已刷新',
    toastMovedToGroup: '已移至目标分区',
    toastMovedToUnsorted: '已移至未分配分区',
    toastSelectedStaleSingle: '已选中 1 个闲置页面。点击关闭按钮即可清理。',
    toastSelectedStalePlural: '已选中 {count} 个闲置页面。点击关闭按钮即可清理。',
    toastNoStaleTabs: '未发现任何闲置页面 🧹',
    toastSelectedDuplicatesSingle: '已选中 1 个重复页面。点击关闭按钮即可清理。',
    toastSelectedDuplicatesPlural: '已选中 {count} 个重复页面。点击关闭按钮即可清理。',
    toastNoDuplicates: '未发现任何重复页面 🧹',

    // Sweeps Empty States
    emptySweepStaleTitle: '没有发现闲置页面',
    emptySweepStaleDesc: '您的所有页面最近都很活跃（在过去的 {days} 天内均被访问过）。',
    emptySweepDupeTitle: '没有发现重复页面',
    emptySweepDupeDesc: '您的工作区非常干净，没有重复打开的网址！',
    emptySweepSectionTitle: '未匹配到该分区',
    emptySweepSectionDesc: '找不到名为 “{name}” 的分区，或者该分区下目前没有处于打开状态的页面。',
    emptySweepSectionNoArg: '请指定分区名称（如 /section:工作）',
    emptySweepSearchTitle: '没有找到匹配的页面',
    emptySweepSearchDesc: '未找到任何匹配搜索条件 “{query}” 的页面。',

    // Additional settings and shortcut options
    settingsOptionChipsCount: '{count} 个页面',
    settingsOptionChipsCountDefault: '8 个页面 (默认)',
    settingsOptionDaysCount: '{count} 天',
    settingsOptionDaysCountDefault: '3 天 (默认)',
    productRulesTitle: '你现在开着的区域',
    productRulesSourceBuiltIn: '内置',
    productRulesSourceCustom: '你改的',
    productRulesSourceFallback: '按域名兜底',
    productRulesNameIt: '给个好名字',
    productRulesRename: '改名',
    productRulesRevert: '还原',
    productRulesEmpty: '现在没有开着的区域',
    hostnameRulesTitle: '按域名合并的规则',
    hostnameRulesHint: '这些规则把匹配的网站合成一个区域。删掉即可拆开。',
    hostnameRulesRemove: '删除规则 {name}',
    hostnameRulesRemoveShort: '删除',
    settingsDuplicateSectionName: '已存在同名分区。',
    settingsBtnDeleteSection: '删除分区',
    settingsLabelEmoji: '分区表情符号',
    settingsShortcutRecording: '按下按键...',
    settingsShortcutLabelSwitchSectionN: '切换到分区 1-9',
    settingsShortcutLabelSwitchSectionAll: '切换到 "全部"',
    settingsShortcutLabelCycleSectionPrev: '循环切回上个分区',
    settingsShortcutLabelCycleSectionNext: '循环切至下个分区',
    settingsShortcutLabelFocusSearch: '聚焦搜索框',
    settingsShortcutLabelClearSectionFilter: '清除分区筛选',

    // Keyword Editor / Rule Match Preview
    keywordEditorLabel: '关键词',
    keywordEditorAdd: '加词',
    keywordEditorPlaceholder: '例如 github',
    keywordEditorRemove: '删除关键词 {word}',
    keywordErrorEmpty: '不能为空',
    keywordErrorWhitespace: '不能含空格',
    keywordErrorInvalid: '只能用字母、数字、连字符和点',
    keywordErrorDuplicate: '这个分区已有这个词',
    rulePreviewTitle: '现在会怎样',
    rulePreviewWillTake: '将移到这里',
    rulePreviewBlocked: '「{section}」占着它，这里的规则不会移动它',
    rulePreviewPinned: '已固定在未分区，规则不会收它',
    rulePreviewMoveThemSingle: '把它也搬过来',
    rulePreviewMoveThemPlural: '把这 {count} 个也搬过来',
    rulePreviewNone: '暂时没有匹配到区域',
    rulePreviewTabCountSingle: '1 个页面',
    rulePreviewTabCountPlural: '{count} 个页面',

    // Onboarding
    onboardingTitle: '挑几个分区，规则你说了算',
    onboardingSubtitle: '下面这些词是我猜的。删掉不对的，加上你自己的。',
    onboardingCollectsSingle: '收进 1 个区域',
    onboardingCollectsPlural: '收进 {count} 个区域',
    onboardingClaimedElsewhere: '已经被上面选的分区占了',
    onboardingNoMatch: '没匹配到区域',
    onboardingConfirm: '建这 {count} 个',
    onboardingSkip: '空着开始',
    onboardingOnce: '之后不再出现',
    onboardingExpand: '展开 {name} 的关键词',

    // Sections & Rules workbench
    workbenchNewSection: '新建分区',
    workbenchNoSections: '还没有分区，先在左边新建一个',
    workbenchPickSection: '在左边选一个分区',
    workbenchAdvancedRegex: '进阶：改用正则',
    workbenchRegexPlaceholder: '正则表达式，每行一条',
    workbenchRegexInvalid: '正则表达式不合法或过慢，请避免 (a+)+ 这类嵌套重复',
    workbenchGroupCount: '{count}',
    workbenchGroupCountSingle: '1 个区域',
    workbenchGroupCountPlural: '{count} 个区域',
    workbenchSectionName: '分区名称',
  }
} as const;
