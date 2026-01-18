import { test, expect } from '@playwright/test';

test.describe('User Journey - Username Change', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('sign up with username, create pages, change username, verify redirects', async ({
    page,
  }) => {
    const testUsername = `testuser${Date.now()}`;
    const newUsername = `new${testUsername}`;
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'password123';

    await test.step('Sign up with username', async () => {
      await page.goto('/signup');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="username"]', testUsername);
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/new-username|\/dashboard/);
    });

    await test.step('Create pages and links', async () => {
      await page.goto('/dashboard/pages');

      await page.click('button:has-text("Create Page")');
      await page.fill('input[placeholder*="Page name"]', 'My First Page');
      await page.fill(
        'textarea[placeholder*="Description"]',
        'This is my first page'
      );
      await page.click('button:has-text("Create")');

      await expect(page.locator('text=My First Page')).toBeVisible();
    });

    await test.step('Navigate to settings', async () => {
      await page.goto('/dashboard/settings');
      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    });

    await test.step('Change username to newusername', async () => {
      await page.fill('input[placeholder*="New Username"]', newUsername);
      await page.waitForTimeout(500);

      await expect(
        page.locator(`text=${testEmail}/${newUsername}`)
      ).toBeVisible();
      await expect(page.locator('text=/aff.link/')).toBeVisible();
      await expect(page.locator('text=important')).toBeVisible();

      await page.click('button:has-text("Change Username")');

      await expect(
        page.locator('text=Username changed successfully')
      ).toBeVisible();
    });

    await test.step('Verify all pages accessible with new username', async () => {
      await page.goto(`/${newUsername}`);
      await expect(page).toHaveURL(/\/${newUsername}/);

      await page.goto(`/${newUsername}/my-first-page`);
      await expect(page).toHaveURL(/\/${newUsername}\/my-first-page/);
    });

    await test.step('Verify old username redirects to new (301)', async () => {
      const response = await page.goto(`/${testUsername}`);
      expect(response?.status()).toBe(301);

      await page.waitForURL(`**/${newUsername}`);
      await expect(page).toHaveURL(/\/${newUsername}/);
    });

    await test.step('Verify short links still work', async () => {
      await page.goto('/dashboard/settings');
      const shortUrlElement = page.locator('text=/aff.link/');
      await expect(shortUrlElement).toBeVisible();

      const shortUrl = await shortUrlElement.textContent();
      await page.goto(shortUrl!);

      await expect(page).toHaveURL(/\/${newUsername}/);
    });

    await test.step('Try to change again (should fail due to cooldown)', async () => {
      await page.goto('/dashboard/settings');

      await page.fill('input[placeholder*="New Username"]', 'anotherusername');
      await page.waitForTimeout(500);

      await page.click('button:has-text("Change Username")');

      await expect(page.locator('text=cooldown')).toBeVisible();
    });

    await test.step('Verify 30-day countdown display', async () => {
      await page.goto('/dashboard/settings');

      const cooldownText = page.locator('text=/30.*days/');
      await expect(cooldownText).toBeVisible();
    });
  });

  test('verify username history is maintained', async ({ page }) => {
    const testUsername = `historyuser${Date.now()}`;
    const testEmail = `history${Date.now()}@example.com`;

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="username"]', testUsername);
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/pages');
    await page.click('button:has-text("Create Page")');
    await page.fill('input[placeholder*="Page name"]', 'Test Page');
    await page.click('button:has-text("Create")');

    await page.goto('/dashboard/settings');

    await page.fill('input[placeholder*="New Username"]', `new${testUsername}`);
    await page.waitForTimeout(500);
    await page.click('button:has-text("Change Username")');

    await expect(
      page.locator('text=Username changed successfully')
    ).toBeVisible();

    await page.goto('/dashboard/settings');
    const historySection = page.locator('text=Username Change History');
    await expect(historySection).toBeVisible();

    await expect(page.locator(`text=${testUsername}`)).toBeVisible();
  });
});

