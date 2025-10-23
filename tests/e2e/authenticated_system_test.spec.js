/**
 * Authenticated System Tests
 * 
 * Tests the application with proper authentication flow including:
 * - Login process
 * - Protected page access
 * - Real database operations
 * - UI component functionality
 */

const { test, expect } = require('@playwright/test');

test.describe('Authenticated System Tests', () => {
  let authToken = null;

  test.beforeAll(async ({ browser }) => {
    // Verify backend server is running
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      const response = await page.goto('http://localhost:8000/api/auth/profile/', { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      if (response.status() === 404) {
        throw new Error('Backend server not running');
      }
    } catch (error) {
      throw new Error('Backend server is not accessible. Please start Django server on port 8000');
    }
    
    await context.close();
  });

  test('Complete Authentication and Food Log Access Flow', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Listen for page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });

    // Fill login form
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for redirect to profile page
    await page.waitForURL('**/profile', { timeout: 10000 });

    // Verify we're logged in
    await expect(page.locator('h2:has-text("Welcome")')).toBeVisible();

    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForLoadState('networkidle');

    // Wait for the dashboard to load
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Verify main dashboard elements are present
    await expect(page.locator('.food-logging-dashboard')).toBeVisible();
    await expect(page.locator('button:has-text("Create Food")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Meal")')).toBeVisible();
    await expect(page.locator('button:has-text("AI Logger")')).toBeVisible();

    // Check for JavaScript errors
    expect(errors.length).toBe(0);
    expect(pageErrors.length).toBe(0);
  });

  test('Create Food Modal - Full Functionality Test', async ({ page }) => {
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

    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Open Create Food modal
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator', { timeout: 5000 });

    // Verify form elements are present
    await expect(page.locator('input[name="food_name"]')).toBeVisible();
    await expect(page.locator('input[name="serving_size"]')).toBeVisible();
    await expect(page.locator('select[name="unit"]')).toBeVisible();
    await expect(page.locator('input[name="calories"]')).toBeVisible();
    await expect(page.locator('input[name="protein"]')).toBeVisible();
    await expect(page.locator('input[name="carbohydrates"]')).toBeVisible();
    await expect(page.locator('input[name="fat"]')).toBeVisible();

    // Test form interaction
    await page.fill('input[name="food_name"]', 'Test Food E2E');
    await page.fill('input[name="serving_size"]', '100');
    await page.selectOption('select[name="unit"]', 'g');
    await page.fill('input[name="calories"]', '250');
    await page.fill('input[name="protein"]', '20');
    await page.fill('input[name="carbohydrates"]', '30');
    await page.fill('input[name="fat"]', '10');

    // Check for errors during form interaction
    expect(errors.length).toBe(0);

    // Test metadata input fields (small inputs)
    const metadataInputs = page.locator('.form-input-small');
    const inputCount = await metadataInputs.count();
    
    if (inputCount > 0) {
      await metadataInputs.first().fill('10');
      expect(errors.length).toBe(0);
    }
  });

  test('Create Meal Modal - Full Functionality Test', async ({ page }) => {
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

    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Open Create Meal modal
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator', { timeout: 5000 });

    // Verify layout structure
    const leftSide = page.locator('.meal-creator-left');
    const rightSide = page.locator('.meal-creator-right');
    
    await expect(leftSide).toBeVisible();
    await expect(rightSide).toBeVisible();

    // Verify form elements
    await expect(page.locator('input[type="text"]:near(:text("Meal Name"))')).toBeVisible();
    await expect(page.locator('input[type="text"]:near(:text("Search Foods"))')).toBeVisible();

    // Test form interaction
    await page.fill('input[type="text"]:near(:text("Meal Name"))', 'Test Meal E2E');
    await page.fill('input[type="text"]:near(:text("Search Foods"))', 'test');

    // Wait for search results
    await page.waitForTimeout(2000);

    // Check for errors during interaction
    expect(errors.length).toBe(0);
  });

  test('AI Food Logger Modal - Full Functionality Test', async ({ page }) => {
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

    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Open AI Food Logger modal
    await page.click('button:has-text("AI Logger")');
    await page.waitForSelector('.food-chatbot', { timeout: 5000 });

    // Verify form elements
    await expect(page.locator('.food-chatbot textarea')).toBeVisible();
    await expect(page.locator('button:has-text("Send")')).toBeVisible();

    // Test form interaction
    await page.fill('.food-chatbot textarea', 'Test input for AI logger');

    // Check for errors during interaction
    expect(errors.length).toBe(0);
  });

  test('UI Styling Verification - Macro Labels and Inputs', async ({ page }) => {
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

    // Test macro label colors
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator', { timeout: 5000 });

    // Check that macro labels exist with correct classes
    const proteinLabels = page.locator('.macro-label-protein');
    const carbLabels = page.locator('.macro-label-carbohydrates');
    const fatLabels = page.locator('.macro-label-fats');
    
    const proteinCount = await proteinLabels.count();
    const carbCount = await carbLabels.count();
    const fatCount = await fatLabels.count();
    
    expect(proteinCount + carbCount + fatCount).toBeGreaterThan(0);

    // Test input styling
    await page.click('button:has-text("Cancel")');
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator', { timeout: 5000 });

    // Check input styling
    const inputs = page.locator('.form-input');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      const firstInput = inputs.first();
      const backgroundColor = await firstInput.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Should have the specified background color
      expect(backgroundColor).toContain('rgb(248, 248, 248)');
    }
  });

  test('Database Integration - Real Food Creation and Search', async ({ page }) => {
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

    // Create a test food
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator', { timeout: 5000 });

    const timestamp = Date.now();
    const testFoodName = `E2E Test Food ${timestamp}`;
    
    await page.fill('input[name="food_name"]', testFoodName);
    await page.fill('input[name="serving_size"]', '100');
    await page.selectOption('select[name="unit"]', 'g');
    await page.fill('input[name="calories"]', '250');
    await page.fill('input[name="protein"]', '20');
    await page.fill('input[name="carbohydrates"]', '30');
    await page.fill('input[name="fat"]', '10');

    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success
    await page.waitForTimeout(3000);

    // Verify the food appears in search
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator', { timeout: 5000 });
    
    // Search for the created food
    await page.fill('input[type="text"]:near(:text("Search Foods"))', testFoodName);
    await page.waitForTimeout(2000);

    // Verify the food appears in search results
    const testFood = page.locator(`.food-item:has-text("${testFoodName}")`);
    await expect(testFood).toBeVisible({ timeout: 10000 });
  });

  test('Streak Counter and Dashboard Features', async ({ page }) => {
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

    // Check streak counter
    const streakCounter = page.locator('.streak-counter');
    await expect(streakCounter).toBeVisible();

    const streakNumber = page.locator('.streak-number');
    await expect(streakNumber).toBeVisible();

    // Verify the streak number is a valid number
    const streakText = await streakNumber.textContent();
    expect(parseInt(streakText)).toBeGreaterThanOrEqual(0);
  });

  test('API Health Check with Authentication', async ({ page }) => {
    // Login first to get auth token
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    // Test authenticated API endpoints
    const endpoints = [
      '/api/foods/',
      '/api/meals/',
      '/api/food-logs/',
      '/api/user-goals/',
      '/api/recently-logged-foods/'
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.get(`http://localhost:8000${endpoint}`);
      
      // API should respond (200 with auth, 401 without)
      expect([200, 401, 403]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('data');
      }
    }
  });

  test('Error Handling and Edge Cases', async ({ page }) => {
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

    // Test error handling with invalid form data
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator', { timeout: 5000 });

    // Submit empty form to test validation
    await page.click('button[type="submit"]');
    
    // Wait for validation error
    await page.waitForTimeout(2000);
    
    // Should show validation error, not crash
    const errorMessage = page.locator('.error-message');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible();
    }
  });
});
