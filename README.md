# AfS Rwanda Procurement - frontend

React 18 + TypeScript (strict) + Vite + React Router + TanStack Query. Plain CSS with design tokens, no UI kit.
This is a working **template**: every route and the full form/signing flow talk to the API in
`../docs/API-CONTRACT.md`, but the look is deliberately plain so a UI/UX developer can restyle it.

## Run

```bash
cp .env.example .env        # optional
npm install
npm run dev                 # http://localhost:5173, proxies /api -> http://localhost:3000
```

The dev proxy defaults to `http://localhost:3000`. The local dev API runs on port **3100**, so set
`VITE_API_PROXY=http://localhost:3100` in `.env` (see `.env.example`) or inline:
`VITE_API_PROXY=http://localhost:3100 npm run dev`. The browser calls `VITE_API_BASE` (default `/api/v1`).

Scripts: `dev`, `build` (typecheck + bundle), `preview`, `lint`, `typecheck`.

### Docker

```bash
docker build -t afs-procurement-fn .
docker run -p 8080:80 -e API_UPSTREAM=http://api:3000 afs-procurement-fn
```

Multi stage: node build -> nginx. `nginx.conf` is an nginx *template* (the image substitutes `${API_UPSTREAM}`,
default `http://api:3000`); `/api/` is proxied to the API, everything else falls back to `index.html`.
Put the container on the same docker network as a service called `api`, or set `API_UPSTREAM`.

### Dev seed accounts

Password `Passw0rd!dev` (no TOTP in dev): `admin@afs.local`, `staff@afs.local`, `accountant@afs.local`,
`director.comms@afs.local`, `director.dept@afs.local`, `pi@afs.local`, `cfm@afs.local`,
`verifier@afs.local` (market verifier), `superior@afs.local`.

## Folder map

```
src/
  api/        typed fetch client (client.ts), types.ts (mirrors the contract), one module per resource
  auth/       AuthProvider, useAuth, route guards (RequireAuth/RequireRole), hasRole()/can()
  ui/         small primitives: Button Card Badge StatusBadge Field Input/Select/Textarea Table Modal
              Spinner EmptyState Toast PageHeader Alert Tabs - each with a documented className hook
  features/
    forms/    schema driven FormRenderer, fields/ (one component per type), registry, autosave hook
    signing/  SignaturePad, SignatureInput, SigningPanel, SlotList
    cases/    Stepper, DeliveryForm, ReasonModal
    documents/ PdfPreview, AuditTable
  layout/     AppShell (sidebar + header), nav.ts (sidebar entries and role filter)
  pages/      one file per route (admin/ has the admin sub pages)
  styles/     theme.css (tokens) base.css components.css layout.css forms.css
  lib/        format + download helpers
```

## How the form renderer works

`FormRenderer` is a controlled component: `template`, `data`, `onChange(key, value)`, `errors`, `readOnly`.
It walks `template.schema.sections`, skips sections/fields whose `visible_if` is false, computes `required`
from `required`/`required_if`, and renders each field through `FieldRenderer`, which looks the field `type` up in
`features/forms/registry.ts` and passes uniform `FieldProps` (value, onChange, error, readOnly, required...).

- **Tables** render each cell through the same registry (so any type can be a column, computed included) and
  report errors by path, e.g. `items[0].qty`. Error paths come from `error.fields` (submit) and
  `validation.errors` (autosave).
- **Autosave**: `useDocumentEditor(doc, template)` keeps the local data, and sends one `PATCH /documents/{id}` with the
  changed top level keys ~2 s after the last edit while the document is a draft. It merges server computed values
  and validation errors back, exposes `status` (`saved/saving/dirty/offline/error`, shown by `SaveIndicator`),
  retries when the browser comes back online, and `flush()` is awaited before submit. Errors are only shown for
  fields the user touched until a submit attempt (the server returns errors for every empty required field).
- **Read-only mode** (`readOnly` prop) is used for frozen documents (anything not `can.edit` / not `draft`) and
  for fields with `readonly`, `computed` or `case_ref`.

### Add a field type

1. Create `src/features/forms/fields/MyField.tsx` exporting a component that takes `FieldProps`
   (wrap the control in `<Field>` from `ui/Field` and spread `fieldAria(...)` on it).
2. Register it in `src/features/forms/registry.ts` (`my_type: MyField`), or call `registerField('my_type', MyField)`.
3. Add the type to `FieldType` in `src/api/types.ts` and, if it should span the full row, to `WIDE_TYPES`.

Unknown types fall back to a plain text input, so a new backend type never crashes the page.

## UI developer guide - what to restyle first

1. **`src/styles/theme.css`** - all colours, spacing, radius, fonts, control height, dark mode
   (`prefers-color-scheme`, or force with `<html data-theme="dark|light">`). Most of the app follows from this file.
2. **`src/ui/` primitives + `styles/components.css`** - Button, Card, Badge/StatusBadge (status -> tone map in
   `StatusBadge.tsx`), Field/Input, Table, Modal (native `<dialog>`), Toast.
3. **Layout** - `layout/AppShell.tsx`, `nav.ts`, `styles/layout.css` (sidebar collapses to a drawer under 900px).
4. **Case stepper** - `features/cases/Stepper.tsx` and the `.stepper` rules in `layout.css`.
5. **Signature pad / signing panel** - `features/signing/*`, `.sig-*` and `.slot*` rules in `forms.css`.
6. **Form look** - `styles/forms.css` (`.form-section`, `.table-field` which turns into cards on phones).

Keep semantic HTML and the label/`aria-describedby` wiring in `ui/Field.tsx` when restyling.

## Contract notes (API-CONTRACT.md addendum is authoritative)

- `Field.fill_at`: fields filled at a later signature stay read only until that slot's signing panel is open; their
  values are sent as `data` in the sign body (422 `error.fields` are shown next to the inputs).
- `allow_other` uses the value `other` (radio, select, checkbox_group) and text in `${key}_other`.
- External signing uses the `template` returned by `GET /sign/{token}`, requires `signer_name`, and shows a message on 410.
- Signature images are fetched as blobs with the bearer token (`/documents/{id}/slots/{slot}/signature.png`).
- `can.edit_request` and `can.assign` drive the "Request edit" button and the delegate picker.
- Closed cases show a "Download purchase file" button (`/cases/{id}/purchase-file`, 404 until built).
- Notification links use `payload.path`; text uses `payload.message`/`title`.
- CONTRACT `clauses` text has `{advance_percent}`, `{advance_days}`, `{balance_percent}` substituted from the data.
- The `travel_category` help text is shown before signing `pi_final_authorization`.

## Other assumptions

- Case "Create <doc>" buttons are chosen by `current_stage` and hidden once a non-cancelled document of that type exists; the backend decides.
  "Cancel case" shows for admin/accountant/requester; "Advance arrangement" for `cfm` in the payment stage.
- `GET /documents`, `/notifications` and admin lists are assumed `{items, next_cursor?}`; report columns come from the row keys.
- Attachment file names are only known in the session that uploaded them (the document stores the id).
- Empty values are sent as `null`. Tokens live in `localStorage`; 401 triggers one refresh and retry.
- Extra routes: `/profile` (TOTP setup), `/requests/new`, `/memos/new`.
