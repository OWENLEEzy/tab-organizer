import React, { useEffect, useRef } from 'react';
import type { ConfirmDialogProps } from '../../types';

// ─── Component ────────────────────────────────────────────────────────

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  // Trap focus inside dialog
  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    function handleTabKey(e: KeyboardEvent): void {
      if (e.key !== 'Tab') return;
      if (!dialog) return;

      const focusables = dialog.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    dialog.addEventListener('keydown', handleTabKey);
    return () => {
      dialog.removeEventListener('keydown', handleTabKey);
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Dismiss backdrop"
        className="absolute inset-0 bg-black/30"
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="border-2 border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark relative w-full max-w-sm animate-[fadeUp_0.3s_ease_both] p-6"
      >
        <h3
          id="confirm-dialog-title"
          className="font-heading text-text-primary-light dark:text-text-primary-dark text-lg font-semibold"
        >
          {title}
        </h3>
        <p
          id="confirm-dialog-description"
          className="text-text-secondary mt-2 text-sm leading-relaxed"
        >
          {message}
        </p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-chip font-body text-text-secondary hover:bg-surface-light focus-visible:ring-accent-blue/40 dark:hover:bg-surface-dark min-h-11 cursor-pointer px-4 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-chip bg-accent-red font-body focus-visible:ring-accent-red/50 min-h-11 cursor-pointer px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-85 focus-visible:ring-2 focus-visible:outline-none"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
