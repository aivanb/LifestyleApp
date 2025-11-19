// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Quick Workouts', () => {
  test('quick workouts reflect previous-day DB data and allow adding a set', async ({ page }) => {
    // Navigate to app root (assumes dev server from playwright.config.js webServer)
    await page.goto('/');

    // Ensure dashboard loads
    await expect(page.locator('.workout-logging-dashboard')).toBeVisible();

    // Quick workouts toggle should exist and be on by default
    const quickToggle = page.locator('input[aria-label="Toggle quick workouts"]');
    await expect(quickToggle).toBeVisible();

    // If toggle off, turn it on
    if (!(await quickToggle.isChecked())) {
      await quickToggle.check();
    }

    // Compute previous calendar day (EST not enforced here, UI code normalizes)
    const base = new Date();
    const prev = new Date(base);
    prev.setDate(base.getDate() - 1);
    const prevStr = prev.toISOString().split('T')[0];

    // Fetch backend data for previous day
    const apiResp = await page.request.get(`http://localhost:8000/workouts/logs/?date_from=${prevStr}&date_to=${prevStr}`);
    expect(apiResp.ok()).toBeTruthy();
    const apiJson = await apiResp.json();
    const apiLogs = Array.isArray(apiJson?.data) ? apiJson.data : [];

    // Group by workout id from API
    const groups = new Map();
    for (const log of apiLogs) {
      const w = log.workout;
      const id = w?.workouts_id || w?.workout_id || log.workout_id;
      if (!id || !w) continue;
      if (!groups.has(id)) groups.set(id, w);
    }

    // Expect at least same number of quick cards as unique workouts
    const quickCards = page.locator('[data-testid="quick-workout-card"]');
    await expect(quickCards).toHaveCount(Math.max(groups.size, 0));

    // Validate each API workout name appears in UI quick cards
    for (const [, workout] of groups) {
      const name = (workout.workout_name || '').replace(
        /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u,
        ''
      ).trim() || workout.workout_name;
      await expect(quickCards.filter({ hasText: name })).toHaveCount(1);
    }

    // Check presence of header bits: emoji box, name, muscles, and stats row for first card
    const quickCard = quickCards.first();
    await expect(quickCard.locator('.workout-set-header')).toBeVisible();
    await expect(quickCard.locator('.workout-name')).toBeVisible();
    await expect(quickCard.locator('.workout-muscles-inline')).toBeVisible();
    await expect(quickCard.locator('.workout-set-summary')).toBeVisible();

    // Stats present (Weight, Reps, RIR, Rest)
    const metrics = quickCard.locator('.workout-set-totals .metric-item');
    await expect(metrics).toHaveCount(4);

    // Add Set should open the logging modal
    await quickCard.locator('[data-testid="quick-workout-add-set"]').click();

    // Expect the workout selection/logging modal to appear
    const loggingModal = page.locator('.workout-logging-modal, .workout-selection-modal');
    await expect(loggingModal).toBeVisible();
  });
});

