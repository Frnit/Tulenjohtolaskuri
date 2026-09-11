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
