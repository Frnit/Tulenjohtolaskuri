import { test, expect } from '@playwright/test';

test('@target REQ-WORKFLOW-001 [Phase 1 REQ-008] both declared main workflows remain selectable', async ({ page }) => {
  await page.goto('/index.html');

  await page.locator('#tabSize').click();
  await expect(page.locator('#tabSize')).toHaveClass(/active/);

  await page.locator('#tabDist').click();
  await expect(page.locator('#tabDist')).toHaveClass(/active/);
});
