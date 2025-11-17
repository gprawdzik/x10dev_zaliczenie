import { test, expect } from '@playwright/test';
import { HomePage } from '../page-objects/HomePage';

test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    // Create new page object for each test
    homePage = new HomePage(page);
    await homePage.navigate();
  });

  test('should display the main heading', async ({ page }) => {
    // Wait for page to load
    await homePage.waitForPageLoad();
    
    // Check if main heading is visible
    await expect(homePage.mainHeading).toBeVisible();
  });

  test('should have a navigation bar', async ({ page }) => {
    // Check if navbar exists
    await expect(homePage.navbar).toBeVisible();
  });

  test('should navigate to login page when clicking login link', async ({ page }) => {
    // Check if login link is visible
    await expect(homePage.loginLink).toBeVisible();
    
    // Click login link
    await homePage.clickLogin();
    
    // Verify URL changed to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('should take a screenshot of home page', async ({ page }) => {
    await homePage.waitForPageLoad();
    
    // Visual comparison - take screenshot
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should have correct page title', async ({ page }) => {
    const title = await homePage.getTitle();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });
});

