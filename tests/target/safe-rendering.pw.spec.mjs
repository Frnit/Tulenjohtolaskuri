import fs from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import {
  collectPageErrors,
  pageErrorDetails,
  seedStorage
} from '../support/browser-fixtures.mjs';

test('@target ACC-SAFE-RENDER-001 [CHG-P2-4-SAFE-UI-001] renders a user-defined target name as text', async ({ page }) => {
  const targets = await fs.readFile(
    new URL('../fixtures/storage/safe-html-marker-targets.json', import.meta.url),
    'utf8'
  );
  await seedStorage(page, { tj_targets: targets });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetList em[data-evidence="SEC-RENDER-001"]')).toHaveCount(0);
  await expect(page.locator('#targetList .target-item span')).toHaveText(
    '<em data-evidence="SEC-RENDER-001">marker</em>'
  );
  await expect(page.locator('#targetList .target-item button')).toHaveAttribute(
    'aria-label',
    'Poista <em data-evidence="SEC-RENDER-001">marker</em>'
  );
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-SAFE-RENDER-001 [CHG-P2-4-SAFE-UI-001] renders a saved profile name as text', async ({ page }) => {
  await seedStorage(page, {
    tj_profs_v2: JSON.stringify({
      '<img src=x data-evidence="PROFILE-MARKER">': { f: '45', r: '1920', u: 'deg' }
    })
  });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('[data-evidence="PROFILE-MARKER"]')).toHaveCount(0);
  await expect(page.locator('#profileSelector option').nth(1)).toHaveText(
    '<img src=x data-evidence="PROFILE-MARKER">'
  );
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});
