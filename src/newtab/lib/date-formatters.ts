const EN_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const ZH_DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const EN_SNAPSHOT_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const ZH_SNAPSHOT_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function getDateFormatter(locale: string): Intl.DateTimeFormat {
  return locale.startsWith('zh') ? ZH_DATE_FORMATTER : EN_DATE_FORMATTER;
}

export function getSnapshotDateFormatter(locale: string): Intl.DateTimeFormat {
  return locale.startsWith('zh') ? ZH_SNAPSHOT_FORMATTER : EN_SNAPSHOT_FORMATTER;
}
