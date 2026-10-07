// Types mirroring docs/API-CONTRACT.md. Keep in sync with the contract.
import type { PaperBlock } from '../features/paper/layoutCore';

export const ROLES = [
  'requesting_staff',
  'accountant',
  'director_comms',
  'director_dept',
  'pi',
  'cfm',
  'market_verifier',
  'superior',
  'admin',
] as const;
export type Role = (typeof ROLES)[number];

export type Currency = 'RWF' | 'USD' | 'EUR';
export interface Money {
  amount: number;
  currency: Currency;
}

export interface Paginated<T> {
  items: T[];
  next_cursor: string | null;
}

export interface Ref {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  position: string;
  department: Ref | null;
  roles: string[];
  permissions: string[];
  totp_enabled: boolean;
  /** a signature image is saved on the account (GET /me/signature) */
  has_signature?: boolean;
}

/** Admin view of a user (adds `active`). */
export interface AdminUser extends User {
  active?: boolean;
}

// ---- auth ----
export interface TokenPair {
  access_token: string;
  refresh_token: string;
}
export interface Session extends TokenPair {
  user: User;
}
export type LoginResponse = Session | { requires_totp: true; challenge_token: string };

// ---- lookups ----
export interface LookupUser {
  id: string;
  full_name: string;
  position: string;
  email: string;
  roles: string[];
}
export interface Supplier {
  id: string;
  name: string;
  tin_or_reg_no: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
}
export type FundingSource = 'internal' | 'external';
export interface BudgetLine {
  id: string;
  code: string;
  project: string;
  /** external = donor / partner funded; `funder` names the source */
  funding_source: FundingSource;
  funder: string | null;
  /** approved budget the available balance is measured against */
  baseline: number;
  available: number;
  currency: Currency;
  active?: boolean;
}
export interface Department {
  id: string;
  name: string;
}

// ---- templates ----
export interface Condition {
  field: string;
  equals?: unknown;
  includes?: string;
  truthy?: boolean;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'time'
  | 'number'
  | 'money'
  | 'select'
  | 'radio'
  | 'checkbox_group'
  | 'yes_no'
  | 'table'
  | 'file'
  | 'user_ref'
  | 'supplier_ref'
  | 'budget_line_ref'
  | 'computed'
  | 'case_ref';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  type: FieldType | (string & {}); // unknown types fall back to a text-ish renderer
  label: string;
  help?: string;
  required?: boolean;
  required_if?: Condition;
  visible_if?: Condition;
  readonly?: boolean;
  /** filled by the signer of this slot key; read only until that signing panel is open */
  fill_at?: string;
  options?: FieldOption[];
  allow_other?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  columns?: FieldDef[];
  min_rows?: number;
  max_rows?: number;
  accept?: string[];
  computed?: Record<string, unknown>;
  /** 'today' on date fields: prefilled with today's date */
  default?: unknown;
  format?: 'money';
  /** how to fill the field correctly (the server also sends hints with validation errors) */
  hint?: string;
}

export interface Section {
  key: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  visible_if?: Condition;
}

export interface SlotDef {
  key: string;
  label: string;
  role: string;
  seq: number;
  group?: string;
  declaration: string;
  assign?: 'creator' | 'case_requester' | `field:${string}`;
}

/** How the printed AfS-Rwanda form looks (API-CONTRACT addendum 2). Every field is optional on the client: see paperMeta.ts for defaults. */
export interface PaperMeta {
  layout?: 'form' | 'contract';
  /** `box` (default): org / FORM / version box · `title`: centred underlined title (TC-10) */
  header?: 'box' | 'title';
  subtitle?: string;
  /** printed body of the form (see features/paper/layoutCore.ts); absent on older template versions */
  blocks?: PaperBlock[];
  form_label?: string;
  title?: string;
  version?: string;
  date_label?: string;
  org?: string;
  footer?: string;
  intro?: string;
  signoff_title?: string;
  /** section key the sign-off grid is printed before (default: after all sections) */
  signoff_before?: string;
  notes?: string;
}

export interface Template {
  code: string;
  version: number;
  title: string;
  description: string;
  schema: { sections: Section[]; paper?: PaperMeta };
  signature_slots: SlotDef[];
  workflow: {
    guards_on_submit: string[];
    guards_on_sign: string[];
    requires_conflict_confirmation: boolean;
    footer_note?: string;
  };
}

// ---- cases ----
export type Stage =
  | 'requisition'
  | 'quotation'
  | 'market_check'
  | 'evaluation'
  | 'purchase_order'
  | 'delivery'
  | 'payment'
  | 'closed'
  | 'cancelled';

export type CaseStatus = 'open' | 'closed' | 'cancelled';

