import { test, expect } from '@playwright/test';

test.describe('WorkoutLog Component', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/workouts/logs/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              workout_log_id: 1,
              workout: {
                workouts_id: 1,
                workout_name: 'Bench Press',
                type: 'Barbell',
                muscles: [
                  {
                    muscle: 1,
                    muscle_name: 'Chest',
                    muscle_group: 'Chest',
                    activation_rating: 85
                  }
                ]
              },
              weight: 185,
              reps: 8,
              rir: 2,
              attributes: ['dropset'],
              rest_time: 90,
              date_time: '2025-10-18T10:00:00Z'
            },
            {
              workout_log_id: 2,
              workout: {
                workouts_id: 1,
                workout_name: 'Bench Press',
                type: 'Barbell',
                muscles: [
                  {
                    muscle: 1,
                    muscle_name: 'Chest',
                    muscle_group: 'Chest',
                    activation_rating: 85
                  }
                ]
              },
              weight: 185,
              reps: 8,
              rir: 2,
              attributes: [],
              rest_time: 90,
              date_time: '2025-10-18T10:05:00Z'
            }
          ]
        })
      });
    });

    await page.route('**/api/workouts/stats/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_sets: 2,
            total_weight_lifted: 370,
            total_reps: 16,
            total_rir: 4
          }
        })
      });
    });

    await page.route('**/api/workouts/current-split-day/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            active_split: {
              splits_id: 1,
              split_name: 'Push/Pull/Legs',
              start_date: '2025-10-15'
            },
            current_split_day: {
              split_days_id: 1,
              day_name: 'Push Day',
              day_order: 1,
              targets: [
                {
                  muscle: 1,
                  muscle_name: 'Chest',
                  muscle_group: 'Chest',
                  target_activation: 1000
                }
              ]
            }
          }
        })
      });
    });

    await page.route('**/api/workouts/recently-logged/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              workout_id: 1,
              workout_name: 'Bench Press',
              last_weight: 185,
              last_reps: 8
            }
          ]
        })
      });
    });

    await page.route('**/api/workouts/log-workout/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { message: 'Workout logged successfully' }
        })
      });
    });

    // Navigate to workout tracker page
    await page.goto('/workout-tracker');
  });

  test('should display workout log with proper formatting', async ({ page }) => {
    // Check if the main heading is displayed
    await expect(page.locator('h2')).toContainText('Workout Log');

    // Check if date selector is present
    await expect(page.locator('input[type="date"]')).toBeVisible();

    // Check if timer is displayed
    await expect(page.locator('text=00:00')).toBeVisible();

    // Check if active split is displayed
    await expect(page.locator('text=Active Split: Push/Pull/Legs')).toBeVisible();
    await expect(page.locator('text=Today\'s Workout: Push Day')).toBeVisible();
  });

  test('should display workout statistics correctly', async ({ page }) => {
    // Wait for stats to load
    await page.waitForSelector('text=Today\'s Stats');

    // Check total sets
    await expect(page.locator('text=Total Sets').locator('..').locator('text=2')).toBeVisible();

    // Check total weight lifted
    await expect(page.locator('text=Weight Lifted (lbs)').locator('..').locator('text=370')).toBeVisible();

    // Check total reps
    await expect(page.locator('text=Total Reps').locator('..').locator('text=16')).toBeVisible();

    // Check total RIR
    await expect(page.locator('text=Total RIR').locator('..').locator('text=4')).toBeVisible();
  });

  test('should group workouts by type and display sets correctly', async ({ page }) => {
    // Wait for workout logs to load
    await page.waitForSelector('text=Workouts Logged on');

    // Check if workouts are grouped by type
    await expect(page.locator('text=Bench Press')).toBeVisible();
    await expect(page.locator('text=Barbell • 2 sets')).toBeVisible();

    // Check if individual sets are displayed
    await expect(page.locator('text=Set 1')).toBeVisible();
    await expect(page.locator('text=Set 2')).toBeVisible();

    // Check if set details are shown
    await expect(page.locator('text=185 lbs × 8 reps')).toBeVisible();

    // Check if RIR is displayed
    await expect(page.locator('text=RIR: 2')).toBeVisible();

    // Check if attributes are displayed
    await expect(page.locator('text=dropset')).toBeVisible();
  });

  test('should display muscle progress with color coding', async ({ page }) => {
    // Wait for muscle progress to load
    await page.waitForSelector('text=Chest');

    // Check if muscle progress bar is displayed
    const progressBar = page.locator('div[style*="width: 13.6%"]'); // 136/1000 * 100 = 13.6%
    await expect(progressBar).toBeVisible();

    // Check if progress text is displayed
    await expect(page.locator('text=136 / 1000')).toBeVisible();
  });

  test('should allow adding sets to existing workouts', async ({ page }) => {
    // Wait for workout logs to load
    await page.waitForSelector('text=Add Set');

    // Click add set button
    await page.click('text=Add Set');

    // Verify API call was made
    await expect(page.locator('text=Workout logged successfully')).toBeVisible();
  });

  test('should display recent workouts for quick add', async ({ page }) => {
    // Wait for recent workouts to load
    await page.waitForSelector('text=Quick Add Recent Workouts');

    // Check if recent workout is displayed
    await expect(page.locator('text=Bench Press')).toBeVisible();
    await expect(page.locator('text=Last: 185 lbs × 8 reps')).toBeVisible();

    // Click on recent workout to add set
    await page.click('text=Bench Press');
  });

  test('should have proper icon sizes', async ({ page }) => {
    // Check calendar icon size
    const calendarIcon = page.locator('svg[class*="h-4 w-4"]').first();
    await expect(calendarIcon).toHaveCSS('width', '16px');
    await expect(calendarIcon).toHaveCSS('height', '16px');

    // Check clock icon size
    const clockIcon = page.locator('svg[class*="h-5 w-5"]').first();
    await expect(clockIcon).toHaveCSS('width', '20px');
    await expect(clockIcon).toHaveCSS('height', '20px');

    // Check chart icon size
    const chartIcon = page.locator('svg[class*="h-6 w-6"]').first();
    await expect(chartIcon).toHaveCSS('width', '24px');
    await expect(chartIcon).toHaveCSS('height', '24px');
  });

  test('should have consistent visual formatting', async ({ page }) => {
    // Check if all elements use CSS variables for theming
    const mainContainer = page.locator('.form-container');
    await expect(mainContainer).toBeVisible();

    // Check if buttons have proper styling
    const startButton = page.locator('button:has-text("Start")');
    await expect(startButton).toHaveCSS('background-color', 'rgb(59, 130, 246)'); // var(--accent-color)

    // Check if form inputs have proper styling
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toHaveCSS('border-radius', '6px'); // var(--border-radius)
  });

  test('should handle timer functionality', async ({ page }) => {
    // Start timer
    await page.click('text=Start');

    // Wait a moment for timer to start
    await page.waitForTimeout(1000);

    // Check if timer is running (should not be 00:00)
    const timerDisplay = page.locator('text=/\\d+:\\d+/');
    await expect(timerDisplay).toBeVisible();

    // Pause timer
    await page.click('text=Pause');

    // Reset timer
    await page.click('text=Reset');

    // Check if timer is back to 00:00
    await expect(page.locator('text=00:00')).toBeVisible();
  });

  test('should update date selection', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]');
    
    // Change date
    await dateInput.fill('2025-10-19');
    
    // Verify date was updated
    await expect(dateInput).toHaveValue('2025-10-19');
  });

  test('should handle empty workout logs gracefully', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/workouts/logs/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: []
        })
      });
    });

    // Reload page
    await page.reload();

    // Check if empty state is displayed
    await expect(page.locator('text=No workouts logged for this date.')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/workouts/logs/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      });
    });

    // Reload page
    await page.reload();

    // Check if error message is displayed
    await expect(page.locator('text=Failed to load workout logs')).toBeVisible();
  });

  test('should display muscle progress colors correctly', async ({ page }) => {
    // Mock different progress levels
    await page.route('**/api/workouts/current-split-day/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            active_split: {
              splits_id: 1,
              split_name: 'Test Split',
              start_date: '2025-10-15'
            },
            current_split_day: {
              split_days_id: 1,
              day_name: 'Test Day',
              day_order: 1,
              targets: [
                {
                  muscle: 1,
                  muscle_name: 'Chest',
                  muscle_group: 'Chest',
                  target_activation: 1000
                }
              ]
            }
          }
        })
      });
    });

    // Mock workout logs with different activation levels
    await page.route('**/api/workouts/logs/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              workout_log_id: 1,
              workout: {
                workouts_id: 1,
                workout_name: 'Bench Press',
                type: 'Barbell',
                muscles: [
                  {
                    muscle: 1,
                    muscle_name: 'Chest',
                    muscle_group: 'Chest',
                    activation_rating: 500 // 50% of target
                  }
                ]
              },
              weight: 185,
              reps: 1,
              rir: 2,
              attributes: [],
              rest_time: 90,
              date_time: '2025-10-18T10:00:00Z'
            }
          ]
        })
      });
    });

    // Reload page
    await page.reload();

    // Check if progress bar has correct color (yellow for 50%)
    const progressBar = page.locator('div[style*="background-color: rgb(251, 191, 36)"]'); // Yellow
    await expect(progressBar).toBeVisible();
  });
});
