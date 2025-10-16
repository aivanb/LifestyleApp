const { test, expect } = require('@playwright/test');

test.describe('Profile System E2E Tests', () => {
  let page;
  let testUser;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Create test user
    testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpass123',
      height: 175,
      birthday: '1990-01-01',
      gender: 'male'
    };

    // Register user
    await page.goto('/register');
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to profile
    await page.waitForURL('/profile');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('complete profile workflow', async () => {
    // 1. Verify profile page loads
    await expect(page.locator('h1')).toContainText(testUser.username);
    await expect(page.locator('.fitness-rank')).toBeVisible();

    // 2. Test Personal Information tab
    await page.click('text=Personal Info');
    await expect(page.locator('text=Personal Information')).toBeVisible();
    
    // Edit personal information
    await page.click('text=Edit');
    await page.fill('input[name="height"]', '180');
    await page.selectOption('select[name="gender"]', 'female');
    await page.click('text=Save Changes');
    
    // Verify update
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();

    // 3. Test Goals tab
    await page.click('text=Goals');
    await expect(page.locator('text=Goals & Macros')).toBeVisible();
    
    // Test macro calculator
    await page.fill('input[placeholder*="Target Weight"]', '65');
    await page.fill('input[placeholder*="Timeframe"]', '12');
    await page.click('text=Calculate');
    
    // Wait for calculation results
    await expect(page.locator('text=Calculated Macros')).toBeVisible();
    await expect(page.locator('text=Calories')).toBeVisible();
    await expect(page.locator('text=Protein')).toBeVisible();
    
    // Apply calculated macros
    await page.click('text=Apply to Goals');
    await expect(page.locator('text=Goals updated successfully')).toBeVisible();

    // Edit goals manually
    await page.click('text=Edit Goals');
    await page.fill('input[name="weight_goal"]', '70');
    await page.fill('input[name="calories_goal"]', '2200');
    await page.click('text=Save Goals');
    
    // Verify goals update
    await expect(page.locator('text=Goals updated successfully')).toBeVisible();

    // 4. Test Body Metrics tab
    await page.click('text=Body Metrics');
    await expect(page.locator('text=Body Metrics')).toBeVisible();
    
    // Verify metrics are displayed
    await expect(page.locator('text=BMI')).toBeVisible();
    await expect(page.locator('text=BMR')).toBeVisible();
    await expect(page.locator('text=TDEE')).toBeVisible();
    await expect(page.locator('text=Current Rank:')).toBeVisible();

    // 5. Test History tab
    await page.click('text=History');
    await expect(page.locator('text=Historical Data')).toBeVisible();
    
    // Verify historical data sections
    await expect(page.locator('text=Total Weight Change')).toBeVisible();
    await expect(page.locator('text=Weekly Recommendation')).toBeVisible();
    await expect(page.locator('text=Weight Trend')).toBeVisible();

    // 6. Test logout
    await page.click('text=Logout');
    await expect(page.locator('text=Login')).toBeVisible();
  });

  test('profile data persistence', async () => {
    // Update profile data
    await page.click('text=Personal Info');
    await page.click('text=Edit');
    await page.fill('input[name="height"]', '185');
    await page.fill('input[name="birthday"]', '1985-05-15');
    await page.selectOption('select[name="gender"]', 'female');
    await page.click('text=Save Changes');

    // Update goals
    await page.click('text=Goals');
    await page.click('text=Edit Goals');
    await page.fill('input[name="weight_goal"]', '75');
    await page.fill('input[name="calories_goal"]', '2500');
    await page.click('text=Save Goals');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify data persistence
    await page.click('text=Personal Info');
    await expect(page.locator('input[name="height"]')).toHaveValue('185');
    await expect(page.locator('input[name="birthday"]')).toHaveValue('1985-05-15');
    await expect(page.locator('select[name="gender"]')).toHaveValue('female');

    await page.click('text=Goals');
    await expect(page.locator('input[name="weight_goal"]')).toHaveValue('75');
    await expect(page.locator('input[name="calories_goal"]')).toHaveValue('2500');
  });

  test('macro calculator validation', async () => {
    await page.click('text=Goals');
    
    // Test empty inputs
    await page.click('text=Calculate');
    await expect(page.locator('text=Please enter both weight goal and timeframe')).toBeVisible();

    // Test invalid inputs
    await page.fill('input[placeholder*="Target Weight"]', 'invalid');
    await page.fill('input[placeholder*="Timeframe"]', '-5');
    await page.click('text=Calculate');
    await expect(page.locator('text=Please enter both weight goal and timeframe')).toBeVisible();

    // Test valid inputs
    await page.fill('input[placeholder*="Target Weight"]', '65');
    await page.fill('input[placeholder*="Timeframe"]', '12');
    await page.click('text=Calculate');
    
    // Wait for calculation
    await expect(page.locator('text=Calculated Macros')).toBeVisible();
    await expect(page.locator('text=Apply to Goals')).toBeVisible();
  });

  test('macro calculator with extreme goals', async () => {
    await page.click('text=Goals');
    
    // Test extreme weight goal
    await page.fill('input[placeholder*="Target Weight"]', '50');
    await page.fill('input[placeholder*="Timeframe"]', '4');
    await page.click('text=Calculate');
    
    // Wait for calculation
    await expect(page.locator('text=Calculated Macros')).toBeVisible();
    
    // Check for warnings
    await expect(page.locator('text=Warnings:')).toBeVisible();
    await expect(page.locator('text=aggressive')).toBeVisible();
  });

  test('responsive design on mobile', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify profile loads on mobile
    await expect(page.locator('h1')).toContainText(testUser.username);
    
    // Test tab navigation on mobile
    await expect(page.locator('text=Personal Info')).toBeVisible();
    await expect(page.locator('text=Goals')).toBeVisible();
    await expect(page.locator('text=Body Metrics')).toBeVisible();
    await expect(page.locator('text=History')).toBeVisible();

    // Test tab switching on mobile
    await page.click('text=Goals');
    await expect(page.locator('text=Goals & Macros')).toBeVisible();
    
    await page.click('text=Body Metrics');
    await expect(page.locator('text=Body Metrics')).toBeVisible();
    
    await page.click('text=History');
    await expect(page.locator('text=Historical Data')).toBeVisible();
  });

  test('profile error handling', async () => {
    // Test with invalid profile data
    await page.click('text=Personal Info');
    await page.click('text=Edit');
    await page.fill('input[name="height"]', 'invalid');
    await page.click('text=Save Changes');
    
    // Should show error message
    await expect(page.locator('text=Failed to update profile')).toBeVisible();

    // Test with invalid goals data
    await page.click('text=Goals');
    await page.click('text=Edit Goals');
    await page.fill('input[name="weight_goal"]', 'invalid');
    await page.click('text=Save Goals');
    
    // Should show error message
    await expect(page.locator('text=Failed to update goals')).toBeVisible();
  });

  test('profile data loading states', async () => {
    // Test loading state
    await page.goto('/profile');
    
    // Should show loading spinner initially
    await expect(page.locator('.loading-spinner')).toBeVisible();
    
    // Wait for data to load
    await expect(page.locator('h1')).toContainText(testUser.username);
    await expect(page.locator('.loading-spinner')).not.toBeVisible();
  });

  test('profile navigation from other pages', async () => {
    // Navigate to food log
    await page.click('text=Food Log');
    await page.waitForURL('/food-log');
    
    // Navigate back to profile
    await page.click('text=Profile');
    await page.waitForURL('/profile');
    
    // Verify profile loads correctly
    await expect(page.locator('h1')).toContainText(testUser.username);
  });

  test('profile data refresh', async () => {
    // Make initial changes
    await page.click('text=Personal Info');
    await page.click('text=Edit');
    await page.fill('input[name="height"]', '190');
    await page.click('text=Save Changes');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify changes are reflected
    await page.click('text=Personal Info');
    await expect(page.locator('input[name="height"]')).toHaveValue('190');
  });

  test('profile form validation', async () => {
    await page.click('text=Personal Info');
    await page.click('text=Edit');
    
    // Test height validation
    await page.fill('input[name="height"]', '300'); // Unrealistic height
    await page.click('text=Save Changes');
    
    // Should show validation error
    await expect(page.locator('text=Invalid height value')).toBeVisible();

    // Test birthday validation
    await page.fill('input[name="birthday"]', '2030-01-01'); // Future date
    await page.click('text=Save Changes');
    
    // Should show validation error
    await expect(page.locator('text=Birthday cannot be in the future')).toBeVisible();
  });

  test('profile goals validation', async () => {
    await page.click('text=Goals');
    await page.click('text=Edit Goals');
    
    // Test negative weight goal
    await page.fill('input[name="weight_goal"]', '-10');
    await page.click('text=Save Goals');
    
    // Should show validation error
    await expect(page.locator('text=Weight goal must be positive')).toBeVisible();

    // Test unrealistic calorie goal
    await page.fill('input[name="calories_goal"]', '50000');
    await page.click('text=Save Goals');
    
    // Should show validation error
    await expect(page.locator('text=Calorie goal is unrealistic')).toBeVisible();
  });

  test('profile metrics calculation accuracy', async () => {
    await page.click('text=Body Metrics');
    
    // Verify metrics are calculated correctly
    await expect(page.locator('text=BMI')).toBeVisible();
    await expect(page.locator('text=BMR')).toBeVisible();
    await expect(page.locator('text=TDEE')).toBeVisible();
    
    // Check that values are reasonable
    const bmiText = await page.locator('text=BMI').textContent();
    const bmiValue = parseFloat(bmiText.match(/\d+\.?\d*/)[0]);
    expect(bmiValue).toBeGreaterThan(10);
    expect(bmiValue).toBeLessThan(50);
  });

  test('profile historical data accuracy', async () => {
    await page.click('text=History');
    
    // Verify historical data sections
    await expect(page.locator('text=Total Weight Change')).toBeVisible();
    await expect(page.locator('text=Weekly Recommendation')).toBeVisible();
    await expect(page.locator('text=Weight Trend')).toBeVisible();
    
    // Check that trend is calculated correctly
    const trendText = await page.locator('text=Weight Trend').textContent();
    expect(['gaining', 'losing', 'stable', 'no_data']).toContain(trendText.toLowerCase());
  });

  test('profile accessibility', async () => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Test form accessibility
    await page.click('text=Personal Info');
    await page.click('text=Edit');
    
    // Verify form labels are accessible
    await expect(page.locator('label[for="height"]')).toBeVisible();
    await expect(page.locator('label[for="birthday"]')).toBeVisible();
    await expect(page.locator('label[for="gender"]')).toBeVisible();
  });

  test('profile performance', async () => {
    // Test page load time
    const startTime = Date.now();
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(5000);
    
    // Test tab switching performance
    const tabStartTime = Date.now();
    await page.click('text=Goals');
    await page.waitForLoadState('networkidle');
    const tabSwitchTime = Date.now() - tabStartTime;
    
    // Should switch tabs quickly
    expect(tabSwitchTime).toBeLessThan(1000);
  });
});
