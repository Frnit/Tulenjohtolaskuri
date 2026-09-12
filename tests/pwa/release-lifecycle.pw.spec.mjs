import {test, expect} from '@playwright/test';
import {copyFile, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {startTestServer, stopTestServer} from '../support/test-server.mjs';

const workerSource = await readFile('sw.js', 'utf8');

function releaseScript(release) {
  return `(function (global) {
    const release = Object.freeze(${JSON.stringify(release)});
    global.TJL_RELEASE = release;
    const namespace = global.TJL = global.TJL || {};
    namespace.release = release;
  })(typeof self !== 'undefined' ? self : window);\n`;
}

function fixtureHtml(version) {
  return `<!doctype html><html><body>
    <strong id="fixtureVersion">${version}</strong>
    <span id="pwaStatusText">OFFLINE: TARKISTETAAN</span>
    <button id="pwaUpdateButton" type="button" hidden>OTA KÄYTTÖÖN</button>
    <script src="src/pwa/release.js"></script>
    <script src="src/pwa/client.js"></script>
    <script>
      window.pwaClient = TJL.createPwaClient();
      TJL.bindPwaStatus(window.pwaClient, {
        statusElement: document.getElementById('pwaStatusText'),
        updateButton: document.getElementById('pwaUpdateButton')
      });
      window.pwaClient.register();
    </script>
  </body></html>`;
}

async function writeFixture(root, {version, build, rollbackTarget, broken = false}) {
  const assets = ['./', './index.html', './shell.txt', './src/pwa/release.js', './src/pwa/client.js'];
  if (broken) assets.push('./missing-release-asset.txt');
  const release = {
    releaseVersion: version,
    commitSha: `${build}-fixture-sha`,
    appVersion: version,
    swBuildId: build,
    cacheName: `tjl-core-${build}`,
    assetManifestVersion: build,
    storageSchemaVersion: version === '2.0.0' ? 2 : 1,
    rollbackTarget,
    assets
  };
  await mkdir(path.join(root, 'src', 'pwa'), {recursive: true});
  await copyFile('src/pwa/client.js', path.join(root, 'src', 'pwa', 'client.js'));
  await writeFile(path.join(root, 'src', 'pwa', 'release.js'), releaseScript(release));
  await writeFile(path.join(root, 'sw.js'), `${workerSource}\n// ${build}\n`);
  await writeFile(path.join(root, 'index.html'), fixtureHtml(version));
  await writeFile(path.join(root, 'shell.txt'), `shell-${version}`);
  await rm(path.join(root, 'missing-release-asset.txt'), {force: true});
}

async function createFixture(port, initial) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tjl-pwa-release-'));
  await writeFixture(root, initial);
  const server = await startTestServer({port, root});
  return {root, server, url: `http://127.0.0.1:${port}/index.html`};
}

async function waitUntilControlled(page, url) {
  await page.goto(url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect(page.locator('#pwaStatusText')).toContainText('OFFLINE: VALMIS');
}

test('@pwa @target ACC-PWA-UPDATE-001 updates open tabs only after user approval and supports rollback builds', async ({browser}) => {
  const fixture = await createFixture(4174, {version: '1.0.0', build: 'v1', rollbackTarget: '0.9.0'});
  const context = await browser.newContext();
  try {
    const first = await context.newPage();
    const second = await context.newPage();
    await waitUntilControlled(first, fixture.url);
    await waitUntilControlled(second, fixture.url);
    await first.evaluate(async () => {
      localStorage.setItem('tjl.targets', JSON.stringify({schemaVersion: 2, data: [{n: 'säilytä'}]}));
      await caches.open('foreign-evidence-cache');
    });

    await writeFixture(fixture.root, {version: '2.0.0', build: 'v2', rollbackTarget: '1.0.0'});
    await first.evaluate(() => window.pwaClient.check());
    await expect(first.locator('#pwaUpdateButton')).toBeVisible();
    await expect(second.locator('#pwaUpdateButton')).toBeVisible();
    await expect(first.locator('#pwaStatusText')).toContainText('PÄIVITYS 2.0.0 VALMIS');
    await expect(second.locator('#pwaStatusText')).toContainText('PÄIVITYS 2.0.0 VALMIS');
    await expect(first.locator('#fixtureVersion')).toHaveText('1.0.0');
    await expect(second.locator('#fixtureVersion')).toHaveText('1.0.0');

    await first.locator('#pwaUpdateButton').click();
    await expect(first.locator('#fixtureVersion')).toHaveText('2.0.0');
    await expect(second.locator('#fixtureVersion')).toHaveText('2.0.0');
    await expect(first.locator('#pwaStatusText')).toContainText('OFFLINE: VALMIS');
    await expect(second.locator('#pwaStatusText')).toContainText('OFFLINE: VALMIS');

    await writeFixture(fixture.root, {version: '1.1.0', build: 'rollback-v3', rollbackTarget: '1.0.0'});
    await first.evaluate(() => window.pwaClient.check());
    await expect(first.locator('#pwaUpdateButton')).toBeVisible();
    await first.locator('#pwaUpdateButton').click();
    await expect(first.locator('#fixtureVersion')).toHaveText('1.1.0');
    await expect(second.locator('#fixtureVersion')).toHaveText('1.1.0');

    const finalState = await first.evaluate(async () => ({
      caches: (await caches.keys()).sort(),
      stored: localStorage.getItem('tjl.targets')
    }));
    expect(finalState.caches).toEqual(['foreign-evidence-cache', 'tjl-core-rollback-v3']);
    expect(JSON.parse(finalState.stored)).toEqual({schemaVersion: 2, data: [{n: 'säilytä'}]});
  } finally {
    await context.close();
    await stopTestServer(fixture.server);
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test('@pwa @target ACC-PWA-FAILED-UPDATE-001 keeps the active release when a new precache fails', async ({browser}) => {
  const fixture = await createFixture(4175, {version: '1.0.0', build: 'stable-v1', rollbackTarget: '0.9.0'});
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await waitUntilControlled(page, fixture.url);
    await writeFixture(fixture.root, {version: '2.0.0', build: 'broken-v2', rollbackTarget: '1.0.0', broken: true});
    await page.evaluate(() => window.pwaClient.check());

    await expect(page.locator('#pwaStatusText')).toContainText('PÄIVITYS EPÄONNISTUI');
    await expect(page.locator('#fixtureVersion')).toHaveText('1.0.0');
    await expect.poll(() => page.evaluate(async () => caches.keys())).toEqual(['tjl-core-stable-v1']);

    await context.setOffline(true);
    const response = await page.reload({waitUntil: 'domcontentloaded'});
    expect(response?.status()).toBe(200);
    await expect(page.locator('#fixtureVersion')).toHaveText('1.0.0');
  } finally {
    await context.setOffline(false);
    await context.close();
    await stopTestServer(fixture.server);
    await rm(fixture.root, {recursive: true, force: true});
  }
});
