export const locales = {
  en: {
    // Greetings
    greetMorning: 'Good morning',
    greetAfternoon: 'Good afternoon',
    greetEvening: 'Good evening',
    greetHello: 'Hello',

    // Global accessibility
    skipToContent: 'Skip to main content',

    // Dashboard Header
    titleOpenTabs: 'Tab Organizer',
    groupCountSingle: '1 Group',
    groupCountPlural: '{count} Groups',
    noGroupsFound: 'No groups found',
    settings: 'Settings',
    historyHide: 'Hide History',
    historyShow: 'History',
    refresh: 'Refresh',
    newGroup: 'New Group',
    closeAll: 'Close All',

    // Sort Options
    sortCount: 'By Tab Count',
    sortByName: 'By Name',
    sortByLastAccessed: 'By Last Used',

    // Status Strip Metrics
    metricTabs: 'tabs',
    metricDuplicates: 'duplicates',
    metricGroups: 'groups',
    alertExtraTabOrganizerSingle: '1 extra dashboard tab',
    alertExtraTabOrganizerPlural: '{count} extra dashboard tabs',
    actionCloseExtras: 'Close extras',
    alertHighTabCount: 'High tab count',
    alertHighTabCountDesc: 'You have {count} tabs open. Consider closing the ones you\'re not using.',
    actionDismiss: 'Dismiss',

    // Search Bar
    searchPlaceholderTabs: 'Search tabs or type / for commands...',
    searchPlaceholderCommands: 'Search commands...',
    cmdDupes: 'duplicates',
    cmdDupesLabel: 'Filter duplicate tabs',
    cmdDupesDesc: 'Find duplicate tabs and keep the active one',
    cmdStale: 'stale tabs',
    cmdStaleLabel: 'Filter stale tabs',
    cmdStaleDesc: 'Find tabs idle for more than 3 days',
    cmdSpace: 'filter by space',
    cmdSpaceLabel: 'Switch Space view',
    cmdSpaceDesc: 'Filter by manual space name (e.g. /space:work)',
    cmdPanelTitle: 'Quick Commands',
    cmdPanelTitleHint: 'Quick Commands (type / or choose below)',
    cmdHintEnter: 'Press Enter / Tab',
    searchMatchingSingle: '1 matching',
    searchMatchingPlural: '{count} matching',
    searchMatchingOfSingle: '1 matching out of 1 tab',
    searchMatchingOfPlural: '{count} of {total}',
    searchKbdHint: 'press / to search',

    // Empty States
    emptyStateTitle: 'No tabs to organize',
    emptyStateText: 'Open some pages or click refresh to sync with your active Chrome tabs.',

    // Space Switcher
    spaceSwitcherAll: 'All spaces',
    spaceSwitcherNew: 'New space',

    // Sweeps / Banners
    sweepDupeTitle: 'Duplicate Tabs Sweep',
    sweepDupeDesc: 'Clean up duplicate tab instances and keep one active copy.',
    sweepDupeBtn: 'Select Duplicates for Sweeping',
    sweepStaleTitle: 'Stale Tabs Sweep',
    sweepStaleDesc: 'Find and select tabs that have been idle for {days}+ days. Pinned and active/audible tabs are preserved.',
    sweepStaleBtn: 'Select Stale Tabs for Sweeping',

    // Dialog Buttons
    dialogCancel: 'Cancel',
    dialogConfirm: 'Confirm',

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
    confirmDeleteGroupMsg: 'Items in this group will return to Unsorted. No tabs will be closed.',
    confirmDeleteGroupBtn: 'Delete group',

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
    historySnapshotsCountSingle: '1 snapshot',
    historySnapshotsCountPlural: '{count} snapshots',
    historyCountTabsSingle: '1 tab',
    historyCountTabsPlural: '{count} tabs',
    historyLoadingDetails: 'Loading details...',

    // Selection Bar
    selectedCount: '{count} selected',
    selectedClose: 'Close',
    selectedCancel: 'Cancel',

    // Update Banner
    updateBannerText: 'Tab Organizer updated to v{version} — What\'s new?',
    updateBannerDismiss: 'Dismiss update notice',

    // Product Table
    tableHeaderName: 'Name',
    tableHeaderGroup: 'Group',
    tableHeaderTabs: 'Tabs',
    tableHeaderDuplicates: 'Duplicates',
    tableHeaderActions: 'Actions',
    tableUnsorted: 'Unsorted',
    tableBtnClose: 'Close',
    tableBtnDedupe: 'Dedupe',
    tableExpandLabel: 'Expand {name}',
    tableCollapseLabel: 'Collapse {name}',

    // Domain Card
    cardBtnCloseAllSingle: 'Close 1 tab',
    cardBtnCloseAllPlural: 'Close all {count} tabs',
    cardBtnCloseDupesSingle: 'Close 1 duplicate',
    cardBtnCloseDupesPlural: 'Close {count} duplicates',
    cardBtnShowLess: 'Show less',
    cardBtnShowMore: '+{count} more',
    cardCloseDupesTitle: 'Close duplicate tabs',
    cardCollapseMoreLabel: 'Collapse {count} more tabs',
    cardShowMoreLabel: 'Show {count} more tabs',

    // DnD Organizer
    organizerUnsorted: 'Unsorted',
    organizerBtnRename: 'Rename',
    organizerBtnDelete: 'Delete',
    organizerBtnCloseAll: 'Close all',

    // Settings Panel
    settingsTitle: 'Settings',
    settingsTabGeneral: 'General',
    settingsTabCustomGroups: 'Custom Groups',
    settingsTabSpaces: 'Spaces & Rules',
    settingsTabShortcuts: 'Shortcuts',

    // Settings - Language Option
    settingsLang: 'Language',
    settingsLangSystem: 'System Default',
    settingsLangEn: 'English',
    settingsLangZh: '简体中文',
    settingsLangDesc: 'Select language for the dashboard',

    // Settings - Theme & Options
    settingsTheme: 'Visual Theme',
    settingsThemeSystem: 'System',
    settingsThemeLight: 'Warm Paper (Light)',
    settingsThemeDark: 'Dark Mode',
    settingsThemeDesc: 'Choose dashboard visual appearance',

    // Theme names
    themeClay: 'Clay Paper',
    themeSage: 'Sage Herb',
    themeFrost: 'Ice Frost',
    themeOchre: 'Chalk Ochre',
    themeObsidian: 'Obsidian Ink',
    themePine: 'Deep Pine',
    themeAmethyst: 'Amethyst Night',

    settingsOptionsTitle: 'Interface Options',
    settingsOptionsSound: 'Sound Effects',
    settingsOptionsSoundDesc: 'Play satisfying click and pop sounds during cleanup',
    settingsOptionsConfetti: 'Confetti Burst',
    settingsOptionsConfettiDesc: 'Celebrate clean slate moments with physical confetti',

    settingsMaxChips: 'Maximum visible tabs per product',
    settingsMaxChipsDesc: 'Set the threshold before chips fold under a \'+N more\' button',
    settingsStaleThreshold: 'Stale Tabs Definition',
    settingsStaleThresholdDesc: 'Define the threshold of inactivity in days for stale sweeps',
    settingsSortOrderTitle: 'Sort Order',
    settingsSortOrderDesc: 'Reset all manual ordering and product positions back to default',
    settingsSortOrderBtn: 'Reset Order',

    // Settings - Custom Groups
    settingsCustomRulesTitle: 'Product Group Rules',
    settingsCustomRulesDesc: 'Define custom grouping terms and styling rules',
    settingsCustomRulesBtn: 'Add Custom Rule',
    settingsRuleFriendlyName: 'Friendly Name',
    settingsRulePattern: 'Match Pattern (regex / domain prefix)',
    settingsRuleColor: 'Visual Badge Color',
    settingsRuleActions: 'Actions',
    settingsRuleNoRules: 'No rules configured yet',

    // Settings - Manual Spaces
    settingsSpacesTitle: 'Manual Spaces & Sections',
    settingsSpacesDesc: 'Create and order spaces or sections to categorize your product groups',
    settingsSpacesBtn: 'Add Space',
    settingsSpaceName: 'Name',
    settingsSpaceOrder: 'Order index',
    settingsSpaceNoSpaces: 'No spaces configured',

    // Settings - Shortcuts
    settingsShortcutsTitle: 'Keyboard Shortcuts',
    settingsShortcutsDesc: 'Configure extension keyboard bindings to launch and clear tabs',
    settingsShortcutGlobalKey: 'Global Action Key',
    settingsShortcutOpenDashboard: 'Open Dashboard',
    settingsShortcutDedupeActive: 'Dedupe Active Product',
    settingsShortcutCloseStale: 'Close Stale Sweep',
    settingsShortcutsResetBtn: 'Reset Shortcuts',
    settingsShortcutsHint: 'Keyboard shortcuts let you trigger Tab Organizer workflows quickly. Double click a field to change it.',

    // Settings - Backup & Import
    settingsBackupTitle: 'Backup & Portability',
    settingsBackupDesc: 'Export or import your extension configurations, space structures, and preferences.',
    settingsBackupExportBtn: 'Export Config',
    settingsBackupImportBtn: 'Import Config',

    // Toasts / Alerts
    toastTabClosed: 'Tab closed',
    toastSettingsExported: 'Settings exported successfully! 📤',
    toastSettingsImported: 'Settings imported successfully! 📥',
    toastImportFailed: 'Import failed. Verify JSON backup file format. ⚠️',
    toastSortOrderReset: 'Sort order reset',
    toastDuplicatesClosed: 'Duplicates closed',
    toastClosedProductTabs: 'Closed all {count} {name} tabs',
    toastClosedSectionTabs: 'Closed all {count} tabs in {title}',
    toastClosedTab: 'Tab closed',
    toastClosedSelectedSingle: 'Closed 1 tab',
    toastClosedSelectedPlural: 'Closed {count} tabs',
    toastGroupCreated: 'Group created',
    toastGroupRenamed: 'Group renamed',
    toastGroupDeleted: 'Group deleted',
    toastViewModeCards: 'Cards view',
    toastViewModeTable: 'Table view',
    toastRefreshed: 'Refreshed',
    toastMovedToGroup: 'Moved to group',
    toastMovedToUnsorted: 'Moved to Unsorted',
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
    emptySweepDupeDesc: 'Your workspace is perfectly clean. There are no duplicate URLs!',
    emptySweepSpaceTitle: 'No space matches found',
    emptySweepSpaceDesc: 'Could not find any space named "{name}" or the space has no tabs.',
    emptySweepSpaceNoArg: 'Please specify a space name (e.g., /space:work)',
    emptySweepSearchTitle: 'No tabs match your search',
    emptySweepSearchDesc: 'We couldn\'t find any open tabs matching "{query}".',

    // Additional settings and shortcut options
    settingsOptionChipsCount: '{count} chips',
    settingsOptionChipsCountDefault: '8 chips (Default)',
    settingsOptionDaysCount: '{count} days',
    settingsOptionDaysCountDefault: '3 days (Default)',
    settingsRuleRequiredHostname: 'Hostname is required',
    settingsRuleRequiredLabel: 'Label is required',
    settingsRuleDuplicateHostname: 'A rule for this hostname already exists',
    settingsCustomRulesExplanationTitle: 'What are Custom Grouping Rules?',
    settingsCustomRulesExplanationDesc: 'They define how open tabs are grouped into product cards. For example, matching hostname dev.company.com with label Company Dev forces tabs of that host into a custom "Company Dev" card, overriding auto-extracted domain cards.',
    settingsPlaceholderHostname: 'Hostname (e.g. notion.so)',
    settingsPlaceholderLabel: 'Label (e.g. Notion)',
    settingsBtnAddRule: 'Add rule',
    settingsSpacesExplanationTitle: 'What are Spaces & Rules?',
    settingsSpacesExplanationDesc: 'They define where product cards are routed and displayed. You create workspaces (e.g. Work, Personal) and write pattern rules. Any product card matching your rule keywords will be automatically routed into that space, avoiding manual card drag-and-drop.',
    settingsPlaceholderSpaceName: 'New space name (e.g. Work, Personal)',
    settingsBtnAddSpace: 'Add Space',
    settingsNoSpacesCreated: 'No spaces created yet. Add one above!',
    settingsBtnDeleteSpace: 'Delete Space',
    settingsLabelAutoRules: 'Auto-assignment rules (one pattern per line)',
    settingsLabelEmoji: 'Space emoji (single character)',
    settingsShortcutRecording: 'Press key...',
    settingsShortcutLabelSwitchSpaceN: 'Switch to Space 1-9',
    settingsShortcutLabelSwitchSpaceAll: 'Switch to "All"',
    settingsShortcutLabelCyclePrev: 'Cycle Space Left',
    settingsShortcutLabelCycleNext: 'Cycle Space Right',
    settingsShortcutLabelFocusSearch: 'Focus Search',
    settingsShortcutLabelClearFilter: 'Clear Space Filter'
  },
  zh: {
    // Greetings
    greetMorning: '早上好',
    greetAfternoon: '下午好',
    greetEvening: '晚上好',
    greetHello: '你好',

    // Global accessibility
    skipToContent: '跳过并直达主内容',

    // Dashboard Header
    titleOpenTabs: '正在运行的标签页',
    groupCountSingle: '1 个分组',
    groupCountPlural: '{count} 个分组',
    noGroupsFound: '未发现分组',
    settings: '设置',
    historyHide: '隐藏历史',
    historyShow: '历史记录',
    refresh: '刷新同步',
    newGroup: '新建分组',
    closeAll: '关闭全部',

    // Sort Options
    sortCount: '按标签数量',
    sortByName: '按名称',
    sortByLastAccessed: '按最近使用',

    // Status Strip Metrics
    metricTabs: '标签页',
    metricDuplicates: '重复项',
    metricGroups: '独立分组',
    alertExtraTabOrganizerSingle: '1 个多余的整理面板标签',
    alertExtraTabOrganizerPlural: '{count} 个多余的整理面板标签',
    actionCloseExtras: '关闭多余面板',
    alertHighTabCount: '标签页数量过高',
    alertHighTabCountDesc: '您当前打开了 {count} 个标签页。建议关闭不常用的标签页以释放资源。',
    actionDismiss: '忽略警告',

    // Search Bar
    searchPlaceholderTabs: '搜索标签页，或输入 / 触发快捷命令...',
    searchPlaceholderCommands: '搜索快捷命令...',
    cmdDupes: '重复项',
    cmdDupesLabel: '筛选重复的标签页',
    cmdDupesDesc: '查找重复的标签页并保留当前激活的标签',
    cmdStale: '闲置标签',
    cmdStaleLabel: '筛选闲置的标签页',
    cmdStaleDesc: '查找超过 3 天未使用的标签页',
    cmdSpace: '按空间筛选',
    cmdSpaceLabel: '切换分区空间视图',
    cmdSpaceDesc: '按手动分区空间名称筛选 (例如 /space:work)',
    cmdPanelTitle: '快捷命令',
    cmdPanelTitleHint: '快捷命令 (输入 / 或在下方选择)',
    cmdHintEnter: '按 Enter / Tab 键',
    searchMatchingSingle: '1 个匹配',
    searchMatchingPlural: '{count} 个匹配',
    searchMatchingOfSingle: '1 个匹配（共 1 个标签）',
    searchMatchingOfPlural: '{count} 个匹配（共 {total} 个标签）',
    searchKbdHint: '按 / 键搜索',

    // Empty States
    emptyStateTitle: '没有需要整理的标签页',
    emptyStateText: '在浏览器中打开一些网页，或点击“刷新同步”以同步当前的 Chrome 标签页。',

    // Space Switcher
    spaceSwitcherAll: '全部空间',
    spaceSwitcherNew: '新建空间',

    // Sweeps / Banners
    sweepDupeTitle: '重复标签页清理',
    sweepDupeDesc: '一键扫描所有重复开启的标签页，只保留一个活跃副本。',
    sweepDupeBtn: '选中所有重复标签页以清理',
    sweepStaleTitle: '闲置标签页清理',
    sweepStaleDesc: '发现并整理已闲置 {days} 天以上的标签页。固定标签和发声/活动中的标签将受保护。',
    sweepStaleBtn: '选中所有闲置标签页以清理',

    // Dialog Buttons
    dialogCancel: '取消',
    dialogConfirm: '确认',

    // Confirmation dialog titles, messages and buttons
    confirmCloseProductTitle: '关闭所有 {name} 标签页',
    confirmCloseProductMsg: '这将关闭此产品下的全部 {count} 个标签页。',
    confirmCloseProductBtn: '确认关闭',

    confirmCloseSectionTitle: '关闭 {title} 中的所有标签页',
    confirmCloseSectionMsg: '这将关闭此分区下的全部 {count} 个标签页。',
    confirmCloseSectionBtn: '确认关闭',

    confirmCloseDupesTitle: '清理重复标签页',
    confirmCloseDupesMsg: '这将关闭全部 {count} 个重复的标签页，只保留每个网址的最新版本。',
    confirmCloseDupesBtn: '清理重复项',

    confirmCloseSelectedTitle: '关闭 {count} 个选中的标签页',
    confirmCloseSelectedMsg: '您确定要关闭这 {count} 个标签页吗？',
    confirmCloseSelectedBtn: '关闭选中项',

    confirmCloseAllTitle: '关闭所有标签页',
    confirmCloseAllMsg: '这将关闭浏览器中的所有 {count} 个标签页，且不可撤销。',
    confirmCloseAllBtn: '关闭全部',

    confirmDeleteGroupTitle: '删除空间 {name}',
    confirmDeleteGroupMsg: '此空间内的所有产品分组将退回“未分类”，不会关闭任何标签页。',
    confirmDeleteGroupBtn: '确认删除',

    // Prompts
    promptCreateGroupTitle: '新建空间分区',
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
    historyNoSnapshotsDesc: '关闭部分标签页即可自动创建首个历史快照。',
    historySnapshotsCountSingle: '1 个历史快照',
    historySnapshotsCountPlural: '{count} 个历史快照',
    historyCountTabsSingle: '1 个标签页',
    historyCountTabsPlural: '{count} 个标签页',
    historyLoadingDetails: '加载详情中...',

    // Selection Bar
    selectedCount: '已选中 {count} 项',
    selectedClose: '关闭选中',
    selectedCancel: '取消选择',

    // Update Banner
    updateBannerText: 'Tab Organizer 已更新至 v{version} — 了解新功能！',
    updateBannerDismiss: '关闭更新通知',

    // Product Table
    tableHeaderName: '名称',
    tableHeaderGroup: '所属分组',
    tableHeaderTabs: '标签页数量',
    tableHeaderDuplicates: '重复项',
    tableHeaderActions: '操作',
    tableUnsorted: '未分类',
    tableBtnClose: '关闭',
    tableBtnDedupe: '去重',
    tableExpandLabel: '展开 {name}',
    tableCollapseLabel: '收起 {name}',

    // Domain Card
    cardBtnCloseAllSingle: '关闭 1 个标签',
    cardBtnCloseAllPlural: '关闭所有 {count} 个标签',
    cardBtnCloseDupesSingle: '清理 1 个重复项',
    cardBtnCloseDupesPlural: '清理 {count} 个重复项',
    cardBtnShowLess: '收起隐藏',
    cardBtnShowMore: '+{count} 个更多',
    cardCloseDupesTitle: '关闭重复标签页',
    cardCollapseMoreLabel: '收起额外的 {count} 个标签页',
    cardShowMoreLabel: '显示额外的 {count} 个标签页',

    // DnD Organizer
    organizerUnsorted: '未分类',
    organizerBtnRename: '重命名',
    organizerBtnDelete: '删除空间',
    organizerBtnCloseAll: '关闭全部',

    // Settings Panel
    settingsTitle: '设置选项',
    settingsTabGeneral: '常规设置',
    settingsTabCustomGroups: '自定义规则',
    settingsTabSpaces: '空间与分区',
    settingsTabShortcuts: '快捷键',

    // Settings - Language Option
    settingsLang: '界面语言',
    settingsLangSystem: '系统默认',
    settingsLangEn: 'English (英文)',
    settingsLangZh: '简体中文',
    settingsLangDesc: '选择整理面板的显示语言',

    // Settings - Theme & Options
    settingsTheme: '界面视觉风格',
    settingsThemeSystem: '跟随系统',
    settingsThemeLight: '暖沙纸张 (亮色)',
    settingsThemeDark: '暗色模式 (深色)',
    settingsThemeDesc: '更改整理面板的整体外观颜色',

    // Theme names
    themeClay: '暖沙陶土',
    themeSage: '草本鼠尾草',
    themeFrost: '冰川冷蓝',
    themeOchre: '白垩赭石',
    themeObsidian: '黑曜石墨',
    themePine: '暗针长青',
    themeAmethyst: '紫曜晚霞',

    settingsOptionsTitle: '交互选项',
    settingsOptionsSound: '清理音效',
    settingsOptionsSoundDesc: '在关闭标签页或清理重复项时播放解压的音效',
    settingsOptionsConfetti: '撒花特效',
    settingsOptionsConfettiDesc: '在彻底清理标签页的轻松时刻展示精美的撒花效果',

    settingsMaxChips: '单个产品内最大可见标签数',
    settingsMaxChipsDesc: '设置在此数量之上的标签页将自动收纳进“+N 个更多”按钮中',
    settingsStaleThreshold: '闲置标签页判定标准',
    settingsStaleThresholdDesc: '定义标签页处于不活动状态多少天后将被判定为“闲置”',
    settingsSortOrderTitle: '排序位置',
    settingsSortOrderDesc: '重置所有手动拖动排序的位置及产品卡片分类',
    settingsSortOrderBtn: '重置排序',

    // Settings - Custom Groups
    settingsCustomRulesTitle: '产品分组自动归类',
    settingsCustomRulesDesc: '通过正则或域名匹配规则，自定义产品的友好显示名称与配色规则',
    settingsCustomRulesBtn: '添加自定义规则',
    settingsRuleFriendlyName: '友好显示名称',
    settingsRulePattern: '匹配模式 (正则或域名开头)',
    settingsRuleColor: '卡片状态条配色',
    settingsRuleActions: '操作',
    settingsRuleNoRules: '暂无自定义规则配置',

    // Settings - Manual Spaces
    settingsSpacesTitle: '手动空间与分区',
    settingsSpacesDesc: '创建并排序手动空间或分区，方便归类您的各产品标签页',
    settingsSpacesBtn: '添加空间分区',
    settingsSpaceName: '空间名称',
    settingsSpaceOrder: '排序序号',
    settingsSpaceNoSpaces: '暂无空间配置',

    // Settings - Shortcuts
    settingsShortcutsTitle: '键盘快捷键',
    settingsShortcutsDesc: '配置快捷键以极其迅速地打开整理面板或执行快速清理',
    settingsShortcutGlobalKey: '全局激活键',
    settingsShortcutOpenDashboard: '打开整理面板',
    settingsShortcutDedupeActive: '去重当前活跃产品',
    settingsShortcutCloseStale: '一键清理闲置标签',
    settingsShortcutsResetBtn: '重置快捷键',
    settingsShortcutsHint: '键盘快捷键能帮您迅速触发 Tab Organizer 整理流程。双击字段即可对其进行修改。',

    // Settings - Backup & Import
    settingsBackupTitle: '数据备份与迁移',
    settingsBackupDesc: '导出或导入您的所有设置选项、分区空间结构及偏好配置。',
    settingsBackupExportBtn: '导出备份文件',
    settingsBackupImportBtn: '导入备份文件',

    // Toasts / Alerts
    toastTabClosed: '标签页已关闭',
    toastSettingsExported: '设置已成功导出！📤',
    toastSettingsImported: '设置已成功导入！📥',
    toastImportFailed: '导入失败，请检查 JSON 备份文件格式是否正确。⚠️',
    toastSortOrderReset: '排序位置已恢复默认',
    toastDuplicatesClosed: '重复标签页已清理完毕',
    toastClosedProductTabs: '已关闭 {name} 的全部 {count} 个标签页',
    toastClosedSectionTabs: '已关闭 {title} 分区下的全部 {count} 个标签页',
    toastClosedTab: '标签页已关闭',
    toastClosedSelectedSingle: '已关闭 1 个标签页',
    toastClosedSelectedPlural: '已关闭 {count} 个标签页',
    toastGroupCreated: '空间分区已成功创建',
    toastGroupRenamed: '分区已被重命名',
    toastGroupDeleted: '空间分区已成功删除',
    toastViewModeCards: '已切换为卡片视图',
    toastViewModeTable: '已切换为表格视图',
    toastRefreshed: '同步刷新成功',
    toastMovedToGroup: '已移至目标空间',
    toastMovedToUnsorted: '已移至未分类分区',
    toastSelectedStaleSingle: '已选中 1 个闲置标签页。点击关闭按钮即可清理。',
    toastSelectedStalePlural: '已选中 {count} 个闲置标签页。点击关闭按钮即可清理。',
    toastNoStaleTabs: '未发现任何闲置标签页 🧹',
    toastSelectedDuplicatesSingle: '已选中 1 个重复标签页。点击关闭按钮即可清理。',
    toastSelectedDuplicatesPlural: '已选中 {count} 个重复标签页。点击关闭按钮即可清理。',
    toastNoDuplicates: '未发现任何重复标签页 🧹',

    // Sweeps Empty States
    emptySweepStaleTitle: '没有发现闲置标签',
    emptySweepStaleDesc: '您的所有标签页最近都很活跃（在过去的 {days} 天内均被访问过）。',
    emptySweepDupeTitle: '没有发现重复标签',
    emptySweepDupeDesc: '您的工作区非常干净，没有重复打开的网址！',
    emptySweepSpaceTitle: '未匹配到该空间的分区',
    emptySweepSpaceDesc: '找不到名为 “{name}” 的空间，或者该空间下目前没有处于打开状态的标签页。',
    emptySweepSpaceNoArg: '请指定空间名称（如 /space:工作）',
    emptySweepSearchTitle: '没有找到匹配的标签页',
    emptySweepSearchDesc: '未找到任何匹配搜索条件 “{query}” 的标签页。',

    // Additional settings and shortcut options
    settingsOptionChipsCount: '{count} 个标签',
    settingsOptionChipsCountDefault: '8 个标签 (默认)',
    settingsOptionDaysCount: '{count} 天',
    settingsOptionDaysCountDefault: '3 天 (默认)',
    settingsRuleRequiredHostname: '必须输入域名',
    settingsRuleRequiredLabel: '必须输入标签',
    settingsRuleDuplicateHostname: '该域名的规则已存在',
    settingsCustomRulesExplanationTitle: '什么是自定义分类规则？',
    settingsCustomRulesExplanationDesc: '自定义规则允许您强制将特定域名的标签页归类到您指定的卡片中。例如，将 dev.company.com 强制命名为 "公司开发环境" 卡片，从而覆盖自动提取的域名分组。',
    settingsPlaceholderHostname: '主机名/域名 (例如 notion.so)',
    settingsPlaceholderLabel: '分类标签 (例如 Notion)',
    settingsBtnAddRule: '添加规则',
    settingsSpacesExplanationTitle: '什么是空间与路由规则？',
    settingsSpacesExplanationDesc: '分区空间允许您分类整理不同任务的分组（例如工作、个人）。您可以编写路由规则关键字，匹配这些关键字的域名分组会被自动路由至该空间，无需手动拖拽。',
    settingsPlaceholderSpaceName: '新空间名称 (例如 工作, 个人)',
    settingsBtnAddSpace: '添加空间',
    settingsNoSpacesCreated: '暂无分区空间。在上方输入名称并创建！',
    settingsBtnDeleteSpace: '删除空间',
    settingsLabelAutoRules: '自动匹配规则 (每行输入一个关键字)',
    settingsLabelEmoji: '空间表情符号 (单字符)',
    settingsShortcutRecording: '按下按键...',
    settingsShortcutLabelSwitchSpaceN: '切换到空间 1-9',
    settingsShortcutLabelSwitchSpaceAll: '切换到 "全部"',
    settingsShortcutLabelCyclePrev: '循环切回上个空间',
    settingsShortcutLabelCycleNext: '循环切至下个空间',
    settingsShortcutLabelFocusSearch: '聚焦搜索框',
    settingsShortcutLabelClearFilter: '清除空间筛选'
  }
} as const;
