import { test, expect } from '@playwright/test';

test.describe('Floating Hamburger Menu Implementation', () => {
  test('should display floating menu button on page view', async ({ page }) => {
    // Navigate to a user page (assuming there's a test user)
    await page.goto('/testuser/test-page');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if floating menu button is visible
    const floatingButton = page.locator('button[aria-label="Open page menu"]');
    await expect(floatingButton).toBeVisible();

    // Check if it's positioned correctly (fixed bottom-right)
    const buttonBox = await floatingButton.boundingBox();
    expect(buttonBox).toBeTruthy();
    expect(buttonBox!.x).toBeGreaterThan(window.innerWidth - 100); // Near right edge
    expect(buttonBox!.y).toBeGreaterThan(window.innerHeight - 100); // Near bottom edge
  });

  test('should open drawer when floating button is clicked', async ({
    page,
  }) => {
    await page.goto('/testuser/test-page');
    await page.waitForLoadState('networkidle');

    // Click floating menu button
    const floatingButton = page.locator('button[aria-label="Open page menu"]');
    await floatingButton.click();

    // Check if drawer opens
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();

    // Check if drawer title contains username
    const drawerTitle = page.locator('[data-testid="drawer-title"]');
    await expect(drawerTitle).toContainText('Pages by testuser');
  });

  test('should display user info and pages list in drawer', async ({
    page,
  }) => {
    await page.goto('/testuser/test-page');
    await page.waitForLoadState('networkidle');

    // Open drawer
    const floatingButton = page.locator('button[aria-label="Open page menu"]');
    await floatingButton.click();

    // Wait for content to load
    await page.waitForSelector(
      '[data-testid="user-info"], .text-muted-foreground',
      { timeout: 5000 }
    );

    // Check if user info is displayed
    const userInfo = page.locator('[data-testid="user-info"]');
    if (await userInfo.isVisible()) {
      await expect(userInfo).toContainText('@testuser');
    }

    // Check if pages are listed or empty state is shown
    const pagesList = page.locator('[data-testid="page-list"]');
    const emptyState = page.locator('text=No pages available');

    const hasPages = (await pagesList.count()) > 0;
    const hasEmptyState = await emptyState.isVisible();

    expect(hasPages || hasEmptyState).toBeTruthy();
  });

  test('should close drawer when X button is clicked', async ({ page }) => {
    await page.goto('/testuser/test-page');
    await page.waitForLoadState('networkidle');

    // Open drawer
    const floatingButton = page.locator('button[aria-label="Open page menu"]');
    await floatingButton.click();

    // Check drawer is open
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();

    // Click close button
    const closeButton = page.locator('button:has(svg:has-text("×"))');
    await closeButton.click();

    // Check drawer is closed
    await expect(drawer).not.toBeVisible();
  });

  test('should show loading state while fetching pages', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/pages/public/testuser', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      await route.continue();
    });

    await page.goto('/testuser/test-page');
    await page.waitForLoadState('networkidle');

    // Open drawer
    const floatingButton = page.locator('button[aria-label="Open page menu"]');
    await floatingButton.click();

    // Check for loading skeletons
    const skeletons = page.locator('.animate-pulse');
    await expect(skeletons.first()).toBeVisible();
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/pages/public/testuser', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Server error' }),
      });
    });

    await page.goto('/testuser/test-page');
    await page.waitForLoadState('networkidle');

    // Open drawer
    const floatingButton = page.locator('button[aria-label="Open page menu"]');
    await floatingButton.click();

    // Check for error state
    const errorMessage = page.locator('text=Failed to load pages');
    await expect(errorMessage).toBeVisible();

    // Check for retry button
    const retryButton = page.locator('button:has-text("Try Again")');
    await expect(retryButton).toBeVisible();
  });
});
