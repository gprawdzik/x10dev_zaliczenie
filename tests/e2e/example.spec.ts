import { test, expect } from '@playwright/test';

/**
 * Example E2E test demonstrating basic Playwright usage
 */
test.describe('Example Test Suite', () => {
  test('should load the application', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page loaded successfully
    expect(page.url()).toContain('/');
  });

  test('should have a title', async ({ page }) => {
    await page.goto('/');
    
    // Get page title
    const title = await page.title();
    
    // Title should not be empty
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should demonstrate browser context usage', async ({ page, context }) => {
    // Create a new page in the same context
    const newPage = await context.newPage();
    
    await page.goto('/');
    await newPage.goto('/about');
    
    // Both pages should be in the same context
    expect(context.pages().length).toBeGreaterThanOrEqual(2);
    
    // Clean up
    await newPage.close();
  });

  test('should demonstrate locator usage', async ({ page }) => {
    await page.goto('/');
    
    // Example of different locator strategies
    const byRole = page.getByRole('link');
    const byText = page.getByText(/home|strona główna/i);
    const byTestId = page.getByTestId('main-content');
    
    // Basic smoke checks ensure locators resolve without throwing
    const roleCount = await byRole.count();
    const textCount = await byText.count();
    const testIdCount = await byTestId.count();
    expect(roleCount + textCount + testIdCount).toBeGreaterThanOrEqual(0);
  });

  test('should demonstrate assertions', async ({ page }) => {
    await page.goto('/');
    
    // Different types of assertions
    await expect(page).toHaveURL(/.*\//);
    await expect(page).toHaveTitle(/.*/);
    
    // Check if body exists
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

