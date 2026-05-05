import React from 'react';

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps): React.ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`font-body dark:text-text-primary-light pointer-events-none fixed bottom-8 left-1/2 z-50 flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white shadow-lg transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible
          ? 'translate-x-[-50%] translate-y-0 opacity-100'
          : 'translate-x-[-50%] translate-y-20 opacity-0'
      } bg-toast-bg-light dark:bg-toast-bg-dark`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="text-accent-sage h-4 w-4"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
