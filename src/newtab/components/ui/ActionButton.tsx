import React from 'react';

type ActionButtonVariant = 'default' | 'primary' | 'danger' | 'quiet';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  icon?: React.ReactNode;
}

const variantClasses: Record<ActionButtonVariant, string> = {
  default: 'bg-card-light text-text-primary-light hover:bg-surface-light dark:bg-card-dark dark:text-text-primary-dark dark:hover:bg-surface-dark',
  primary: 'bg-accent-blue text-text-primary-light hover:bg-accent-blue/80 dark:text-text-primary-light',
  danger: 'bg-card-light text-text-primary-light hover:bg-accent-red hover:text-white dark:bg-card-dark dark:text-text-primary-dark',
  quiet: 'bg-transparent text-text-secondary hover:bg-surface-light hover:text-text-primary-light dark:hover:bg-surface-dark dark:hover:text-text-primary-dark',
};

export function ActionButton({
  variant = 'default',
  icon,
  className = '',
  children,
  type = 'button',
  ...props
}: ActionButtonProps): React.ReactElement {
  return (
    <button
      type={type}
      className={[
        'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-chip border-2 border-border-light px-3 py-2',
        'font-body text-xs font-medium uppercase transition-colors duration-150',
        'focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark',
        variantClasses[variant],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {icon ? <span className="shrink-0" aria-hidden="true">{icon}</span> : null}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}
