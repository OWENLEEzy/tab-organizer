import React, { useEffect, useEffectEvent, useState } from 'react';
import type { AppSettings } from '../../../types';
import { useI18n } from '../../hooks/useI18n';

interface KeyboardSectionProps {
  keyBindings: AppSettings['keyBindings'];
  onUpdateKeyBinding: (key: keyof AppSettings['keyBindings'], binding: string) => void;
  onResetKeyBindings: () => void;
}

export function KeyboardSection({ keyBindings, onUpdateKeyBinding, onResetKeyBindings }: KeyboardSectionProps): React.ReactElement {
  const { t } = useI18n();
  const [recordingKey, setRecordingKey] = useState<keyof AppSettings['keyBindings'] | null>(null);

  const SHORTCUT_LABELS: Record<string, string> = {
    switchSectionN: t('settingsShortcutLabelSwitchSectionN'),
    switchSectionAll: t('settingsShortcutLabelSwitchSectionAll'),
    cyclePrev: t('settingsShortcutLabelCycleSectionPrev'),
    cycleNext: t('settingsShortcutLabelCycleSectionNext'),
    focusSearch: t('settingsShortcutLabelFocusSearch'),
    clearFilter: t('settingsShortcutLabelClearSectionFilter'),
  };

  const onUpdateKeyBindingEffect = useEffectEvent(onUpdateKeyBinding);

  useEffect(() => {
    if (!recordingKey) return;

    function handleKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingKey(null);
        return;
      }

      const parts: string[] = [];
      if (e.metaKey) parts.push('Meta');
      if (e.ctrlKey) parts.push('Control');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');

      let mainKey = e.key;
      if (mainKey === ' ') mainKey = 'Space';
      if (mainKey.length === 1) mainKey = mainKey.toUpperCase();

      if (!['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
        parts.push(mainKey);
        const formatted = parts.join('+');
        if (recordingKey) {
          onUpdateKeyBindingEffect(recordingKey, formatted);
        }
        setRecordingKey(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingKey]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
          {t('settingsShortcutsTitle')}
        </span>
        <button
          type="button"
          onClick={onResetKeyBindings}
          className="rounded-chip font-body text-accent-blue hover:bg-accent-blue/10 focus-visible:ring-accent-primary/40 px-2 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none min-h-[var(--spacing-button-height)]"
        >
          {t('settingsShortcutsResetBtn')}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {Object.entries(SHORTCUT_LABELS).map(([key, label]) => {
          const binding = keyBindings[key as keyof typeof keyBindings] || 'None';
          const isRecording = recordingKey === key;

          return (
            <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded bg-surface-light dark:bg-surface-dark border border-border-color/50 min-h-[var(--spacing-button-height)]">
              <span className="font-body text-xs text-text-primary-light dark:text-text-primary-dark">{label}</span>
              <button
                type="button"
                data-recording-shortcut={isRecording ? 'true' : undefined}
                onClick={() => setRecordingKey(isRecording ? null : (key as keyof AppSettings['keyBindings']))}
                className={`font-body text-xs px-2.5 py-1 rounded border transition-all cursor-pointer min-h-[var(--spacing-button-height-sm)] min-w-[var(--width-button-min)] ${
                  isRecording
                    ? 'bg-[var(--accent-amber)]/10 dark:bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] dark:text-[var(--accent-amber)] border-[var(--accent-amber)] dark:border-[var(--accent-amber)] animate-pulse'
                    : 'bg-[var(--bg-card)] dark:bg-[var(--bg-card)] text-text-secondary border-border-color hover:border-text-muted dark:hover:border-text-muted-dark'
                }`}
              >
                {isRecording ? t('settingsShortcutRecording') : binding}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
