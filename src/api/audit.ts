import { api } from './client';
import type { AuditEvent, AuditFilter, Paginated } from './types';

export const auditApi = {
  list: (filter: AuditFilter & { cursor?: string | null; limit?: number } = {}) =>
    api<Paginated<AuditEvent>>('/audit', { query: { ...filter } }),
};
