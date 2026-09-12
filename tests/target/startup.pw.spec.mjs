import { test, expect } from '@playwright/test';
import {
  collectPageErrors,
  pageErrorDetails,
  seedStorage
} from '../support/browser-fixtures.mjs';

test('@target ACC-START-001 [CHG-P2-2-STARTUP-001] initializes targets and saved profiles without page errors', async ({ page }) => {
  await seedStorage(page, {
    tj_profs_v2: JSON.stringify({ EvidenceProfile: { f: '45', r: '1920', u: 'deg' } })
  });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetSelect option')).toHaveCount(5);
  await expect(page.locator('#profileSelector option')).toHaveCount(2);
  await expect(page.locator('#profileSelector option').nth(1)).toHaveText('EvidenceProfile');
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-HANDOFF-001 [CHG-P2-2-STARTUP-001] consumes an incoming AR distance once and selects the size workflow', async ({ page }) => {
  const errors = collectPageErrors(page);

  await page.goto('/index.html');
  await page.evaluate(() => localStorage.setItem('tj_incoming_dist', '321'));
  await page.reload();

  await expect(page.locator('#knownDist')).toHaveValue('321');
  await expect(page.locator('#tabSize')).toHaveClass(/active/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('tj_incoming_dist'))).toBeNull();
  await page.waitForTimeout(600);
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);

  await page.locator('#knownDist').fill('');
  await page.reload();

  await expect(page.locator('#knownDist')).toHaveValue('');
  await expect(page.locator('#tabDist')).toHaveClass(/active/);
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-AR-HANDOFF-002 consumes versioned AR distance and elevation once', async ({ page }) => {
  const errors = collectPageErrors(page);
  const handoff = {
    schemaVersion: 1,
    updatedAt: '2026-09-13T00:00:00.000Z',
    data: {distance: 432, elevation: -7}
  };

  await page.goto('/index.html');
  await page.evaluate((value) => {
    sessionStorage.setItem('tjl.handoff', JSON.stringify(value));
    localStorage.setItem('tj_incoming_dist', '432');
  }, handoff);
  await page.reload();

  await expect(page.locator('#knownDist')).toHaveValue('432');
  await expect(page.locator('#elev')).toHaveValue('-7');
  await expect(page.locator('#tabSize')).toHaveClass(/active/);
  await expect.poll(() => page.evaluate(() => ({
    handoff: sessionStorage.getItem('tjl.handoff'),
    legacy: localStorage.getItem('tj_incoming_dist')
  }))).toEqual({handoff: null, legacy: null});
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-AR-HANDOFF-002 preserves an unsupported handoff and uses the legacy distance fallback', async ({ page }) => {
  const errors = collectPageErrors(page);
  const future = JSON.stringify({
    schemaVersion: 2,
    updatedAt: '2026-09-13T00:00:00.000Z',
    data: {distance: 999, elevation: 12}
  });

  await page.goto('/index.html');
  await page.evaluate((value) => {
    sessionStorage.setItem('tjl.handoff', value);
    localStorage.setItem('tj_incoming_dist', '345');
  }, future);
  await page.reload();

  await expect(page.locator('#knownDist')).toHaveValue('345');
  await expect(page.locator('#elev')).toHaveValue('');
  await expect(page.locator('#persistenceWarnings')).toContainText('tjl.handoff');
  expect(await page.evaluate(() => ({
    handoff: sessionStorage.getItem('tjl.handoff'),
    legacy: localStorage.getItem('tj_incoming_dist')
  }))).toEqual({handoff: future, legacy: null});
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});
