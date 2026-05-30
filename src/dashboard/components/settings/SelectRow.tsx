import React from 'react';

interface SelectRowProps<T extends string | number> {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (val: T) => void;
}

export function SelectRow<T extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
}: SelectRowProps<T>): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="font-body text-text-primary-light dark:text-text-primary-dark text-sm">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          const num = Number(val);
          onChange((isNaN(num) ? val : num) as T);
        }}
        className="settings-select focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
