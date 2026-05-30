import React from 'react';

interface ToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

export function ToggleRow({ id, label, checked, onChange }: ToggleRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <label
        htmlFor={id}
        className="font-body text-text-primary-light dark:text-text-primary-dark text-sm"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`settings-toggle ${checked ? 'is-checked' : ''} focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none`}
      >
        <span className="settings-toggle-thumb" aria-hidden="true" />
      </button>
    </div>
  );
}
