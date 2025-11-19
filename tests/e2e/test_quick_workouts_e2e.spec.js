// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Quick Workouts', () => {
  test('quick workouts reflect previous-day DB data and allow adding a set', async ({ page }) => {
    // UI login
    await page.goto('/login');
    await page.locator('input[name="username"]').fill('john_doe');
    await page.locator('input[name="password"]').fill('testpass123');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500); // wait for redirect/auth init

    await page.goto('/workout-tracker');
    await expect(page.locator('.workout-logging-dashboard')).toBeVisible();

    const quickToggle = page.locator('input[aria-label="Toggle quick workouts"]');
    await expect(quickToggle).toBeVisible();
    if (!(await quickToggle.isChecked())) await quickToggle.check();

    const base = new Date();
    const prev = new Date(base);
    prev.setDate(base.getDate() - 1);
    const prevStr = prev.toISOString().split('T')[0];

    const apiResp = await page.request.get(`http://localhost:8000/workouts/logs/?date_from=${prevStr}&date_to=${prevStr}`);
    expect(apiResp.ok()).toBeTruthy();
    const apiJson = await apiResp.json();
    const apiLogs = Array.isArray(apiJson?.data) ? apiJson.data : [];

    const groups = new Map();
    for (const log of apiLogs) {
      const w = log.workout;
      const id = w?.workouts_id || w?.workout_id || log.workout_id;
      if (!id || !w) continue;
      if (!groups.has(id)) groups.set(id, w);
    }

    const quickCards = page.locator('[data-testid="quick-workout-card"]');
    await expect(quickCards).toHaveCount(Math.max(groups.size, 0));

    for (const [, workout] of groups) {
      const name = (workout.workout_name || '').replace(
        /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u,
        ''
      ).trim() || workout.workout_name;
      await expect(quickCards.filter({ hasText: name })).toHaveCount(1);
    }

    const firstCard = quickCards.first();
    await expect(firstCard.locator('.workout-set-header')).toBeVisible();
    await expect(firstCard.locator('.workout-name')).toBeVisible();
    await expect(firstCard.locator('.workout-muscles-inline')).toBeVisible();
    await expect(firstCard.locator('.workout-set-summary')).toBeVisible();

    const metrics = firstCard.locator('.workout-set-totals .metric-item');
    await expect(metrics).toHaveCount(4);

    await firstCard.locator('[data-testid="quick-workout-add-set"]').click();
    const loggingModal = page.locator('.workout-logging-modal, .workout-selection-modal');
    await expect(loggingModal).toBeVisible();
  });
});

