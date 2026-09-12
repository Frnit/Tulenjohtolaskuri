import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadRelease() {
  const sandbox = {self: {}};
  vm.createContext(sandbox);
  vm.runInContext(await readFile('src/pwa/release.js', 'utf8'), sandbox, {filename: 'src/pwa/release.js'});
  return JSON.parse(JSON.stringify(sandbox.self.TJL_RELEASE));
}

test('ACC-PWA-RELEASE-001 release metadata is internally consistent', async () => {
  const release = await loadRelease();
  assert.equal(release.releaseVersion, release.appVersion);
  assert.equal(release.cacheName, `tjl-core-${release.swBuildId}`);
  assert.equal(release.storageSchemaVersion, 1);
  assert.match(release.releaseVersion, /^\d+\.\d+\.\d+(?:-rc\.\d+)?$/);
  if (release.commitSha === null) {
    assert.equal(release.rollbackTarget, null, 'integration builds leave both promotion identifiers unset');
  } else {
    assert.match(release.commitSha, /^[0-9a-f]{40}$/, 'release identifies its accepted immutable source');
    assert.match(release.rollbackTarget, /^[0-9a-f]{40}$/, 'release identifies its immutable rollback source');
    assert.notEqual(release.commitSha, release.rollbackTarget);
  }
  assert.equal(new Set(release.assets).size, release.assets.length);
  for (const required of [
    './', './index.html', './ar.html', './manifest.json', './icon.png', './readme.txt',
    './docs/pwa-offline.md', './src/pwa/release.js', './src/pwa/client.js'
  ]) assert.ok(release.assets.includes(required), required);
});

test('ACC-PWA-CACHE-OWNERSHIP-001 worker uses only its release cache', async () => {
  const source = await readFile('sw.js', 'utf8');
  assert.match(source, /caches\.open\(CACHE_NAME\)/);
  assert.match(source, /cache\.match\(event\.request/);
  assert.doesNotMatch(source, /caches\.match\(/);
  assert.match(source, /name\.startsWith\(CACHE_PREFIX\) && name !== CACHE_NAME/);
  assert.match(source, /caches\.delete\(CACHE_NAME\)/);
});

test('ACC-PWA-UPDATE-001 worker activation requires an explicit client message', async () => {
  const source = await readFile('sw.js', 'utf8');
  const installHandler = source.slice(
    source.indexOf("self.addEventListener('install'"),
    source.indexOf("self.addEventListener('activate'")
  );
  assert.doesNotMatch(installHandler, /skipWaiting/);
  assert.match(source, /message\.type !== 'TJL_ACTIVATE_UPDATE'/);
  assert.match(source, /self\.skipWaiting\(\)/);
  assert.match(source, /TJL_UPDATE_ACTIVATING/);
});

test('ACC-PWA-MANIFEST-001 manifest has an explicit app identity and scope', async () => {
  const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
  const icon = await readFile('icon.png');
  assert.equal(manifest.id, './index.html');
  assert.equal(manifest.start_url, './index.html');
  assert.equal(manifest.scope, './');
  assert.deepEqual(manifest.icons, [{src: 'icon.png', sizes: '512x512', type: 'image/png'}]);
  assert.equal(icon.readUInt32BE(16), 512);
  assert.equal(icon.readUInt32BE(20), 512);
});

test('ACC-PWA-CLIENT-001 both workflows expose release and update status', async () => {
  for (const file of ['index.html', 'ar.html']) {
    const source = await readFile(file, 'utf8');
    assert.match(source, /id="pwaStatusText"/, file);
    assert.match(source, /id="pwaUpdateButton"/, file);
    assert.match(source, /src="src\/pwa\/release\.js"/, file);
    assert.match(source, /src="src\/pwa\/client\.js"/, file);
    assert.match(source, /TJL\.createPwaClient\(\)/, file);
  }
});
