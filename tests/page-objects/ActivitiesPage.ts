import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ActivitiesPage extends BasePage {
  readonly viewContainer: Locator;
  readonly activitiesTableContainer: Locator;
  readonly activitiesTable: Locator;
  readonly activitiesSummary: Locator;
  readonly activitiesEmptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.viewContainer = page.getByTestId('activities-view');
    this.activitiesTableContainer = page.getByTestId('activities-table-container');
    this.activitiesTable = this.activitiesTableContainer.locator('table');
    this.activitiesSummary = page.getByTestId('activities-summary');
    this.activitiesEmptyState = page.getByTestId('activities-empty-state');
  }

  async navigate() {
    await this.goto('/activities');
  }

  async waitForActivitiesTable() {
    await this.viewContainer.waitFor({ state: 'visible' });
    await expect(this.viewContainer).toHaveAttribute('data-hydrated', 'true');

    await this.activitiesTableContainer.waitFor({ state: 'visible' });
    await this.ensureTableVisibility();
  }

  private async ensureTableVisibility(timeoutMs = 20000, pollIntervalMs = 250) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const tableVisible = await this.activitiesTable.isVisible().catch(() => false);
      if (tableVisible) {
        return;
      }

      const emptyVisible = await this.activitiesEmptyState.isVisible().catch(() => false);
      if (emptyVisible) {
        throw new Error('Aktywności nie zostały wygenerowane - widoczny jest widok pustej tabeli.');
      }

      await this.page.waitForTimeout(pollIntervalMs);
    }

    throw new Error('Tabela aktywności nie stała się widoczna w oczekiwanym czasie.');
  }

  async getSummaryText(): Promise<string> {
    const text = await this.activitiesSummary.textContent();
    return text?.trim() ?? '';
  }
}

