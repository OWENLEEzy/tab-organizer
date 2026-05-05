import React, { useEffect, useRef, useState } from 'react';

interface FooterProps {
  tabCount: number;
}

const POP_DURATION = 300;

export function Footer({ tabCount }: FooterProps): React.ReactElement {
  const [popping, setPopping] = useState(false);
  const prevCount = useRef(tabCount);

  /* eslint-disable react-hooks/set-state-in-effect */
  // One-shot animation: trigger pop when tab count decreases.
  // setState-in-effect is intentional here — this is a side-effect reaction
  // to a prop change, not a derived state computation.
  useEffect(() => {
    if (tabCount < prevCount.current) {
      setPopping(true);
      const timer = setTimeout(() => setPopping(false), POP_DURATION);
      prevCount.current = tabCount;
      return () => clearTimeout(timer);
    }
    prevCount.current = tabCount;
    return undefined;
  }, [tabCount]);

  const GITHUB_URL = 'https://github.com/OWENLEEzy/tab-out';

  return (
    <footer className="pt-8 pb-12" aria-label="Dashboard footer">
      <div className="text-text-secondary flex items-center justify-between text-xs font-semibold tracking-wider uppercase">
        <div className="flex items-center gap-2">
          <span
            className={`font-heading text-text-primary-light dark:text-text-primary-dark inline-block text-2xl font-light${popping ? ' animate-[countPop_0.3s_ease]' : ''}`}
          >
            {tabCount}
          </span>
          <span className="opacity-70">open tabs</span>
        </div>
        <a
          href={GITHUB_URL}
          target="_top"
          className="text-text-secondary hover:text-accent-blue transition-colors underline underline-offset-4"
        >
          Tab Out — Open Source
        </a>
      </div>
    </footer>
  );
}
