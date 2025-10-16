const { test, expect } = require('@playwright/test');

test.describe('Workout Tracker E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    
    // Login
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to profile
    await page.waitForURL('**/profile');
    
    // Navigate to workout tracker
    await page.click('a[href="/workout-tracker"]');
    await page.waitForURL('**/workout-tracker');
  });

  test('should display workout tracker page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Workout Tracker');
    await expect(page.locator('button:has-text("Muscle Priority")')).toBeVisible();
    await expect(page.locator('button:has-text("Workout Adder")')).toBeVisible();
    await expect(page.locator('button:has-text("Split Creator")')).toBeVisible();
    await expect(page.locator('button:has-text("Workout Logger")')).toBeVisible();
    await expect(page.locator('button:has-text("Workout Log")')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Test muscle priority tab (default)
    await expect(page.locator('h2:has-text("Muscle Priority")')).toBeVisible();
    
    // Switch to workout adder
    await page.click('button:has-text("Workout Adder")');
    await expect(page.locator('h2:has-text("Create New Workout")')).toBeVisible();
    
    // Switch to split creator
    await page.click('button:has-text("Split Creator")');
    await expect(page.locator('h2:has-text("Split Creator")')).toBeVisible();
    
    // Switch to workout logger
    await page.click('button:has-text("Workout Logger")');
    await expect(page.locator('h2:has-text("Workout Logger")')).toBeVisible();
    
    // Switch to workout log
    await page.click('button:has-text("Workout Log")');
    await expect(page.locator('h2:has-text("Workout Log")')).toBeVisible();
  });

  test('should create a new workout', async ({ page }) => {
    // Navigate to workout adder tab
    await page.click('button:has-text("Workout Adder")');
    await expect(page.locator('h2:has-text("Create New Workout")')).toBeVisible();
    
    // Fill workout form
    await page.fill('input[id="workoutName"]', 'Test Bench Press');
    await page.selectOption('select[id="type"]', 'barbell');
    await page.fill('input[id="equipmentBrand"]', 'Rogue Fitness');
    await page.fill('input[id="location"]', 'Home Gym');
    await page.fill('textarea[id="notes"]', 'Focus on form');
    await page.check('input[id="makePublic"]');
    
    // Add muscle activation
    await page.selectOption('select[id="newMuscle"]', '1'); // Assuming Chest is option 1
    await page.fill('input[id="newActivationRating"]', '100');
    await page.click('button:has-text("Add Muscle")');
    
    // Submit form
    await page.click('button:has-text("Create Workout")');
    
    // Check for success message
    await expect(page.locator('text=Workout created successfully!')).toBeVisible();
  });

  test('should update muscle priorities', async ({ page }) => {
    // Stay on muscle priority tab (default)
    await expect(page.locator('h2:has-text("Muscle Priority")')).toBeVisible();
    
    // Wait for muscle priorities to load
    await page.waitForSelector('input[type="range"]');
    
    // Update a muscle priority
    const slider = page.locator('input[type="range"]').first();
    await slider.fill('90');
    
    // Click update button
    await page.click('button:has-text("Update Priorities")');
    
    // Check for success message
    await expect(page.locator('text=Muscle priorities updated successfully!')).toBeVisible();
  });

  test('should create a new split', async ({ page }) => {
    // Navigate to split creator tab
    await page.click('button:has-text("Split Creator")');
    await expect(page.locator('h2:has-text("Split Creator")')).toBeVisible();
    
    // Fill split form
    await page.fill('input[id="splitName"]', 'Test Push/Pull/Legs');
    
    // Add a day
    await page.fill('input[placeholder="Day name (e.g., Push Day)"]', 'Push Day');
    await page.click('button:has-text("Add Day")');
    
    // Add muscle target to the day
    await page.selectOption('select:has-text("Add muscle target")', '1'); // Assuming Chest is option 1
    
    // Submit form
    await page.click('button:has-text("Create Split")');
    
    // Check for success message
    await expect(page.locator('text=Split created successfully!')).toBeVisible();
  });

  test('should log a workout', async ({ page }) => {
    // First create a workout
    await page.click('button:has-text("Workout Adder")');
    await page.fill('input[id="workoutName"]', 'Test Workout');
    await page.selectOption('select[id="type"]', 'barbell');
    await page.click('button:has-text("Create Workout")');
    await page.waitForSelector('text=Workout created successfully!');
    
    // Navigate to workout logger
    await page.click('button:has-text("Workout Logger")');
    await expect(page.locator('h2:has-text("Workout Logger")')).toBeVisible();
    
    // Wait for workouts to load
    await page.waitForSelector('button:has-text("Test Workout")');
    
    // Select workout
    await page.click('button:has-text("Test Workout")');
    
    // Fill logging form
    await page.fill('input[id="weight"]', '135');
    await page.fill('input[id="reps"]', '10');
    await page.fill('input[id="rir"]', '2');
    await page.fill('input[id="restTime"]', '120');
    
    // Submit form
    await page.click('button:has-text("Log Workout")');
    
    // Check for success message
    await expect(page.locator('text=Workout logged successfully!')).toBeVisible();
  });

  test('should display workout log', async ({ page }) => {
    // Navigate to workout log tab
    await page.click('button:has-text("Workout Log")');
    await expect(page.locator('h2:has-text("Workout Log")')).toBeVisible();
    
    // Check for date input
    await expect(page.locator('input[type="date"]')).toBeVisible();
    
    // Check for stats display
    await expect(page.locator('text=Total Sets')).toBeVisible();
    await expect(page.locator('text=Weight Lifted')).toBeVisible();
    await expect(page.locator('text=Total Reps')).toBeVisible();
    await expect(page.locator('text=Total RIR')).toBeVisible();
  });

  test('should handle work timer', async ({ page }) => {
    // Navigate to workout logger
    await page.click('button:has-text("Workout Logger")');
    await expect(page.locator('h2:has-text("Workout Logger")')).toBeVisible();
    
    // Check timer display
    await expect(page.locator('text=00:00')).toBeVisible();
    await expect(page.locator('text=Resting')).toBeVisible();
    
    // Start work timer
    await page.click('button:has-text("Start Work")');
    await expect(page.locator('text=Working')).toBeVisible();
    
    // Wait a moment
    await page.waitForTimeout(2000);
    
    // Stop work timer
    await page.click('button:has-text("Stop Work")');
    await expect(page.locator('text=Resting')).toBeVisible();
  });

  test('should filter workouts by search', async ({ page }) => {
    // Navigate to workout logger
    await page.click('button:has-text("Workout Logger")');
    await expect(page.locator('h2:has-text("Workout Logger")')).toBeVisible();
    
    // Wait for workouts to load
    await page.waitForSelector('input[placeholder="Search workouts..."]');
    
    // Search for specific workout
    await page.fill('input[placeholder="Search workouts..."]', 'Bench');
    
    // Check that only matching workouts are shown
    await expect(page.locator('button:has-text("Bench")')).toBeVisible();
  });

  test('should add workout attributes', async ({ page }) => {
    // Navigate to workout logger
    await page.click('button:has-text("Workout Logger")');
    await expect(page.locator('h2:has-text("Workout Logger")')).toBeVisible();
    
    // Wait for workouts to load and select one
    await page.waitForSelector('button:has-text("Test Workout")');
    await page.click('button:has-text("Test Workout")');
    
    // Add dropset attribute
    await page.click('button:has-text("Dropset")');
    
    // Check that attribute was added
    await expect(page.locator('text=Dropset')).toBeVisible();
    
    // Fill attribute details
    await page.fill('input[placeholder="Weight"]', '115');
    await page.fill('input[placeholder="Reps"]', '8');
    
    // Add pause attribute
    await page.click('button:has-text("Pause")');
    await expect(page.locator('text=Pause')).toBeVisible();
    
    // Fill pause details
    await page.fill('input[placeholder="Wait (s)"]', '3');
    await page.fill('input[placeholder="Reps"]', '5');
  });

  test('should reset muscle priorities to default', async ({ page }) => {
    // Stay on muscle priority tab
    await expect(page.locator('h2:has-text("Muscle Priority")')).toBeVisible();
    
    // Wait for muscle priorities to load
    await page.waitForSelector('input[type="range"]');
    
    // Change a priority
    const slider = page.locator('input[type="range"]').first();
    await slider.fill('95');
    
    // Reset to default
    await page.click('button:has-text("Reset to Default")');
    
    // Check that priority was reset to 80
    await expect(slider).toHaveValue('80');
  });

  test('should activate a split', async ({ page }) => {
    // Navigate to split creator
    await page.click('button:has-text("Split Creator")');
    await expect(page.locator('h2:has-text("Split Creator")')).toBeVisible();
    
    // Wait for splits to load
    await page.waitForSelector('button:has-text("Activate")');
    
    // Activate a split
    await page.click('button:has-text("Activate")');
    
    // Check for success message
    await expect(page.locator('text=Split activated successfully!')).toBeVisible();
  });

  test('should edit existing split', async ({ page }) => {
    // Navigate to split creator
    await page.click('button:has-text("Split Creator")');
    await expect(page.locator('h2:has-text("Split Creator")')).toBeVisible();
    
    // Wait for splits to load
    await page.waitForSelector('button:has-text("Edit")');
    
    // Edit a split
    await page.click('button:has-text("Edit")');
    
    // Check that form is populated
    await expect(page.locator('input[id="splitName"]')).toHaveValue('Test Push/Pull/Legs');
    
    // Update split name
    await page.fill('input[id="splitName"]', 'Updated Split Name');
    
    // Submit update
    await page.click('button:has-text("Update Split")');
    
    // Check for success message
    await expect(page.locator('text=Split updated successfully!')).toBeVisible();
  });

  test('should handle workout creation validation', async ({ page }) => {
    // Navigate to workout adder
    await page.click('button:has-text("Workout Adder")');
    await expect(page.locator('h2:has-text("Create New Workout")')).toBeVisible();
    
    // Try to submit empty form
    await page.click('button:has-text("Create Workout")');
    
    // Check for validation error
    await expect(page.locator('text=Workout name cannot be empty.')).toBeVisible();
  });

  test('should handle split creation validation', async ({ page }) => {
    // Navigate to split creator
    await page.click('button:has-text("Split Creator")');
    await expect(page.locator('h2:has-text("Split Creator")')).toBeVisible();
    
    // Try to submit empty form
    await page.click('button:has-text("Create Split")');
    
    // Check for validation error
    await expect(page.locator('text=Split name is required')).toBeVisible();
  });

  test('should handle workout logging validation', async ({ page }) => {
    // Navigate to workout logger
    await page.click('button:has-text("Workout Logger")');
    await expect(page.locator('h2:has-text("Workout Logger")')).toBeVisible();
    
    // Wait for workouts to load and select one
    await page.waitForSelector('button:has-text("Test Workout")');
    await page.click('button:has-text("Test Workout")');
    
    // Try to submit without required fields
    await page.click('button:has-text("Log Workout")');
    
    // Check for validation error
    await expect(page.locator('text=Weight and reps are required')).toBeVisible();
  });

  test('should display muscle analysis in split creator', async ({ page }) => {
    // Navigate to split creator
    await page.click('button:has-text("Split Creator")');
    await expect(page.locator('h2:has-text("Split Creator")')).toBeVisible();
    
    // Create a split with targets
    await page.fill('input[id="splitName"]', 'Analysis Test Split');
    await page.fill('input[placeholder="Day name (e.g., Push Day)"]', 'Push Day');
    await page.click('button:has-text("Add Day")');
    
    // Add muscle target
    await page.selectOption('select:has-text("Add muscle target")', '1');
    
    // Check that muscle analysis appears
    await expect(page.locator('text=Muscle Analysis')).toBeVisible();
    await expect(page.locator('text=Chest')).toBeVisible();
  });

  test('should handle date changes in workout log', async ({ page }) => {
    // Navigate to workout log
    await page.click('button:has-text("Workout Log")');
    await expect(page.locator('h2:has-text("Workout Log")')).toBeVisible();
    
    // Change date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]', tomorrowStr);
    
    // Check that date was updated
    await expect(page.locator('input[type="date"]')).toHaveValue(tomorrowStr);
  });
});
