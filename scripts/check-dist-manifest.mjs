import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const sourceManifestPath = path.join(rootDir, 'manifest.json');
const distManifestPath = path.join(rootDir, 'dist', 'manifest.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeIconPath(iconPath) {
  return String(iconPath).replace(/^public\//, '');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const sourceManifest = readJson(sourceManifestPath);
const distManifest = readJson(distManifestPath);

assert(distManifest.manifest_version === sourceManifest.manifest_version, 'manifest_version drifted');
assert(distManifest.version === sourceManifest.version, 'version drifted');
assert(distManifest.name === sourceManifest.name, 'name drifted');
assert(distManifest.description === sourceManifest.description, 'description drifted');
assert(
  distManifest.content_security_policy?.extension_pages === sourceManifest.content_security_policy?.extension_pages,
  'extension_pages CSP drifted',
);
assert(distManifest.background?.type === sourceManifest.background?.type, 'background type drifted');
assert(typeof distManifest.background?.service_worker === 'string', 'background service worker missing');

for (const [size, sourcePath] of Object.entries(sourceManifest.icons ?? {})) {
  assert(
    distManifest.icons?.[size] === normalizeIconPath(sourcePath),
    `icon path drifted for ${size}`,
  );
}

for (const [size, sourcePath] of Object.entries(sourceManifest.action?.default_icon ?? {})) {
  assert(
    distManifest.action?.default_icon?.[size] === normalizeIconPath(sourcePath),
    `action icon path drifted for ${size}`,
  );
}

console.log('[dist-manifest] manifest output matches source contract');
