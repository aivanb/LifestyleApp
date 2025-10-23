/**
 * Debug Login Test
 * 
 * Simple test to debug the login flow and see what's actually happening
 */

const { test, expect } = require('@playwright/test');

test.describe('Debug Login Test', () => {
  test('Debug Login Flow', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form', { timeout: 10000 });

    // Check what's on the login page
    console.log('Login page title:', await page.title());
    
    // Check if form elements exist
    const usernameInput = page.locator('input[name="username"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    console.log('Username input exists:', await usernameInput.count());
    console.log('Password input exists:', await passwordInput.count());
    console.log('Submit button exists:', await submitButton.count());

    // Fill login form
    await usernameInput.fill('testuser');
    await passwordInput.fill('testpass123');

    // Submit login form
    await submitButton.click();

    // Wait a bit and check where we are
    await page.waitForTimeout(3000);
    
    console.log('Current URL after login:', page.url());
    console.log('Page title after login:', await page.title());
    
    // Check for any errors
    console.log('Console errors:', errors);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-login.png' });
    
    // Check if we're on dashboard
    const dashboardTitle = page.locator('h1:has-text("Dashboard")');
    const dashboardCount = await dashboardTitle.count();
    console.log('Dashboard title found:', dashboardCount);
    
    if (dashboardCount > 0) {
      console.log('SUCCESS: Login worked and we are on dashboard');
    } else {
      console.log('FAILED: Login did not work or we are not on dashboard');
      
      // Check what elements are actually visible
      const allH1s = page.locator('h1');
      const h1Count = await allH1s.count();
      console.log('Total H1 elements:', h1Count);
      
      for (let i = 0; i < h1Count; i++) {
        const text = await allH1s.nth(i).textContent();
        console.log(`H1 ${i}: "${text}"`);
      }
    }
  });
});
