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
    expect(eslintConfig).toContain("importNames: ['readStorage']");
  });

  it('lets e2e checks avoid unrelated local port conflicts', () => {
    const runner = fs.readFileSync(path.join(repoRoot, 'scripts/run-a11y-e2e.mjs'), 'utf8');
    const config = fs.readFileSync(path.join(repoRoot, 'playwright.config.ts'), 'utf8');

    expect(runner).toContain('findAvailablePort(4173)');
    expect(runner).toContain('PLAYWRIGHT_BASE_URL');
    expect(config).toContain('process.env.PLAYWRIGHT_BASE_URL');
  });

  it('runs the full check in pull request CI', () => {
    const ciWorkflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');

    expect(ciWorkflow).toContain('pull_request:');
    expect(ciWorkflow).toContain('node-version: 22');
    expect(ciWorkflow).toContain('npm ci');
    expect(ciWorkflow).toContain('npm run check');
  });
});

describe('architecture lint guardrails', () => {
  const eslintConfig = fs.readFileSync(path.join(repoRoot, 'eslint.config.js'), 'utf8');

  it('prevents presentational components from importing stores, controllers, storage, or chrome APIs', () => {
    expect(eslintConfig).toContain("files: ['src/dashboard/components/**/*.tsx']");
    expect(eslintConfig).toContain("group: ['**/stores/*']");
    expect(eslintConfig).toContain("group: ['**/dashboard/controllers/*', '**/controllers/*']");
    expect(eslintConfig).toContain("group: ['**/utils/storage']");
    expect(eslintConfig).toContain("MemberExpression[object.name='chrome']");
  });

  it('keeps pure dashboard hooks free of stores, storage, and chrome APIs', () => {
    expect(eslintConfig).toContain("files: ['src/dashboard/hooks/**/*.{ts,tsx}']");
    expect(eslintConfig).toContain("group: ['**/stores/*']");
    expect(eslintConfig).toContain("group: ['**/utils/storage']");
  });

  it('keeps src/lib pure and independent from utils and app layers', () => {
    expect(eslintConfig).toContain("files: ['src/lib/**/*.{ts,tsx}']");
    expect(eslintConfig).toContain("group: ['../utils/*', '**/utils/*']");
    expect(eslintConfig).toContain("group: ['../stores/*', '**/stores/*']");
    expect(eslintConfig).toContain("group: ['../dashboard/*', '**/dashboard/*']");
  });

  it('keeps src/utils as adapter layer without app imports', () => {
    expect(eslintConfig).toContain("files: ['src/utils/**/*.{ts,tsx}']");
    expect(eslintConfig).toContain("group: ['../stores/*', '**/stores/*']");
    expect(eslintConfig).toContain("group: ['../dashboard/*', '**/dashboard/*']");
  });

  it('prevents stores from using raw chrome.* APIs', () => {
    expect(eslintConfig).toContain("files: ['src/stores/**/*.{ts,tsx}']");
    expect(eslintConfig).toContain("Stores must use src/utils Chrome adapters instead of raw chrome.* APIs.");
  });

  it('ships chrome adapter modules', () => {
    expect(fs.existsSync(path.join(repoRoot, 'src/utils/chrome-tabs.ts'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'src/utils/chrome-runtime.ts'))).toBe(true);
  });
});

