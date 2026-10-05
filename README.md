# AfS Rwanda Procurement - frontend

React 18 + TypeScript (strict) + Vite + React Router + TanStack Query. Plain CSS with design tokens, no UI kit.
Every route and the full form/signing flow talk to the API in `../docs/API-CONTRACT.md`. Styling is plain CSS driven by tokens
so a UI/UX developer can restyle it (see the UI developer guide).

## Run (standalone: this repo does not need the backend repo)

The frontend only needs the URL of a running API (see `../docs/API-CONTRACT.md`).

### Development

```bash
cp .env.example .env        # optional
npm install
VITE_API_PROXY=http://localhost:3100 npm run dev     # http://localhost:5173, proxies /api -> that API
```

`VITE_API_PROXY` can be any API URL (default `http://localhost:3000`; also settable in `.env`). The browser calls
`VITE_API_BASE` (default `/api/v1`). Scripts: `dev`, `build` (typecheck + bundle), `preview`, `lint`, `typecheck`.

### Docker (compose)

```bash
docker compose up -d --build                                   # http://localhost:8080 -> API_UPSTREAM
API_UPSTREAM=http://host.docker.internal:3100 WEB_PORT=8190 docker compose up -d --build
```

`docker-compose.yml` has one service, `web` (nginx serving the build, port `${WEB_PORT:-8080}:80`). `API_UPSTREAM` is where
`/api` is proxied and can be **any reachable URL**: `http://host.docker.internal:3100` (an API published on this machine;
`extra_hosts: host.docker.internal:host-gateway` makes that name work on Linux), `http://api:3000` (a container on a shared
network), or a remote `https://...` server. Put variables in `.env` (see `.env.example`).

Plain docker: `docker build -t afs-procurement-fn . && docker run -p 8080:80 -e API_UPSTREAM=http://host.docker.internal:3100 --add-host host.docker.internal:host-gateway afs-procurement-fn`.

nginx details (`nginx.conf` is an envsubst template; `docker/10-upstream.envsh` prepares the variables):
the upstream is resolved per request through a variable + `resolver`, so the container **starts even if the API is down**
(`/api` then answers a JSON 502 until it is reachable). `/etc/hosts` names such as `host.docker.internal` are swapped for their
IP at start because nginx's resolver does not read `/etc/hosts`. `GET /healthz` returns `ok` (web container only; used by the
image HEALTHCHECK). The SPA falls back to `index.html`.

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
              Spinner EmptyState Toast PageHeader Alert Tabs Icon FileDropzone - each with a documented className hook
  features/
    forms/    schema driven FormRenderer (editing), fields/ (one component per type), registry, autosave hook
    paper/    PaperForm: read-only "printed form" view (PaperForm, ContractPaper, SignOff, Values, paperMeta)
    signing/  SignaturePad, SignatureInput (saved/draw/type/upload), SigningPanel, SlotList, MySignature (profile card), SavedSignatureImage
    cases/    Stepper, DeliveryForm, ReasonModal
    documents/ PdfPreview, AuditTable
  layout/     AppShell (sidebar + header), PublicLayout (login/supplier/verify frame), nav.ts (sidebar entries + icons)
  pages/      one file per route (admin/ has the admin sub pages)
  styles/     theme.css (tokens) base.css components.css layout.css forms.css paper.css (paper view + print)
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

## How the PaperForm works

Every document is shown, by default, as its printed AfS-Rwanda form (document page, tab **Form**; drafts and people who
must fill a `fill_at` field open on **Edit fields**, the autosaving `FormRenderer`, and can flip to **Form** for a live
preview). The supplier signing page `/sign/:token` uses the same component.

`<PaperForm template doc data />` (`src/features/paper/`) is generic and read-only. It takes no per-form code:

- **Header box, intro, sign-off title, notes, footer** come from `template.schema.paper` (`PaperMeta` in `api/types.ts`).
  `paperMeta.ts` supplies fallbacks (from the template code/title/footer note) so older templates without `paper` still render.
- **Sections** (`schema.sections`, in order, honouring `visible_if`) become lettered blue-grey headings. Consecutive non-table
  fields share one two-column table (shaded label cell + value); `table` fields become item tables (light-blue header row,
  numbered rows, blank rows padded up to `min_rows`).
- **Values** are printed by field type in `Values.tsx`: dates as dd/mm/yyyy, money, refs resolved through the lookups (never a raw
  uuid), `checkbox_group`/`radio`/`yes_no` as check-box lists (boxes drawn with CSS so they print identically; `allow_other`
  prints "Other: text"), empty values as writing lines. Unknown types print as text.
- **Sign-off grid** (`SignOff.tsx`) is built from `document.slots` ordered by `seq` (or the template's slots for an unsubmitted
  draft), up to three per row: name, signature (`SignatureImage`, or the typed name for `method: type`), date; open slots show empty
  lines and their status.
