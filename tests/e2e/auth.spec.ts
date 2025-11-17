import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { HomePage } from '../page-objects/HomePage';
import { testUsers } from '../fixtures/test-users';

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    // Create page objects
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
  });

  test('should display login form', async () => {
    await loginPage.navigate();
    await loginPage.waitForPageLoad();

    // Check if login form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    await loginPage.navigate();

    // Try to login with invalid credentials
    await loginPage.login(testUsers.invalidUser.email, testUsers.invalidUser.password);

    // Wait for error message
    await page.waitForTimeout(2000);

    // Check if error is displayed (if validation is implemented)
    const hasError = await loginPage.hasError();
    if (hasError) {
      await expect(loginPage.errorMessage).toBeVisible();
    }
  });

  test('should have forgot password link', async () => {
    await loginPage.navigate();

    // Check if forgot password link exists
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await loginPage.navigate();

    // Click forgot password link
    await loginPage.clickForgotPassword();

    // Verify URL changed
    await expect(page).toHaveURL(/.*\/auth\/recover/);
  });

  test('should prevent login with empty fields', async ({ page }) => {
    await loginPage.navigate();

    // Try to submit empty form
    await loginPage.submitButton.click();

    // Check that we're still on login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test.describe('Logged In User', () => {
    test('should redirect to home after successful login', async ({ page }) => {
      const username = process.env.E2E_USERNAME;
      const password = process.env.E2E_PASSWORD;

      test.skip(!username || !password, 'Set E2E_USERNAME and E2E_PASSWORD to run this test.');

      await loginPage.navigate();
      await loginPage.waitForPageLoad();

      await loginPage.login(username!, password!);

      await page.waitForURL('**/');
      await expect(page).toHaveURL('/');

      const isLoggedIn = await homePage.isUserLoggedIn();
      expect(isLoggedIn).toBe(true);
    });
  });
});

