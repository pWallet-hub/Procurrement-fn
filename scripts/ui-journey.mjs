// Browser smoke test of a running frontend: sign in, create a PR-01, fill, submit, sign as three people, check the paper view, PDF tab and verify page.
//   BASE=https://procurement.afs-rwanda.org node scripts/ui-journey.mjs
// If the frontend's own /api proxy is not working yet, send the browser's /api calls straight to the API instead:
//   BASE=https://procurement.afs-rwanda.org API_DIRECT=https://apipro.afs-rwanda.org node scripts/ui-journey.mjs
// Needs Playwright (npx playwright install chromium; npm i playwright somewhere on the module path). Uses the demo accounts
// (password PASSWORD, default Passw0rd!dev) and CREATES a test case, so only run it against a test or demo database.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:8080';
const API_DIRECT = process.env.API_DIRECT;
const PASSWORD = process.env.PASSWORD ?? 'Passw0rd!dev';
const br = await chromium.launch();
const errs = [], bad = [];
let pg, docUrl, failed = 0;

const mk = async () => {
  const p = await (await br.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
  if (API_DIRECT) await p.route('**/api/**', async (r) => { const u = new URL(r.request().url()); await r.fulfill({ response: await r.fetch({ url: API_DIRECT + u.pathname + u.search }) }); });
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('response', (r) => { if (r.url().includes('/api/') && r.status() >= 400) bad.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`); });
  return p;
};
const step = async (name, fn) => {
  try { await fn(); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '-', e.message.split('\n').slice(0, 2).join(' / ')); await pg.screenshot({ path: `ui-fail-${name.replace(/\W+/g, '_')}.png`, fullPage: true }).catch(() => {}); }
};
const login = async (u) => {
  pg = await mk(); await pg.goto(BASE + '/login');
  await pg.getByLabel(/e-?mail/i).fill(`${u}@afs.local`); await pg.locator('#password').fill(PASSWORD);
  await pg.getByRole('button', { name: /sign in/i }).click(); await pg.waitForURL(BASE + '/', { timeout: 15000 });
};
const decl = () => pg.getByRole('checkbox', { name: /^I /i }).first();
const sign = async (u) => {
  await login(u); await pg.goto(docUrl); await decl().waitFor({ timeout: 10000 }); await decl().check();
  const drawTab = pg.getByRole('tab', { name: /^draw$/i }); if (await drawTab.count()) await drawTab.click(); // users with a saved signature land on the Saved tab
  const b = await pg.locator('canvas').first().boundingBox();
  await pg.mouse.move(b.x + 20, b.y + 20); await pg.mouse.down(); await pg.mouse.move(b.x + 100, b.y + 60, { steps: 6 }); await pg.mouse.move(b.x + 160, b.y + 25, { steps: 6 }); await pg.mouse.up();
  await pg.getByRole('button', { name: /^sign$/i }).click(); await pg.waitForTimeout(2000);
};

await step('sign in + dashboard', async () => { await login('staff'); await pg.waitForSelector('text=/my actions/i'); });
await step('create case + fill PR-01', async () => {
  await pg.goto(BASE + '/cases/new'); await pg.getByLabel(/project/i).fill('UI journey test'); await pg.getByLabel(/budget line/i).selectOption({ index: 1 });
  await pg.getByRole('button', { name: 'Create case' }).click(); await pg.waitForURL(/\/documents\/[0-9a-f-]{36}/); docUrl = pg.url();
  await pg.waitForSelector('text=Business justification'); await pg.locator('[id$="required_by_date"]').fill('2026-12-01');
  await pg.getByRole('button', { name: /add row/i }).first().click().catch(() => {});
  await pg.locator('[id$="items-0--description"]').fill('Roll-up banners'); await pg.locator('[id$="items-0--qty"]').fill('3');
  await pg.locator('[id$="items-0--unit_cost"]').fill('20000'); await pg.locator('[id$="items-0--est_unit_cost"]').fill('20000');
  await pg.locator('[id$="business_justification"]').fill('UI journey'); await pg.waitForSelector('text=/Saved/i', { timeout: 10000 });
});
await step('submit for signing', async () => { await pg.getByRole('button', { name: /submit for signing/i }).click(); await decl().waitFor({ timeout: 10000 }); });
await step('requester signs (draw)', () => sign('staff'));
await step('accountant signs', () => sign('accountant'));
await step('PI signs, document complete', async () => { await sign('pi'); await pg.reload(); await pg.waitForSelector('text=/This document is complete/i'); await pg.screenshot({ path: 'ui-signed.png', fullPage: true }); });
await step('paper header shows the date', async () => { const t = await pg.locator('.pf-header__meta').last().innerText(); if (!/\d{2}\/\d{2}\/\d{4}/.test(t)) throw new Error('no date in header: ' + t.replace(/\n/g, ' ')); });
await step('PDF tab renders', async () => { await pg.getByText('PDF', { exact: true }).first().click(); await pg.waitForSelector('iframe, embed, object', { timeout: 10000 }); });
await step('public verify page loads', async () => { const p2 = await mk(); await p2.goto(BASE + '/verify/' + docUrl.split('/').pop()); await p2.waitForSelector('text=/verif/i', { timeout: 10000 }); console.log('     verify page says:', (await p2.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 150)); });

console.log('API errors:', bad); console.log('browser errors:', errs.filter((e) => !/status of 4\d\d/.test(e)));
await br.close(); process.exit(failed ? 1 : 0);
