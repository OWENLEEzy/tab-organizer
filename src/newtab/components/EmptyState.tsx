import React from 'react';

export function EmptyState(): React.ReactElement {
  return (
    <div className="flex animate-[fadeUp_0.5s_ease_both] flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="border-accent-sage/30 bg-accent-sage/10 flex h-14 w-14 animate-[checkPop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.1s_both] items-center justify-center rounded-full border-[1.5px] shadow-[0_0_0_8px_rgba(77,171,154,0.05),0_0_0_16px_rgba(77,171,154,0.03)]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="text-accent-sage h-[26px] w-[26px]"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>
      </div>
      <p className="font-heading text-text-primary-light dark:text-text-primary-dark text-xl font-normal tracking-tight italic">
        Inbox zero, but for tabs.
      </p>
      <p className="text-text-secondary text-[13px] font-normal tracking-wide">
        You&apos;re free.
      </p>
    </div>
  );
}
