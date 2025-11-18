import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
  readonly viewContainer: Locator;
  readonly generatorTab: Locator;
  readonly generatorOpenButton: Locator;
  readonly generatorDialog: Locator;
  readonly generatorConfirmButton: Locator;
  readonly generatorSportChips: Locator;

  constructor(page: Page) {
    super(page);
    this.viewContainer = page.getByTestId('settings-view');
    this.generatorTab = page.getByTestId('settings-tab-generator');
    this.generatorOpenButton = page.getByTestId('generator-open-dialog');
    this.generatorDialog = page.getByTestId('generator-dialog');
    this.generatorConfirmButton = page.getByTestId('generator-confirm-button');
    this.generatorSportChips = page.getByTestId('generator-sport-chip');
  }

  async navigate() {
    await this.goto('/settings');
  }

  async openGeneratorTab() {
    await this.viewContainer.waitFor({ state: 'visible' });
    await expect(this.viewContainer).toHaveAttribute('data-hydrated', 'true');

    await this.generatorTab.waitFor({ state: 'visible' });
    const isAlreadyActive = (await this.generatorTab.getAttribute('data-state')) === 'active';
    if (isAlreadyActive) {
      return;
    }

    await this.generatorTab.scrollIntoViewIfNeeded();
    await this.generatorTab.click();
    await expect(this.generatorTab).toHaveAttribute('data-state', 'active');
  }

  async waitForGeneratorPanel() {
    await this.generatorOpenButton.waitFor({ state: 'visible' });
  }

  async openGeneratorDialog() {
    await expect(this.generatorSportChips).toHaveCount(4, {
      timeout: 15000,
    });
    await this.generatorOpenButton.waitFor({ state: 'visible' });
    await this.generatorOpenButton.click();
    await this.generatorDialog.waitFor({ state: 'visible' });
  }

  async confirmGeneration() {
    await this.generatorConfirmButton.click();
    await this.generatorDialog.waitFor({ state: 'hidden' });
  }
}

