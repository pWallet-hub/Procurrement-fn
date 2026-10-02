import { api } from './client';
import type { ExternalSignInfo, SignBody, SigningTask, VerifyResult } from './types';

export const signingApi = {
  tasks: () => api<{ items: SigningTask[] }>('/signing/tasks'),
  // External supplier (no login): single use token
  externalGet: (token: string) => api<ExternalSignInfo>(`/sign/${token}`, { auth: false }),
  externalSign: (token: string, body: SignBody, idempotencyKey: string) =>
    api<{ ok: true }>(`/sign/${token}`, { method: 'POST', body, auth: false, idempotencyKey }),
  // Public verification (QR target)
  verify: (documentId: string) => api<VerifyResult>(`/verify/${documentId}`, { auth: false }),
};
