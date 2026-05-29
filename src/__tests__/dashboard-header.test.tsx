import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardHeader } from '../dashboard/components/layout/DashboardHeader';
import { I18nProvider } from '../dashboard/providers/I18nProvider';

afterEach(() => {
  cleanup();
});

function renderWithI18n(element: React.ReactElement) {
  return render(<I18nProvider>{element}</I18nProvider>);
}

describe('DashboardHeader', () => {
  it('wires search and command actions without owning dashboard state', () => {
    const onSearchChange = vi.fn();

    const onCreateSection = vi.fn();
    const onOpenSettings = vi.fn();
    const onGroupSortByChange = vi.fn();

    renderWithI18n(
      <DashboardHeader
        title="Open Tabs by Product"
        hasGroups
        dateLabel="Tuesday, May 5, 2026"
        searchQuery=""
        onSearchChange={onSearchChange}
        resultCount={6}
        totalCount={12}
        groupSortBy="count"
        onGroupSortByChange={onGroupSortByChange}
        sortButtonDisabled={false}
        onSortWindow={vi.fn()}
        onRefresh={() => {}}
        onCreateSection={onCreateSection}
        onOpenSettings={onOpenSettings}
        sections={[{ id: 'work', name: 'Work', order: 0 }]}
        sectionIds={[null, 'work']}
        activeSectionId={null}
        onSectionChange={() => {}}
      />,
    );

    expect(screen.getByText('Tuesday, May 5, 2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Open Tabs by Product' })).toBeInTheDocument();

    const hardcodedHeightClass = ['h', '[44px]'].join('-');
    expect(screen.getByRole('combobox', { name: 'Sort order' })).not.toHaveClass(hardcodedHeightClass);
    expect(screen.getByRole('button', { name: 'New section' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close All' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search tabs' }), {
      target: { value: 'github' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'New section' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(onSearchChange).toHaveBeenCalledWith('github');
    expect(onCreateSection).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('keeps settings available without showing group-only actions in the empty state', () => {
    const onOpenSettings = vi.fn();
    const onGroupSortByChange = vi.fn();

    renderWithI18n(
      <DashboardHeader
        title="Open Tabs by Product"
        hasGroups={false}
        dateLabel="Tuesday, May 5, 2026"
        searchQuery=""
        onSearchChange={() => {}}
        resultCount={0}
        totalCount={0}
        groupSortBy="count"
        onGroupSortByChange={onGroupSortByChange}
        sortButtonDisabled={false}
        onSortWindow={vi.fn()}
        onRefresh={() => {}}
        onCreateSection={() => {}}
        onOpenSettings={onOpenSettings}
        sections={[]}
        sectionIds={[null]}
        activeSectionId={null}
        onSectionChange={() => {}}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Open Tabs by Product' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Search tabs' })).not.toBeInTheDocument();
    expect(screen.queryByText('0 groups')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Organize' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New section' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close All' })).not.toBeInTheDocument();
    // Settings is always visible (Layer 3), independent of hasGroups
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });
});
