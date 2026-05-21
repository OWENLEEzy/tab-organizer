import React from 'react';

type ActionButtonVariant = 'default' | 'primary' | 'danger' | 'quiet';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  icon?: React.ReactNode;
}

const variantClasses: Record<ActionButtonVariant, string> = {
  default: 'bg-card-light text-text-primary-light border-border-light hover:bg-accent-blue/10 hover:text-accent-blue hover:border-accent-blue/30 dark:bg-card-dark dark:text-text-primary-dark dark:border-border-dark dark:hover:bg-accent-blue/10 dark:hover:text-accent-blue dark:hover:border-accent-blue/30',
  primary: 'bg-accent-blue text-white border-transparent hover:bg-accent-blue/90 dark:bg-accent-blue dark:text-white dark:hover:bg-accent-blue/90 dark:border-transparent',
  danger: 'bg-accent-red text-white border-transparent hover:opacity-85 dark:bg-accent-red dark:text-white dark:hover:opacity-85 dark:border-transparent',
  quiet: 'bg-transparent text-text-secondary border-transparent hover:bg-surface-light hover:text-text-primary-light dark:hover:bg-surface-dark dark:hover:text-text-primary-dark',
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
        'action-button inline-flex cursor-pointer items-center justify-center gap-2 rounded-chip border border-border-light',
        'font-body text-xs font-semibold tracking-wide transition-colors duration-150',
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
