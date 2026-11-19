import { expect, type Page } from '@playwright/test';

export const PASSWORD = process.env.E2E_PASSWORD ?? 'Passw0rd!dev';
export const USERS = {
  admin: 'admin@afs.local',
  staff: 'staff@afs.local',
  accountant: 'accountant@afs.local',
  cfm: 'cfm@afs.local',
  verifier: 'verifier@afs.local',
} as const;
export type Who = keyof typeof USERS;

/** Signs in with a password (the dev/test setup keeps password sign-in on). */
export async function signIn(page: Page, who: Who) {
  // Start from a signed-out browser, so switching people within one test works too.
  await page.goto('/login?signed_out=1');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.context().clearCookies();
  await page.goto('/login?signed_out=1');
  await page.getByLabel(/email/i).fill(USERS[who]);
  await page.locator('input[type=password]').fill(PASSWORD);
  await page.locator('form button[type=submit]').click();
  await expect(page.locator('.shell__header')).toBeVisible();
}

/** Fails the test on any uncaught script error or failed API call (5xx) while the page is used. */
export function watchForErrors(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`script error: ${e.message}`));
  page.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 500) problems.push(`${r.status()} from ${r.url()}`); });
  return () => expect(problems, problems.join('\n')).toEqual([]);
}

/** The page finished loading and shows no error message. */
export async function expectPageOk(page: Page) {
  await expect(page.locator('.spinner--block')).toHaveCount(0);
  await expect(page.locator('main .alert--error')).toHaveCount(0);
  await expect(page.locator('main h1').first()).toBeVisible();
}

export const unique = (label: string) => `${label} ${Date.now().toString(36)}`;
