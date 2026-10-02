import { api } from './client';
import type { Template } from './types';

export const templatesApi = {
  list: () => api<{ items: Template[] }>('/templates'),
  get: (code: string, opts: { auth?: boolean } = {}) => api<Template>(`/templates/${code}`, opts),
};
