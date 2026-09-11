import { test, expect } from '@playwright/test';

test('@characterization CHAR-RESET-001 reset clears the origin-wide localStorage namespace', async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => {
    localStorage.setItem('tj_targets', JSON.stringify([{ n: 'Evidence target', s: 1 }]));
    localStorage.setItem('unrelated_origin_key', 'must also be removed by current reset');
  });
  page.once('dialog', (dialog) => dialog.accept());

  await Promise.all([
    page.waitForNavigation(),
    page.evaluate(() => resetAll())
  ]);

  expect(await page.evaluate(() => ({
    length: localStorage.length,
    unrelated: localStorage.getItem('unrelated_origin_key')
  }))).toEqual({ length: 0, unrelated: null });
});
