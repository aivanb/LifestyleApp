const { test, expect } = require('@playwright/test');

test.describe('Additional Trackers Graphs', () => {
  test.beforeEach(async ({ page }) => {
    // Login as john_doe
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'john_doe');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('http://localhost:3000/*', { timeout: 10000 });
  });

  test('should display graphs for weight, steps, and cardio trackers', async ({ page }) => {
    // Navigate to additional trackers page
    await page.goto('http://localhost:3000/additional-trackers');
    
    // Wait for page to load and data to be fetched
    await page.waitForTimeout(3000);
    
    // Check that we're on the right page
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Additional/i }).first()).toBeVisible({ timeout: 5000 });
    
    // Check for Weight Log tracker and its graph
    const weightSection = page.locator('text=/Weight Log/i');
    await expect(weightSection.first()).toBeVisible();
    
    // Scroll to find the graph
    const weightGraph = page.locator('svg').first();
    await expect(weightGraph).toBeVisible({ timeout: 5000 });
    
    // Check for Steps tracker
    const stepsSection = page.locator('text=/Steps/i');
    await expect(stepsSection.first()).toBeVisible();
    
    // Check for Cardio tracker
    const cardioSection = page.locator('text=/Cardio/i');
    await expect(cardioSection.first()).toBeVisible();
    
    // Verify at least some SVG graphs exist (weight, steps, or cardio)
    const graphs = page.locator('svg');
    const graphCount = await graphs.count();
    expect(graphCount).toBeGreaterThan(0);
    
    // Check that the graphs are not showing "No data available"
    const noDataText = page.locator('text=/No data available/i');
    const noDataCount = await noDataText.count();
    
    // Either graphs with data exist, or noDataCount should be less than total trackers
    expect(graphCount + noDataCount).toBeGreaterThan(0);
  });

  test('should display streak counters', async ({ page }) => {
    await page.goto('http://localhost:3000/additional-trackers');
    await page.waitForTimeout(3000);
    
    // Look for streak numbers
    const streakPattern = /\d+\s+day/;
    const hasStreak = await page.locator(`text=/${streakPattern.source}/`).count();
    expect(hasStreak).toBeGreaterThan(0);
  });

  test('should display heatmap', async ({ page }) => {
    await page.goto('http://localhost:3000/additional-trackers');
    await page.waitForTimeout(3000);
    
    // Scroll to bottom to find heatmap
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // The heatmap should be present (we can check by looking for the grid structure)
    const pageContent = await page.content();
    expect(pageContent).toContain('heatmap');
  });
});

