import React, { useState, useCallback, useMemo } from 'react';
import { usePopupData } from './usePopupData';
import type { PopupSection } from './usePopupData';
import { useTheme } from '../dashboard/hooks/useTheme';
import { ActionButton } from '../dashboard/components/ui/ActionButton';
import { createPopupTranslator } from './popup-i18n';
import { openOrFocusDashboard } from '../utils/open-dashboard';

// idle → confirming (user must confirm) → running → done | partial | error
type OrganizeState = 'idle' | 'confirming' | 'running' | 'done' | 'partial' | 'error';

export function Popup(): React.ReactElement {
  const data = usePopupData();
  useTheme(data.theme);
  const t = useMemo(() => createPopupTranslator(data.locale), [data.locale]);
  const [organizeState, setOrganizeState] = useState<OrganizeState>('idle');

  const runOrganizeFlow = useCallback(async () => {
    setOrganizeState('running');
    try {
      // Load the organize pipeline lazily to keep the popup-open path light. It
      // re-reads the freshest state, protects recovery, and reports honestly.
      const { runOrganize } = await import('./run-organize');
      const outcome = await runOrganize();
      setOrganizeState(outcome.ok ? 'done' : 'partial');
    } catch (err) {
      console.error('[Tab Organizer] Organize failed', err);
      setOrganizeState('error');
    }
  }, []);

  const handleOrganizeClick = useCallback(() => {
    // First click asks for confirmation; the actual work runs only on confirm.
    if (organizeState === 'running') return;
    setOrganizeState('confirming');
  }, [organizeState]);

  const handleOpenDashboard = useCallback(() => {
    void openOrFocusDashboard(chrome.runtime.getURL).finally(() => window.close());
  }, []);

  if (data.isLoading) {
    return (
      <div className="bg-bg-card text-text-primary" style={{ width: 300, fontFamily: 'var(--font-family-to-ui)' }}>
        <PopupHeader />
        <p className="m-0 px-4 pb-5 pt-1 text-center text-xs text-text-muted">{t('popupLoading')}</p>
      </div>
    );
  }

  const isDone = organizeState === 'done';
  const isPartial = organizeState === 'partial';
  const isError = organizeState === 'error';
  const isRunning = organizeState === 'running';
  const isConfirming = organizeState === 'confirming';

  // Counts always reflect LIVE data — usePopupData re-reads on tab/storage changes,
  // so after organizing they settle to the real remaining values (never faked to 0).
  const stats = [
    { value: data.totalTabs, label: t('metricTabs'), tone: 'text-text-primary' },
    { value: data.totalGroups, label: t('metricGroups'), tone: 'text-text-primary' },
    {
      value: data.unassignedCount,
      label: t('popupUnassigned'),
      tone: data.unassignedCount > 0 ? 'text-accent-amber' : 'text-text-primary',
    },
    {
      value: data.duplicateCount,
      label: t('metricDuplicates'),
      tone: data.duplicateCount > 0 ? 'text-accent-red' : 'text-text-primary',
    },
  ];

  const organizeLabel = isError
    ? t('popupRetry')
    : isRunning
      ? t('popupOrganizing')
      : isDone
        ? t('popupOrganized')
        : t('popupOrganize');

  const hasList = data.activeSections.length > 0 || data.unassignedGroups.length > 0;

  return (
    <div className="bg-bg-card text-text-primary" style={{ width: 300, fontFamily: 'var(--font-family-to-ui)' }}>
      <PopupHeader windowCountLabel={t('popupWindowCount', { count: data.windowCount })} />

      {/* Stats */}
      <div className="flex px-4 pb-3">
        {stats.map((s) => (
          <div key={s.label} className="flex-1 text-center">
            <div className={`text-base leading-none ${s.tone}`} style={{ fontWeight: 600 }}>{s.value}</div>
            <div className="mt-1 text-3xs uppercase tracking-wider text-text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Section list — names and counts only, no per-group detail */}
      {hasList && (
        <div className="flex flex-col border-t border-border-color/50 px-2.5 py-2">
          {data.activeSections.map((section) => (
            <SectionRow key={section.id} section={section} />
          ))}
          {data.unassignedGroups.length > 0 && (
            <Row
              label={t('popupUnassigned')}
              count={data.unassignedGroups.length}
              muted
              accentCount
            />
          )}
        </div>
      )}

      {/* Status banners */}
      {isDone && <Banner tone="sage" text={t('popupOrganizeDone')} />}
      {isPartial && <Banner tone="amber" text={t('popupOrganizePartial')} />}
      {isError && <Banner tone="red" text={t('popupOrganizeError')} />}
      {isConfirming && (
        <Banner
          tone="amber"
          text={
            <div className="flex flex-col gap-0.5">
              <span style={{ fontWeight: 600 }}>{t('popupConfirmLead')}</span>
              <span>· {t('popupConfirmSort')}</span>
              {data.assignableCount > 0 && (
                <span>· {t('popupConfirmAssign', { count: data.assignableCount })}</span>
              )}
              {data.duplicateCount > 0 && (
                <span>· {t('popupConfirmDedupe', { count: data.duplicateCount })}</span>
              )}
            </div>
          }
        />
      )}
      {data.duplicateCount > 0 && !isConfirming && !isDone && !isPartial && !isError && (
        <Banner tone="amber" text={t('popupDuplicateWarning', { count: data.duplicateCount })} />
      )}

      {/* Footer */}
      <div className="flex flex-col gap-1.5 border-t border-border-color/50 px-3 py-3">
        {isConfirming ? (
          <div className="flex gap-1.5">
            <ActionButton variant="quiet" className="flex-1" onClick={() => setOrganizeState('idle')}>
              {t('popupCancel')}
            </ActionButton>
            {/* Move focus into the gate when it opens (it mounts fresh on each
                idle→confirming transition), so keyboard/screen-reader users land
                on Confirm instead of having focus drop to <body>. */}
            <ActionButton autoFocus variant="primary" className="flex-1" onClick={() => void runOrganizeFlow()}>
              {t('popupConfirm')}
            </ActionButton>
          </div>
        ) : (
          <ActionButton
            variant={isError ? 'danger' : 'primary'}
            className="w-full"
            disabled={isRunning}
            onClick={handleOrganizeClick}
          >
            {organizeLabel}
          </ActionButton>
        )}
        <ActionButton variant="quiet" className="w-full" onClick={handleOpenDashboard}>
          {t('popupOpenDashboard')}
        </ActionButton>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function PopupHeader({ windowCountLabel }: { windowCountLabel?: string }): React.ReactElement {
  return (
    <header className="flex items-center justify-between px-4 pt-3.5 pb-3">
      <div className="flex items-center gap-2">
        <FolderIcon />
        <span
          className="text-sm tracking-tight text-text-primary"
          style={{ fontFamily: 'var(--font-family-to-display)', fontWeight: 600 }}
        >
          Tab Organizer
        </span>
      </div>
      {windowCountLabel && <span className="text-2xs text-text-muted">{windowCountLabel}</span>}
    </header>
  );
}

function FolderIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4 shrink-0 text-text-secondary"
      aria-hidden="true"
    >
      <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
    </svg>
  );
}

const BANNER_RGB = {
  sage: 'var(--accent-sage-rgb)',
  red: 'var(--accent-red-rgb)',
  amber: 'var(--accent-amber-rgb)',
} as const;

const BANNER_COLOR = {
  sage: 'var(--accent-sage)',
  red: 'var(--accent-red)',
  amber: 'var(--accent-amber)',
} as const;

function Banner({ tone, text }: { tone: keyof typeof BANNER_RGB; text: React.ReactNode }): React.ReactElement {
  // Error is urgent (role="alert"); success/warning are polite status updates. Both
  // are live regions so screen readers announce organize results, which appear
  // dynamically after the popup has already rendered.
  const isAlert = tone === 'red';
  return (
    <div
      role={isAlert ? 'alert' : 'status'}
      aria-live={isAlert ? 'assertive' : 'polite'}
      className="mx-3 mb-1 rounded-chip px-3 py-1.5 text-2xs font-medium"
      style={{
        color: BANNER_COLOR[tone],
        background: `rgba(${BANNER_RGB[tone]}, 0.1)`,
        border: `1px solid rgba(${BANNER_RGB[tone]}, 0.22)`,
      }}
    >
      {text}
    </div>
  );
}

function Row({
  label,
  count,
  emoji,
  muted = false,
  accentCount = false,
}: {
  label: string;
  count: number;
  emoji?: string;
  muted?: boolean;
  accentCount?: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2 rounded-chip px-1.5 py-1.5 transition-colors duration-[var(--motion-fast)] hover:bg-bg-surface">
      {emoji && <span className="shrink-0 text-xs">{emoji}</span>}
      <span className={`min-w-0 flex-1 truncate text-xs ${muted ? 'text-text-secondary' : 'text-text-primary'}`}>
        {label}
      </span>
      <span className={`shrink-0 text-2xs ${accentCount ? 'text-accent-primary' : 'text-text-muted'}`}>
        {count}
      </span>
    </div>
  );
}

function SectionRow({ section }: { section: PopupSection }): React.ReactElement {
  return <Row label={section.name} count={section.tabCount} emoji={section.emoji} />;
}
