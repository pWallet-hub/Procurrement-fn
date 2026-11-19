import { expect, test } from '@playwright/test';
import { expectPageOk, signIn, watchForErrors } from './helpers';

const STAFF_PAGES = ['/', '/cases', '/cases/new', '/requests', '/memos', '/travel', '/notifications', '/profile', '/help'];
const ADMIN_PAGES = ['/reports', '/audit', '/admin/overview', '/admin/system', '/admin/users', '/admin/departments', '/admin/budget-lines', '/admin/suppliers', '/admin/templates'];

// these walk through many pages in one test
test.describe.configure({ timeout: 120_000 });

test('every page a staff member can open loads without errors', async ({ page }) => {
  const done = watchForErrors(page);
  await signIn(page, 'staff');
  for (const path of STAFF_PAGES) {
    await test.step(path, async () => {
      await page.goto(path);
      await expectPageOk(page);
    });
  }
  done();
});

test('every admin page loads without errors', async ({ page }) => {
  const done = watchForErrors(page);
  await signIn(page, 'admin');
  for (const path of ADMIN_PAGES) {
    await test.step(path, async () => {
      await page.goto(path);
      await expectPageOk(page);
    });
  }
  done();
});

test('staff cannot open administration pages', async ({ page }) => {
  await signIn(page, 'staff');
  await page.goto('/admin/system');
  await expect(page.getByText(/system health/i)).toHaveCount(0);
});

test('the New menu offers the right documents and opens them', async ({ page }) => {
  await signIn(page, 'staff');
  await page.locator('.create-menu > summary').click();
  const menu = page.locator('.create-menu__panel');
  for (const item of ['Procurement case', 'Request', 'Memo', 'Travel clearance']) await expect(menu.getByText(item, { exact: true })).toBeVisible();
  await menu.getByText('Memo', { exact: true }).click();
  await expect(page).toHaveURL(/\/memos\/new/);
  await page.keyboard.press('Escape');
});

test('Help explains the process and its search finds forms', async ({ page }) => {
  await signIn(page, 'staff');
  await page.goto('/help');
  await expect(page.getByRole('heading', { name: 'Steps of a procurement case' })).toBeVisible();
  await page.getByPlaceholder(/search questions and forms/i).fill('PO-09');
  await expect(page.locator('.help-forms')).toContainText('Purchase Order');
  await expect(page.locator('.help-forms > div')).toHaveCount(1);
  // admin-only questions are hidden from staff
  await page.getByPlaceholder(/search questions and forms/i).fill('invitation');
  await expect(page.locator('.help-faq')).toHaveCount(0);
});
