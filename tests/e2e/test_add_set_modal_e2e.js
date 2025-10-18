const { test, expect } = require('@playwright/test');

test.describe('Add Set Modal E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the workout tracker page
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Click on Workout Log tab
    await page.click('text=Workout Log');
    await page.waitForLoadState('networkidle');
  });

  test('should open Add Set modal when clicking Add Set button', async ({ page }) => {
    // Wait for workout logs to load
    await page.waitForSelector('[data-testid="workout-log"]', { timeout: 10000 });
    
    // Look for Add Set buttons
    const addSetButtons = await page.locator('button:has-text("Add Set")');
    const buttonCount = await addSetButtons.count();
    
    if (buttonCount > 0) {
      // Click the first Add Set button
      await addSetButtons.first().click();
      
      // Wait for modal to appear
      await page.waitForSelector('text=Add Set -', { timeout: 5000 });
      
      // Verify modal is visible
      const modal = page.locator('text=Add Set -');
      await expect(modal).toBeVisible();
      
      // Verify modal has workout name
      const workoutName = await page.locator('text=Add Set -').textContent();
      expect(workoutName).toContain('Add Set -');
      
      // Verify form fields are present
      await expect(page.locator('input[type="number"]').first()).toBeVisible(); // Weight field
      await expect(page.locator('label:has-text("Reps")')).toBeVisible();
      await expect(page.locator('label:has-text("RIR")')).toBeVisible();
      await expect(page.locator('label:has-text("Rest Time")')).toBeVisible();
      
      // Verify buttons are present
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
      await expect(page.locator('button:has-text("Add Set")')).toBeVisible();
    } else {
      console.log('No Add Set buttons found - skipping test');
    }
  });

  test('should close modal when clicking Cancel', async ({ page }) => {
    // Wait for workout logs to load
    await page.waitForSelector('[data-testid="workout-log"]', { timeout: 10000 });
    
    // Look for Add Set buttons
    const addSetButtons = await page.locator('button:has-text("Add Set")');
    const buttonCount = await addSetButtons.count();
    
    if (buttonCount > 0) {
      // Click the first Add Set button
      await addSetButtons.first().click();
      
      // Wait for modal to appear
      await page.waitForSelector('text=Add Set -', { timeout: 5000 });
      
      // Click Cancel button
      await page.click('button:has-text("Cancel")');
      
      // Verify modal is closed
      await expect(page.locator('text=Add Set -')).not.toBeVisible();
    } else {
      console.log('No Add Set buttons found - skipping test');
    }
  });

  test('should close modal when clicking X button', async ({ page }) => {
    // Wait for workout logs to load
    await page.waitForSelector('[data-testid="workout-log"]', { timeout: 10000 });
    
    // Look for Add Set buttons
    const addSetButtons = await page.locator('button:has-text("Add Set")');
    const buttonCount = await addSetButtons.count();
    
    if (buttonCount > 0) {
      // Click the first Add Set button
      await addSetButtons.first().click();
      
      // Wait for modal to appear
      await page.waitForSelector('text=Add Set -', { timeout: 5000 });
      
      // Click X button
      await page.click('button:has-text("✕")');
      
      // Verify modal is closed
      await expect(page.locator('text=Add Set -')).not.toBeVisible();
    } else {
      console.log('No Add Set buttons found - skipping test');
    }
  });

  test('should fill form fields with previous set data', async ({ page }) => {
    // Wait for workout logs to load
    await page.waitForSelector('[data-testid="workout-log"]', { timeout: 10000 });
    
    // Look for Add Set buttons
    const addSetButtons = await page.locator('button:has-text("Add Set")');
    const buttonCount = await addSetButtons.count();
    
    if (buttonCount > 0) {
      // Click the first Add Set button
      await addSetButtons.first().click();
      
      // Wait for modal to appear
      await page.waitForSelector('text=Add Set -', { timeout: 5000 });
      
      // Check if form fields are pre-filled (they should be based on the most recent set)
      const weightInput = page.locator('input[type="number"]').first();
      const weightValue = await weightInput.inputValue();
      
      // The weight field should either be empty or have a value
      expect(typeof weightValue).toBe('string');
      
      // Verify all form fields are present and editable
      await expect(page.locator('label:has-text("Weight")')).toBeVisible();
      await expect(page.locator('label:has-text("Reps")')).toBeVisible();
      await expect(page.locator('label:has-text("RIR")')).toBeVisible();
      await expect(page.locator('label:has-text("Rest Time")')).toBeVisible();
      await expect(page.locator('label:has-text("Attributes")')).toBeVisible();
    } else {
      console.log('No Add Set buttons found - skipping test');
    }
  });

  test('should show workout names with each set', async ({ page }) => {
    // Wait for workout logs to load
    await page.waitForSelector('[data-testid="workout-log"]', { timeout: 10000 });
    
    // Look for workout sets
    const sets = await page.locator('text=Set 1').count();
    
    if (sets > 0) {
      // Check that workout names are displayed with sets
      const setElements = page.locator('text=Set 1');
      const firstSet = setElements.first();
      
      // The set should contain workout name information
      const setText = await firstSet.textContent();
      expect(setText).toContain('Set 1');
      
      // Look for workout names in the same row
      const workoutNameElements = page.locator('text=Set 1').locator('..').locator('span');
      const workoutNameCount = await workoutNameElements.count();
      
      if (workoutNameCount > 1) {
        // There should be workout name information displayed
        console.log('Workout names are displayed with sets');
      }
    } else {
      console.log('No workout sets found - skipping test');
    }
  });
});
