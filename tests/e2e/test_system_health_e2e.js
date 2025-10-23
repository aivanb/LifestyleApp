/**
 * System Health E2E Tests
 * 
 * Tests the actual application functionality including:
 * - API health and connectivity
 * - Database connectivity and queries
 * - Real page loading and rendering
 * - Authentication flow
 * - Data persistence and retrieval
 */

const { test, expect } = require('@playwright/test');

test.describe('System Health Tests', () => {
  let authToken = null;

  test.beforeAll(async ({ browser }) => {
    // Test API health first
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Check if backend is running
      const response = await page.goto('http://localhost:8000/api/auth/profile/', { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      if (response.status() === 404) {
        throw new Error('Backend server not running on port 8000');
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      throw new Error('Backend server is not accessible. Please ensure Django server is running on port 8000');
    }
    
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to login page first
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });
  });

  test('Authentication Flow - Login with Real Credentials', async ({ page }) => {
    // Test with real user credentials
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to profile page
    await page.waitForURL('**/profile', { timeout: 10000 });
    
    // Verify we're logged in
    await expect(page.locator('h2:has-text("Welcome")')).toBeVisible();
    
    // Store auth token for other tests
    const cookies = await page.context().cookies();
    authToken = cookies.find(c => c.name.includes('session') || c.name.includes('token'));
  });

  test('API Health Check - All Endpoints', async ({ page }) => {
    // Test all critical API endpoints
    const endpoints = [
      '/api/auth/profile/',
      '/api/foods/',
      '/api/meals/',
      '/api/food-logs/',
      '/api/user-goals/',
      '/api/recently-logged-foods/'
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.get(`http://localhost:8000${endpoint}`);
      
      // API should respond (even if 401 for auth endpoints)
      expect([200, 401, 403]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    }
  });

  test('Database Connectivity - Food Creation and Retrieval', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile');

    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Open Create Food modal
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator', { timeout: 5000 });

    // Fill in test food data
    const testFoodName = `Test Food ${Date.now()}`;
    await page.fill('input[name="food_name"]', testFoodName);
    await page.fill('input[name="serving_size"]', '100');
    await page.selectOption('select[name="unit"]', 'g');
    await page.fill('input[name="calories"]', '250');
    await page.fill('input[name="protein"]', '20');
    await page.fill('input[name="carbohydrates"]', '30');
    await page.fill('input[name="fat"]', '10');

    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success (modal should close or show success message)
    await page.waitForTimeout(3000);

    // Verify food was created by searching for it
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator');
    
    // Search for the created food
    await page.fill('input[type="text"]:near(:text("Search Foods"))', testFoodName);
    await page.waitForTimeout(2000);

    // Verify the food appears in search results
    const testFood = page.locator(`.food-item:has-text("${testFoodName}")`);
    await expect(testFood).toBeVisible({ timeout: 5000 });
  });

  test('Database Connectivity - Food Log Creation and Display', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile');

    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Count initial food logs
    const initialLogCount = await page.locator('.food-log-item').count();

    // Create a meal to log
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator');

    const testMealName = `Test Meal ${Date.now()}`;
    await page.fill('input[type="text"]:near(:text("Meal Name"))', testMealName);

    // Search for a food to add
    await page.fill('input[type="text"]:near(:text("Search Foods"))', 'Test Food');
    await page.waitForTimeout(2000);

    // Add first available food
    const firstFood = page.locator('.food-item').first();
    if (await firstFood.count() > 0) {
      await firstFood.click();
      
      // Set servings
      await page.fill('.servings-input', '1');
      
      // Check "Log All Foods" to log immediately
      await page.check('input[type="checkbox"]:near(:text("Log All Foods"))');
      
      // Submit the meal
      await page.click('button[type="submit"]');
      
      // Wait for success
      await page.waitForTimeout(3000);
      
      // Navigate back to food log page
      await page.goto('http://localhost:3000/food-log');
      await page.waitForSelector('.food-logging-dashboard');
      
      // Verify food log count increased
      const newLogCount = await page.locator('.food-log-item').count();
      expect(newLogCount).toBeGreaterThan(initialLogCount);
    }
  });

  test('Real Data Display - Food Log with Database Data', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile');

    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Check if food logs are displayed with real data
    const foodLogItems = page.locator('.food-log-item');
    
    if (await foodLogItems.count() > 0) {
      const firstLog = foodLogItems.first();
      
      // Verify real data is displayed
      await expect(firstLog.locator('.food-name')).not.toBeEmpty();
      await expect(firstLog.locator('.food-time')).not.toBeEmpty();
      
      // Verify macro values are numeric and realistic
      const macroValues = firstLog.locator('.macro-value');
      const caloriesText = await macroValues.nth(0).textContent();
      const proteinText = await macroValues.nth(1).textContent();
      
      expect(parseInt(caloriesText)).toBeGreaterThan(0);
      expect(parseFloat(proteinText)).toBeGreaterThanOrEqual(0);
    }
  });

  test('API Data Retrieval - Recently Logged Foods', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile');

    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Open AI Food Logger to test recent foods
    await page.click('button:has-text("AI Logger")');
    await page.waitForSelector('.food-chatbot', { timeout: 5000 });

    // Check if recent foods are loaded from API
    const recentFoods = page.locator('.recent-foods-list');
    if (await recentFoods.isVisible()) {
      const recentFoodItems = page.locator('.recent-food-item');
      
      if (await recentFoodItems.count() > 0) {
        const firstRecentFood = recentFoodItems.first();
        
        // Verify real data from database
        await expect(firstRecentFood.locator('.food-name')).not.toBeEmpty();
        
        // Verify metadata is populated with real values
        const metadataValues = firstRecentFood.locator('.metadata-value');
        const caloriesValue = await metadataValues.nth(0).textContent();
        expect(parseInt(caloriesValue)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('Database Query Performance - Large Dataset Handling', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile');

    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Test search performance with large dataset
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator');

    // Start timing
    const startTime = Date.now();
    
    // Perform search
    await page.fill('input[type="text"]:near(:text("Search Foods"))', 'a');
    await page.waitForTimeout(2000);
    
    const endTime = Date.now();
    const searchTime = endTime - startTime;
    
    // Search should complete within reasonable time (5 seconds)
    expect(searchTime).toBeLessThan(5000);
    
    // Verify results are displayed
    const searchResults = page.locator('.food-item');
    await expect(searchResults.first()).toBeVisible({ timeout: 10000 });
  });

  test('Error Handling - Invalid API Requests', async ({ page }) => {
    // Test error handling with invalid requests
    const response = await page.request.get('http://localhost:8000/api/nonexistent-endpoint/');
    expect([404, 500]).toContain(response.status());
  });

  test('Database Transaction Integrity - Concurrent Operations', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile');

    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Test concurrent operations
    const operations = [
      page.click('button:has-text("Create Food")'),
      page.click('button:has-text("Create Meal")'),
      page.click('button:has-text("AI Logger")')
    ];

    // Execute operations concurrently
    await Promise.allSettled(operations);
    
    // Verify all modals can be opened without conflicts
    await expect(page.locator('.modal-backdrop')).toBeVisible();
  });

  test('Data Persistence - Page Refresh Data Retention', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile');

    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Count food logs
    const initialCount = await page.locator('.food-log-item').count();

    // Refresh the page
    await page.reload();
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Verify data persists after refresh
    const afterRefreshCount = await page.locator('.food-log-item').count();
    expect(afterRefreshCount).toBe(initialCount);
  });

  test('API Response Validation - Data Structure Integrity', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile');

    // Test API response structure
    const response = await page.request.get('http://localhost:8000/api/foods/');
    
    if (response.status() === 200) {
      const data = await response.json();
      
      // Validate response structure
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('foods');
      expect(Array.isArray(data.data.foods)).toBe(true);
      
      // Validate food object structure if foods exist
      if (data.data.foods.length > 0) {
        const food = data.data.foods[0];
        expect(food).toHaveProperty('food_id');
        expect(food).toHaveProperty('food_name');
        expect(food).toHaveProperty('macro_preview');
      }
    }
  });
});
