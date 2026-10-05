import { useState } from 'react';
import { attachmentsApi } from '../../../api/attachments';
import { errorMessage } from '../../../api/client';
import { Button } from '../../../ui/Button';
import { FileDropzone } from '../../../ui/FileDropzone';
import { Field } from '../../../ui/Field';
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

  async function onPick(file: File) {
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
      {attachmentId || !readOnly ? (
        <FileDropzone
          id={id}
          compact={inline}
          accept={field.accept}
          acceptLabel={field.accept ? field.accept.map((m) => m.split('/')[1]?.toUpperCase() ?? m).join(', ') : undefined}
          label={inline ? 'Add file' : 'Drag a file here, or click to choose'}
          busy={busy}
          disabled={readOnly}
          onFile={(f) => void onPick(f)}
          current={attachmentId ? { name: name ?? 'File attached' } : null}
          onRemove={() => { setName(null); onChange(null); }}
          actions={attachmentId ? <Button size="sm" onClick={download}>Download</Button> : undefined}
        />
      ) : (
        <span className="muted">No file</span>
      )}
    </Field>
  );
}
