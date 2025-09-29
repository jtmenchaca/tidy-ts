import { test, expect } from '@playwright/test';

test.describe('Statistical Distributions Example', () => {
  test('should run distribution example successfully in browser', async ({ page }) => {
    // Navigate to the distribution example page
    await page.goto('/dist-example.html');
    
    // Wait for the page to load and the test to complete
    await page.waitForSelector('#status');
    
    // Wait for the status to change from "Running distribution example..." to either success or error
    await page.waitForFunction(() => {
      const status = document.querySelector('#status');
      return status && !status.textContent.includes('Running distribution example...');
    }, { timeout: 10000 });
    
    // Check that the status shows success
    const status = await page.textContent('#status');
    expect(status).toContain('✅ Distribution example completed successfully!');
    
    // Check that the output contains expected content
    const output = await page.textContent('#output');
    expect(output).toContain('📊 Statistical Distributions Example');
    expect(output).toContain('✅ Library imported successfully');
    expect(output).toContain('🔹 Generating Normal Distribution PDF data...');
    expect(output).toContain('🔹 Generating Normal Distribution CDF data...');
    expect(output).toContain('✅ PDF data generated');
    expect(output).toContain('✅ CDF data generated');
    expect(output).toContain('📈 Summary Statistics:');
    expect(output).toContain('📊 Final Combined Data');
    
    // Check that we have actual data (not just headers)
    expect(output).toMatch(/x: -?\d+\.\d+, density: \d+\.\d+/);
    expect(output).toMatch(/x: -?\d+\.\d+, probability: \d+\.\d+/);
    
    console.log('Distribution example test completed successfully!');
  });
  
  test('should handle errors gracefully', async ({ page }) => {
    // Test error handling by checking console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/dist-example.html');
    await page.waitForSelector('#status');
    
    // Should not have any console errors
    expect(errors).toHaveLength(0);
  });
});
