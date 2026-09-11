import { test, expect } from '@playwright/test';
import { collectPageErrors } from '../support/browser-fixtures.mjs';

test('@characterization CHAR-START-001 records the current startup sequence', async ({ page }) => {
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetSelect option')).toHaveCount(5);
  await expect(page.locator('#profileSelector option')).toHaveCount(1);
  await expect.poll(() => errors.map((error) => error.message)).toContain(
    'updateSel is not defined'
  );
  await expect(page.locator('#rGround')).toHaveText('---');
});
