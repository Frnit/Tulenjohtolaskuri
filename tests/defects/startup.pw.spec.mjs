import { test, expect } from '@playwright/test';
import {
  BASELINE_MAIN_STARTUP_ERROR,
  collectPageErrors,
  pageErrorDetails,
  seedStorage
} from '../support/browser-fixtures.mjs';

test('@known-defect DEF-START-001 [KNOWN BASELINE DEFECT] updateSel blocks profile and AR handoff startup work', async ({ page }) => {
  await seedStorage(page, {
    tj_profs_v2: JSON.stringify({ EvidenceProfile: { f: '45', r: '1920', u: 'deg' } }),
    tj_incoming_dist: '321'
  });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect.poll(() => pageErrorDetails(errors)).toEqual([
    BASELINE_MAIN_STARTUP_ERROR
  ]);
  await expect(page.locator('#profileSelector option')).toHaveCount(1);
  await expect(page.locator('#knownDist')).toHaveValue('');
  await expect(page.locator('#tabDist')).toHaveClass(/active/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('tj_incoming_dist'))).toBe('321');
});
