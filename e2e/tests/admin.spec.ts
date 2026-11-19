import { expect, test } from '@playwright/test';
import { signIn, watchForErrors } from './helpers';

const CHECKS = ['Database', 'File storage', 'Background jobs queue', 'Background worker', 'Email', 'Signed PDFs', 'Sign-in', 'Audit trail'];

test('System health shows every part of the system and its state', async ({ page }) => {
  const done = watchForErrors(page);
  await signIn(page, 'admin');
  await page.goto('/admin/system');
  await expect(page.locator('.health-banner h2')).toBeVisible();
  for (const label of CHECKS) await expect(page.locator('.health-check__label', { hasText: label })).toBeVisible();
  // The core services must be up for the rest of the tests to mean anything.
  for (const label of ['Database', 'File storage', 'Background jobs queue', 'Background worker']) {
    await expect(page.locator('.health-check', { has: page.locator('.health-check__label', { hasText: label }) })).not.toHaveClass(/health-check--error/);
  }
  await page.getByRole('button', { name: 'Check again' }).click();
  await page.getByRole('button', { name: /Verify now/ }).click();
  await expect(page.locator('.health-audit .alert--success')).toContainText('intact');
  done();
});

test('the Overview lists what needs attention, with a clear state for each list', async ({ page }) => {
  const done = watchForErrors(page);
  await signIn(page, 'admin');
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/overview/);
  for (const title of ['Signatures waiting', 'Cases past their required date', 'Returned documents', 'Forgotten drafts', 'Emails that failed this week']) {
    await expect(page.locator('.card__title', { hasText: title })).toBeVisible();
  }
  await expect(page.locator('.ov-tile')).not.toHaveCount(0);
  done();
});
