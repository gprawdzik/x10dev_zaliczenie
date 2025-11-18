import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
  readonly generatorTab: Locator;
  readonly generatorOpenButton: Locator;
  readonly generatorDialog: Locator;
  readonly generatorConfirmButton: Locator;

  constructor(page: Page) {
    super(page);
    this.generatorTab = page.getByRole('tab', { name: /generator danych/i });
    this.generatorOpenButton = page.getByTestId('generator-open-dialog');
    this.generatorDialog = page.getByTestId('generator-dialog');
    this.generatorConfirmButton = page.getByTestId('generator-confirm-button');
  }

  async navigate() {
    await this.goto('/settings');
  }

  async openGeneratorTab() {
    await this.generatorTab.waitFor({ state: 'visible' });
    await this.generatorTab.click();
  }

  async waitForGeneratorPanel() {
    await this.generatorOpenButton.waitFor({ state: 'visible' });
  }

  async openGeneratorDialog() {
    await this.generatorOpenButton.waitFor({ state: 'visible' });
    await this.generatorOpenButton.click();
    await this.generatorDialog.waitFor({ state: 'visible' });
  }

  async confirmGeneration() {
    await this.generatorConfirmButton.click();
    await this.generatorDialog.waitFor({ state: 'hidden' });
  }
}

