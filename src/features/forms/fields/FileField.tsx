import { useState } from 'react';
import { attachmentsApi } from '../../../api/attachments';
import { errorMessage } from '../../../api/client';
import { Button } from '../../../ui/Button';
import { Field, fieldAria } from '../../../ui/Field';
import { Spinner } from '../../../ui/Spinner';
import { downloadBlob } from '../../../lib/download';
import { useFormContext } from '../FormContext';
import type { FieldProps } from '../types';

/** Uploads via POST /attachments and stores the attachment id (uuid) in the document. */
export function FileField({ field, id, value, onChange, error, readOnly, required, inline }: FieldProps) {
  const { caseId, documentId } = useFormContext();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const attachmentId = typeof value === 'string' ? value : null;

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    try {
      const att = await attachmentsApi.upload(file, { case_id: caseId, document_id: documentId, kind: field.key });
      setName(att.filename);
      onChange(att.id);
    } catch (e) {
      setUploadError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!attachmentId) return;
    try {
      downloadBlob(await attachmentsApi.download(attachmentId), name ?? `attachment-${attachmentId}`);
    } catch (e) {
      setUploadError(errorMessage(e));
    }
  }

  return (
    <Field id={id} label={field.label} help={field.help} error={error ?? uploadError ?? undefined} required={required} hideLabel={inline}>
      <div className="file-field">
        {attachmentId && (
          <>
            <span>{name ?? 'File attached'}</span>
            <Button size="sm" onClick={download}>
              Download
            </Button>
            {!readOnly && (
              <Button size="sm" variant="ghost" onClick={() => { setName(null); onChange(null); }}>
                Remove
              </Button>
            )}
          </>
        )}
        {!readOnly && (
          <input
            {...fieldAria(id, field.help, error, required)}
            type="file"
            accept={field.accept?.join(',')}
            disabled={busy}
            onChange={(e) => {
              void onPick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        )}
        {busy && <Spinner label="Uploading" />}
        {!attachmentId && readOnly && <span className="muted">No file</span>}
      </div>
    </Field>
  );
}
