import { api } from './client';

/** Administration > System health and Overview (GET /admin/system/*, admin only). */
export type CheckStatus = 'ok' | 'warning' | 'error' | 'off';
export interface HealthCheck {
  key: string;
  label: string;
  status: CheckStatus;
  summary: string;
  fix?: string;
  facts?: Record<string, string | number | null>;
  ms?: number;
}
export interface SystemHealth {
  status: CheckStatus;
  checked_at: string;
  environment: string;
  app_url: string;
  checks: HealthCheck[];
}

interface Listed<T> { total: number; items: T[] }
export interface WaitingSignature { slot_id: string; label: string; role_code: string; assigned_to: string | null; document_id: string; doc_type: string; title: string; request_no: string | null; waiting_since: string }
export interface OverdueCase { id: string; request_no: string; project: string | null; required_by: string; current_stage: string; requested_by: string }
export interface StaleDraft { id: string; doc_type: string; title: string; request_no: string | null; created_by: string; updated_at: string }
export interface ReturnedDocument { id: string; doc_type: string; title: string; request_no: string | null; returned_reason: string | null; updated_at: string }
export interface FailedEmail { id: string; kind: string; email: string | null; error: string | null; created_at: string; full_name: string | null }

export interface SystemOverview {
  people: { active: number; inactive: number; invite_pending: number; no_roles: number; no_signature: number; password_login: boolean };
  setup: { departments: number; budget_lines: number; suppliers: number };
  waiting_signatures: Listed<WaitingSignature>;
  overdue_cases: Listed<OverdueCase>;
  stale_drafts: Listed<StaleDraft>;
  returned_documents: Listed<ReturnedDocument>;
  failed_emails: Listed<FailedEmail>;
  reminder_days: number;
}

export const systemApi = {
  health: () => api<SystemHealth>('/admin/system/health'),
  overview: () => api<SystemOverview>('/admin/system/overview'),
  verifyAudit: () => api<{ ok: boolean; failing_id?: number; checked: number }>('/admin/system/audit/verify', { method: 'POST' }),
  remind: (slotId: string) => api<{ sent: number }>(`/admin/system/slots/${slotId}/remind`, { method: 'POST' }),
  retryFailedEmails: () => api<{ retried: number }>('/admin/system/notifications/retry-failed', { method: 'POST' }),
};
