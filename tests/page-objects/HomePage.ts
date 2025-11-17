import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Home Page
 */
export class HomePage extends BasePage {
  // Locators
  readonly navbar: Locator;
  readonly mainHeading: Locator;
  readonly loginLink: Locator;
  readonly registerLink: Locator;
  readonly userTrigger: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.navbar = page.locator('nav');
    this.mainHeading = page.locator('h1');
    this.loginLink = page.getByRole('link', { name: /login|zaloguj/i });
    this.registerLink = page.getByRole('link', { name: /register|zarejestruj|sign up/i });
    this.userTrigger = page.getByTestId('navbar-user-trigger');
  }

  /**
   * Navigate to home page
   */
  async navigate() {
    await this.goto('/');
  }

  /**
   * Check if user is logged in by checking for logout button
   */
  async isUserLoggedIn(): Promise<boolean> {
    try {
      await this.userTrigger.waitFor({ timeout: 4000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click on login link
   */
  async clickLogin() {
    await this.loginLink.click();
  }

  /**
   * Click on register link
   */
  async clickRegister() {
    await this.registerLink.click();
  }
}

