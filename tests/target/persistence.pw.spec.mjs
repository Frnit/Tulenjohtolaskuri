import { test, expect } from '@playwright/test';
import {
  collectPageErrors,
  installStorageScenario,
  pageErrorDetails,
  seedStorage,
  stubArSensors
} from '../support/browser-fixtures.mjs';

const envelope = (data, schemaVersion = 1) => JSON.stringify({
  schemaVersion,
  updatedAt: '2026-09-11T00:00:00.000Z',
  data
});

test('@target ACC-PERSISTENCE-LEGACY-001 migrates valid legacy records and retains the legacy sources', async ({ page }) => {
  const legacyTargets = [{ n: 'Legacy target', s: 1.25 }];
  const legacyProfiles = { LegacyProfile: { f: '45', r: '1920', u: 'deg' } };
  await seedStorage(page, {
    tj_targets: JSON.stringify(legacyTargets),
    tj_profs_v2: JSON.stringify(legacyProfiles),
    tj_ar_fov: '61.5'
  });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetSelect option')).toHaveCount(2);
  await expect(page.locator('#profileSelector option')).toHaveCount(2);
  await expect(page.locator('#profileSelector option').nth(1)).toHaveText('LegacyProfile');
  const state = await page.evaluate(() => ({
    targets: JSON.parse(localStorage.getItem('tjl.targets')),
    profiles: JSON.parse(localStorage.getItem('tjl.profiles')),
    settings: JSON.parse(localStorage.getItem('tjl.settings')),
    meta: JSON.parse(localStorage.getItem('tjl.meta')),
    legacyTargets: localStorage.getItem('tj_targets'),
    legacyProfiles: localStorage.getItem('tj_profs_v2'),
    legacyFov: localStorage.getItem('tj_ar_fov')
  }));
  expect(state.targets.data).toEqual(legacyTargets);
  expect(state.profiles.data).toEqual(legacyProfiles);
  expect(state.settings.data).toEqual({ arFov: 61.5 });
  expect(state.meta.data.migratedLegacyKeys.sort()).toEqual(['tj_ar_fov', 'tj_profs_v2', 'tj_targets']);
  expect(state.legacyTargets).toBe(JSON.stringify(legacyTargets));
  expect(state.legacyProfiles).toBe(JSON.stringify(legacyProfiles));
  expect(state.legacyFov).toBe('61.5');
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-PERSISTENCE-V1-001 prefers a valid v1 record over legacy data', async ({ page }) => {
  await seedStorage(page, {
    'tjl.targets': envelope([{ n: 'Versioned target', s: 2 }]),
    tj_targets: JSON.stringify([{ n: 'Legacy target', s: 1 }])
  });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetSelect option').nth(1)).toHaveText('Versioned target');
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-PERSISTENCE-CORRUPT-001 isolates a corrupt record and continues loading other records', async ({ page }) => {
  const corrupt = '{broken-json';
  await seedStorage(page, {
    'tjl.targets': corrupt,
    'tjl.profiles': envelope({ SafeProfile: { f: '35', r: '1280', u: 'deg' } })
  });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetSelect option')).toHaveCount(5);
  await expect(page.locator('#profileSelector option').nth(1)).toHaveText('SafeProfile');
  await expect(page.locator('#persistenceWarnings')).toContainText('tjl.targets');
  expect(await page.evaluate(() => localStorage.getItem('tjl.targets'))).toBe(corrupt);
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-PERSISTENCE-CORRUPT-001 isolates malformed legacy profiles from valid legacy targets', async ({ page }) => {
  const corrupt = '{not-a-profile-record';
  await seedStorage(page, {
    tj_targets: JSON.stringify([{ n: 'Usable target', s: 1.5 }]),
    tj_profs_v2: corrupt
  });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetSelect option').nth(1)).toHaveText('Usable target');
  await expect(page.locator('#profileSelector option')).toHaveCount(1);
  await expect(page.locator('#persistenceWarnings')).toContainText('tj_profs_v2');
  expect(await page.evaluate(() => ({
    legacy: localStorage.getItem('tj_profs_v2'),
    current: localStorage.getItem('tjl.profiles')
  }))).toEqual({ legacy: corrupt, current: null });
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-PERSISTENCE-READ-001 isolates a failed record read from the rest of startup', async ({ page }) => {
  await seedStorage(page, {
    'tjl.profiles': envelope({ AvailableProfile: { f: '40', r: '1920', u: 'deg' } })
  });
  await installStorageScenario(page, { readErrorKeys: ['tjl.targets'] });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetSelect option')).toHaveCount(5);
  await expect(page.locator('#profileSelector option').nth(1)).toHaveText('AvailableProfile');
  await expect(page.locator('#persistenceWarnings')).toContainText('tjl.targets');
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-PERSISTENCE-EMPTY-001 treats an empty target collection as a supported AR state', async ({ page }) => {
  await stubArSensors(page);
  await seedStorage(page, { tj_targets: '[]' });
  const errors = collectPageErrors(page);

  await page.goto('/ar.html');

  await expect(page.locator('#targetSelect option')).toHaveCount(1);
  await expect(page.locator('#targetSelect option')).toHaveText('Ei tallennettuja kohteita');
  await expect(page.locator('#bracketBox')).toHaveAttribute('data-tgt', 'EI KOHDETTA');
  await expect(page.locator('#distOutput')).toHaveText('0');
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-PERSISTENCE-QUOTA-001 keeps valid legacy data usable when migration cannot be written', async ({ page }) => {
  const legacyTargets = [{ n: 'Read-only legacy target', s: 3 }];
  await seedStorage(page, { tj_targets: JSON.stringify(legacyTargets) });
  await installStorageScenario(page, { quotaErrorKeys: ['tjl.targets'] });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetSelect option').nth(1)).toHaveText('Read-only legacy target');
  await expect(page.locator('#persistenceWarnings')).toContainText('tjl.targets');
  expect(await page.evaluate(() => ({
    current: localStorage.getItem('tjl.targets'),
    legacy: localStorage.getItem('tj_targets')
  }))).toEqual({ current: null, legacy: JSON.stringify(legacyTargets) });
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-PERSISTENCE-SCHEMA-001 preserves an unknown newer schema and starts with safe defaults', async ({ page }) => {
  const future = envelope([{ n: 'Future target', s: 9 }], 2);
  await seedStorage(page, { 'tjl.targets': future });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetSelect option')).toHaveCount(5);
  await expect(page.locator('#persistenceWarnings')).toContainText('tjl.targets');
  expect(await page.evaluate(() => localStorage.getItem('tjl.targets'))).toBe(future);
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-PERSISTENCE-WRITE-001 verifies a new record before adopting it in AppState', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/index.html');
  await page.evaluate(() => openTargetManager());
  await page.locator('#newTgtName').fill('New target');
  await page.locator('#newTgtSize').fill('4.5');

  await page.evaluate(() => addTarget());

  await expect(page.locator('#targetSelect option')).toHaveCount(6);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('tjl.targets')));
  expect(stored.schemaVersion).toBe(1);
  expect(stored.data.at(-1)).toEqual({ n: 'New target', s: 4.5 });
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-PERSISTENCE-RESET-001 reset removes only application-owned keys', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => {
    localStorage.setItem('tjl.targets', JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), data: [] }));
    localStorage.setItem('tj_targets', '[]');
    localStorage.setItem('tj_incoming_dist', '321');
    localStorage.setItem('unrelated_origin_key', 'must remain');
    sessionStorage.setItem('tjl.handoff', 'owned');
  });
  page.once('dialog', dialog => dialog.accept());

  await Promise.all([
    page.waitForNavigation(),
    page.evaluate(() => resetAll())
  ]);

  expect(await page.evaluate(() => ({
    currentTargets: localStorage.getItem('tjl.targets'),
    legacyTargets: localStorage.getItem('tj_targets'),
    incoming: localStorage.getItem('tj_incoming_dist'),
    handoff: sessionStorage.getItem('tjl.handoff'),
    unrelated: localStorage.getItem('unrelated_origin_key')
  }))).toEqual({
    currentTargets: null,
    legacyTargets: null,
    incoming: null,
    handoff: null,
    unrelated: 'must remain'
  });
});
