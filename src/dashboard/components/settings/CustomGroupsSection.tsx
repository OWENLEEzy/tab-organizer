import React, { useState } from 'react';
import type { CustomGroup } from '../../../types';
import { useI18n } from '../../hooks/useI18n';

interface CustomGroupsSectionProps {
  groups: CustomGroup[];
  onAdd: (group: CustomGroup) => void;
  onRemove: (groupKey: string) => void;
}

export function CustomGroupsSection({
  groups,
  onAdd,
  onRemove,
}: CustomGroupsSectionProps): React.ReactElement {
  const { t } = useI18n();
  const [hostname, setHostname] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const h = hostname.trim().toLowerCase();
    const l = label.trim();
    if (!h) { setError(t('settingsRuleRequiredHostname')); return; }
    if (!l) { setError(t('settingsRuleRequiredLabel')); return; }
    const key = h.replace(/[^a-z0-9]/g, '-');
    if (groups.some((g) => g.groupKey === key || g.hostname === h)) {
      setError(t('settingsRuleDuplicateHostname'));
      return;
    }
    onAdd({ hostname: h, groupKey: key, groupLabel: l });
    setHostname('');
    setLabel('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
        {t('settingsCustomRulesTitle')}
      </span>

      <div className="rounded-md border border-accent-blue/15 bg-accent-blue/[0.03] p-3 text-xs text-text-secondary leading-relaxed font-body mb-1 flex gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="text-accent-blue size-4 shrink-0 mt-0.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
        </svg>
        <div>
          <strong className="text-text-primary-light dark:text-text-primary-dark block mb-0.5">
            {t('settingsCustomRulesExplanationTitle')}
          </strong>
          <p>
            {t('settingsCustomRulesExplanationDesc')}
          </p>
        </div>
      </div>

      {/* Existing rules */}
      {groups.length > 0 && (
        <ul className="flex flex-col gap-1">
          {groups.map((g) => (
            <li
              key={g.groupKey}
              className="flex items-center justify-between rounded-chip bg-surface-light dark:bg-surface-dark px-3 py-1.5"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-body text-text-primary-light dark:text-text-primary-dark text-xs font-medium truncate">
                  {g.groupLabel}
                </span>
                <span className="font-body text-text-secondary text-xs truncate">
                  {g.hostname ?? g.hostnameEndsWith}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(g.groupKey)}
                aria-label={`Remove ${g.groupLabel} group`}
                className="ml-2 shrink-0 text-accent-red hover:bg-accent-red/10 focus-visible:ring-accent-red/40 rounded-chip flex size-7 items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add form */}
      <div className="flex flex-col gap-2">
        <label htmlFor="custom-group-hostname" className="sr-only">
          {t('settingsPlaceholderHostname')}
        </label>
        <input
          id="custom-group-hostname"
          type="text"
          placeholder={t('settingsPlaceholderHostname')}
          value={hostname}
          onChange={(e) => { setHostname(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          className="settings-input placeholder:text-text-secondary w-full focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
        />
        <label htmlFor="custom-group-label" className="sr-only">
          {t('settingsPlaceholderLabel')}
        </label>
        <input
          id="custom-group-label"
          type="text"
          placeholder={t('settingsPlaceholderLabel')}
          value={label}
          onChange={(e) => { setLabel(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          className="settings-input placeholder:text-text-secondary w-full focus-visible:ring-accent-primary/40 focus-visible:ring-2 focus-visible:outline-none"
        />
        {error && (
          <span className="text-accent-red text-xs font-body">{error}</span>
        )}
        <button
          type="button"
          onClick={handleAdd}
          className="font-body text-xs text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-primary/40 rounded-chip px-3 py-1.5 self-end transition-colors focus-visible:ring-2 focus-visible:outline-none cursor-pointer min-h-[var(--spacing-button-height)]"
        >
          {t('settingsBtnAddRule')}
        </button>
      </div>
    </div>
  );
}