describe('source naming governance', () => {
  const sourceFiles = [
    ...fs.readdirSync(path.join(repoRoot, 'src'), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(entry.parentPath, entry.name))
      .filter((file) => /\.(ts|tsx|html|css)$/.test(file)),
    path.join(repoRoot, 'package.json'),
    path.join(repoRoot, 'vite.config.ts'),
    path.join(repoRoot, 'manifest.json'),
    path.join(repoRoot, 'AGENTS.md'),
    path.join(repoRoot, 'CLAUDE.md'),
  ];

  it('does not reintroduce newtab as the dashboard source surface name', () => {
    const offenders = sourceFiles.filter((file) => !file.includes('tooling-gates') && (file.includes('/src/newtab/') || fs.readFileSync(file, 'utf8').includes('src/newtab')));
    expect(offenders).toEqual([]);
  });

  it('does not use space terminology for section behavior', () => {
    const offenders = sourceFiles.filter((file) => !file.includes('tooling-gates') && fs.readFileSync(file, 'utf8').includes('open-space-switcher'));
    expect(offenders).toEqual([]);
  });

  it('does not use temporary URL or helper names', () => {
    const badNamePattern = /(url-new|new-url|url2|utils2|helpers2|helpers\.ts|misc\.ts|common\.ts)/i;
    const offenders = sourceFiles.filter((file) => !file.includes('AGENTS.md') && !file.includes('CLAUDE.md') && !file.includes('tooling-gates') && (badNamePattern.test(file) || badNamePattern.test(fs.readFileSync(file, 'utf8'))));
    expect(offenders).toEqual([]);
  });

  it('does not reintroduce DomainCard as a component name', () => {
    const offenders = sourceFiles.filter((file) => !file.includes('tooling-gates') && fs.readFileSync(file, 'utf8').includes('DomainCard'));
    expect(offenders).toEqual([]);
  });

  it('does not reintroduce tab-grouper as a module name', () => {
    const offenders = sourceFiles.filter((file) => !file.includes('tooling-gates') && (file.includes('tab-grouper') || fs.readFileSync(file, 'utf8').includes('tab-grouper')));
    expect(offenders).toEqual([]);
  });

  it('does not reintroduce history-snapshots as a file or module name', () => {
    const offenders = sourceFiles.filter((file) => !file.includes('tooling-gates') && (file.includes('history-snapshots') || fs.readFileSync(file, 'utf8').includes('history-snapshots')));
    expect(offenders).toEqual([]);
  });

  it('does not reintroduce unsortedOverrides as a property or variable name', () => {
    const legacyCleanupFiles = [
      'src/utils/storage.ts',
    ];
    const offenders = sourceFiles.filter((file) => {
      if (file.includes('tooling-gates')) return false;
      if (legacyCleanupFiles.some((legacy) => file.endsWith(legacy))) return false;
      return fs.readFileSync(file, 'utf8').includes('unsortedOverrides');
    });
    expect(offenders).toEqual([]);
  });

  it('does not use workspace terminology except for literal Google Workspace brand references', () => {
    const offenders = sourceFiles.filter((file) => {
      if (file.includes('tooling-gates')) return false;
      if (file.includes('AGENTS.md') || file.includes('CLAUDE.md')) return false;
      const content = fs.readFileSync(file, 'utf8');
      return /\bworkspace\b/i.test(content) && !/Google\s+Workspace/i.test(content);
    });
    expect(offenders).toEqual([]);
  });

  it('does not use legacy architecture terminology', () => {
    const forbiddenTerms = [
      'DndOrganizer',
      'components/organizer',
      'expandedDomains',
      'noSectionOverrides',
      'unsortedOverrides',
      'manualGroups',
      'groupAssignments',
      'historyCandidate',
      'recoveryHistory',
    ];

    // Files that legitimately use legacy terms for cleanup or destructive-reset testing.
    const legacyCleanupFiles = [
      'src/utils/storage.ts',
      'src/__tests__/storage.test.ts',
      'src/__tests__/storage-extra.test.ts',
      'src/__tests__/settings-import-export-controller.test.tsx',
    ];

    for (const term of forbiddenTerms) {
      const offenders = sourceFiles.filter((file) => {
        if (file.includes('tooling-gates')) return false;
        if (legacyCleanupFiles.some((legacy) => file.endsWith(legacy))) return false;
        return fs.readFileSync(file, 'utf8').includes(term);
      });
      expect(offenders, `Found legacy term "${term}" in: ${offenders.join(', ')}`).toEqual([]);
    }
  });
});

describe('source noise governance', () => {
  it('does not contain .DS_Store files under src/', () => {
    const offenders: string[] = [];
    const walkDir = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.name === '.DS_Store') {
          offenders.push(fullPath);
        }
      }
    };
    walkDir(path.join(repoRoot, 'src'));
    expect(offenders).toEqual([]);
  });

  it('does not contain .DS_Store files under docs/', () => {
    const docsDir = path.join(repoRoot, 'docs');
    if (!fs.existsSync(docsDir)) return;
    const offenders: string[] = [];
    const walkDir = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.name === '.DS_Store') {
          offenders.push(fullPath);
        }
      }
    };
    walkDir(docsDir);
    expect(offenders).toEqual([]);
  });

  it('does not contain stale architecture cleanup plan docs', () => {
    const stalePaths = [
      path.join(repoRoot, 'docs/superpowers/specs/src-architecture-cleanup-plan.md'),
      path.join(repoRoot, 'docs/src-architecture-cleanup-plan.md'),
    ];
    const offenders = stalePaths.filter((p) => fs.existsSync(p));
    expect(offenders).toEqual([]);
  });
});
