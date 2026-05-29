
import fs from 'node:fs';
import path from 'node:path';
/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';

const repoRoot = process.cwd();

describe('performance gates', () => {
  it('exposes bundle and startup timing checks in the release gate', () => {
    expect(packageJson.scripts['check:bundle']).toBe('node ./scripts/check-bundle-budget.mjs');
    expect(packageJson.scripts['check:startup']).toBe('node ./scripts/check-startup-budget.mjs');
    expect(packageJson.scripts.check).toContain('npm run check:bundle');
    expect(packageJson.scripts.check).toContain('npm run check:startup');
    expect(fs.existsSync(path.join(repoRoot, 'scripts/check-bundle-budget.mjs'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'scripts/check-startup-budget.mjs'))).toBe(true);
  });

  it('checks the dashboard entry bundle separately from total JavaScript', () => {
    const script = fs.readFileSync(path.join(repoRoot, 'scripts/check-bundle-budget.mjs'), 'utf8');

    expect(script).toContain('entryParsed');
    expect(script).toContain('totalParsed');
    expect(script).toContain('entryGzip');
    expect(script).toContain('totalGzip');
    expect(script).toContain('600 * 1024');
    expect(script).toContain('1024 * 1024');
  });

  it('lazy-loads panels that are not needed for the initial dashboard view', () => {
    const appSource = fs.readFileSync(path.join(repoRoot, 'src/dashboard/App.tsx'), 'utf8');

    expect(appSource).not.toContain("import { SettingsPanel }");
    expect(appSource).not.toContain("import { RecoveryPanel }");
    expect(appSource).toContain('React.lazy');
    expect(appSource).toContain("import('./components/settings/SettingsPanel')");
  });
});
