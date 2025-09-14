import { test, expect } from '@playwright/test';

test('dataframe works in browser', async ({ page }) => {
  await page.goto('/test.html');
  await expect(page.locator('#result')).toHaveText('PASS');
});
