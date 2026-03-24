/**
 * E2E: /profile personal info edit + persistence
 *
 * Requires frontend (3000) and backend (8000) with matching registration flow.
 */
const { test, expect } = require('@playwright/test');

test.describe('Profile: edit personal info', () => {
  test('saves first name and shows it after reload', async ({ page }) => {
    const unique = `e2e_edit_${Date.now()}`;
    const email = `${unique}@example.com`;

    await page.goto('/register');
    await page.waitForSelector('form', { timeout: 10000 });

    await page.locator('input[name="username"]').fill(unique);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill('E2ePass123!');
    await page.locator('input[name="password_confirm"]').fill('E2ePass123!');

    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/home', { timeout: 20000 });

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /edit info/i }).click();
    await page.locator('input[name="first_name"]').fill('E2eFirst');
    await page.locator('input[name="last_name"]').fill('E2eLast');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect(page.getByText('E2eFirst')).toBeVisible();
    await expect(page.getByText('E2eLast')).toBeVisible();

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('E2eFirst')).toBeVisible();
    await expect(page.getByText('E2eLast')).toBeVisible();
  });
});
