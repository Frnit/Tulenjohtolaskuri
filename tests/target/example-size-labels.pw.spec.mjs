import { test, expect } from '@playwright/test';

test('@target ACC-EXAMPLE-SIZE-LABELS-001 makes built-in size assumptions explicit in both workflows', async ({ page }) => {
  await page.goto('/index.html');

  await expect(page.locator('#targetSelect option')).toHaveText([
    '▾ Valitse',
    'Mies — leveys 0,5 m (etäisyyden laskenta)',
    'Mies — korkeus 1,8 m (etäisyyden laskenta)',
    'BTR / PAS — leveys 2,9 m (etäisyyden laskenta)',
    'Kuorma-auto — leveys 2,5 m (etäisyyden laskenta)'
  ]);
  await expect(page.locator('label', { hasText: 'Sama ulottuvuus (px)' })).toBeVisible();

  await page.goto('/ar.html');

  await expect(page.locator('#targetSelect option')).toHaveText([
    'Mies — leveys 0,5 m (AR-etäisyyden laskenta)',
    'Mies — korkeus 1,8 m (AR-etäisyyden laskenta)',
    'BTR — leveys 2,9 m (AR-etäisyyden laskenta)',
    'Auto — leveys 1,8 m (AR-etäisyyden laskenta)'
  ]);
  await expect(page.locator('label[for="targetSelect"]')).toHaveText('Esimerkkimaali ja sovitettava ulottuvuus');
});
