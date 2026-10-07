import { ApiError, errorMessage } from '../../api/client';

/**
 * Server validation messages are short ("required", "is before the date of request (07/10/2026)").
 * These helpers turn them into sentences and add the server's hint on how to fix the field.
 */
export function problemSentence(msg: string): string {
  const m = msg.trim();
  if (m === 'required') return 'This field is required';
  if (/^(is|has|does|mixes|must|cannot|\()/.test(m)) return `This ${m}`;
  return m.charAt(0).toUpperCase() + m.slice(1);
}

/** "This field is required. Pick the date from the calendar." */
export function withHint(msg: string, hint?: string): string {
  const s = problemSentence(msg);
  return hint ? `${s}. ${hint}` : s;
}

/** Message of an API error plus how to fix it (for toasts and panels that have no field to point at). */
export function describeError(e: unknown): string {
  if (!(e instanceof ApiError)) return errorMessage(e);
  const general = e.hints._form;
  const fieldHints = Object.entries(e.hints).filter(([k]) => k !== '_form' && !(k in e.fields));
  const single = Object.keys(e.fields).length === 1 ? e.hints[Object.keys(e.fields)[0]] : undefined;
  const fix = general ?? single ?? fieldHints[0]?.[1];
  return fix && !e.message.includes(fix) ? `${e.message} ${fix}` : e.message;
}
