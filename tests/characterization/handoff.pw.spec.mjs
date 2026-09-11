import { test, expect } from '@playwright/test';
import { collectPageErrors, stubArSensors } from '../support/browser-fixtures.mjs';

test('@characterization CHAR-HANDOFF-001 AR produces tj_incoming_dist but main startup does not consume it', async ({ page }) => {
  await stubArSensors(page);
  const errors = collectPageErrors(page);
  await page.goto('/ar.html');

  await page.evaluate(() => {
    currentDist = 321;
    useResult();
  });
  await page.waitForURL('**/index.html');

  await expect.poll(() => errors.map((error) => error.message)).toContain(
    'updateSel is not defined'
  );
  expect(await page.evaluate(() => localStorage.getItem('tj_incoming_dist'))).toBe('321');
  await expect(page.locator('#knownDist')).toHaveValue('');
  await expect(page.locator('#tabDist')).toHaveClass(/active/);
});
