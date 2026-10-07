import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsApi } from '../../api/attachments';
import { ApiError, errorMessage } from '../../api/client';
import { withHint } from '../forms/problems';
import { todayIso } from '../../lib/format';
import { casesApi } from '../../api/cases';
import { Alert } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Field, fieldAria } from '../../ui/Field';
import { Input } from '../../ui/Input';
import { useToast } from '../../ui/Toast';

/** Accountant records delivery + invoice (POST /cases/{id}/delivery) -> case moves to payment. */
export function DeliveryForm({ caseId }: { caseId: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [v, setV] = useState({ delivery_date: '', invoice_no: '', invoice_date: '', delivery_note_ref: '' });
  const [fileId, setFileId] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<ApiError | Error | null>(null);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  const m = useMutation({
    mutationFn: () => casesApi.recordDelivery(caseId, { ...v, delivery_note_attachment_id: fileId }),
    onSuccess: () => {
      toast.success('Delivery recorded');
      void qc.invalidateQueries({ queryKey: ['case', caseId] });
      void qc.invalidateQueries({ queryKey: ['timeline', caseId] });
    },
    onError: (e: Error) => setErr(e),
  });
  // field errors with the server's hint on how to fix them
  const fe: Record<string, string> = err instanceof ApiError
    ? Object.fromEntries(Object.entries(err.fields).map(([k, m]) => [k, withHint(m, err.hints[k])]))
    : {};

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const a = await attachmentsApi.upload(file, { case_id: caseId, kind: 'delivery_note' });
      setFileId(a.id);
      setFileName(a.filename);
    } catch (e) {
      setErr(e as Error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        m.mutate();
      }}
    >
      <div className="grid-2">
        <Field id="d-date" label="Delivery date" required error={fe.delivery_date}>
          <Input {...fieldAria('d-date')} type="date" max={todayIso()} value={v.delivery_date} onChange={set('delivery_date')} />
        </Field>
        <Field id="d-inv" label="Invoice number" required error={fe.invoice_no}>
          <Input {...fieldAria('d-inv')} value={v.invoice_no} onChange={set('invoice_no')} />
        </Field>
        <Field id="d-invdate" label="Invoice date" required error={fe.invoice_date}>
          <Input {...fieldAria('d-invdate')} type="date" value={v.invoice_date} onChange={set('invoice_date')} />
        </Field>
        <Field id="d-note" label="Delivery note reference" required error={fe.delivery_note_ref}>
          <Input {...fieldAria('d-note')} value={v.delivery_note_ref} onChange={set('delivery_note_ref')} />
        </Field>
      </div>
      <Field id="d-file" label="Delivery note (scan)" required error={fe.delivery_note_attachment_id}>
        <input id="d-file" type="file" onChange={(e) => void upload(e.target.files?.[0])} disabled={uploading} />
        {fileName && <span className="muted">Uploaded: {fileName}</span>}
      </Field>
      {err && <Alert tone="error">{errorMessage(err)}</Alert>}
      <div>
        <Button type="submit" variant="primary" loading={m.isPending || uploading}>
          Record delivery
        </Button>
      </div>
    </form>
  );
}
