import { test, expect } from '@playwright/test';

test('statistical distributions work in browser', async ({ page }) => {
  // Capture console logs
  page.on('console', msg => console.log('Browser:', msg.text()));
  page.on('pageerror', error => console.error('Page error:', error));
  
  // Navigate to the distribution test page
  await page.goto('/test-distributions.html');
  
  // Wait for tests to complete (should be quick)
  await page.waitForFunction(() => {
    const result = document.getElementById('result').textContent;
    return result !== 'Loading...';
  }, { timeout: 30000 });
  
  // Check overall result
  const resultText = await page.locator('#result').textContent();
  console.log('Distribution test result:', resultText);
  
  // Get detailed test results
  const testDetails = await page.locator('#test-list li').allTextContents();
  console.log('Detailed test results:');
  testDetails.forEach(detail => console.log('  ', detail));
  
  // The test should pass if all distribution functions work
  // If it fails, we'll see which specific functions are problematic
  await expect(page.locator('#result')).toHaveText('ALL TESTS PASS');
});