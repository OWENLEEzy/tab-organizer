import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PromptDialog } from '../newtab/components/PromptDialog';
import type { PromptDialogProps } from '../types';

afterEach(() => {
  cleanup();
});

function renderPrompt(props: Partial<PromptDialogProps> = {}) {
  const defaultProps: PromptDialogProps = {
    open: true,
    title: 'New Section',
    label: 'Section Name',
    initialValue: 'Work',
    confirmLabel: 'Create Section',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  return render(<PromptDialog {...defaultProps} {...props} />);
}

describe('PromptDialog', () => {
  it('uses a fresh initial value for each keyed dialog instance', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const { rerender } = renderPrompt({ onCancel });

    const input = screen.getByLabelText('Section Name');
    expect(input).toHaveValue('Work');

    await user.clear(input);
    await user.type(input, 'Edited draft');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(
      <PromptDialog
        key="rename-dialog"
        open
        title="Rename Section"
        label="Section Name"
        initialValue="Later"
        confirmLabel="Save Changes"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByLabelText('Section Name')).toHaveValue('Later');
  });
});
