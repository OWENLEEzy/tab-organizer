import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DashboardHeader } from '../newtab/components/layout/DashboardHeader';

afterEach(() => {
  cleanup();
});

describe('DashboardHeader', () => {
  it('wires search and command actions without owning dashboard state', () => {
    const onSearchChange = vi.fn();
    const onViewModeChange = vi.fn();
    const onCreateGroup = vi.fn();
    const onCloseAll = vi.fn();
    const onOpenSettings = vi.fn();

    render(
      <DashboardHeader
        title="Open Tabs by Product"
        hasGroups
        groupCount={2}
        dateLabel="Tuesday, May 5, 2026"
        searchQuery=""
        onSearchChange={onSearchChange}
        resultCount={6}
        totalCount={12}
        viewMode="cards"
        onViewModeChange={onViewModeChange}
        onRefresh={() => {}}
        onCreateGroup={onCreateGroup}
        onCloseAll={onCloseAll}
        onOpenSettings={onOpenSettings}
      />,
    );

    expect(screen.getByText('Tuesday, May 5, 2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Open Tabs by Product' })).toBeInTheDocument();
    expect(screen.getByText('2 Groups')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search tabs' }), {
      target: { value: 'github' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'New Group' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close All' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(onSearchChange).toHaveBeenCalledWith('github');
    expect(onCreateGroup).toHaveBeenCalledTimes(1);
    expect(onCloseAll).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('keeps settings available without showing group-only actions in the empty state', () => {
    const onOpenSettings = vi.fn();

    render(
      <DashboardHeader
        title="Open Tabs by Product"
        hasGroups={false}
        groupCount={0}
        dateLabel="Tuesday, May 5, 2026"
        searchQuery=""
        onSearchChange={() => {}}
        resultCount={0}
        totalCount={0}
        viewMode="cards"
        onViewModeChange={() => {}}
        onRefresh={() => {}}
        onCreateGroup={() => {}}
        onCloseAll={() => {}}
        onOpenSettings={onOpenSettings}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Open Tabs by Product' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Search tabs' })).not.toBeInTheDocument();
    expect(screen.queryByText('0 Groups')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Organize' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New Group' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close All' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
