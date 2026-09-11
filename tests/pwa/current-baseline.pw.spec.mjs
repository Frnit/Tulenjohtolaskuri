import { test, expect } from '@playwright/test';

async function activateWorker(page) {
  await page.goto('/index.html');
  await page.evaluate(() => navigator.serviceWorker.ready);
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) {
    await page.reload();
  }
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
}

test('@pwa @characterization CHAR-PWA-001 registers the worker and precaches the current declared assets', async ({ page }) => {
  await activateWorker(page);

  const state = await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const cacheNames = await caches.keys();
    const cache = await caches.open('tj-laskuri-v1');
    const requests = await cache.keys();
    return {
      registrations: registrations.map((registration) => registration.scope),
      cacheNames,
      paths: requests.map((request) => new URL(request.url).pathname).sort()
    };
  });

  expect(state.registrations).toHaveLength(1);
  expect(state.cacheNames).toContain('tj-laskuri-v1');
  expect(state.paths).toEqual([
    '/',
    '/index.html',
    '/manifest.json',
    '/src/adapters/storage.js',
    '/src/app/state.js',
    '/src/persistence/repository.js'
  ]);
  expect(state.paths).not.toContain('/ar.html');
  expect(state.paths).not.toContain('/icon.png');
});

test('@pwa @characterization CHAR-PWA-001 serves the current index precache during a controlled offline reload', async ({ page, context }) => {
  await activateWorker(page);

  await context.setOffline(true);
  try {
    const response = await page.reload({ waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('h2')).toHaveText('TJ-Laskuri Pro');
  } finally {
    await context.setOffline(false);
  }
});

test('@pwa @characterization CHAR-PWA-OWNERSHIP-001 current fetch handling can return an entry owned by another cache', async ({ page, context }) => {
  await activateWorker(page);
  await page.evaluate(async () => {
    const cache = await caches.open('foreign-evidence-cache');
    await cache.put('/ownership-probe.txt', new Response('foreign-cache-response'));
  });

  await context.setOffline(true);
  try {
    const body = await page.evaluate(async () => (await fetch('/ownership-probe.txt')).text());
    expect(body).toBe('foreign-cache-response');
  } finally {
    await context.setOffline(false);
    await page.evaluate(() => caches.delete('foreign-evidence-cache'));
  }
});
