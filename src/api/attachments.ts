import { api, apiBlob } from './client';
import type { Attachment } from './types';

export const attachmentsApi = {
  upload: (file: File, meta: { case_id?: string | null; document_id?: string | null; kind?: string } = {}) => {
    const form = new FormData();
    form.append('file', file);
    if (meta.case_id) form.append('case_id', meta.case_id);
    if (meta.document_id) form.append('document_id', meta.document_id);
    if (meta.kind) form.append('kind', meta.kind);
    return api<Attachment>('/attachments', { method: 'POST', body: form });
  },
  download: (id: string) => apiBlob(`/attachments/${id}`),
};
