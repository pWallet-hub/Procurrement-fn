# Procurement portal – browser tests

Playwright tests that sign in as the seed accounts and walk through the main screens: sign-in and menus per role,
every page loading without errors, starting a case and a request, Back buttons, case search and filters, Help,
Administration › System health and Overview, and the layout on a phone.

They create their own cases and drafts (with unique names), so run them against a **local or test** system with the
dev seed accounts – never production.

```bash
cd e2e
npm install
npx playwright install chromium          # first time only
E2E_BASE_URL=http://localhost:5173 npm test
npm run report                           # open the HTML report (screenshots and traces of failures)
```

Settings: `E2E_BASE_URL` (portal address, default `http://localhost:5173`), `E2E_PASSWORD` (seed password, default `Passw0rd!dev`).
