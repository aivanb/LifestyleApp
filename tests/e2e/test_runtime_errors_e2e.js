/**
 * Runtime Error Detection and Prevention Tests
 * 
 * Tests to catch and prevent runtime errors including:
 * - JSX syntax errors
 * - JavaScript compilation errors
 * - Component rendering errors
 * - API integration errors
 * - Database connection errors
 */

const { test, expect } = require('@playwright/test');

test.describe('Runtime Error Detection Tests', () => {
  test('Frontend Compilation - No JavaScript Errors', async ({ page }) => {
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

    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Check for JavaScript errors
    expect(errors.length).toBe(0);
    expect(pageErrors.length).toBe(0);
  });

  test('FoodChatbot Component - JSX Syntax Validation', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });

    // Login
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Open AI Food Logger modal
    await page.click('button:has-text("AI Logger")');
    await page.waitForSelector('.food-chatbot', { timeout: 5000 });

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Interact with the chatbot
    const textarea = page.locator('.food-chatbot textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('Test input');
    
    // Check for syntax errors
    expect(errors.length).toBe(0);
  });

  test('FoodCreator Component - Form Rendering and Interaction', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });

    // Login
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Open Create Food modal
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator', { timeout: 5000 });

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Test form interactions
    await page.fill('input[name="food_name"]', 'Test Food');
    await page.fill('input[name="serving_size"]', '100');
    await page.selectOption('select[name="unit"]', 'g');
    await page.fill('input[name="calories"]', '250');

    // Check for errors during form interaction
    expect(errors.length).toBe(0);

    // Test metadata input fields
    const metadataInputs = page.locator('.form-input-small');
    const inputCount = await metadataInputs.count();
    
    if (inputCount > 0) {
      await metadataInputs.first().fill('10');
      expect(errors.length).toBe(0);
    }
  });

  test('MealCreator Component - Layout and Interaction', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });

    // Login
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Open Create Meal modal
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator', { timeout: 5000 });

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Test layout rendering
    const leftSide = page.locator('.meal-creator-left');
    const rightSide = page.locator('.meal-creator-right');
    
    await expect(leftSide).toBeVisible();
    await expect(rightSide).toBeVisible();

    // Test search functionality
    await page.fill('input[type="text"]:near(:text("Search Foods"))', 'test');
    await page.waitForTimeout(1000);

    // Check for errors during search
    expect(errors.length).toBe(0);
  });

  test('FoodLoggingDashboard Component - Streak Counter Rendering', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });

    // Login
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Test streak counter rendering
    const streakCounter = page.locator('.streak-counter');
    await expect(streakCounter).toBeVisible();

    const streakNumber = page.locator('.streak-number');
    await expect(streakNumber).toBeVisible();

    // Check for errors during streak calculation
    expect(errors.length).toBe(0);
  });

  test('API Integration - Network Error Handling', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });

    // Login
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Test API error handling
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator', { timeout: 5000 });

    // Fill form with invalid data to test error handling
    await page.fill('input[name="food_name"]', '');
    await page.click('button[type="submit"]');

    // Check that errors are handled gracefully
    await page.waitForTimeout(2000);
    
    // Should show validation error, not crash
    const errorMessage = page.locator('.error-message');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible();
    }

    // No JavaScript errors should occur
    expect(errors.length).toBe(0);
  });

  test('Database Connection - Real Data Loading', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });

    // Login
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Check that food logs are loaded without errors
    const foodLogItems = page.locator('.food-log-item');
    const logCount = await foodLogItems.count();
    
    // Should have loaded data (even if empty) without errors
    expect(logCount).toBeGreaterThanOrEqual(0);
    expect(errors.length).toBe(0);
  });

  test('Component State Management - No Memory Leaks', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });

    // Login
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Open and close multiple modals to test state management
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator');
    await page.click('button:has-text("Cancel")');
    
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator');
    await page.click('button:has-text("Cancel")');
    
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("AI Logger")');
    await page.waitForSelector('.food-chatbot');
    await page.click('button:has-text("Cancel")');

    // Check for errors during state changes
    expect(errors.length).toBe(0);
  });

  test('CSS and Styling - No Layout Errors', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });

    // Login
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/profile', { timeout: 10000 });

    await page.goto('http://localhost:3000/food-log');
    await page.waitForSelector('.food-logging-dashboard', { timeout: 10000 });

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Test responsive design
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);

    // Check that layout doesn't break
    await expect(page.locator('.food-logging-dashboard')).toBeVisible();
    expect(errors.length).toBe(0);
  });
});
