export const DASHBOARD_RELATIVE_PATH = 'src/newtab/index.html';
export const DASHBOARD_SPACE_SWITCHER_FOCUS_HASH = '#focus-space-switcher';

export function getDashboardUrl(
  getUrl: (path: string) => string,
): string {
  return getUrl(DASHBOARD_RELATIVE_PATH);
}

export function getDashboardFocusUrl(
  getUrl: (path: string) => string,
): string {
  return `${getDashboardUrl(getUrl)}${DASHBOARD_SPACE_SWITCHER_FOCUS_HASH}`;
}

export function isDashboardUrl(url: string | undefined, dashboardUrl: string): boolean {
  if (!url) return false;

  try {
    const candidate = new URL(url);
    const dashboard = new URL(dashboardUrl);
    return candidate.origin === dashboard.origin && candidate.pathname === dashboard.pathname;
  } catch {
    return url.split(/[?#]/, 1)[0] === dashboardUrl.split(/[?#]/, 1)[0];
  }
}