test.describe('Multiple Username Changes', () => {
  test('test multiple username changes over time', async ({ page }) => {
    const baseUsername = `multiuser${Date.now()}`;
    const testEmail = `multi${Date.now()}@example.com`;

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="username"]', baseUsername);
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/pages');
    await page.click('button:has-text("Create Page")');
    await page.fill('input[placeholder*="Page name"]', 'Test Page');
    await page.click('button:has-text("Create")');

    const usernames = [
      `username1${Date.now()}`,
      `username2${Date.now()}`,
      `username3${Date.now()}`,
    ];

    for (let i = 0; i < usernames.length; i++) {
      await page.goto('/dashboard/settings');
      await page.fill('input[placeholder*="New Username"]', usernames[i]);
      await page.waitForTimeout(500);
      await page.click('button:has-text("Change Username")');

      await expect(
        page.locator('text=Username changed successfully')
      ).toBeVisible();

      await page.waitForTimeout(2000);
    }

    const historySection = page.locator('text=Username Change History');
    await expect(historySection).toBeVisible();

    for (const username of [baseUsername, ...usernames]) {
      await expect(page.locator(`text=${username}`)).toBeVisible();
    }
  });

  test('verify redirects work for all previous usernames', async ({ page }) => {
    const baseUsername = `redirectuser${Date.now()}`;
    const testEmail = `redirect${Date.now()}@example.com`;

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="username"]', baseUsername);
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/pages');
    await page.click('button:has-text("Create Page")');
    await page.fill('input[placeholder*="Page name"]', 'Test Page');
    await page.click('button:has-text("Create")');

    const usernames = [`old1${Date.now()}`, `old2${Date.now()}`];
    let currentUsername = baseUsername;

    for (const username of usernames) {
      await page.goto('/dashboard/settings');
      await page.fill('input[placeholder*="New Username"]', username);
      await page.waitForTimeout(500);
      await page.click('button:has-text("Change Username")');

      await expect(
        page.locator('text=Username changed successfully')
      ).toBeVisible();
      await page.waitForTimeout(2000);
      currentUsername = username;
    }

    const allUsernames = [baseUsername, ...usernames];

    for (const oldUsername of allUsernames) {
      if (oldUsername === currentUsername) continue;

      await page.goto(`/${oldUsername}`);
      await page.waitForURL(`**/${currentUsername}`);
      await expect(page).toHaveURL(/\/${currentUsername}/);
    }
  });

  test('verify short links remain functional after multiple changes', async ({
    page,
  }) => {
    const testUsername = `shortlinkuser${Date.now()}`;
    const testEmail = `shortlink${Date.now()}@example.com`;

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="username"]', testUsername);
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/pages');
    await page.click('button:has-text("Create Page")');
    await page.fill('input[placeholder*="Page name"]', 'Test Page');
    await page.click('button:has-text("Create")');

    await page.goto('/dashboard/settings');
    const shortUrlElement = page.locator('text=/aff.link/');
    await expect(shortUrlElement).toBeVisible();
    const firstShortUrl = await shortUrlElement.textContent();

    await page.fill('input[placeholder*="New Username"]', `new${testUsername}`);
    await page.waitForTimeout(500);
    await page.click('button:has-text("Change Username")');

    await page.waitForTimeout(2000);

    await page.goto(firstShortUrl!);
    await expect(page).toHaveURL(/\/new${testUsername}/);

    await page.goto('/dashboard/settings');
    const secondShortUrlElement = page.locator('text=/aff.link/');
    const secondShortUrl = await secondShortUrlElement.textContent();

    await page.fill(
      'input[placeholder*="New Username"]',
      `secondnew${testUsername}`
    );
    await page.waitForTimeout(500);
    await page.click('button:has-text("Change Username")');

    await page.waitForTimeout(2000);

    await page.goto(firstShortUrl!);
    await expect(page).toHaveURL(/\/secondnew${testUsername}/);

    await page.goto(secondShortUrl!);
    await expect(page).toHaveURL(/\/secondnew${testUsername}/);
  });
});
