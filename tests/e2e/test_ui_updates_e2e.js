/**
 * E2E Tests for UI Updates with Real Database Integration
 * 
 * Tests the updated browser-based UI state including:
 * - Global styling for macro labels, input boxes, and buttons
 * - Front page updates (streak counter, macro labels, sorting)
 * - Create Food Menu updates (horizontal metadata layout)
 * - Create Meal Menu updates (right-side food display)
 * - AI Food Logger updates (recent foods, macro labels)
 * - Real database integration and API connectivity
 */

const { test, expect } = require('@playwright/test');

test.describe('UI Updates E2E Tests with Database Integration', () => {
  test.beforeEach(async ({ page }) => {
    // First check if backend is running
    try {
      const response = await page.request.get('http://localhost:8000/api/auth/profile/');
      if (![200, 401, 403].includes(response.status())) {
        throw new Error('Backend server not accessible');
      }
    } catch (error) {
      throw new Error('Backend server is not running. Please start Django server on port 8000');
    }

    // Navigate to login page first
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });

    // Login with test credentials
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to profile page
    await page.waitForURL('**/profile', { timeout: 10000 });

    // Navigate to the food log page
    await page.goto('http://localhost:3000/food-log');
    
    // Wait for the page to load with real data
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });
  });

  test('Front Page - Streak Counter Display', async ({ page }) => {
    // Check if streak counter is displayed
    await expect(page.locator('.streak-counter')).toBeVisible();
    await expect(page.locator('.streak-number')).toBeVisible();
    await expect(page.locator('.streak-label')).toHaveText('Day Streak');
  });

  test('Front Page - Macro Label Colors', async ({ page }) => {
    // Check if macro labels use correct colors
    const proteinLabels = page.locator('.macro-label-protein');
    const carbLabels = page.locator('.macro-label-carbohydrates');
    const fatLabels = page.locator('.macro-label-fats');

    if (await proteinLabels.count() > 0) {
      await expect(proteinLabels.first()).toHaveCSS('color', 'rgb(255, 215, 0)'); // #FFD700
    }
    
    if (await carbLabels.count() > 0) {
      await expect(carbLabels.first()).toHaveCSS('color', 'rgb(0, 0, 255)'); // #0000FF
    }
    
    if (await fatLabels.count() > 0) {
      await expect(fatLabels.first()).toHaveCSS('color', 'rgb(128, 0, 128)'); // #800080
    }
  });

  test('Front Page - Input Box Styling', async ({ page }) => {
    // Check if input boxes have correct styling
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toHaveCSS('background-color', 'rgb(248, 248, 248)'); // #f8f8f8
    await expect(dateInput).toHaveCSS('border', '1px solid rgb(204, 204, 204)'); // #ccc
  });

  test('Front Page - Action Buttons Enhancement', async ({ page }) => {
    // Check if action buttons are visible and properly styled
    const createFoodBtn = page.locator('button:has-text("Create Food")');
    const createMealBtn = page.locator('button:has-text("Create Meal")');
    const aiLoggerBtn = page.locator('button:has-text("AI Logger")');

    await expect(createFoodBtn).toBeVisible();
    await expect(createMealBtn).toBeVisible();
    await expect(aiLoggerBtn).toBeVisible();
  });

  test('Create Food Menu - Metadata Layout', async ({ page }) => {
    // Open Create Food modal
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator');

    // Check if metadata fields are in horizontal layout
    const horizontalGrid = page.locator('.form-grid-horizontal');
    await expect(horizontalGrid).toBeVisible();

    // Check if small input fields are used for metadata
    const smallInputs = page.locator('.form-input-small');
    await expect(smallInputs.first()).toHaveCSS('width', '120px');
  });

  test('Create Food Menu - Input Styling', async ({ page }) => {
    // Open Create Food modal
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator');

    // Check if inputs have correct styling
    const foodNameInput = page.locator('input[name="food_name"]');
    await expect(foodNameInput).toHaveCSS('background-color', 'rgb(248, 248, 248)');
    await expect(foodNameInput).toHaveCSS('border', '1px solid rgb(204, 204, 204)');
  });

  test('Create Meal Menu - Right Side Layout', async ({ page }) => {
    // Open Create Meal modal
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator');

    // Check if right side layout exists
    const rightSide = page.locator('.meal-creator-right');
    await expect(rightSide).toBeVisible();

    // Check if available foods are displayed
    const availableFoods = page.locator('.food-list');
    await expect(availableFoods).toBeVisible();
  });

  test('Create Meal Menu - Macro Label Colors', async ({ page }) => {
    // Open Create Meal modal
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator');

    // Check if macro labels in meal creator use correct colors
    const proteinLabels = page.locator('.macro-label-protein');
    if (await proteinLabels.count() > 0) {
      await expect(proteinLabels.first()).toHaveCSS('color', 'rgb(255, 215, 0)');
    }
  });

  test('Create Meal Menu - Log All Foods Position', async ({ page }) => {
    // Open Create Meal modal
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator');

    // Check if "Log All Foods" checkbox is at the top
    const logAllCheckbox = page.locator('input[type="checkbox"]:near(:text("Log All Foods"))');
    await expect(logAllCheckbox).toBeVisible();
  });

  test('AI Food Logger - Recent Foods Display', async ({ page }) => {
    // Open AI Food Logger modal
    await page.click('button:has-text("AI Logger")');
    await page.waitForSelector('.food-chatbot');

    // Check if recent foods section exists
    const recentFoods = page.locator('.recent-foods-list');
    await expect(recentFoods).toBeVisible();

    // Check if macro labels in recent foods use correct colors
    const proteinLabels = page.locator('.macro-label-protein');
    if (await proteinLabels.count() > 0) {
      await expect(proteinLabels.first()).toHaveCSS('color', 'rgb(255, 215, 0)');
    }
  });

  test('AI Food Logger - Stats Tooltips', async ({ page }) => {
    // Open AI Food Logger modal
    await page.click('button:has-text("AI Logger")');
    await page.waitForSelector('.food-chatbot');

    // Check if stats show tooltip text
    const promptsLabel = page.locator('.stat-label:has-text("Prompts Sent")');
    const tokensLabel = page.locator('.stat-label:has-text("Tokens Used")');

    await expect(promptsLabel).toContainText('past 10 days');
    await expect(tokensLabel).toContainText('past 10 days');
  });

  test('AI Food Logger - Voice Input Integration', async ({ page }) => {
    // Open AI Food Logger modal
    await page.click('button:has-text("AI Logger")');
    await page.waitForSelector('.food-chatbot');

    // Check if voice input button exists
    const voiceButton = page.locator('button[title*="Voice Input"]');
    await expect(voiceButton).toBeVisible();
  });

  test('Database Integration - Food Log Display', async ({ page }) => {
    // Check if food log displays real data from database
    const foodLogItems = page.locator('.food-log-item');
    
    // If there are food log items, verify they display real data
    if (await foodLogItems.count() > 0) {
      const firstItem = foodLogItems.first();
      await expect(firstItem.locator('.food-name')).not.toBeEmpty();
      await expect(firstItem.locator('.food-time')).not.toBeEmpty();
    }
  });

  test('Database Integration - Macro Calculations', async ({ page }) => {
    // Check if macro values are calculated correctly
    const macroValues = page.locator('.macro-value');
    
    if (await macroValues.count() > 0) {
      // Verify macro values are numeric
      const firstValue = await macroValues.first().textContent();
      expect(parseFloat(firstValue)).not.toBeNaN();
    }
  });

  test('Responsive Design - Mobile Layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if mobile layout is displayed
    const mobileLayout = page.locator('.dashboard-layout-mobile');
    await expect(mobileLayout).toBeVisible();

    // Check if PC layout is hidden
    const pcLayout = page.locator('.dashboard-layout-pc');
    await expect(pcLayout).not.toBeVisible();
  });

  test('Responsive Design - Desktop Layout', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });

    // Check if PC layout is displayed
    const pcLayout = page.locator('.dashboard-layout-pc');
    await expect(pcLayout).toBeVisible();

    // Check if mobile layout is hidden
    const mobileLayout = page.locator('.dashboard-layout-mobile');
    await expect(mobileLayout).not.toBeVisible();
  });

  test('Sorting Functionality - Descending Order', async ({ page }) => {
    // Check if food logs are sorted in descending order (newest first)
    const foodLogItems = page.locator('.food-log-item');
    
    if (await foodLogItems.count() > 1) {
      const firstTime = await foodLogItems.nth(0).locator('.food-time').textContent();
      const secondTime = await foodLogItems.nth(1).locator('.food-time').textContent();
      
      // Convert time strings to comparable format
      const time1 = new Date(`2000-01-01 ${firstTime}`);
      const time2 = new Date(`2000-01-01 ${secondTime}`);
      
      expect(time1.getTime()).toBeGreaterThanOrEqual(time2.getTime());
    }
  });

  test('Accessibility - Keyboard Navigation', async ({ page }) => {
    // Test keyboard navigation through main buttons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Error Handling - Network Issues', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort());

    // Try to open Create Food modal
    await page.click('button:has-text("Create Food")');
    
    // Check if error handling works
    await page.waitForTimeout(1000);
    // The modal should still open even if API calls fail
    await expect(page.locator('.food-creator')).toBeVisible();
  });
});

