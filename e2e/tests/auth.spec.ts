import { expect, test } from '@playwright/test';
import { signIn, USERS } from './helpers';

test('a wrong password is refused with a message', async ({ page }) => {
  await page.goto('/login?signed_out=1');
  await page.getByLabel(/email/i).fill(USERS.staff);
  await page.locator('input[type=password]').fill('definitely-wrong');
  await page.locator('form button[type=submit]').click();
  await expect(page.locator('.alert--error')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('signed-out visitors are sent to the sign-in page', async ({ page }) => {
  await page.goto('/cases');
  await expect(page).toHaveURL(/\/login/);
});

test('each role sees the menu that fits it', async ({ page }) => {
  await signIn(page, 'staff');
  const nav = page.locator('.shell__sidebar nav');
  await expect(nav.getByRole('link', { name: 'Procurement cases' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Help' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Administration' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Reports' })).toHaveCount(0);

  await signIn(page, 'admin');
  await expect(nav.getByRole('link', { name: 'Administration' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Reports' })).toBeVisible();
});

test('signing out ends the session', async ({ page }) => {
  await signIn(page, 'staff');
  await page.locator('.user-menu summary').click();
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/cases');
  await expect(page).toHaveURL(/\/login/);
});
