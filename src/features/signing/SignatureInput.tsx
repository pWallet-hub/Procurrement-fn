import { useEffect, useRef, useState } from 'react';
import type { SignMethod } from '../../api/types';
import { Field, fieldAria } from '../../ui/Field';
import { FileDropzone } from '../../ui/FileDropzone';
import { Input } from '../../ui/Input';
import { Tabs } from '../../ui/Tabs';
import { SavedSignatureImage } from './SavedSignatureImage';
import { SignaturePad } from './SignaturePad';

export interface SignatureValue {
  method: SignMethod;
  signature_image?: string;
  signature_text?: string;
  save_signature?: boolean;
}

export const SIGNATURE_MAX_BYTES = 1_000_000;
export const SIGNATURE_TYPES = ['image/png', 'image/jpeg'];

/** Reads a File as a data URL. */
export const readDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

/**
 * Chooses the signature method and reports a ready-to-send value, or null while nothing valid has been provided yet.
 * Tabs: Saved signature (only if `hasSaved`), Draw, Type your name, Upload (drag and drop).
 * With `allowSave`, draw/upload show "Save this signature to my account" (sent as save_signature).
 * Set `onlyImages` (profile page) to offer just Draw/Upload and no saved/typed option.
 */
export function SignatureInput({
  defaultName = '',
  onChange,
  hasSaved = false,
  allowSave = false,
  onlyImages = false,
}: {
  defaultName?: string;
  onChange: (v: SignatureValue | null) => void;
  hasSaved?: boolean;
  allowSave?: boolean;
  onlyImages?: boolean;
}) {
  const useSaved = hasSaved && !onlyImages;
  const [method, setMethod] = useState<SignMethod>(useSaved ? 'saved' : 'draw');
  const [typed, setTyped] = useState(defaultName);
  const [uploaded, setUploaded] = useState<{ url: string; name: string; size: number } | null>(null);
  const [saveIt, setSaveIt] = useState(!hasSaved);
  const base = useRef<SignatureValue | null>(null);

  const emit = (v: SignatureValue | null, save = saveIt) => {
    base.current = v;
    onChange(v && allowSave && (v.method === 'draw' || v.method === 'upload') ? { ...v, save_signature: save } : v);
  };

  useEffect(() => {
    if (useSaved) emit({ method: 'saved' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchTo = (m: SignMethod) => {
    setMethod(m);
    if (m === 'saved') emit({ method: 'saved' });
    else if (m === 'type') emit(typed.trim() ? { method: 'type', signature_text: typed.trim() } : null);
    else if (m === 'upload') emit(uploaded ? { method: 'upload', signature_image: uploaded.url } : null);
    else emit(null); // drawing: pad reports after the first stroke
  };

  async function onFile(file: File) {
    const url = await readDataUrl(file);
    setUploaded({ url, name: file.name || 'pasted-image', size: file.size });
    emit({ method: 'upload', signature_image: url });
  }

  const showSave = allowSave && (method === 'draw' || method === 'upload') && !!base.current;

  return (
    <div className="stack">
      <Tabs
        tabs={[
          ...(useSaved ? [{ id: 'saved', label: 'Saved signature' }] : []),
          { id: 'draw', label: 'Draw' },
          ...(onlyImages ? [] : [{ id: 'type', label: 'Type your name' }]),
          { id: 'upload', label: 'Upload' },
        ]}
        active={method}
        onChange={(id) => switchTo(id as SignMethod)}
      />
      {method === 'saved' && (
        <div className="saved-sig">
          <SavedSignatureImage className="saved-sig__img" />
          <p className="field__help" style={{ margin: 0 }}>This is the signature saved on your account. Tick the box above and press Sign.</p>
        </div>
      )}
      {method === 'draw' && <SignaturePad onChange={(url) => emit(url ? { method: 'draw', signature_image: url } : null)} />}
      {method === 'type' && (
        <div className="stack">
          <Field id="sig-typed" label="Full name">
            <Input
              {...fieldAria('sig-typed')}
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                emit(e.target.value.trim() ? { method: 'type', signature_text: e.target.value.trim() } : null);
              }}
            />
          </Field>
          <div className="sig-typed" aria-hidden="true">
            {typed}
          </div>
        </div>
      )}
      {method === 'upload' && (
        <FileDropzone
          id="sig-upload"
          accept={SIGNATURE_TYPES}
          acceptLabel="a PNG or JPG image"
          maxBytes={SIGNATURE_MAX_BYTES}
          label="Drag your signature image here, or click to choose"
          paste
          onFile={(f) => void onFile(f)}
          current={uploaded ? { name: uploaded.name, size: uploaded.size, previewUrl: uploaded.url } : null}
          onRemove={() => { setUploaded(null); emit(null); }}
        />
      )}
      {showSave && (
        <label className="choice">
          <input type="checkbox" checked={saveIt} onChange={(e) => { setSaveIt(e.target.checked); if (base.current) emit(base.current, e.target.checked); }} />
          <span>Save this signature to my account for next time</span>
        </label>
      )}
    </div>
  );
}
