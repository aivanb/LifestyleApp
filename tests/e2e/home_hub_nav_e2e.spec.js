/**
 * E2E: post-login home + bottom nav hub
 */
const { test, expect } = require('@playwright/test');

test.describe('Home and navigation hub', () => {
  test('register lands on home; half-circle nav opens', async ({ page }) => {
    const unique = `e2e_home_${Date.now()}`;
    const email = `${unique}@example.com`;

    await page.goto('/register');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.locator('input[name="username"]').fill(unique);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill('E2ePass123!');
    await page.locator('input[name="password_confirm"]').fill('E2ePass123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/home', { timeout: 20000 });

    await expect(page.getByRole('heading', { name: /^Today$/i })).toBeVisible();

    await page.getByRole('button', { name: /open navigation/i }).click();
    await expect(page.getByRole('link', { name: /profile/i })).toBeVisible();
  });
});