test.describe('Database Verification Tests with Real API Integration', () => {
  test('Verify Food Data Creation and Retrieval in Database', async ({ page }) => {
    // First check if backend is running
    try {
      const response = await page.request.get('http://localhost:8000/api/auth/profile/');
      if (![200, 401, 403].includes(response.status())) {
        throw new Error('Backend server not accessible');
      }
    } catch (error) {
      throw new Error('Backend server is not running. Please start Django server on port 8000');
    }

    // Login first
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Open Create Food modal to add test data
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator', { timeout: 5000 });

    // Fill in test food data with unique timestamp
    const timestamp = Date.now();
    const testFoodName = `Test Food E2E ${timestamp}`;
    await page.fill('input[name="food_name"]', testFoodName);
    await page.fill('input[name="serving_size"]', '100');
    await page.selectOption('select[name="unit"]', 'g');
    await page.fill('input[name="calories"]', '250');
    await page.fill('input[name="protein"]', '20');
    await page.fill('input[name="carbohydrates"]', '30');
    await page.fill('input[name="fat"]', '10');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for success and modal to close
    await page.waitForTimeout(3000);

    // Verify the food appears in the database by checking if it shows up in search
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator', { timeout: 5000 });
    
    // Search for the test food
    await page.fill('input[type="text"]:near(:text("Search Foods"))', testFoodName);
    await page.waitForTimeout(2000);

    // Verify the food appears in search results
    const testFood = page.locator(`.food-item:has-text("${testFoodName}")`);
    await expect(testFood).toBeVisible({ timeout: 10000 });

    // Verify the food data is correctly displayed
    await expect(testFood.locator('.food-name')).toHaveText(testFoodName);
    
    // Verify macro data is displayed correctly
    const macroValues = testFood.locator('.metadata-value');
    await expect(macroValues.nth(0)).toHaveText('250'); // Calories
    await expect(macroValues.nth(1)).toHaveText('20g'); // Protein
  });

  test('Verify Meal Creation in Database', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard');

    // Open Create Meal modal
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator');

    // Fill meal name
    await page.fill('input[type="text"]:near(:text("Meal Name"))', 'Test Meal E2E');

    // Search for and add a food
    await page.fill('input[type="text"]:near(:text("Search Foods"))', 'Test Food E2E');
    await page.waitForTimeout(1000);
    
    const testFood = page.locator('.food-item:has-text("Test Food E2E")');
    if (await testFood.count() > 0) {
      await testFood.click();
      
      // Set servings
      await page.fill('.servings-input', '2');
      
      // Submit the meal
      await page.click('button[type="submit"]');
      
      // Wait for success
      await page.waitForTimeout(2000);
      
      // Verify meal was created (check if it appears in food logger)
      await page.click('button:has-text("Create Meal")');
      await page.waitForSelector('.meal-creator');
      
      // Search for the meal
      await page.fill('input[type="text"]:near(:text("Search Foods"))', 'Test Meal E2E');
      await page.waitForTimeout(1000);
      
      // The meal should appear in search results
      const testMeal = page.locator('.food-item:has-text("Test Meal E2E")');
      await expect(testMeal).toBeVisible();
    }
  });
});
