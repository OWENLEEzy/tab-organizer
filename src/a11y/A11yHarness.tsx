import React, { useState } from 'react';
import { SearchBar } from '../newtab/components/SearchBar';
import { SettingsPanel } from '../newtab/components/SettingsPanel';
import { Toast } from '../newtab/components/Toast';
import { TabChip } from '../newtab/components/TabChip';

export function A11yHarness(): React.ReactElement {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="tab-out-container" style={{ minHeight: '100vh' }}>
      <header className="mb-8 space-y-4">
        <h1 className="font-heading text-text-primary-light dark:text-text-primary-dark text-3xl">
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
          title="Tab Out repo"
          duplicateCount={2}
          active
          onFocus={() => {}}
          onClose={() => {}}
          onSave={() => {}}
        />
      </section>

      <Toast message="Harness ready" visible />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme="system"
        soundEnabled
        confettiEnabled
        onSetTheme={() => {}}
        onToggleSound={() => {}}
        onToggleConfetti={() => {}}
        onResetSortOrder={() => {}}
      />
    </main>
  );
}
