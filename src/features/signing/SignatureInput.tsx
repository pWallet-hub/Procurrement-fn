import { useState } from 'react';
import type { SignMethod } from '../../api/types';
import { Field, fieldAria } from '../../ui/Field';
import { Input } from '../../ui/Input';
import { Tabs } from '../../ui/Tabs';
import { SignaturePad } from './SignaturePad';

export interface SignatureValue {
  method: SignMethod;
  signature_image?: string;
  signature_text?: string;
}

const MAX_UPLOAD_BYTES = 1_000_000;

/**
 * Chooses the signature method (draw / type / upload) and reports a ready-to-send value,
 * or null while nothing valid has been provided yet.
 */
export function SignatureInput({ defaultName = '', onChange }: { defaultName?: string; onChange: (v: SignatureValue | null) => void }) {
  const [method, setMethod] = useState<SignMethod>('draw');
  const [typed, setTyped] = useState(defaultName);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const switchTo = (m: SignMethod) => {
    setMethod(m);
    if (m === 'type') onChange(typed.trim() ? { method: 'type', signature_text: typed.trim() } : null);
    else if (m === 'upload') onChange(uploaded ? { method: 'upload', signature_image: uploaded } : null);
    else onChange(null); // drawing: pad reports after the first stroke
  };

  function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setUploadError('Please choose an image file.');
    if (file.size > MAX_UPLOAD_BYTES) return setUploadError('Image must be under 1 MB.');
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setUploaded(url);
      onChange({ method: 'upload', signature_image: url });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="stack">
      <Tabs
        tabs={[
          { id: 'draw', label: 'Draw' },
          { id: 'type', label: 'Type your name' },
          { id: 'upload', label: 'Upload' },
        ]}
        active={method}
        onChange={(id) => switchTo(id as SignMethod)}
      />
      {method === 'draw' && <SignaturePad onChange={(url) => onChange(url ? { method: 'draw', signature_image: url } : null)} />}
      {method === 'type' && (
        <div className="stack">
          <Field id="sig-typed" label="Full name">
            <Input
              {...fieldAria('sig-typed')}
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                onChange(e.target.value.trim() ? { method: 'type', signature_text: e.target.value.trim() } : null);
              }}
            />
          </Field>
          <div className="sig-typed" aria-hidden="true">
            {typed}
          </div>
        </div>
      )}
      {method === 'upload' && (
        <Field id="sig-upload" label="Signature image (PNG/JPG, max 1 MB)" error={uploadError ?? undefined}>
          <input id="sig-upload" type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
          {uploaded && <img className="sig-preview" src={uploaded} alt="Uploaded signature preview" />}
        </Field>
      )}
    </div>
  );
}
