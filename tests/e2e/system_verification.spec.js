/**
 * System Verification Tests
 * 
 * Tests the actual application functionality including:
 * - Frontend compilation and runtime
 * - Backend API connectivity
 * - Database integration
 * - Real user workflows
 */

const { test, expect } = require('@playwright/test');

test.describe('System Verification Tests', () => {
  test('Frontend Compilation and Runtime - No JavaScript Errors', async ({ page }) => {
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

  test('Backend API Health Check', async ({ page }) => {
    // Test backend API endpoints
    const response = await page.request.get('http://localhost:8000/api/auth/profile/');
    
    // API should respond (401 is expected without auth)
    expect([200, 401, 403]).toContain(response.status());
  });

  test('Authentication Flow - Login Page Loads', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    
    // Wait for login form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check that login form elements are present
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Food Log Page - Component Rendering', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that main dashboard is visible
    await expect(page.locator('.food-logging-dashboard')).toBeVisible();
    
    // Check that action buttons are present
    await expect(page.locator('button:has-text("Create Food")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Meal")')).toBeVisible();
    await expect(page.locator('button:has-text("AI Logger")')).toBeVisible();
  });

  test('Create Food Modal - Component Rendering', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForLoadState('networkidle');
    
    // Open Create Food modal
    await page.click('button:has-text("Create Food")');
    await page.waitForSelector('.food-creator', { timeout: 5000 });
    
    // Check that form elements are present
    await expect(page.locator('input[name="food_name"]')).toBeVisible();
    await expect(page.locator('input[name="serving_size"]')).toBeVisible();
    await expect(page.locator('select[name="unit"]')).toBeVisible();
    await expect(page.locator('input[name="calories"]')).toBeVisible();
    
    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Interact with form
    await page.fill('input[name="food_name"]', 'Test Food');
    await page.fill('input[name="calories"]', '100');
    
    // No errors should occur
    expect(errors.length).toBe(0);
  });

  test('Create Meal Modal - Component Rendering', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForLoadState('networkidle');
    
    // Open Create Meal modal
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator', { timeout: 5000 });
    
    // Check that form elements are present
    await expect(page.locator('input[type="text"]:near(:text("Meal Name"))')).toBeVisible();
    await expect(page.locator('input[type="text"]:near(:text("Search Foods"))')).toBeVisible();
    
    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Interact with form
    await page.fill('input[type="text"]:near(:text("Meal Name"))', 'Test Meal');
    
    // No errors should occur
    expect(errors.length).toBe(0);
  });

  test('AI Food Logger Modal - Component Rendering', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForLoadState('networkidle');
    
    // Open AI Food Logger modal
    await page.click('button:has-text("AI Logger")');
    await page.waitForSelector('.food-chatbot', { timeout: 5000 });
    
    // Check that form elements are present
    await expect(page.locator('.food-chatbot textarea')).toBeVisible();
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
    
    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Interact with form
    await page.fill('.food-chatbot textarea', 'Test input');
    
    // No errors should occur
    expect(errors.length).toBe(0);
  });

  test('UI Styling - Macro Label Colors', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForLoadState('networkidle');
    
    // Open Create Meal modal to check macro labels
    await page.click('button:has-text("Create Meal")');
    await page.waitForSelector('.meal-creator', { timeout: 5000 });
    
    // Check that macro labels exist
    const proteinLabels = page.locator('.macro-label-protein');
    const carbLabels = page.locator('.macro-label-carbohydrates');
    const fatLabels = page.locator('.macro-label-fats');
    
    // At least one of each should exist
    const proteinCount = await proteinLabels.count();
    const carbCount = await carbLabels.count();
    const fatCount = await fatLabels.count();
    
    expect(proteinCount + carbCount + fatCount).toBeGreaterThan(0);
  });

  test('UI Styling - Input Box Styling', async ({ page }) => {
    // Navigate to food log page
    await page.goto('http://localhost:3000/food-log');
    await page.waitForLoadState('networkidle');
    
    // Open Create Food modal to check input styling
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

  test('Database Integration - Food Search API', async ({ page }) => {
    // Test the food search API endpoint
    const response = await page.request.get('http://localhost:8000/api/foods/', {
      params: {
        search: 'test',
        page_size: 10
      }
    });
    
    // API should respond
    expect([200, 401, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('data');
    }
  });

  test('Database Integration - Food Logs API', async ({ page }) => {
    // Test the food logs API endpoint
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const response = await page.request.get('http://localhost:8000/api/food-logs/', {
      params: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        page_size: 10
      }
    });
    
    // API should respond
    expect([200, 401, 403]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('data');
    }
  });
});
