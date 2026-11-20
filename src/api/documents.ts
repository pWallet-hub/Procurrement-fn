import { api, apiBlob } from './client';
import type { AuditEvent, Doc, Paginated, SignBody, SignResult } from './types';

export interface DocListParams {
  /** one form code, or several separated by commas */
  doc_type?: string;
  /** one state, or several separated by commas (the archive asks for "signed,archived") */
  state?: string;
  /** searches the request number, form code, title, the form's text and the creator's name */
  q?: string;
  mine?: boolean;
  limit?: number;
  cursor?: string | null;
}

export const documentsApi = {
  list: (params: DocListParams = {}) => api<Paginated<Doc>>('/documents', { query: { ...params } }),
  get: (id: string) => api<Doc>(`/documents/${id}`),
  create: (doc_type: string, data?: Record<string, unknown>) =>
    api<Doc>('/documents', { method: 'POST', body: { doc_type, data } }),
  /** Autosave. `data` is merged server side at top level key level (draft only). */
  patch: (id: string, data: Record<string, unknown>) =>
    api<Doc>(`/documents/${id}`, { method: 'PATCH', body: { data } }),
  /** `signature`: the creator's own first signature (Prepared / Requested by), required when they sign first. */
  submit: (id: string, idempotencyKey: string, signature?: Omit<SignBody, 'content_hash'>) =>
    api<Doc>(`/documents/${id}/submit`, { method: 'POST', idempotencyKey, ...(signature ? { body: { signature } } : {}) }),
  sign: (id: string, slotKey: string, body: SignBody, idempotencyKey: string) =>
    api<SignResult>(`/documents/${id}/slots/${slotKey}/sign`, { method: 'POST', body, idempotencyKey }),
  decline: (id: string, slotKey: string, reason: string) =>
    api<Doc>(`/documents/${id}/slots/${slotKey}/decline`, { method: 'POST', body: { reason } }),
  editRequest: (id: string, reason: string) =>
    api<Doc>(`/documents/${id}/edit-request`, { method: 'POST', body: { reason } }),
  revise: (id: string) => api<Doc>(`/documents/${id}/revise`, { method: 'POST' }),
  cancel: (id: string, reason: string) => api<Doc>(`/documents/${id}/cancel`, { method: 'POST', body: { reason } }),
  assign: (id: string, slotKey: string, user_id: string) =>
    api<Doc>(`/documents/${id}/slots/${slotKey}/assign`, { method: 'POST', body: { user_id } }),
  signatureImage: (id: string, slotKey: string) => apiBlob(`/documents/${id}/slots/${slotKey}/signature.png`),
  pdf: (id: string) => apiBlob(`/documents/${id}/pdf`),
  audit: (id: string) => api<{ items: AuditEvent[] }>(`/documents/${id}/audit`),
};
