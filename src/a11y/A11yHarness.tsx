import React, { useState } from 'react';
import { SearchBar } from '../dashboard/components/search/SearchBar';
import { SettingsPanel } from '../dashboard/components/settings/SettingsPanel';
import { Toast } from '../dashboard/components/states/Toast';
import { TabChip } from '../dashboard/components/tabs/TabChip';
import { I18nProvider } from '../dashboard/providers/I18nProvider';

export function A11yHarness(): React.ReactElement {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <I18nProvider>
      <main className="dashboard-shell" style={{ minHeight: '100vh' }}>
        <header className="mb-8 space-y-4">
          <h1 className="font-heading text-3xl text-text-primary-light dark:text-text-primary-dark">
            Accessibility Harness
          </h1>
          <button
            type="button"
            className="rounded-chip bg-accent-blue px-4 py-3 text-sm font-medium text-white"
            onClick={() => setSettingsOpen(true)}
          >
            Open settings
          </button>
          <SearchBar value="" onChange={() => {}} resultCount={3} totalCount={12} />
        </header>

        <section aria-label="Tab chip examples" className="space-y-2">
          <TabChip
            url="https://github.com/OWENLEEzy/tab-out"
            title="Tab Organizer repo"
            duplicateCount={2}
            active
            onFocus={() => {}}
            onClose={() => {}}
          />
        </section>

        <Toast message="Harness ready" visible />

        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          theme="clay"
          language="system"
          soundEnabled
          confettiEnabled
          customGroups={[]}
          onSetTheme={() => {}}
          onSetLanguage={() => {}}
          onToggleSound={() => {}}
          onToggleConfetti={() => {}}
          onResetSortOrder={() => {}}
          onAddCustomGroup={() => {}}
          onRemoveCustomGroup={() => {}}
          maxChipsVisible={8}
          staleThresholdDays={3}
          onSetMaxChipsVisible={() => {}}
          onSetStaleThresholdDays={() => {}}
          onExportSettings={() => {}}
          onImportSettings={async () => {}}
          onCreateSection={() => {}}
          appVersion="2.0.0-test"
          viewMode="cards"
          onViewModeChange={() => {}}
        />
      </main>
    </I18nProvider>
  );
}
