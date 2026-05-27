import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DashboardHeader } from '../newtab/components/layout/DashboardHeader';
import { DashboardShell } from '../newtab/components/layout/DashboardShell';
import { StatusStrip } from '../newtab/components/layout/StatusStrip';
import { UtilityPanel } from '../newtab/components/layout/UtilityPanel';
import { TabChip } from '../newtab/components/TabChip';

const globalCss = readFileSync(
  join(process.cwd(), 'src/newtab/styles/global.css'),
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
  it('renders the status strip with global metrics', () => {
    render(
      <StatusStrip
        totalTabs={42}
        totalDupes={3}
        totalGroups={12}
        alerts={[{ id: 'tab-out-pages', label: '2 extra dashboard tabs', actionLabel: 'Close extras', onAction: () => {} }]}
      />,
    );

    expect(screen.getByText('42 tabs')).toBeInTheDocument();
    expect(screen.getByText('3 duplicates')).toBeInTheDocument();
    expect(screen.getByText('12 groups')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close extras' })).toBeInTheDocument();
  });

  it('renders the merged dashboard header without marketing copy', () => {
    render(
      <DashboardHeader
        title="Open Tabs by Product"
        hasGroups
        dateLabel="Tuesday, May 5, 2026"
        searchQuery=""
        onSearchChange={() => {}}
        resultCount={5}
        totalCount={8}
        viewMode="cards"
        onViewModeChange={() => {}}
        groupSortBy="count"
        onGroupSortByChange={() => {}}
        onRefresh={() => {}}
        onCreateGroup={() => {}}
        onCloseAll={() => {}}
        onOpenSettings={() => {}}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Open Tabs by Product' })).toBeInTheDocument();
    expect(screen.getByText('Tuesday, May 5, 2026')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search tabs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('composes primary content and utility panels', () => {
    render(
      <DashboardShell
        top={<StatusStrip totalTabs={1} totalDupes={0} totalGroups={1} alerts={[]} />}
        header={
          <DashboardHeader
            title="Open Tabs by Product"
            hasGroups
            dateLabel="Tuesday, May 5, 2026"
            searchQuery=""
            onSearchChange={() => {}}
            resultCount={1}
            totalCount={1}
            viewMode="cards"
            onViewModeChange={() => {}}
            groupSortBy="count"
            onGroupSortByChange={() => {}}
            onRefresh={() => {}}
            onCreateGroup={() => {}}
            onCloseAll={() => {}}
            onOpenSettings={() => {}}
          />
        }
        toolbar={null}
        utilities={<UtilityPanel title="Saved">Saved item</UtilityPanel>}
      >
        <main>Product grid</main>
      </DashboardShell>,
    );

    expect(screen.getByText('Product grid')).toBeInTheDocument();
    expect(screen.getByText('Saved item')).toBeInTheDocument();
  });
});

describe('dashboard reskin composition contract', () => {
  it('documents that App owns behavior while layout components remain prop-driven', () => {
    const appSource = readFileSync(
      join(process.cwd(), 'src/newtab/App.tsx'),
      'utf8',
    );

    expect(appSource).toContain('DashboardShell');
    expect(appSource).toContain('StatusStrip');
    expect(appSource).toContain('DashboardHeader');
    expect(appSource).toContain('DndOrganizer');
    expect(appSource).toContain('ProductTable');
  });
});

describe('tab title readability', () => {
  it('does not uppercase real tab titles', () => {
    render(
      <TabChip
        url="https://github.com/OWENLEEzy/tab-out"
        title="Tab Organizer repo"
        duplicateCount={1}
        onFocus={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('Tab Organizer repo')).toBeInTheDocument();
    expect(screen.queryByText('TAB OUT REPO')).not.toBeInTheDocument();
  });
});
