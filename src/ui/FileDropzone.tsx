import { useEffect, useId, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './cx';
import { Button } from './Button';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

export function formatBytes(n: number): string {
  if (n < 1000) return `${n} B`;
  if (n < 1_000_000) return `${Math.round(n / 1000)} KB`;
  return `${+(n / 1_000_000).toFixed(1)} MB`;
}

export interface DropzoneFile {
  name: string;
  size?: number;
  /** object/data URL shown as a preview image */
  previewUrl?: string | null;
}

interface Props {
  /** accepted MIME types, e.g. ['image/png','image/jpeg']; omit to accept anything */
  accept?: string[];
  /** human wording for the accepted types, e.g. "PNG or JPG" */
  acceptLabel?: string;
  maxBytes?: number;
  /** called with a file that passed the type/size checks */
  onFile: (file: File) => void;
  /** the file currently chosen/attached (shows name, size, preview, Replace/Remove) */
  current?: DropzoneFile | null;
  onRemove?: () => void;
  busy?: boolean;
  disabled?: boolean;
  /** external error (e.g. upload failed) */
  error?: string | null;
  label?: string;
  /** accept images pasted from the clipboard while the zone is focused */
  paste?: boolean;
  id?: string;
  className?: string;
  /** extra content under the file summary (e.g. a Download button) */
  actions?: ReactNode;
  compact?: boolean;
}

/**
 * Reusable upload area: drag and drop, click or Enter/Space to browse, paste an image, drag-over highlight, client side
 * type/size validation with clear messages, file summary with preview and Replace/Remove.
 * className hooks: .dropzone .dropzone--over .dropzone--error .dropzone__file
 */
export function FileDropzone({ accept, acceptLabel, maxBytes, onFile, current, onRemove, busy, disabled, error, label = 'Drag a file here, or click to choose', paste, id, className, actions, compact }: Props) {
  const auto = useId();
  const inputId = id ?? `dz-${auto.replace(/:/g, '')}`;
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  useEffect(() => { if (current) setLocalError(null); }, [current]);

  const check = (file?: File | null) => {
    if (!file || disabled) return;
    if (accept && !accept.includes(file.type)) return setLocalError(`"${file.name}" is not allowed. Please choose ${acceptLabel ?? accept.join(', ')}.`);
    if (maxBytes && file.size > maxBytes) return setLocalError(`"${file.name}" is ${formatBytes(file.size)}. The maximum size is ${formatBytes(maxBytes)}.`);
    setLocalError(null);
    onFile(file);
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); check(e.dataTransfer.files?.[0]); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } };
  const onPaste = (e: ClipboardEvent) => {
    if (!paste) return;
    const f = Array.from(e.clipboardData.files)[0];
    if (f) { e.preventDefault(); check(f); }
  };
  const shownError = localError ?? error ?? null;

  return (
    <div className={cx('dropzone-wrap', className)}>
      {current && (
        <div className="dropzone__file">
          {current.previewUrl && <img className="dropzone__preview" src={current.previewUrl} alt="Preview" />}
          <div className="dropzone__meta">
            <strong>{current.name}</strong>
            {current.size != null && <span className="muted"> {formatBytes(current.size)}</span>}
          </div>
          <div className="row">
            {actions}
            {!disabled && <Button size="sm" onClick={() => input.current?.click()}>Replace</Button>}
            {!disabled && onRemove && <Button size="sm" variant="ghost" onClick={onRemove}>Remove</Button>}
          </div>
        </div>
      )}
      {!current && !disabled && (
        <div
          className={cx('dropzone', over && 'dropzone--over', shownError && 'dropzone--error', compact && 'dropzone--compact')}
          role="button"
          tabIndex={0}
          aria-label={`${label}${acceptLabel ? ` (${acceptLabel}${maxBytes ? `, max ${formatBytes(maxBytes)}` : ''})` : ''}`}
          aria-describedby={shownError ? `${inputId}-err` : undefined}
          onClick={() => !busy && input.current?.click()}
          onKeyDown={onKey}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          onPaste={onPaste}
          data-testid="dropzone"
        >
          {busy ? <Spinner label="Uploading" /> : <Icon name="upload" size={compact ? 18 : 26} />}
          <div className="dropzone__text">{busy ? 'Uploading…' : label}</div>
          {(acceptLabel || maxBytes) && (
            <div className="dropzone__hint">{[acceptLabel, maxBytes ? `max ${formatBytes(maxBytes)}` : null, paste ? 'or paste an image' : null].filter(Boolean).join(' · ')}</div>
          )}
        </div>
      )}
      <input
        ref={input}
        id={inputId}
        className="visually-hidden"
        type="file"
        tabIndex={-1}
        accept={accept?.join(',')}
        disabled={disabled || busy}
        onChange={(e) => { check(e.target.files?.[0]); e.target.value = ''; }}
      />
      {shownError && <div id={`${inputId}-err`} className="field__error" role="alert">{shownError}</div>}
    </div>
  );
}
