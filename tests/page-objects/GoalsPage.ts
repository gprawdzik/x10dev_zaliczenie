import { expect, Locator, Page, APIResponse } from '@playwright/test';

import { BasePage } from './BasePage';

type GoalScope = 'global' | 'per_sport';
type GoalMetric = 'distance' | 'time' | 'elevation_gain';

export class GoalsPage extends BasePage {
  readonly viewContainer: Locator;
  readonly addGoalButton: Locator;
  readonly goalCards: Locator;
  readonly goalFormDialog: Locator;
  readonly goalForm: Locator;
  readonly scopeSelect: Locator;
  readonly sportSelect: Locator;
  readonly metricSelect: Locator;
  readonly targetValueInput: Locator;
  readonly formError: Locator;
  readonly saveGoalButton: Locator;
  readonly deleteDialog: Locator;
  readonly deleteConfirmButton: Locator;
  readonly editMenuItem: Locator;
  readonly deleteMenuItem: Locator;

  constructor(page: Page) {
    super(page);
    this.viewContainer = page.getByTestId('goals-view');
    this.addGoalButton = page.getByTestId('goals-add-button');
    this.goalCards = page.locator('[data-testid^="goal-card-"]');
    this.goalFormDialog = page.getByTestId('goal-form-dialog');
    this.goalForm = page.getByTestId('goal-form');
    this.scopeSelect = page.getByLabel('Zakres celu');
    this.sportSelect = page.getByLabel('Sport');
    this.metricSelect = page.getByLabel('Metryka');
    this.targetValueInput = page.getByLabel('Wartość docelowa');
    this.formError = page.getByTestId('goal-form-error');
    this.saveGoalButton = this.goalFormDialog.getByRole('button', { name: /Zapisz|Zapisywanie/i });
    this.deleteDialog = page.getByTestId('goal-delete-dialog');
    this.deleteConfirmButton = this.deleteDialog.getByRole('button', { name: /^Usuń$/i });
    this.editMenuItem = page.getByRole('menuitem', { name: /^Edytuj$/i });
    this.deleteMenuItem = page.getByRole('menuitem', { name: /^Usuń$/i });
  }

  async navigate() {
    await this.goto('/goals');
  }

  async waitForHydration() {
    await this.viewContainer.waitFor({ state: 'visible' });
    await expect(this.viewContainer).toHaveAttribute('data-hydrated', 'true');
  }

  async openCreateGoalDialog() {
    await this.addGoalButton.click();
    await this.goalFormDialog.waitFor({ state: 'visible' });
  }

  async fillGoalForm(options: {
    scopeType?: GoalScope;
    sportName?: string;
    metricType?: GoalMetric;
    targetValue?: number;
  }) {
    if (options.scopeType) {
      await this.scopeSelect.selectOption(options.scopeType);
    }

    if (options.metricType) {
      await this.metricSelect.selectOption(options.metricType);
    }

    if (options.sportName) {
      await this.sportSelect.selectOption({ label: options.sportName });
    }

    if (typeof options.targetValue === 'number') {
      await this.targetValueInput.fill(options.targetValue.toString());
    }
  }

  getGoalCardById(goalId: string): Locator {
    return this.page.getByTestId(`goal-card-${goalId}`);
  }

  getGoalCardByTargetValue(label: string): Locator {
    return this.goalCards.filter({ hasText: label });
  }

  async openActionMenu(card: Locator) {
    const trigger = card.getByRole('button', { name: /Otwórz menu akcji/i });
    await trigger.click();
  }

  waitForGoalMutation(method: 'POST' | 'PATCH' | 'DELETE', goalId?: string): Promise<APIResponse> {
    return this.page.waitForResponse((response) => {
      if (!response.url().includes('/api/goals')) {
        return false;
      }

      if (response.request().method() !== method) {
        return false;
      }

      if (!goalId) {
        return true;
      }

      try {
        const searchParams = new URL(response.url()).searchParams;
        const receivedId = (searchParams.get('id') ?? '').replace(/^eq\./, '');
        return receivedId === goalId;
      } catch {
        return false;
      }
    });
  }

  async deleteGoalById(goalId: string) {
    const card = this.getGoalCardById(goalId);
    await this.openActionMenu(card);
    await this.deleteMenuItem.click();
    await this.deleteDialog.waitFor({ state: 'visible' });

    const deleteResponse = this.waitForGoalMutation('DELETE', goalId);
    await this.deleteConfirmButton.click();
    const response = await deleteResponse;
    expect(response.status()).toBe(204);

    await this.deleteDialog.waitFor({ state: 'hidden' });
    await expect(card).toHaveCount(0);
  }
}

