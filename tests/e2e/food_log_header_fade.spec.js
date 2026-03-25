const { test, expect } = require('@playwright/test');

test.describe('Food log PC header actions', () => {
  test('header actions hide after inactivity; double-arrow reveals them again', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    await page.goto('http://localhost:3000/food-log');
    const headerActions = page.locator('.food-logging-dashboard .header-actions');
    const reveal = page.locator('.food-logging-dashboard .header-actions-reveal');

    await expect(headerActions).toBeVisible();

    await page.waitForTimeout(3200);
    await expect(headerActions).toHaveCount(0);
    await expect(reveal).toBeVisible();

    await reveal.click();
    await expect(headerActions).toBeVisible();
    await expect(reveal).toHaveCount(0);
  });
});
