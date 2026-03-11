/**
 * E2E: Registration Flow + Muscle Log Seeding
 *
 * Verifies a user can register via UI, receives tokens, and the backend returns
 * a fully seeded muscle priority list (one row per muscle, default priority 80).
 */
const { test, expect } = require('@playwright/test');

test.describe('Registration flow', () => {
  test('user can register and muscle priorities are seeded', async ({ page, request }) => {
    const unique = `e2e_user_${Date.now()}`;
    const email = `${unique}@example.com`;

    await page.goto('http://localhost:3000/register');
    await page.waitForSelector('form', { timeout: 10000 });

    await page.locator('input[name="username"]').fill(unique);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="invite_key"]').fill('dev-invite-key-002');
    await page.locator('input[name="password"]').fill('E2ePass123!');
    await page.locator('input[name="password_confirm"]').fill('E2ePass123!');

    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/profile', { timeout: 20000 });

    const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(accessToken).toBeTruthy();

    const headers = { Authorization: `Bearer ${accessToken}` };

    const musclesRes = await request.get('http://localhost:8000/api/workouts/muscles/', { headers });
    expect(musclesRes.ok()).toBeTruthy();
    const musclesJson = await musclesRes.json();
    expect(musclesJson.success).toBeTruthy();
    const musclesCount = musclesJson.data.length;

    const prioritiesRes = await request.get('http://localhost:8000/api/workouts/muscle-priorities/', { headers });
    expect(prioritiesRes.ok()).toBeTruthy();
    const prioritiesJson = await prioritiesRes.json();
    expect(prioritiesJson.success).toBeTruthy();
    expect(prioritiesJson.data.length).toBe(musclesCount);

    for (const row of prioritiesJson.data) {
      expect(row.priority).toBe(80);
    }
  });
});

