import { test, expect } from '@playwright/test';

test.describe('Short Link Sharing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('test short link creation and sharing', async ({ page, context }) => {
    const testUsername = `shareuser${Date.now()}`;
    const testEmail = `share${Date.now()}@example.com`;

    await test.step('Create user and page', async () => {
      await page.goto('/signup');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="username"]', testUsername);
      await page.click('button[type="submit"]');

      await page.goto('/dashboard/pages');
      await page.click('button:has-text("Create Page")');
      await page.fill('input[placeholder*="Page name"]', 'Share Test Page');
      await page.fill(
        'textarea[placeholder*="Description"]',
        'This is a test page for sharing'
      );
      await page.click('button:has-text("Create")');

      await expect(page.locator('text=Share Test Page')).toBeVisible();
    });

    await test.step('Generate short link', async () => {
      await page.goto('/dashboard/settings');
      const generateButton = page.locator(
        'button:has-text("Generate Short Link")'
      );
      if (await generateButton.isVisible()) {
        await generateButton.click();
      }

      await expect(page.locator('text=/aff.link/')).toBeVisible();
    });

    await test.step('Copy short URL to clipboard', async () => {
      const shortUrlElement = page.locator('text=/aff.link/');
      const shortUrl = await shortUrlElement.textContent();

      const copyButton = page.locator('button:has-text("Copy")').first();
      await copyButton.click();

      await expect(page.locator('text=Copied!')).toBeVisible();

      const clipboardText = await page.evaluate(() =>
        navigator.clipboard.readText()
      );
      expect(clipboardText).toBe(shortUrl);
    });

    await test.step('Test other user accessing short URL', async () => {
      const shortUrlElement = page.locator('text=/aff.link/');
      const shortUrl = await shortUrlElement.textContent();

      await context.clearCookies();

      await page.goto(shortUrl!);
      await expect(page).toHaveURL(/\/${testUsername}/);
      await expect(page.locator('text=Share Test Page')).toBeVisible();
    });

    await test.step('Verify redirect to correct page', async () => {
      const shortUrlElement = page.locator('text=/aff.link/');
      const shortUrl = await shortUrlElement.textContent();

      await page.goto(shortUrl!);
      await expect(page).toHaveURL(/\/${testUsername}/);

      const pageTitle = await page.locator('h1').textContent();
      expect(pageTitle).toContain('Share Test Page');
    });

    await test.step('Verify click count increment', async () => {
      await context.clearCookies();

      const initialClickCount = page.locator('text=/\\d+ clicks/');
      const initialText = await initialClickCount.textContent();

      const shortUrlElement = page.locator('text=/aff.link/');
      const shortUrl = await shortUrlElement.textContent();

      await page.goto(shortUrl!);
      await page.waitForTimeout(100);

      const finalClickCount = page.locator('text=/\\d+ clicks/');
      const finalText = await finalClickCount.textContent();

      expect(parseInt(finalText!.replace(/\D/g, ''))).toBeGreaterThan(
        parseInt(initialText!.replace(/\D/g, ''))
      );
    });
  });

  test('test expired link handling', async ({ page }) => {
    const testUsername = `expireuser${Date.now()}`;
    const testEmail = `expire${Date.now()}@example.com`;

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="username"]', testUsername);
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/pages');
    await page.click('button:has-text("Create Page")');
    await page.fill('input[placeholder*="Page name"]', 'Expire Test Page');
    await page.click('button:has-text("Create")');

    await page.goto('/dashboard/settings');
    const shortUrlElement = page.locator('text=/aff.link/');
    await expect(shortUrlElement).toBeVisible();
    const shortUrl = await shortUrlElement.textContent();

    const deleteButton = page.locator('button:has-text("Delete")');
    await deleteButton.click();
    await page.click('button:has-text("Delete")');

    await expect(
      page.locator('text=Short link deleted successfully')
    ).toBeVisible();

    await page.goto(shortUrl!);
    await expect(page.locator('text=not found|404')).toBeVisible();
  });

  test('test short link with page slug', async ({ page }) => {
    const testUsername = `sluguser${Date.now()}`;
    const testEmail = `slug${Date.now()}@example.com`;
    const pageName = 'my-special-page';

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="username"]', testUsername);
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/pages');
    await page.click('button:has-text("Create Page")');
    await page.fill('input[placeholder*="Page name"]', pageName);
    await page.click('button:has-text("Create")');

    await page.goto('/dashboard/settings');
    const shortUrlElement = page.locator('text=/aff.link/');
    await expect(shortUrlElement).toBeVisible();
    const shortUrl = await shortUrlElement.textContent();

    await page.goto(shortUrl!);
    await expect(page).toHaveURL(/\/${testUsername}/);

    await expect(page.locator('text=' + pageName)).toBeVisible();
  });

  test('test multiple short links for same page', async ({ page }) => {
    const testUsername = `multilink${Date.now()}`;
    const testEmail = `multilink${Date.now()}@example.com`;

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

    const generateButtons = page.locator(
      'button:has-text("Generate Short Link")'
    );
    const buttonCount = await generateButtons.count();

    for (let i = 0; i < buttonCount; i++) {
      await generateButtons.nth(i).click();
      await page.waitForTimeout(100);
    }

    const shortUrlElements = page.locator('text=/aff.link/');
    const shortUrlCount = await shortUrlElements.count();

    expect(shortUrlCount).toBeGreaterThan(1);

    for (let i = 0; i < shortUrlCount; i++) {
      const shortUrl = await shortUrlElements.nth(i).textContent();
      await page.goto(shortUrl!);
      await expect(page).toHaveURL(/\/${testUsername}/);
      await page.goBack();
    }
  });

  test('test short link on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Test only on mobile');

    const testUsername = `mobileshare${Date.now()}`;
    const testEmail = `mobileshare${Date.now()}@example.com`;

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="username"]', testUsername);
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/pages');
    await page.click('button:has-text("Create Page")');
    await page.fill('input[placeholder*="Page name"]', 'Mobile Test Page');
    await page.click('button:has-text("Create")');

    await page.goto('/dashboard/settings');

    const menuButton = page.locator('button[aria-label*="menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }

    const shortUrlElement = page.locator('text=/aff.link/');
    await expect(shortUrlElement).toBeVisible();

    const copyButton = page.locator('button:has-text("Copy")').first();
    await copyButton.click();

    await expect(page.locator('text=Copied!')).toBeVisible();
  });
});

