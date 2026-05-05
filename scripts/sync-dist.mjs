import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const dashboardCandidates = [
  path.join(distDir, 'index.html'),
  path.join(distDir, 'src', 'newtab', 'index.html'),
];

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeIconPaths(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.replace(/^\//, '');
  return normalized.startsWith('public/') ? normalized.replace(/^public\//, '') : normalized;
}

function normalizeIcons(iconMap) {
  if (!iconMap || typeof iconMap !== 'object') {
    return iconMap;
  }

  const result = {};
  for (const [size, iconPath] of Object.entries(iconMap)) {
    result[size] = normalizeIconPaths(iconPath);
  }
  return result;
}

async function main() {
  if (!(await fileExists(path.join(distDir, 'manifest.json')))) {
    throw new Error('dist/manifest.json not found. Run npm run build first.');
  }

  const foundDashboardPath = await (async () => {
    for (const candidate of dashboardCandidates) {
      if (await fileExists(candidate)) {
        return candidate;
      }
    }
    return null;
  })();

  if (!foundDashboardPath) {
    throw new Error(
      'dist/index.html not found. Ensure src/newtab/index.html is included in Vite build inputs.',
    );
  }

  // Normalize manifest icon paths for direct loading from dist/.
  const manifestText = await fs.readFile(path.join(distDir, 'manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestText);

  if (manifest.icons) {
    manifest.icons = normalizeIcons(manifest.icons);
  }

  if (manifest.action?.default_icon) {
    manifest.action.default_icon = normalizeIcons(manifest.action.default_icon);
  }

  if (manifest.action?.default_icon && manifest.icons) {
    // Keep a consistent icon surface for the extension toolbar action.
    if (manifest.icons['128'] && !manifest.action.default_icon['128']) {
      manifest.action.default_icon['128'] = manifest.icons['128'];
    }
  }

  await fs.writeFile(
    path.join(distDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  console.log('Prepared dist/ for direct Chrome loading');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
