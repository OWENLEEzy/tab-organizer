import React, { useState, useCallback, useMemo } from 'react';
import { usePopupData } from './usePopupData';
import type { PopupSection } from './usePopupData';
import { useTheme } from '../dashboard/hooks/useTheme';
import { ActionButton } from '../dashboard/components/ui/ActionButton';
import { createPopupTranslator } from './popup-i18n';
import { writeOrganizerState } from '../utils/storage';
import { closeTabIds } from '../utils/chrome-tabs';
import { getDashboardUrl } from '../background/dashboard';

type OrganizeState = 'idle' | 'running' | 'done' | 'error';

export function Popup(): React.ReactElement {
  const data = usePopupData();
  useTheme(data.theme);
  const t = useMemo(() => createPopupTranslator(data.locale), [data.locale]);
  const [organizeState, setOrganizeState] = useState<OrganizeState>('idle');

  const handleOrganize = useCallback(async () => {
    if (organizeState === 'running') return;
    setOrganizeState('running');
    try {
      // The organize/sort pipeline is only needed on click, so load it lazily to
      // keep the popup-open path light.
      const [{ computeOrganizePlan }, { sortAndGroupTabs }] = await Promise.all([
        import('../lib/organize-plan'),
        import('../utils/sort-and-group-tabs'),
      ]);

      const plan = computeOrganizePlan({
        groups: data.groups,
        sections: data.sections,
        assignments: data.assignments,
        unsectionedProductKeys: data.unsectionedProductKeys,
        groupOrder: data.groupOrder,
      });

      if (plan.assignmentUpdates.length > 0) {
        await writeOrganizerState({
          sectionAssignments: [...data.assignments, ...plan.assignmentUpdates],
        });
      }

      if (plan.tabIdsToClose.length > 0) {
        await closeTabIds(plan.tabIdsToClose);
      }

      // Sort tabs into section order across all windows, then create native groups.
      // Exclude just-closed duplicates so their ids are not used after removal.
      await sortAndGroupTabs(plan.orderedGroups, { closedTabIds: new Set(plan.tabIdsToClose) });

      setOrganizeState('done');
    } catch (err) {
      console.warn('[Tab Organizer] Organize failed', err);
      setOrganizeState('error');
    }
  }, [data, organizeState]);

  const handleOpenDashboard = useCallback(() => {
    const url = getDashboardUrl(chrome.runtime.getURL);
    void chrome.tabs.create({ url });
    window.close();
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
  const isError = organizeState === 'error';
  const isRunning = organizeState === 'running';

  const stats = [
    { value: data.totalTabs, label: t('metricTabs'), tone: 'text-text-primary' },
    { value: data.totalGroups, label: t('metricGroups'), tone: 'text-text-primary' },
    {
      value: isDone ? 0 : data.unassignedCount,
      label: t('popupUnassigned'),
      tone: isDone ? 'text-accent-sage' : data.unassignedCount > 0 ? 'text-accent-amber' : 'text-text-primary',
    },
    {
      value: isDone ? 0 : data.duplicateCount,
      label: t('metricDuplicates'),
      tone: isDone ? 'text-accent-sage' : data.duplicateCount > 0 ? 'text-accent-red' : 'text-text-primary',
    },
  ];

  const organizeLabel = isDone
    ? t('popupOrganized')
    : isError
      ? t('popupRetry')
      : isRunning
        ? t('popupOrganizing')
        : t('popupOrganize');

  const hasList = data.activeSections.length > 0 || (data.unassignedGroups.length > 0 && !isDone);

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
          {data.unassignedGroups.length > 0 && !isDone && (
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
      {isError && <Banner tone="red" text={t('popupOrganizeError')} />}
      {data.duplicateCount > 0 && !isDone && !isError && (
        <Banner tone="amber" text={t('popupDuplicateWarning', { count: data.duplicateCount })} />
      )}

      {/* Footer */}
      <div className="flex flex-col gap-1.5 border-t border-border-color/50 px-3 py-3">
        <ActionButton
          variant={isError ? 'danger' : 'primary'}
          className="w-full"
          disabled={isRunning}
          onClick={() => void handleOrganize()}
        >
          {organizeLabel}
        </ActionButton>
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

function Banner({ tone, text }: { tone: keyof typeof BANNER_RGB; text: string }): React.ReactElement {
  return (
    <div
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
