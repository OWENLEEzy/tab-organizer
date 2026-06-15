import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PopupData } from '../popup/usePopupData';

const m = vi.hoisted(() => ({
  runOrganize: vi.fn(() => Promise.resolve({ ok: true, closedCount: 1, remainingDuplicates: 0, remainingUnassigned: 0 })),
  usePopupData: vi.fn(),
}));
const { runOrganize, usePopupData } = m;

vi.mock('../popup/run-organize', () => ({ runOrganize: m.runOrganize }));
vi.mock('../popup/usePopupData', () => ({ usePopupData: m.usePopupData }));
vi.mock('../dashboard/hooks/useTheme', () => ({ useTheme: vi.fn() }));

import { Popup } from '../popup/Popup';

const DATA: PopupData = {
  totalTabs: 5, totalGroups: 2, unassignedCount: 1, assignableCount: 1, duplicateCount: 3, windowCount: 2,
  activeSections: [], unassignedGroups: [], groups: [], sections: [],
  assignments: [], unsectionedProductKeys: [], groupOrder: {}, theme: 'clay',
  locale: 'en', isLoading: false,
};

describe('Popup organize confirmation gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePopupData.mockReturnValue(DATA);
  });

  afterEach(() => {
    cleanup();
  });

  it('does NOT organize on the first click — it asks for confirmation first', async () => {
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: 'Organize' }));

    expect(runOrganize).not.toHaveBeenCalled();
    // A confirm + cancel pair appears.
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('moves focus to Confirm when the gate opens (focus must not drop to body)', async () => {
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: 'Organize' }));

    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
  });

  it('confirm checklist spells out the real actions with live counts', async () => {
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: 'Organize' }));

    // DATA has assignableCount=1, duplicateCount=3 — the checklist must show what
    // organize will do, not just a duplicate count.
    expect(screen.getByText('Organize will:')).toBeInTheDocument();
    expect(screen.getByText(/Sort & group tabs by section/)).toBeInTheDocument();
    expect(screen.getByText(/Groups to assign: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Duplicates to close: 3/)).toBeInTheDocument();
  });

  it('omits the duplicate line entirely when there are no duplicates', async () => {
    usePopupData.mockReturnValue({ ...DATA, duplicateCount: 0 });
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: 'Organize' }));

    // No misleading "Close 0 duplicates" — the line just isn't shown.
    expect(screen.queryByText(/Duplicates to close/)).not.toBeInTheDocument();
    // The core sort/group action is still promised.
    expect(screen.getByText(/Sort & group tabs by section/)).toBeInTheDocument();
  });

  it('hides the assign line when nothing can actually be auto-assigned', async () => {
    // Unassigned groups exist, but none match a section autoRule, so organize
    // assigns nothing. The checklist must show the honest count (0 → hidden),
    // never the raw unassigned total.
    usePopupData.mockReturnValue({ ...DATA, unassignedCount: 3, assignableCount: 0 });
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: 'Organize' }));

    expect(screen.queryByText(/Groups to assign/)).not.toBeInTheDocument();
    // The core sort/group action is still promised.
    expect(screen.getByText(/Sort & group tabs by section/)).toBeInTheDocument();
  });

  it('runs organize only after the user confirms', async () => {
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: 'Organize' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(runOrganize).toHaveBeenCalledTimes(1));
  });

  it('cancelling returns to idle without organizing', async () => {
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: 'Organize' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(runOrganize).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Organize' })).toBeInTheDocument();
  });

  it('shows the partial banner (never a false success) when organize returns ok:false', async () => {
    runOrganize.mockResolvedValueOnce({
      ok: false,
      closedCount: 0,
      remainingDuplicates: 3,
      remainingUnassigned: 1,
    });
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: 'Organize' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(
      await screen.findByText('Partly organized — open the dashboard for details'),
    ).toBeInTheDocument();
    // It must NOT claim success.
    expect(screen.queryByText('Organized')).not.toBeInTheDocument();
  });

  it('shows the error banner and a Retry button when organize throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    runOrganize.mockRejectedValueOnce(new Error('boom'));
    render(<Popup />);
    await userEvent.click(screen.getByRole('button', { name: 'Organize' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('Organize failed, please retry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
