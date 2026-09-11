import { test, expect } from '@playwright/test';
import {
  collectPageErrors,
  pageErrorDetails
} from '../support/browser-fixtures.mjs';

test('@known-defect DEF-UI-VIEW-001 [KNOWN BASELINE DEFECT] size workflow consumes fields hidden with the distance view', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/index.html');
  await page.locator('#fov').fill('60');
  await page.locator('#tPx').fill('100');

  await page.locator('#tabSize').click();
  await page.locator('#knownDist').fill('100');

  await expect(page.locator('#viewDist')).toBeHidden();
  await expect(page.locator('#fov')).toBeHidden();
  await expect(page.locator('#res')).toBeHidden();
  await expect(page.locator('#tPx')).toBeHidden();
  await expect(page.locator('#rSize')).not.toHaveText('(Syötä optiikka)');
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});
