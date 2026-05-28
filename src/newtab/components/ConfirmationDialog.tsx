import React, { useEffect, useEffectEvent, useRef } from 'react';
import type { ConfirmDialogProps } from '../../types';
import { ActionButton } from './ui/ActionButton';
import { useI18n } from '../hooks/useI18n';

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
  const { t } = useI18n();

  const onCancelEffect = useEffectEvent(onCancel);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onCancelEffect();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

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
        aria-label="Dismiss dialog"
        className="absolute inset-0 bg-black/30"
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="border border-border-light bg-card-light relative w-full max-w-sm animate-[fadeUp_var(--motion-enter)_ease_both] p-6 rounded-card"
      >
        <h3
          id="confirm-dialog-title"
          className="font-heading text-text-primary text-lg font-semibold"
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
          <ActionButton
            variant="quiet"
            onClick={onCancel}
          >
            {t('dialogCancel')}
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={onConfirm}
          >
            {confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
