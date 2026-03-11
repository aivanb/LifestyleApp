const { test, expect } = require('@playwright/test');

test.describe('Food log header actions fade', () => {
  test('header actions fade after inactivity and restore on hover', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    // Navigate to food log
    await page.goto('http://localhost:3000/food-log');
    const headerActions = page.locator('.food-logging-dashboard .header-actions');
    await expect(headerActions).toBeVisible();

    // Allow initial fade timer to run
    await page.waitForTimeout(3200);
    await expect(headerActions).toHaveCSS('opacity', '0.1');

    // Hover should restore opacity
    await headerActions.hover();
    await expect(headerActions).toHaveCSS('opacity', '1');
  });
});

