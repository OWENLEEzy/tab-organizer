import React, { useEffect, useRef, useState } from 'react';
import type { PromptDialogProps } from '../../types';

// ─── Component ────────────────────────────────────────────────────────

export function PromptDialog({
  open,
  title,
  label,
  initialValue,
  placeholder,
  confirmLabel,
  onConfirm,
  onCancel,
}: PromptDialogProps): React.ReactElement | null {
  const [value, setValue] = useState(initialValue);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync value when initialValue changes or dialog opens
  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [open, initialValue]);

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

  // Trap focus + auto-focus input
  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Auto focus input
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);

    function handleTabKey(e: KeyboardEvent): void {
      if (e.key !== 'Tab') return;
      if (!dialog) return;

      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
  };

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
        aria-labelledby="prompt-dialog-title"
        className="border-2 border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark relative w-full max-w-sm animate-[fadeUp_0.3s_ease_both] p-6 shadow-2xl"
      >
        <h3
          id="prompt-dialog-title"
          className="font-heading text-text-primary-light dark:text-text-primary-dark text-lg font-normal"
        >
          {title}
        </h3>
        
        <form onSubmit={handleSubmit} className="mt-4">
          <label className="text-text-secondary block text-xs font-bold uppercase tracking-widest mb-2">
            {label}
          </label>
          <input
            ref={inputRef}
            type="text"
            className="w-full rounded-sm border-2 border-border-light bg-surface-light px-3 py-2 text-sm text-text-primary-light outline-none focus:border-accent-blue dark:border-border-dark dark:bg-surface-dark dark:text-text-primary-dark dark:focus:border-accent-blue transition-colors"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
          
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              className="rounded-chip font-body text-text-secondary hover:bg-surface-light focus-visible:ring-accent-blue/40 dark:hover:bg-surface-dark min-h-11 cursor-pointer px-4 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-chip bg-accent-blue font-body focus-visible:ring-accent-blue/50 min-h-11 cursor-pointer px-6 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              disabled={!value.trim()}
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
