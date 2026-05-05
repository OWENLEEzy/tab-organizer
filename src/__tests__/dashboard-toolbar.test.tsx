import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardToolbar } from '../newtab/components/layout/DashboardToolbar';

describe('DashboardToolbar', () => {
  it('wires search and command actions without owning dashboard state', () => {
    const onSearchChange = vi.fn();
    const onViewModeChange = vi.fn();
    const onToggleOrganize = vi.fn();
    const onCreateSection = vi.fn();
    const onCloseAll = vi.fn();

    render(
      <DashboardToolbar
        searchQuery=""
        onSearchChange={onSearchChange}
        resultCount={6}
        totalCount={12}
        viewMode="cards"
        onViewModeChange={onViewModeChange}
        organizeActive={false}
        canOrganize
        onToggleOrganize={onToggleOrganize}
        onCreateSection={onCreateSection}
        onCloseAll={onCloseAll}
      />,
    );

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search tabs' }), {
      target: { value: 'github' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Organize' }));
    fireEvent.click(screen.getByRole('button', { name: 'New section' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close all' }));

    expect(onSearchChange).toHaveBeenCalledWith('github');
    expect(onToggleOrganize).toHaveBeenCalledTimes(1);
    expect(onCreateSection).toHaveBeenCalledTimes(1);
    expect(onCloseAll).toHaveBeenCalledTimes(1);
  });
});
