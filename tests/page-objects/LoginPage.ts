import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for Login Page
 */
export class LoginPage extends BasePage {
  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators using resilient selection methods
    this.emailInput = page.getByLabel(/email|e-mail/i);
    this.passwordInput = page.getByLabel(/password|hasło/i);
    this.submitButton = page.getByRole('button', { name: /login|zaloguj|sign in/i });
    this.errorMessage = page.locator('[role="alert"]');
    this.forgotPasswordLink = page.getByRole('link', { name: /recover|odzyskaj dostęp/i });
  }

  /**
   * Navigate to login page
   */
  async navigate() {
    await this.goto('/auth/login');
  }

  /**
   * Perform login action
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }
}

