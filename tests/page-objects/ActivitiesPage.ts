import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ActivitiesPage extends BasePage {
  readonly activitiesTable: Locator;
  readonly activitiesSummary: Locator;

  constructor(page: Page) {
    super(page);
    this.activitiesTable = page.getByTestId('activities-table');
    this.activitiesSummary = page.getByTestId('activities-summary');
  }

  async navigate() {
    await this.goto('/activities');
  }

  async waitForActivitiesTable() {
    await this.activitiesTable.waitFor({ state: 'visible' });
  }

  async getSummaryText(): Promise<string> {
    const text = await this.activitiesSummary.textContent();
    return text?.trim() ?? '';
  }
}

