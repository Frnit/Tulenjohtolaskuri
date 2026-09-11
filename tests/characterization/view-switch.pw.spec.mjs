import { test, expect } from '@playwright/test';

test('@characterization CHAR-UI-VIEW-001 records current workflow visibility', async ({ page }) => {
  await page.goto('/index.html');

  await expect(page.locator('#viewDist')).toBeVisible();
  await expect(page.locator('#viewSize')).toBeHidden();
  await expect(page.locator('#resGroupDist')).toBeVisible();
  await expect(page.locator('#resGroupSize')).toBeHidden();

  await page.locator('#tabSize').click();

  await expect(page.locator('#viewDist')).toBeHidden();
  await expect(page.locator('#viewSize')).toBeVisible();
  await expect(page.locator('#resGroupDist')).toBeHidden();
  await expect(page.locator('#resGroupSize')).toBeVisible();
});
