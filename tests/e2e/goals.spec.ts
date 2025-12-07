import { test, expect, type Page } from '@playwright/test';

import type { GoalDto } from '../../src/types.js';
import { LoginPage } from '../page-objects/LoginPage';
import { GoalsPage } from '../page-objects/GoalsPage';

test.describe('Goals management E2E', () => {
  let loginPage: LoginPage;
  let goalsPage: GoalsPage;

  test.beforeEach(({ page }) => {
    loginPage = new LoginPage(page);
    goalsPage = new GoalsPage(page);
  });

  const requireCredentials = () => {
    const username = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!username || !password) {
      test.skip('Set E2E_USERNAME and E2E_PASSWORD environment variables to run goals E2E tests.');
    }

    return { username: username!, password: password! };
  };

  const uniqueTargetValue = () => Math.floor(200 + Math.random() * 200);

  const kmLabel = (value: number) => `${value} km`;

  const authenticateAndOpenGoals = async (page: Page) => {
    const { username, password } = requireCredentials();

    await loginPage.navigate();
    await loginPage.waitForPageLoad();
    await loginPage.login(username, password);
    await page.waitForURL('**/');

    await goalsPage.navigate();
    await goalsPage.waitForHydration();
  };

  const createGoalViaForm = async (targetValueKm: number): Promise<GoalDto> => {
    await goalsPage.openCreateGoalDialog();
    await goalsPage.fillGoalForm({
      scopeType: 'global',
      metricType: 'distance',
      targetValue: targetValueKm,
    });

    const createResponsePromise = goalsPage.waitForGoalMutation('POST');
    await goalsPage.saveGoalButton.click();
    const response = await createResponsePromise;
    expect(response.status()).toBe(201);

    const createdGoal = (await response.json()) as GoalDto;
    await goalsPage.goalFormDialog.waitFor({ state: 'hidden' });
    await expect(goalsPage.getGoalCardById(createdGoal.id)).toBeVisible();

    return createdGoal;
  };

  test('TC-GOAL-01: user can create a new annual goal', async ({ page }) => {
    test.setTimeout(120000);
    await authenticateAndOpenGoals(page);

    const targetValueKm = uniqueTargetValue();
    const createdGoal = await createGoalViaForm(targetValueKm);
    const createdCard = goalsPage.getGoalCardById(createdGoal.id);

    await expect(createdCard.getByText(kmLabel(targetValueKm))).toBeVisible();
    await expect(createdCard.getByRole('button', { name: /Pokaż postęp/i })).toBeVisible();

    await goalsPage.deleteGoalById(createdGoal.id);
  });

  test('TC-GOAL-02: form validation blocks invalid goal data', async ({ page }) => {
    await authenticateAndOpenGoals(page);

    await goalsPage.openCreateGoalDialog();
    await goalsPage.fillGoalForm({
      scopeType: 'global',
      metricType: 'distance',
      targetValue: 0,
    });

    await goalsPage.saveGoalButton.click();

    await expect(goalsPage.goalFormDialog).toBeVisible();
    await expect(goalsPage.formError).toBeVisible();
    await expect(goalsPage.formError).toHaveText(/większa od zera/i);
  });

  test('TC-GOAL-03: user can edit an existing goal', async ({ page }) => {
    test.setTimeout(120000);
    await authenticateAndOpenGoals(page);

    const initialValue = uniqueTargetValue();
    const createdGoal = await createGoalViaForm(initialValue);

    const updatedValue = initialValue + 50;
    const card = goalsPage.getGoalCardById(createdGoal.id);

    await goalsPage.openActionMenu(card);
    await goalsPage.editMenuItem.click();
    await goalsPage.goalFormDialog.waitFor({ state: 'visible' });

    await goalsPage.fillGoalForm({ targetValue: updatedValue });

    const updateResponsePromise = goalsPage.waitForGoalMutation('PATCH', createdGoal.id);
    await goalsPage.saveGoalButton.click();
    const response = await updateResponsePromise;
    expect(response.status()).toBe(200);

    const updatedGoal = (await response.json()) as GoalDto;
    expect(updatedGoal.id).toBe(createdGoal.id);
    expect(updatedGoal.target_value).toBe(updatedValue * 1000);

    await goalsPage.goalFormDialog.waitFor({ state: 'hidden' });
    await expect(goalsPage.getGoalCardById(createdGoal.id).getByText(kmLabel(updatedValue))).toBeVisible();

    await goalsPage.deleteGoalById(createdGoal.id);
  });

  test('TC-GOAL-04: user can delete a goal from the list', async ({ page }) => {
    await authenticateAndOpenGoals(page);

    const targetValueKm = uniqueTargetValue();
    const createdGoal = await createGoalViaForm(targetValueKm);
    const card = goalsPage.getGoalCardById(createdGoal.id);

    await goalsPage.openActionMenu(card);
    await goalsPage.deleteMenuItem.click();
    await goalsPage.deleteDialog.waitFor({ state: 'visible' });

    const deleteResponsePromise = goalsPage.waitForGoalMutation('DELETE', createdGoal.id);
    await goalsPage.deleteConfirmButton.click();
    const response = await deleteResponsePromise;
    expect(response.status()).toBe(204);

    await goalsPage.deleteDialog.waitFor({ state: 'hidden' });
    await expect(card).toHaveCount(0);
  });
});