export interface DocumentSummary {
  id: string;
  doc_type: string;
  title: string;
  state: DocumentState;
  version: number;
}
export interface NextAction {
  document_id: string;
  doc_type: string;
  slot_key: string;
  label: string;
  role: string;
  assigned_user: Ref2 | null;
}
export interface Ref2 {
  id: string;
  full_name: string;
}

export interface Case {
  id: string;
  request_no: string;
  project: string;
  budget_line: { id: string; code: string } | null;
  requested_by: Ref2;
  required_by: string | null;
  status: CaseStatus;
  current_stage: Stage;
  market_check_required: boolean;
  contract_required: boolean;
  advance_arrangement: { reason: string } | null;
  selected_supplier: Ref | null;
  approved_amount: number | null;
  currency: Currency;
  delivery: Record<string, unknown> | null;
  created_at: string;
  closed_at: string | null;
  documents: DocumentSummary[];
  next_actions: NextAction[];
}

export interface TimelineStage {
  stage: Stage;
  label: string;
  status: 'done' | 'current' | 'upcoming' | 'skipped';
  documents: DocumentSummary[];
}
export interface Timeline {
  stages: TimelineStage[];
  events: AuditEvent[];
}

export interface DeliveryInput {
  delivery_date: string;
  invoice_no: string;
  invoice_date: string;
  delivery_note_ref: string;
  delivery_note_attachment_id: string;
}

// ---- documents ----
export type DocumentState = 'draft' | 'in_signing' | 'signed' | 'returned' | 'archived' | 'cancelled';
export type SlotStatus = 'pending' | 'waiting' | 'signed' | 'declined' | 'skipped';
export type SignMethod = 'draw' | 'type' | 'upload' | 'saved';

export interface DocumentSlot {
  slot_key: string;
  label: string;
  role_code: string;
  seq: number;
  group: string | null;
  status: SlotStatus;
  declaration: string;
  assigned_user: Ref2 | null;
  signature: {
    signer_name: string;
    /** the signer's position (job title) at signing time */
    signer_position?: string | null;
    signed_at: string;
    method: SignMethod;
    image_url?: string;
  } | null;
}

export interface DocumentCan {
  edit: boolean;
  submit: boolean;
  sign: string[]; // slot keys the current user may sign
  decline: string[];
  revise: boolean;
  cancel: boolean;
  edit_request: boolean;
  assign: boolean;
}

export interface Doc {
  id: string;
  case_id: string | null;
  request_no: string | null;
  doc_type: string;
  title: string;
  state: DocumentState;
  version: number;
  data: Record<string, unknown>;
  content_hash: string | null;
  template: { code: string; version: number };
  created_by: Ref2;
  created_at: string;
  updated_at: string;
  slots: DocumentSlot[];
  can: DocumentCan;
  returned_reason?: string | null;
  pdf_available: boolean;
  /** drafts only: problems in what was entered, what is still missing before submit, and how to fix each (by field path) */
  validation?: DraftValidation;
}

export interface DraftValidation {
  errors: Record<string, string>;
  missing?: Record<string, string>;
  hints?: Record<string, string>;
}

export interface SignBody {
  content_hash: string;
  declaration_accepted: boolean;
  conflict_confirmed?: boolean;
  method: SignMethod;
  signature_image?: string;
  signature_text?: string;
  /** draw/upload: also store this image as the account's saved signature */
  save_signature?: boolean;
  /** values of fields with fill_at === this slot */
  data?: Record<string, unknown>;
  /** external signers only */
  signer_name?: string;
  signer_position?: string;
}
export interface SignResult {
  document_state: DocumentState;
  signed_at: string;
  next_slots: string[] | unknown[];
}

// ---- attachments ----
export interface Attachment {
  id: string;
  filename: string;
  mime: string;
  size_bytes: number;
  sha256: string;
}

// ---- signing ----
export interface SigningTask {
  document_id: string;
  case_id: string | null;
  request_no: string | null;
  doc_type: string;
  title: string;
  slot_key: string;
  label: string;
  created_at: string;
}
export interface ExternalSignInfo {
  document: Doc;
  template: Template;
  slot: { slot_key: string; label: string; declaration: string };
  signer_email: string;
}
export interface VerifyResult {
  ok: boolean;
  checks: { content_hash: boolean; pdf_hash: boolean; audit_chain: boolean };
  failing?: string;
}

// ---- notifications / audit / reports ----
export interface Notification {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
  read_at: string | null;
}
export interface AuditEvent {
  id: string;
  at: string;
  actor: Ref2 | null;
  action: string;
  object_type: string;
  object_id: string;
  case_id: string | null;
  detail: unknown;
}
export interface AuditFilter {
  case_id?: string;
  actor?: string;
  from?: string;
  to?: string;
}
export type ReportRow = Record<string, unknown>;
export interface ReportResult {
  rows: ReportRow[];
}
