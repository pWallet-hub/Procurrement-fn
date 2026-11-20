import { api } from './client';
import type { Template } from './types';

export const templatesApi = {
  list: () => api<{ items: Template[] }>('/templates'),
  /** `version`: the version a document was made with (shown exactly as signed and printed); the current form otherwise */
  get: (code: string, opts: { auth?: boolean; version?: number } = {}) =>
    api<Template>(`/templates/${code}${opts.version ? `?version=${opts.version}` : ''}`, { auth: opts.auth }),
};
