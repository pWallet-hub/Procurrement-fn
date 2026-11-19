import { expect, test } from '@playwright/test';
import { signIn, unique, watchForErrors } from './helpers';

test('staff starts a procurement case, lands on its PR-01, and finds it again', async ({ page }) => {
  const done = watchForErrors(page);
  const project = unique('E2E projector');
  await signIn(page, 'staff');

  await page.goto('/cases/new');
  await page.getByLabel('Project / activity').fill(project);
  await page.getByLabel('Required by').fill('2030-01-15');
  const budget = page.getByLabel('Budget line');
  if (await budget.locator('option').count() > 1) await budget.selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Create case' }).click();

  // The new requisition opens for filling in; Back returns to where we came from.
  await expect(page).toHaveURL(/\/documents\//);
  await expect(page.getByRole('heading', { name: 'Procurement Requisition' })).toBeVisible();
  await expect(page.locator('.back-link')).toBeVisible();

  // The case page says what to do next.
  await page.getByRole('link', { name: 'View case' }).click();
  await expect(page.locator('.next-step')).toContainText('PR-01 is still a draft');
  await page.getByRole('button', { name: /Continue PR-01/ }).click();
  await expect(page).toHaveURL(/\/documents\//);
  await page.locator('.back-link').click();
  await expect(page).toHaveURL(/\/cases\//);

  // Search finds it, and the filters stay in the address.
  await page.goto('/cases');
  await page.getByPlaceholder(/search by request number or project/i).fill(project);
  await expect(page).toHaveURL(/q=/);
  await expect(page.locator('table tbody tr')).toHaveCount(1);
  await expect(page.locator('table')).toContainText(project);
  await page.getByRole('button', { name: 'Closed' }).click();
  await expect(page.getByText('No cases match these filters')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  done();
});

test('a request draft can be created from its list, and Back returns to the list', async ({ page }) => {
  const done = watchForErrors(page);
  await signIn(page, 'staff');
  await page.goto('/requests');
  await page.getByRole('button', { name: /New request/ }).click();
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page).toHaveURL(/\/documents\//);
  await expect(page.locator('.dp-type')).toHaveText('GR-06');
  await page.locator('.back-link').click();
  await expect(page).toHaveURL(/\/requests/);
  done();
});
