import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { DashboardHeader } from '../dashboard/components/layout/DashboardHeader';
import { getDateFormatter, getSnapshotDateFormatter } from '../dashboard/lib/date-formatters';
import { DashboardShell } from '../dashboard/components/layout/DashboardShell';
import { Footer } from '../dashboard/components/Footer';
import { UtilityPanel } from '../dashboard/components/layout/UtilityPanel';
import { TabChip } from '../dashboard/components/tabs/TabChip';

const globalCss = readFileSync(
  join(process.cwd(), 'src/dashboard/styles/global.css'),
  'utf8',
);

describe('MotherDuck-inspired dashboard token layer', () => {
  it('defines visual tokens instead of relying on raw brand class names', () => {
    expect(globalCss).toContain('--color-bg-page');
    expect(globalCss).toContain('--color-bg-surface');
    expect(globalCss).toContain('--color-accent-amber');
    expect(globalCss).toContain('--color-accent-primary');
    expect(globalCss).toContain('--color-border-color');
    expect(globalCss).toContain('--font-family-body');
  });

  it('keeps warm flat layout classes available to React components', () => {
    expect(globalCss).toContain('.dashboard-shell');
    expect(globalCss).toContain('.dashboard-workspace');
    expect(globalCss).toContain('.dashboard-utilities');
  });

  it('keeps dashboard control heights managed by global size tokens', () => {
    expect(globalCss).toContain('.action-button');
    expect(globalCss).toContain('.view-toggle');
    expect(globalCss).toContain('.sort-dropdown');
    expect(globalCss).toContain('height: var(--spacing-button-height)');
    expect(globalCss).not.toContain('min-width: calc(var(--spacing-button-height)');
    expect(globalCss).not.toContain('--spacing-button-min-width');
    expect(globalCss).not.toContain('--spacing-button-padding-x');
    expect(globalCss).not.toContain('height: 44px');
  });
});

describe('MotherDuck-inspired layout components', () => {
  it('uses Chinese date formatters for zh-CN locales', () => {
    const date = new Date('2026-05-05T12:00:00Z');

    expect(getDateFormatter('zh-CN').format(date)).toBe(new Intl.DateTimeFormat('zh-CN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date));
    expect(getSnapshotDateFormatter('zh-CN').format(date)).toBe(new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date));
  });

  it('renders footer metrics and alerts', () => {
    render(
      <I18nProvider>
        <Footer
          tabCount={42}
          duplicateCount={3}
          alerts={[{ id: 'tab-out-pages', label: '2 extra dashboard tabs', actionLabel: 'Close extras', onAction: () => {} }]}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('tabs')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('duplicates')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close extras' })).toBeInTheDocument();
  });

  it('renders the merged dashboard header without marketing copy', () => {
    render(
      <I18nProvider>
        <DashboardHeader
          title="Open Tabs by Product"
          hasGroups={true}
          dateLabel="Tuesday, May 5, 2026"
          searchQuery=""
          onSearchChange={() => {}}
          resultCount={5}
          totalCount={8}
          viewMode="cards"
          onViewModeChange={() => {}}
          groupSortBy="count"
          onGroupSortByChange={() => {}}
          sortButtonDisabled={false}
          onSortWindow={vi.fn()}
          onRefresh={() => {}}
          onCreateSection={() => {}}
          onOpenSettings={() => {}}
          sections={[{ id: 'work', name: 'Work', order: 0 }]}
          sectionIds={[null, 'work']}
          activeSectionId={null}
          onSectionChange={() => {}}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Open Tabs by Product' })).toBeInTheDocument();
    expect(screen.getByText('Tuesday, May 5, 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All sections' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Work' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search tabs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('composes primary content and utility panels', () => {
    render(
      <I18nProvider>
        <DashboardShell
          top={null}
          header={
            <DashboardHeader
              title="Open Tabs by Product"
              hasGroups={true}
              dateLabel="Tuesday, May 5, 2026"
              searchQuery=""
              onSearchChange={() => {}}
              resultCount={1}
              totalCount={1}
              viewMode="cards"
              onViewModeChange={() => {}}
              groupSortBy="count"
              onGroupSortByChange={() => {}}
              sortButtonDisabled={false}
              onSortWindow={vi.fn()}
              onRefresh={() => {}}
              onCreateSection={() => {}}
              onOpenSettings={() => {}}
              sections={[]}
              sectionIds={[null]}
              activeSectionId={null}
              onSectionChange={() => {}}
            />
          }
          toolbar={null}
          utilities={<UtilityPanel title="Saved">Saved item</UtilityPanel>}
        >
          <main>Product grid</main>
        </DashboardShell>
      </I18nProvider>,
    );

    expect(screen.getByText('Product grid')).toBeInTheDocument();
    expect(screen.getByText('Saved item')).toBeInTheDocument();
  });
});

describe('dashboard reskin composition contract', () => {
  it('documents that App owns behavior while layout components remain prop-driven', () => {
    const appSource = readFileSync(
      join(process.cwd(), 'src/dashboard/App.tsx'),
      'utf8',
    );

    expect(appSource).toContain('DashboardShell');
    expect(appSource).toContain('Footer');
    expect(appSource).toContain('DashboardHeader');
    expect(appSource).toContain('DndOrganizer');
    expect(appSource).toContain('ProductTable');
  });

  it('keeps dnd-kit isolated to the cards drag board', () => {
    const appSource = readFileSync(
      join(process.cwd(), 'src/dashboard/App.tsx'),
      'utf8',
    );
    const dndOrganizerSource = readFileSync(
      join(process.cwd(), 'src/dashboard/components/organizer/DndOrganizer.tsx'),
      'utf8',
    );
    const productTableSource = readFileSync(
      join(process.cwd(), 'src/dashboard/components/tabs/ProductTable.tsx'),
      'utf8',
    );

    expect(appSource).not.toContain('@dnd-kit');
    expect(dndOrganizerSource).toContain('@dnd-kit');
    expect(productTableSource).not.toContain('@dnd-kit');
  });
});

describe('tab title readability', () => {
  it('does not uppercase real tab titles', () => {
    render(
      <I18nProvider>
        <TabChip
          url="https://github.com/OWENLEEzy/tab-out"
          title="Tab Organizer repo"
          duplicateCount={1}
          onFocus={() => {}}
          onClose={() => {}}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('Tab Organizer repo')).toBeInTheDocument();
    expect(screen.queryByText('TAB OUT REPO')).not.toBeInTheDocument();
  });
});