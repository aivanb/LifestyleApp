/**
 * E2E: /profile UI (info → rankings)
 *
 * Verifies:
 * - No Personal Info tab / header-based navigation
 * - "rankings" button navigates to rankings view
 * - Rankings view shows left-side ranking panel
 * - BMI is selected by default and selection changes update the panel
 * - Back button returns to info view
 */
const { test, expect } = require('@playwright/test');

test.describe('Profile: rankings UI', () => {
  test('user can open rankings and switch metric selection', async ({ page }) => {
    const unique = `e2e_profile_${Date.now()}`;
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

    await expect(page.getByTestId('rank-badge')).toBeVisible();
    await expect(page.getByRole('button', { name: /personal info/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /body metrics/i })).toHaveCount(0);

    const rankBadge = page.getByTestId('rank-badge');
    await expect(rankBadge).toBeVisible();
    await rankBadge.click();

    await expect(page.getByTestId('back-to-info')).toBeVisible();
    await expect(page.getByTestId('ranking-panel')).toBeVisible();
    await expect(page.getByTestId('ranking-range')).toHaveCount(17);

    const bmiCard = page.getByTestId('metric-card-bmi');
    await expect(bmiCard).toHaveClass(/selected/);

    const tdeeCard = page.getByTestId('metric-card-tdee');
    await tdeeCard.click();

    await expect(tdeeCard).toHaveClass(/selected/);
    await expect(bmiCard).not.toHaveClass(/selected/);
    await expect(page.getByTestId('ranking-range')).toHaveCount(17);

    await page.getByTestId('back-to-info').click();
    await expect(page.getByTestId('rank-badge')).toBeVisible();
    await expect(page.getByTestId('ranking-panel')).toHaveCount(0);
  });
});