test.describe('API Integration', () => {
  test('test all API endpoints', async ({ page, request }) => {
    const testUsername = `apiuser${Date.now()}`;
    const testEmail = `api${Date.now()}@example.com`;
    const testPassword = 'password123';

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="username"]', testUsername);
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/pages');
    await page.click('button:has-text("Create Page")');
    await page.fill('input[placeholder*="Page name"]', 'API Test Page');
    await page.click('button:has-text("Create")');

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name.includes('session'));

    await test.step('Test username-availability endpoint', async () => {
      const response = await request.get(
        `/api/user/username-availability/testusername${Date.now()}`
      );
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.available).toBe(true);
    });

    await test.step('Test username-preview endpoint', async () => {
      const response = await request.get(
        `/api/user/username-preview?username=testpreview${Date.now()}`
      );
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.username).toBeDefined();
      expect(data.homePageUrl).toBeDefined();
      expect(data.warning).toBeDefined();
    });

    await test.step('Test username-history endpoint', async () => {
      const response = await request.get('/api/user/username-history', {
        headers: {
          Cookie: `${sessionCookie?.name}=${sessionCookie?.value}`,
        },
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.history).toBeDefined();
      expect(Array.isArray(data.history)).toBe(true);
    });

    await test.step('Test short-links/user endpoint', async () => {
      const response = await request.get('/api/short-links/user', {
        headers: {
          Cookie: `${sessionCookie?.name}=${sessionCookie?.value}`,
        },
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  test('test authentication', async ({ page, request }) => {
    await test.step('Test unauthenticated request returns 401', async () => {
      const response = await request.get('/api/user/username-history');
      expect(response.status()).toBe(401);
    });

    await test.step('Test invalid credentials return 401', async () => {
      const response = await request.post('/api/user/update-username', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          username: 'newusername',
        },
      });
      expect(response.status()).toBe(401);
    });
  });

  test('test authorization', async ({ page, request }) => {
    const testUsername = `authuser${Date.now()}`;
    const testEmail = `auth${Date.now()}@example.com`;

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="username"]', testUsername);
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/pages');
    await page.click('button:has-text("Create Page")');
    await page.fill('input[placeholder*="Page name"]', 'Auth Test Page');
    await page.click('button:has-text("Create")');

    await page.goto('/dashboard/settings');
    const shortUrlElements = page.locator('text=/aff.link/');
    const shortUrlCount = await shortUrlElements.count();

    if (shortUrlCount > 0) {
      const shortUrlText = await shortUrlElements.nth(0).textContent();
      const shortCode = shortUrlText?.split('/').pop();

      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find((c) => c.name.includes('session'));

      const test2Email = `auth2${Date.now()}@example.com`;

      await page.goto('/signup');
      await page.fill('input[name="email"]', test2Email);
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="username"]', `auth2user${Date.now()}`);
      await page.click('button[type="submit"]');

      const cookies2 = await page.context().cookies();
      const sessionCookie2 = cookies2.find((c) => c.name.includes('session'));

      if (shortCode && sessionCookie2) {
        await test.step("Test user cannot delete another user's short link", async () => {
          const db = await page.evaluate(() => {
            return (global as any).db;
          });

          const links = await db
            .select()
            .from('short_links')
            .where(eq('short_code', shortCode));
          if (links.length > 0) {
            const response = await request.delete(
              `/api/short-links/${links[0].id}`,
              {
                headers: {
                  Cookie: `${sessionCookie2?.name}=${sessionCookie2?.value}`,
                },
              }
            );
            expect(response.status()).toBe(403);
          }
        });
      }
    }
  });

  test('test error handling', async ({ page, request }) => {
    const testUsername = `erroruser${Date.now()}`;
    const testEmail = `error${Date.now()}@example.com`;

    await page.goto('/signup');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="username"]', testUsername);
    await page.click('button[type="submit"]');

    await test.step('Test missing username returns 400', async () => {
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find((c) => c.name.includes('session'));

      const response = await request.post('/api/user/update-username', {
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${sessionCookie?.name}=${sessionCookie?.value}`,
        },
        data: {},
      });
      expect(response.status()).toBe(400);
    });

    await test.step('Test invalid username format returns 400', async () => {
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find((c) => c.name.includes('session'));

      const response = await request.post('/api/user/update-username', {
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${sessionCookie?.name}=${sessionCookie?.value}`,
        },
        data: {
          username: 'Invalid Username',
        },
      });
      expect(response.status()).toBe(400);
    });

    await test.step('Test non-existent page returns 404', async () => {
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find((c) => c.name.includes('session'));

      const response = await request.post('/api/short-links/generate', {
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${sessionCookie?.name}=${sessionCookie?.value}`,
        },
        data: {
          pageId: 999999,
        },
      });
      expect(response.status()).toBe(404);
    });
  });
});
