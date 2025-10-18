import { test, expect } from '@playwright/test';

test.describe('WorkoutLogger Component', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/workouts/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              workouts_id: 1,
              workout_name: 'Bench Press',
              type: 'Barbell',
              equipment_brand: 'Generic',
              location: 'Gym',
              muscles: [
                {
                  muscle: 1,
                  muscle_name: 'Chest',
                  muscle_group: 'Chest',
                  activation_rating: 85
                }
              ],
              recent_log: {
                last_weight: 185,
                last_reps: 8,
                last_rir: 2,
                last_rest_time: 90,
                last_attributes: ['dropset'],
                last_date: '2025-10-18T10:00:00Z'
              }
            },
            {
              workouts_id: 2,
              workout_name: 'Squat',
              type: 'Barbell',
              equipment_brand: 'Generic',
              location: 'Gym',
              muscles: [
                {
                  muscle: 2,
                  muscle_name: 'Quadriceps',
                  muscle_group: 'Legs',
                  activation_rating: 90
                }
              ],
              recent_log: null
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

  test('should display workout logger with proper formatting', async ({ page }) => {
    // Check if the main heading is displayed
    await expect(page.locator('h2')).toContainText('Log Workout');

    // Check if search input is present
    await expect(page.locator('input[placeholder="Search workouts..."]')).toBeVisible();

    // Check if filters are displayed
    await expect(page.locator('text=Muscle Activation Threshold')).toBeVisible();
    await expect(page.locator('text=Filter by Muscle')).toBeVisible();
    await expect(page.locator('text=Sort By')).toBeVisible();
  });

  test('should autofill workout data from recent logs', async ({ page }) => {
    // Wait for workouts to load
    await page.waitForSelector('text=Bench Press');

    // Click on Bench Press workout
    await page.click('text=Bench Press');

    // Check if autofill data is populated
    await expect(page.locator('input[placeholder="135.5"]')).toHaveValue('185');
    await expect(page.locator('input[placeholder="10"]')).toHaveValue('8');
    await expect(page.locator('input[placeholder="2"]')).toHaveValue('2');
    await expect(page.locator('input[placeholder="90"]')).toHaveValue('90');
  });

  test('should display workout muscles and activation ratings', async ({ page }) => {
    // Wait for workouts to load
    await page.waitForSelector('text=Bench Press');

    // Click on Bench Press workout
    await page.click('text=Bench Press');

    // Check if muscle information is displayed
    await expect(page.locator('text=Muscles & Activation:')).toBeVisible();
    await expect(page.locator('text=Chest')).toBeVisible();
    await expect(page.locator('text=85')).toBeVisible();
  });

  test('should handle attribute inputs correctly', async ({ page }) => {
    // Wait for workouts to load
    await page.click('text=Bench Press');

    // Check if dropset attribute is available
    await expect(page.locator('text=Dropset')).toBeVisible();

    // Click on dropset checkbox
    await page.check('input[type="checkbox"]');

    // Check if attribute inputs appear
    await expect(page.locator('input[placeholder="Dropset Weight (lbs)"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Dropset Reps"]')).toBeVisible();

    // Fill in attribute inputs
    await page.fill('input[placeholder="Dropset Weight (lbs)"]', '155');
    await page.fill('input[placeholder="Dropset Reps"]', '6');

    // Verify values are set
    await expect(page.locator('input[placeholder="Dropset Weight (lbs)"]')).toHaveValue('155');
    await expect(page.locator('input[placeholder="Dropset Reps"]')).toHaveValue('6');
  });

  test('should handle all attribute types correctly', async ({ page }) => {
    await page.click('text=Bench Press');

    // Test assisted attribute
    await page.check('input[type="checkbox"]');
    await expect(page.locator('input[placeholder="Assisted Reps"]')).toBeVisible();

    // Test partial attribute
    await page.check('input[type="checkbox"]');
    await expect(page.locator('input[placeholder="Partial Reps"]')).toBeVisible();

    // Test pause attribute
    await page.check('input[type="checkbox"]');
    await expect(page.locator('input[placeholder="Pause Time (seconds)"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Pause Reps"]')).toBeVisible();

    // Test negatives attribute
    await page.check('input[type="checkbox"]');
    await expect(page.locator('input[placeholder="Negative Reps"]')).toBeVisible();
  });

  test('should filter workouts correctly', async ({ page }) => {
    // Test text search
    await page.fill('input[placeholder="Search workouts..."]', 'Bench');
    await expect(page.locator('text=Bench Press')).toBeVisible();
    await expect(page.locator('text=Squat')).not.toBeVisible();

    // Test muscle activation threshold
    const thresholdSlider = page.locator('input[type="range"]');
    await thresholdSlider.fill('90');
    await expect(page.locator('text=Squat')).toBeVisible();
    await expect(page.locator('text=Bench Press')).not.toBeVisible();

    // Test muscle filter
    await page.selectOption('select', 'Chest');
    await expect(page.locator('text=Bench Press')).toBeVisible();
    await expect(page.locator('text=Squat')).not.toBeVisible();
  });

  test('should sort workouts correctly', async ({ page }) => {
    // Test alphabetical sorting
    await page.selectOption('select', 'alphabetical');
    await expect(page.locator('text=Bench Press')).toBeVisible();
    await expect(page.locator('text=Squat')).toBeVisible();

    // Test activation rating sorting
    await page.selectOption('select', 'activation');
    await expect(page.locator('text=Squat')).toBeVisible();
    await expect(page.locator('text=Bench Press')).toBeVisible();

    // Test most commonly logged sorting
    await page.selectOption('select', 'most_logged');
    await expect(page.locator('text=Bench Press')).toBeVisible();
    await expect(page.locator('text=Squat')).toBeVisible();

    // Test recently logged sorting
    await page.selectOption('select', 'recently_logged');
    await expect(page.locator('text=Bench Press')).toBeVisible();
    await expect(page.locator('text=Squat')).toBeVisible();
  });

  test('should toggle sort direction', async ({ page }) => {
    // Click sort direction button
    await page.click('button:has-text("Ascending")');

    // Verify button text changes
    await expect(page.locator('button:has-text("Descending")')).toBeVisible();

    // Click again to toggle back
    await page.click('button:has-text("Descending")');
    await expect(page.locator('button:has-text("Ascending")')).toBeVisible();
  });

  test('should log workout successfully', async ({ page }) => {
    // Select workout
    await page.click('text=Bench Press');

    // Fill in workout data
    await page.fill('input[placeholder="135.5"]', '190');
    await page.fill('input[placeholder="10"]', '6');
    await page.fill('input[placeholder="2"]', '1');

    // Add attribute
    await page.check('input[type="checkbox"]');
    await page.fill('input[placeholder="Dropset Weight (lbs)"]', '160');
    await page.fill('input[placeholder="Dropset Reps"]', '8');

    // Submit workout
    await page.click('button:has-text("Log Workout")');

    // Verify success message
    await expect(page.locator('text=Workout logged successfully!')).toBeVisible();
  });

  test('should have proper icon sizes', async ({ page }) => {
    // Check search icon size
    const searchIcon = page.locator('svg[class*="h-4 w-4"]').first();
    await expect(searchIcon).toHaveCSS('width', '16px');
    await expect(searchIcon).toHaveCSS('height', '16px');

    // Check info icon size
    const infoIcon = page.locator('svg[class*="h-6 w-6"]').first();
    await expect(infoIcon).toHaveCSS('width', '24px');
    await expect(infoIcon).toHaveCSS('height', '24px');
  });

  test('should have consistent visual formatting', async ({ page }) => {
    // Check if all elements use CSS variables for theming
    const mainContainer = page.locator('.form-container');
    await expect(mainContainer).toBeVisible();

    // Check if buttons have proper styling
    const logButton = page.locator('button:has-text("Log Workout")');
    await expect(logButton).toHaveCSS('background-color', 'rgb(59, 130, 246)'); // var(--accent-color)

    // Check if form inputs have proper styling
    const searchInput = page.locator('input[placeholder="Search workouts..."]');
    await expect(searchInput).toHaveCSS('border-radius', '6px'); // var(--border-radius)
  });

  test('should handle workout selection correctly', async ({ page }) => {
    // Click on different workouts
    await page.click('text=Bench Press');
    await expect(page.locator('text=Logging: Bench Press')).toBeVisible();

    await page.click('text=Squat');
    await expect(page.locator('text=Logging: Squat')).toBeVisible();
  });

  test('should display progressive overload message', async ({ page }) => {
    await page.click('text=Bench Press');

    // Check if progressive overload message is displayed
    await expect(page.locator('text=Progressive overload should be done if not in a caloric deficit.')).toBeVisible();
  });

  test('should handle empty workout list gracefully', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/workouts/**', async route => {
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

    // Check if empty state is handled
    await expect(page.locator('text=Loading workouts...')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/workouts/**', async route => {
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
    await expect(page.locator('text=Failed to load workouts')).toBeVisible();
  });

  test('should reset form after successful log', async ({ page }) => {
    // Select workout and fill data
    await page.click('text=Bench Press');
    await page.fill('input[placeholder="135.5"]', '190');
    await page.fill('input[placeholder="10"]', '6');

    // Log workout
    await page.click('button:has-text("Log Workout")');

    // Wait for success message
    await expect(page.locator('text=Workout logged successfully!')).toBeVisible();

    // Check if form is reset
    await expect(page.locator('input[placeholder="135.5"]')).toHaveValue('');
    await expect(page.locator('input[placeholder="10"]')).toHaveValue('');
  });
});
