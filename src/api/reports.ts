import { api } from './client';
import type { ReportResult } from './types';

export type ReportName = 'open-cases' | 'cycle-time' | 'spend';
export const reportsApi = {
  get: (name: ReportName) => api<ReportResult>(`/reports/${name}`),
};
