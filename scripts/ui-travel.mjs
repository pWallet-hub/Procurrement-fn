// Browser test of the TC-10 travel clearance and the budget-line admin page: staff requests (no costs), supervisor confirms,
// admin enters items 15-16 and sees the total, accountant and PI sign. Same setup as ui-journey.mjs:
//   BASE=http://localhost:8080 node scripts/ui-travel.mjs
// Uses the demo accounts and CREATES test data, so only run it against a test or demo database.
import { chromium } from 'playwright';
const BASE = process.env.BASE ?? 'http://localhost:8080';
const PASSWORD = process.env.PASSWORD ?? 'Passw0rd!dev';
const br = await chromium.launch();
const errs = [], bad = [];
let pg, docUrl, failed = 0;

const mk = async () => {
  const p = await (await br.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
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
const field = (key) => pg.locator(`[id$="-${key}"]`).first();
const pick = async (key, text) => {
  const value = await field(key).evaluate((el, t) => [...el.options].find((o) => o.text.includes(t))?.value, text);
  if (!value) throw new Error(`no option "${text}" in ${key}`);
  await field(key).selectOption(value);
};
const decl = () => pg.getByRole('checkbox', { name: /^I /i }).first();
const sign = async (u, before) => {
  await login(u); await pg.goto(docUrl); await decl().waitFor({ timeout: 10000 });
  if (before) await before();
  await decl().check();
  const drawTab = pg.getByRole('tab', { name: /^draw$/i }); if (await drawTab.count()) await drawTab.click();
  const b = await pg.locator('canvas').first().boundingBox();
  await pg.mouse.move(b.x + 20, b.y + 20); await pg.mouse.down(); await pg.mouse.move(b.x + 100, b.y + 60, { steps: 6 }); await pg.mouse.move(b.x + 160, b.y + 25, { steps: 6 }); await pg.mouse.up();
  await pg.getByRole('button', { name: /^sign$/i }).click(); await pg.waitForTimeout(2000);
};

await step('admin adds an external budget line with a baseline', async () => {
  await login('admin'); await pg.goto(BASE + '/admin/budget-lines');
  await pg.getByRole('button', { name: /add budget line/i }).click();
  await field('code').fill(`BL-UI-${Date.now() % 100000}`); await field('project').fill('UI donor project');
  await field('funding_source').selectOption('external'); await field('funder').fill('UI Donor');
  await field('baseline').fill('3000000'); await field('available').fill('2500000');
  await pg.getByRole('button', { name: /^save$/i }).click();
  await pg.waitForSelector('td:has-text("UI Donor")', { timeout: 10000 });
  const row = await pg.locator('tr', { hasText: 'UI Donor' }).first().innerText();
  if (!/External/.test(row) || !/3,000,000/.test(row) || !/500,000/.test(row)) throw new Error('row shows ' + row.replace(/\s+/g, ' '));
});

await step('staff creates a TC-10 from the sidebar', async () => {
  await login('staff');
  await pg.getByRole('link', { name: /travel clearance/i }).click(); await pg.waitForURL(/\/travel$/);
  await pg.getByRole('button', { name: /^new$/i }).click(); await pg.getByRole('button', { name: /create draft/i }).click();
  await pg.waitForURL(/\/documents\/[0-9a-f-]{36}/); docUrl = pg.url();
});
await step('requester cannot enter items 15-17 or create budget lines', async () => {
  await field('allowance_per_day').waitFor();
  if (await field('allowance_per_day').isEditable()) throw new Error('allowance is editable for the requester');
  if (await field('accommodation_per_day').isEditable()) throw new Error('accommodation is editable for the requester');
  if (await pg.getByRole('button', { name: /new budget line/i }).count()) throw new Error('staff sees New budget line');
});
await step('requester fills items 1-14 and submits', async () => {
  await field('id_number').fill('1199080012345678'); await field('account_number').fill('000-123-456');
  await field('program').fill('OFAB Rwanda'); await pick('funding', 'UI donor project');
  await field('expected_results').fill('Partners briefed'); await field('purpose').fill('Field visit');
  await pick('supervisor', 'Diane'); await field('destination').fill('Musanze');
  await field('departure_date').fill('2026-11-02'); await field('departure_place').fill('Kigali');
  await field('return_date').fill('2026-11-04'); await field('duration_days').fill('3');
  await pg.getByLabel('Office vehicle').check();
  await pg.waitForSelector('text=/Saved/i', { timeout: 10000 }); await pg.waitForTimeout(1500);
  await pg.getByRole('button', { name: /submit for signing/i }).click(); await decl().waitFor({ timeout: 10000 });
});
await step('external traveller: typed name instead of staff picker, passport checked', async () => {
  await pg.goto(BASE + '/travel/new'); await pg.getByRole('button', { name: /create draft/i }).click(); await pg.waitForURL(/\/documents\//);
  await field('id_number').waitFor({ timeout: 10000 });
  if (!(await field('issued_to').isVisible())) throw new Error('staff picker not shown for internal');
  await pg.getByLabel('External', { exact: true }).check();
  await field('issued_to_name').waitFor({ timeout: 5000 });
  if (await field('issued_to').isVisible()) throw new Error('staff picker still shown for external');
  await field('issued_to_name').fill('Jane Visitor');
  await pg.getByLabel('Passport', { exact: true }).check(); await field('id_number').fill('AB12');
  await pg.waitForSelector('text=/passport number must be 6 to 9/i', { timeout: 10000 });
  await field('id_number').fill('PC1234567');
  await pg.waitForSelector('text=/passport number must be 6 to 9/i', { state: 'detached', timeout: 10000 });
});
await step('internal traveller: wrong national ID is flagged', async () => {
  await pg.goto(BASE + '/travel/new'); await pg.getByRole('button', { name: /create draft/i }).click(); await pg.waitForURL(/\/documents\//);
  await field('id_number').fill('12345');
  await pg.waitForSelector('text=/16 digits/', { timeout: 10000 });
});
await step('requester signs', () => sign('staff'));
await step('supervisor named on the form signs', () => sign('director.dept'));
await step('admin sees the costs task, enters 15-16, total shows live, signs', async () => {
  await sign('admin', async () => {
    await field('allowance_per_day').fill('20000'); await field('accommodation_per_day').fill('30000');
    await pg.waitForSelector('output:has-text("150,000")', { timeout: 5000 });
  });
  await pg.reload(); await pg.waitForSelector('text=/150,000/', { timeout: 10000 });
});
await step('accountant signs', () => sign('accountant'));
await step('PI approves, document complete with the total', async () => {
  await sign('pi'); await pg.reload(); await pg.waitForSelector('text=/This document is complete/i');
  await pg.getByRole('tab', { name: /form/i }).first().click().catch(() => {});
  await pg.waitForSelector('text=/150,000/'); await pg.screenshot({ path: 'ui-travel-signed.png', fullPage: true });
});

console.log('API errors:', bad); console.log('browser errors:', errs.filter((e) => !/status of 4\d\d/.test(e)));
await br.close(); process.exit(failed ? 1 : 0);
