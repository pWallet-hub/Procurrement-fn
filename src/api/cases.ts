import { api, apiBlob } from './client';
import type { Case, DeliveryInput, Doc, Paginated, Timeline } from './types';

export interface CaseListParams {
  status?: string;
  stage?: string;
  q?: string;
  limit?: number;
  cursor?: string | null;
}

export const casesApi = {
  list: (params: CaseListParams = {}) => api<Paginated<Case>>('/cases', { query: { ...params } }),
  get: (id: string) => api<Case>(`/cases/${id}`),
  timeline: (id: string) => api<Timeline>(`/cases/${id}/timeline`),
  create: (body: { project?: string; budget_line_id?: string; required_by?: string; data?: Record<string, unknown> }) =>
    api<Case>('/cases', { method: 'POST', body }),
  patch: (id: string, body: { market_check_required?: boolean; contract_required?: boolean }) =>
    api<Case>(`/cases/${id}`, { method: 'PATCH', body }),
  createDocument: (id: string, doc_type: string) =>
    api<Doc>(`/cases/${id}/documents`, { method: 'POST', body: { doc_type } }),
  recordDelivery: (id: string, body: DeliveryInput) =>
    api<Case>(`/cases/${id}/delivery`, { method: 'POST', body }),
  advanceArrangement: (id: string, reason: string) =>
    api<Case>(`/cases/${id}/advance-arrangement`, { method: 'POST', body: { reason } }),
  purchaseFile: (id: string) => apiBlob(`/cases/${id}/purchase-file`),
  cancel: (id: string, reason: string) => api<Case>(`/cases/${id}/cancel`, { method: 'POST', body: { reason } }),
};
