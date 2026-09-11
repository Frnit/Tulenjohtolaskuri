import fs from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import {
  collectPageErrors,
  pageErrorDetails,
  seedStorage
} from '../support/browser-fixtures.mjs';

test('@known-defect SEC-RENDER-001 [KNOWN BASELINE DEFECT] user-defined target text reaches an HTML interpretation surface', async ({ page }) => {
  const targets = await fs.readFile(
    new URL('../fixtures/storage/safe-html-marker-targets.json', import.meta.url),
    'utf8'
  );
  await seedStorage(page, { tj_targets: targets });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetList em[data-evidence="SEC-RENDER-001"]')).toHaveText('marker');
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});
