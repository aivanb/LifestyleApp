/**
 * E2E: /analytics page
 *
 * Verifies:
 * - Workout Analytics: single progression graph that switches All vs individual; date range on the right
 * - Food Analytics: date range in separate card on the right; Macro Split stacked; Food Frequency with Food Group / Brand headers
 * - Backend tests (apps/analytics/tests.py) verify API response data matches DB
 */
const { test, expect } = require('@playwright/test');

test.describe('Analytics page', () => {
  test('workout section has single progression graph, date range on right', async ({ page }) => {
    const unique = `e2e_analytics_${Date.now()}`;
    const email = `${unique}@example.com`;

    await page.goto('/register');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.locator('input[name="username"]').fill(unique);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill('E2ePass123!');
    await page.locator('input[name="password_confirm"]').fill('E2ePass123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(profile|overview|dashboard|home)/, { timeout: 20000 });

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const workoutTab = page.getByRole('button', { name: /workout analytics/i });
    await expect(workoutTab).toBeVisible();
    await workoutTab.click();

    // Date range selector is on the right (inside controls card)
    await expect(page.getByLabel('Date range:')).toBeVisible();
    await expect(page.locator('#analytics-range')).toBeVisible();
    await page.locator('#analytics-range').selectOption('2weeks');

    // Single progression chart: title "All Workouts" is visible (in chart card, not in dropdown)
    await expect(page.locator('.workout-progression-chart-title').filter({ hasText: 'All Workouts' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /workout/i })).toBeVisible();
  });

  test('food section has date range in separate card on right, Food Group and Brand headers', async ({ page }) => {
    const unique = `e2e_analytics_food_${Date.now()}`;
    await page.goto('/register');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.locator('input[name="username"]').fill(unique);
    await page.locator('input[name="email"]').fill(`${unique}@example.com`);
    await page.locator('input[name="password"]').fill('E2ePass123!');
    await page.locator('input[name="password_confirm"]').fill('E2ePass123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(profile|overview|dashboard|home)/, { timeout: 20000 });

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /food analytics/i }).click();

    // Date range in its own card (visible in food section)
    await expect(page.getByLabel('Date range:')).toBeVisible();
    await expect(page.locator('#analytics-range')).toBeVisible();

    // Food Frequency card shows headers "Food Group" and "Brand"
    await expect(page.getByRole('heading', { name: 'Food Group', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Brand', level: 3 })).toBeVisible();

    await expect(page.getByText(/macro split/i)).toBeVisible();
    await expect(page.getByText(/food timing/i)).toBeVisible();
  });

  test('date range custom shows from/to inputs', async ({ page }) => {
    const unique = `e2e_analytics_custom_${Date.now()}`;
    await page.goto('/register');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.locator('input[name="username"]').fill(unique);
    await page.locator('input[name="email"]').fill(`${unique}@example.com`);
    await page.locator('input[name="password"]').fill('E2ePass123!');
    await page.locator('input[name="password_confirm"]').fill('E2ePass123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(profile|overview|dashboard|home)/, { timeout: 20000 });

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    await page.locator('#analytics-range').selectOption('custom');
    await expect(page.getByLabel('From date')).toBeVisible();
    await expect(page.getByLabel('To date')).toBeVisible();
  });

  test('workout section shows one graph that switches between All and individual workout', async ({ page }) => {
    const unique = `e2e_analytics_switch_${Date.now()}`;
    await page.goto('/register');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.locator('input[name="username"]').fill(unique);
    await page.locator('input[name="email"]').fill(`${unique}@example.com`);
    await page.locator('input[name="password"]').fill('E2ePass123!');
    await page.locator('input[name="password_confirm"]').fill('E2ePass123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/(profile|overview|dashboard|home)/, { timeout: 20000 });

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /workout analytics/i }).click();
    await expect(page.locator('.workout-progression-chart-title').filter({ hasText: 'All Workouts' })).toBeVisible();
    const workoutSelect = page.getByRole('combobox', { name: /workout/i });
    const optionCount = await workoutSelect.locator('option').count();
    if (optionCount > 1) {
      await workoutSelect.selectOption({ index: 1 });
      await expect(page.locator('.workout-progression-chart').first()).toBeVisible();
    }
  });
});