- **`paper.layout === 'contract'`** switches to `ContractPaper.tsx`: bold centred title, parties, numbered scope list, clauses
  (section descriptions and field help, with `{advance_percent}` etc. substituted) in two columns, two signature blocks, letterhead footer.
- The header "date" is the form's first date field unless `date_label` contains "Effective" (that is the form edition date and stays blank).

**Print**: the *Print* button calls `window.print()`; `paper.css` (`@media print`, `@page` A4) hides the app chrome and avoids
breaking rows. On phones label/value cells stack and wide tables scroll sideways inside their wrapper.

### Add or adjust a form layout

1. Normally nothing in the frontend: change the template on the backend (sections/fields/`schema.paper`) and the paper view follows.
2. To restyle, edit the `--paper-*` tokens at the top of `styles/paper.css` (label shading, header blue, section colour, font, size).
3. To change how a field **type** prints, edit `Values.tsx` (`PaperValue`). To change the section structure (e.g. pair two short
   fields per row), edit `PaperSection` in `PaperForm.tsx`. To add a new layout, add a value to `PaperMeta.layout`, a component next
   to `ContractPaper.tsx` and branch on it at the top of `PaperForm`.

## Uploads, saved signature and dates

- **`ui/FileDropzone.tsx`** is the one upload pattern: drag and drop (highlight on drag-over), click or Enter/Space to browse,
  optional paste of an image, client-side type/size checks with plain-language errors, file summary with preview and
  Replace/Remove. Used by the signature *Upload* tab, by `FileField` (attachments, incl. QC-02 quotation files; same
  `POST /attachments` call) and can be reused anywhere. Props: `accept`, `acceptLabel`, `maxBytes`, `onFile`, `current`, `onRemove`, `paste`.
- **Saved signature** (API addendum 4): *Profile -> My signature* (`MySignature.tsx`) draws/uploads, saves (`PUT /me/signature`),
  shows the saved image (`GET /me/signature` as blob), replaces or deletes it. In the signing panel, if `user.has_signature`
  the first tab is *Saved signature* (sends `method: 'saved'`; the declaration checkbox is still required). Drawing or
  uploading shows "Save this signature to my account for next time" (checked by default when none is saved) and sends
  `save_signature: true`; afterwards `reloadUser()` refreshes `has_signature`. A `no_saved_signature` error shows a message,
  reloads the user and switches to the other tabs. External suppliers never see saved signatures.
- **Dates**: stored ISO, shown as dd/mm/yyyy (`lib/format.ts`: `formatDate`, `todayIso`). Every date input has a *Today* button
  and a "Shown as dd/mm/yyyy" hint; new table rows prefill date columns with `default: 'today'`; drafts keep the dates the
  backend prefilled (autosave only sends keys the user changed). The signing panel states that the signing date is recorded
  automatically.

## UI developer guide - what to restyle first

1. **`src/styles/theme.css`** - all colours, spacing, radius, fonts, control height, dark mode
   (`prefers-color-scheme`, or force with `<html data-theme="dark|light">`). Most of the app follows from this file.
2. **`src/ui/` primitives + `styles/components.css`** - Button, Card, Badge/StatusBadge (status -> tone map in
   `StatusBadge.tsx`), Field/Input, Table, Modal (native `<dialog>`), Toast.
3. **Layout** - `layout/AppShell.tsx`, `nav.ts`, `styles/layout.css` (sidebar collapses to a drawer with a menu button under 900px); public pages use `PublicLayout`. Brand colour `--color-primary` (AfS green), logo `public/logo.png` (transparent PNG; the sidebar crops its side lines with CSS).
4. **Case stepper** - `features/cases/Stepper.tsx` and the `.stepper` rules in `layout.css`.
5. **Signature pad / signing panel** - `features/signing/*`, `.sig-*` and `.slot*` rules in `forms.css`.
6. **Form look** - `styles/forms.css` (`.form-section`, `.table-field` which turns into cards on phones); **paper view** - `styles/paper.css`.
7. **Dashboard** - `pages/Dashboard.tsx` (task list with *Review & sign*, open cases); `ui/Icon.tsx` is the icon set.

Keep semantic HTML and the label/`aria-describedby` wiring in `ui/Field.tsx` when restyling.

## Contract notes (API-CONTRACT.md addendum is authoritative)

- `Field.fill_at`: fields filled at a later signature stay read only until that slot's signing panel is open; their
  values are sent as `data` in the sign body (422 `error.fields` are shown next to the inputs).
- `allow_other` uses the value `other` (radio, select, checkbox_group) and text in `${key}_other`.
- External signing uses the `template` returned by `GET /sign/{token}`, requires `signer_name`, and shows a message on 410.
- Signature images are fetched as blobs with the bearer token (`/documents/{id}/slots/{slot}/signature.png`).
- `can.edit_request` and `can.assign` drive the "Request edit" button and the delegate picker.
- The delegate picker is a collapsible "Reassign signer" listing only open slots.
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
