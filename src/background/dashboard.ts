export const DASHBOARD_RELATIVE_PATH = 'src/newtab/index.html';

export function getDashboardUrl(
  getUrl: (path: string) => string,
): string {
  return getUrl(DASHBOARD_RELATIVE_PATH);
}
