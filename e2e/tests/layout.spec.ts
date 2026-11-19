import { expect, test } from '@playwright/test';
import { signIn } from './helpers';

// Runs on desktop and on a phone-sized screen (see playwright.config.ts).
const PAGES = ['/', '/cases', '/requests', '/notifications', '/help', '/profile'];

// these walk through many pages in one test
test.describe.configure({ timeout: 120_000 });

test('pages fit the screen without sideways scrolling', async ({ page }) => {
  await signIn(page, 'staff');
  for (const path of PAGES) {
    await test.step(path, async () => {
      await page.goto(path);
      await expect(page.locator('main h1').first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} is ${overflow}px wider than the screen`).toBeLessThanOrEqual(1);
    });
  }
});

test('the menu works on every screen size', async ({ page, isMobile }) => {
  await signIn(page, 'staff');
  if (isMobile) {
    await expect(page.locator('.shell__sidebar')).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
  }
  await page.locator('.shell__sidebar').getByRole('link', { name: 'Help' }).click();
  await expect(page).toHaveURL(/\/help/);
  await expect(page.locator('main h1')).toHaveText('Help');
});

test('links look like links and buttons like buttons', async ({ page }) => {
  await signIn(page, 'staff');
  await page.goto('/help');
  const inText = page.locator('.help-section p a, .help-steps a').first();
  await expect(inText).toHaveCSS('text-decoration-line', 'underline');
  const navLink = page.locator('.shell__sidebar .nav__link').first();
  if (await navLink.isVisible()) await expect(navLink).toHaveCSS('text-decoration-line', 'none');
});
