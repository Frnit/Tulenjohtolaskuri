import {test, expect} from '@playwright/test';

async function activateWorker(page) {
  await page.goto('/index.html');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect(page.locator('#pwaStatusText')).toContainText('OFFLINE: VALMIS');
}

test('@pwa @target ACC-PWA-INSTALL-001 installs the complete declared offline Core', async ({page}) => {
  await activateWorker(page);

  const state = await page.evaluate(async () => {
    const release = window.TJL_RELEASE;
    const registrations = await navigator.serviceWorker.getRegistrations();
    const cacheNames = await caches.keys();
    const cache = await caches.open(release.cacheName);
    const requests = await cache.keys();
    return {
      release,
      registrations: registrations.map(registration => registration.scope),
      cacheNames,
      paths: requests.map(request => new URL(request.url).pathname).sort()
    };
  });

  const expectedPaths = state.release.assets
    .map(asset => new URL(asset, 'http://127.0.0.1:4173/index.html').pathname)
    .sort();
  expect(state.registrations).toHaveLength(1);
  expect(state.cacheNames).toContain(state.release.cacheName);
  expect(state.paths).toEqual(expectedPaths);
  expect(state.paths).toContain('/ar.html');
  expect(state.paths).toContain('/icon.png');
  expect(state.paths).toContain('/docs/pwa-offline.md');
});

test('@pwa @target ACC-PWA-OFFLINE-001 serves main and AR workflows offline', async ({page, context}) => {
  await activateWorker(page);

  await context.setOffline(true);
  try {
    const mainResponse = await page.reload({waitUntil: 'domcontentloaded'});
    expect(mainResponse?.status()).toBe(200);
    await expect(page.locator('h2')).toHaveText('TJ-Laskuri Pro');
    await expect(page.locator('#pwaStatusText')).toContainText('OFFLINE: VALMIS');

    const arResponse = await page.goto('/ar.html', {waitUntil: 'domcontentloaded'});
    expect(arResponse?.status()).toBe(200);
    await expect(page.locator('#targetSelect option')).toHaveCount(4);
    await expect(page.locator('#pwaStatusText')).toContainText('OFFLINE: VALMIS');
  } finally {
    await context.setOffline(false);
  }
});

test('@pwa @target ACC-PWA-CACHE-OWNERSHIP-001 ignores foreign cache entries and preserves foreign caches', async ({page, context}) => {
  await page.goto('/manifest.json');
  await page.evaluate(async () => {
    const foreign = await caches.open('foreign-evidence-cache');
    await foreign.put('/ownership-probe.txt', new Response('foreign-cache-response'));
    await caches.open('tjl-core-obsolete-build');
  });

  await activateWorker(page);
  await expect.poll(() => page.evaluate(async () => {
    const names = (await caches.keys()).sort();
    const expected = [window.TJL_RELEASE.cacheName, 'foreign-evidence-cache'].sort();
    return JSON.stringify(names) === JSON.stringify(expected);
  })).toBe(true);

  await context.setOffline(true);
  try {
    const outcome = await page.evaluate(async () => {
      try {
        return {body: await (await fetch('/ownership-probe.txt')).text()};
      } catch (error) {
        return {error: error.name};
      }
    });
    expect(outcome).toEqual({error: 'TypeError'});
  } finally {
    await context.setOffline(false);
  }
});
