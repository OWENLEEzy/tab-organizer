/// <reference types="node" />

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';

const repoRoot = process.cwd();

describe('tooling gates', () => {
  it('keeps generated coverage output outside ESLint', () => {
    const eslintConfig = fs.readFileSync(path.join(repoRoot, 'eslint.config.js'), 'utf8');

    expect(eslintConfig).toContain("globalIgnores(['dist', 'extension', 'coverage'");
  });

  it('treats lint warnings as release blockers', () => {
    expect(packageJson.scripts.lint).toBe('eslint . --max-warnings=0');
  });

  it('keeps the full release gate wired through npm run check', () => {
    const check = packageJson.scripts.check;

    expect(check).toContain('npm run lint');
    expect(check).toContain('npm run lint:css');
    expect(check).toContain('npm run test:coverage');
    expect(check).toContain('npm run build');
    expect(check).toContain('npm run check:dist-manifest');
    expect(check).toContain('npm run check:bundle');
    expect(check).toContain('npm run check:startup');
    expect(check).toContain('npm run test:e2e');
  });

  it('pins Node 22 and keeps release versions aligned', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'manifest.json'), 'utf8')) as { version: string };
    const lockfile = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package-lock.json'), 'utf8')) as {
      version: string;
      packages: { '': { version: string } };
    };
    const nodeVersion = fs.readFileSync(path.join(repoRoot, '.node-version'), 'utf8').trim();

    expect(packageJson.engines.node).toBe('>=22');
    expect(nodeVersion).toBe('22');
    expect(packageJson.version).toBe(manifest.version);
    expect(lockfile.version).toBe(packageJson.version);
    expect(lockfile.packages[''].version).toBe(packageJson.version);
  });

  it('keeps the privacy policy aligned with local-only storage and current repo support', () => {
    const privacyPolicy = fs.readFileSync(path.join(repoRoot, 'public/privacy-policy.html'), 'utf8');

    expect(privacyPolicy).toContain('chrome.storage.local');
    expect(privacyPolicy).not.toContain('chrome.storage.sync');
    expect(privacyPolicy).toContain('OWENLEEzy/tab-organizer');
    expect(privacyPolicy).not.toContain('OWENLEEzy/tab-out');
  });

  it('enforces store storage imports through the architecture rule', () => {
    const eslintConfig = fs.readFileSync(path.join(repoRoot, 'eslint.config.js'), 'utf8');

    expect(eslintConfig).toContain("files: ['src/stores/**/*.ts']");
    expect(eslintConfig).toContain("group: ['**/utils/storage']");
    expect(eslintConfig).toContain("importNames: ['readStorage', 'updateStorage']");
  });

  it('lets e2e checks avoid unrelated local port conflicts', () => {
    const runner = fs.readFileSync(path.join(repoRoot, 'scripts/run-a11y-e2e.mjs'), 'utf8');
    const config = fs.readFileSync(path.join(repoRoot, 'playwright.config.ts'), 'utf8');

    expect(runner).toContain('findAvailablePort(4173)');
    expect(runner).toContain('PLAYWRIGHT_BASE_URL');
    expect(config).toContain('process.env.PLAYWRIGHT_BASE_URL');
  });
});
