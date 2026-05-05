import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CommandHeader } from '../newtab/components/layout/CommandHeader';
import { DashboardShell } from '../newtab/components/layout/DashboardShell';
import { StatusStrip } from '../newtab/components/layout/StatusStrip';
import { UtilityPanel } from '../newtab/components/layout/UtilityPanel';
import { TabChip } from '../newtab/components/TabChip';

const globalCss = readFileSync(
  join(process.cwd(), 'src/newtab/styles/global.css'),
  'utf8',
);

describe('MotherDuck-inspired dashboard token layer', () => {
  it('defines Tab Out-owned visual tokens instead of relying on raw brand class names', () => {
    expect(globalCss).toContain('--to-bg-page');
    expect(globalCss).toContain('--to-bg-surface');
    expect(globalCss).toContain('--to-bg-yellow');
    expect(globalCss).toContain('--to-bg-blue');
    expect(globalCss).toContain('--to-border-strong');
    expect(globalCss).toContain('--to-font-ui');
  });

  it('keeps warm flat layout classes available to React components', () => {
    expect(globalCss).toContain('.dashboard-shell');
    expect(globalCss).toContain('.dashboard-workspace');
    expect(globalCss).toContain('.dashboard-utilities');
  });
});

describe('MotherDuck-inspired layout components', () => {
  it('renders the status strip with global metrics', () => {
    render(
      <StatusStrip
        totalTabs={42}
        totalDupes={3}
        totalProducts={12}
        alerts={[{ id: 'tab-out-pages', label: '2 extra dashboard tabs', actionLabel: 'Close extras', onAction: () => {} }]}
      />,
    );

    expect(screen.getByText('42 tabs')).toBeInTheDocument();
    expect(screen.getByText('3 duplicates')).toBeInTheDocument();
    expect(screen.getByText('12 products')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close extras' })).toBeInTheDocument();
  });

  it('renders command header without marketing copy', () => {
    render(
      <CommandHeader
        title="OPEN TABS BY PRODUCT"
        context="Tuesday, May 5, 2026"
        metrics={[
          { label: 'saved', value: 5 },
          { label: 'sessions', value: 2 },
        ]}
        onOpenSettings={() => {}}
      />,
    );

    expect(screen.getByRole('heading', { name: 'OPEN TABS BY PRODUCT' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('composes primary content and utility panels', () => {
    render(
      <DashboardShell
        top={<StatusStrip totalTabs={1} totalDupes={0} totalProducts={1} alerts={[]} />}
        header={<CommandHeader title="OPEN TABS BY PRODUCT" context="Today" metrics={[]} onOpenSettings={() => {}} />}
        toolbar={<div>Toolbar</div>}
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
    expect(appSource).toContain('CommandHeader');
    expect(appSource).toContain('DashboardToolbar');
    expect(appSource).toContain('SectionBoard');
    expect(appSource).toContain('ProductTable');
  });
});

describe('tab title readability', () => {
  it('does not uppercase real tab titles', () => {
    render(
      <TabChip
        url="https://github.com/OWENLEEzy/tab-out"
        title="Tab Out repo"
        duplicateCount={1}
        onFocus={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText('Tab Out repo')).toBeInTheDocument();
    expect(screen.queryByText('TAB OUT REPO')).not.toBeInTheDocument();
  });
});
