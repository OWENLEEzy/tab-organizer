/// <reference types="node" />

import fs from 'node:fs';
import path from 'node:path';
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

  it('keeps DND out of the default dashboard entry modules', () => {
    const defaultEntryFiles = [
      'src/newtab/App.tsx',
      'src/newtab/components/DomainCard.tsx',
      'src/newtab/components/SectionBoard.tsx',
    ];

    for (const file of defaultEntryFiles) {
      const content = fs.readFileSync(path.join(repoRoot, file), 'utf8');
      expect(content, `${file} must not import @dnd-kit`).not.toContain('@dnd-kit');
    }

    const dndOrganizer = fs.readFileSync(path.join(repoRoot, 'src/newtab/components/DndOrganizer.tsx'), 'utf8');
    expect(dndOrganizer).toContain('@dnd-kit');
  });

  it('checks the dashboard entry bundle separately from total JavaScript', () => {
    const script = fs.readFileSync(path.join(repoRoot, 'scripts/check-bundle-budget.mjs'), 'utf8');

    expect(script).toContain('entryParsed');
    expect(script).toContain('totalParsed');
    expect(script).toContain('entryGzip');
    expect(script).toContain('totalGzip');
    expect(script).toContain('285 * 1024');
    expect(script).toContain('350 * 1024');
  });

  it('lazy-loads panels that are not needed for the initial dashboard view', () => {
    const appSource = fs.readFileSync(path.join(repoRoot, 'src/newtab/App.tsx'), 'utf8');

    expect(appSource).not.toContain("import { SettingsPanel }");
    expect(appSource).not.toContain("import { RecoveryPanel }");
    expect(appSource).toContain('React.lazy');
    expect(appSource).toContain("import('./components/DndOrganizer')");
    expect(appSource).toContain("import('./components/SettingsPanel')");
  });
});
