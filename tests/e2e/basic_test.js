const { test, expect } = require('@playwright/test');

test('Basic frontend test', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Check if the page loads
  const title = await page.title();
  console.log('Page title:', title);
  
  // Basic check that the page is working
  expect(title).toBeTruthy();
});
