import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { HomePage } from '../page-objects/HomePage';
import { SettingsPage } from '../page-objects/SettingsPage';
import { ActivitiesPage } from '../page-objects/ActivitiesPage';

test.describe('Activity generation to activities list flow', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;
  let settingsPage: SettingsPage;
  let activitiesPage: ActivitiesPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    settingsPage = new SettingsPage(page);
    activitiesPage = new ActivitiesPage(page);
  });

  test('user generates activities and verifies activities list summary', async ({ page }) => {
    const username = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    test.skip(!username || !password, 'Set E2E_USERNAME and E2E_PASSWORD environment variables to run this test.');
    test.setTimeout(120000);

    // 1-3 Login
    await loginPage.navigate();
    await loginPage.waitForPageLoad();
    await loginPage.login(username!, password!);

    // 4 Redirect to home
    await page.waitForURL('**/');
    await expect(page).toHaveURL('/');
    await expect(homePage.userTrigger).toBeVisible();

    // 5 Navigate to settings via user dropdown
    await expect(homePage.userTrigger).toBeVisible();
    await homePage.userTrigger.click();
    await page.getByRole('menuitem', { name: /ustawienia/i }).click();
    await page.waitForURL('**/settings');

    // 6 Switch to generator tab
    await settingsPage.openGeneratorTab();
    await settingsPage.waitForGeneratorPanel();

    // // 7-8 Generate activities through dialog
    await settingsPage.openGeneratorDialog();
    await settingsPage.confirmGeneration();

    // // 9 Navigate to activities tab
    await page.getByRole('link', { name: /aktywności/i }).click();
    await page.waitForURL('**/activities');

    // // 10 Check table visibility
    await activitiesPage.waitForActivitiesTable();
    await expect(activitiesPage.activitiesTable).toBeVisible();

    // // 11 Validate summary info
    await expect(activitiesPage.activitiesSummary).toHaveText(/Wyświetlane \d+-\d+ z \d+ aktywności/);
  });
});

