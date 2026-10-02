import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../api/client';
import { documentsApi } from '../../api/documents';
import type { Doc, Template } from '../../api/types';
import { mergeServerComputed } from './computed';
import { rootKey } from './paths';
import type { Errors } from './types';

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'offline' | 'error';

const AUTOSAVE_MS = 2000;
const RETRY_MS = 5000;

/**
 * Local copy of document.data + debounced autosave.
 * - setField() marks a key dirty; ~2s later one PATCH sends the dirty top level keys.
 * - Server computed values and validation errors from the response are merged back.
 * - Errors are only shown for fields the user touched, until showAllErrors() (after a submit attempt).
 * - flush() sends pending changes immediately (call before submit).
 */
export function useDocumentEditor(doc: Doc, template: Template | undefined) {
  const editable = doc.can.edit && doc.state === 'draft';
  const [data, setData] = useState<Record<string, unknown>>(doc.data ?? {});
  const [serverErrors, setServerErrors] = useState<Errors>(doc.validation?.errors ?? {});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');

  const pending = useRef<Record<string, unknown>>({});
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const chain = useRef<Promise<void>>(Promise.resolve());
  const templateRef = useRef(template);
  templateRef.current = template;

  const send = useCallback(async () => {
    const body = pending.current;
    if (Object.keys(body).length === 0) return;
    pending.current = {};
    setStatus('saving');
    try {
      const saved = await documentsApi.patch(doc.id, body);
      const t = templateRef.current;
      if (t) setData((prev) => mergeServerComputed(t, prev, saved.data ?? {}));
      setServerErrors(saved.validation?.errors ?? {});
      setStatus(Object.keys(pending.current).length ? 'dirty' : 'saved');
    } catch (e) {
      pending.current = { ...body, ...pending.current }; // keep for retry
      if (e instanceof ApiError && e.isNetwork) {
        setStatus('offline');
        clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), RETRY_MS);
      } else {
        if (e instanceof ApiError && Object.keys(e.fields).length) setServerErrors(e.fields);
        setStatus('error');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  /** Serialises saves so two PATCHes never overlap. */
  const flush = useCallback((): Promise<void> => {
    clearTimeout(timer.current);
    chain.current = chain.current.then(send);
    return chain.current;
  }, [send]);

  const setField = useCallback(
    (key: string, value: unknown) => {
      if (!editable) return;
      setData((d) => ({ ...d, [key]: value }));
      setTouched((t) => (t.has(key) ? t : new Set(t).add(key)));
      pending.current[key] = value;
      setStatus('dirty');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
    },
    [editable, flush],
  );

  // retry as soon as the browser is back online
  useEffect(() => {
    const onOnline = () => Object.keys(pending.current).length && void flush();
    const onOffline = () => Object.keys(pending.current).length && setStatus('offline');
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) e.preventDefault();
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeunload', beforeUnload);
      void flush(); // best effort on unmount
    };
  }, [flush]);

  const errors: Errors = showAll
    ? serverErrors
    : Object.fromEntries(Object.entries(serverErrors).filter(([p]) => touched.has(rootKey(p))));

  /** Show errors from a failed submit (ApiError.fields) on the form. */
  const applyApiError = useCallback((e: unknown) => {
    if (e instanceof ApiError && Object.keys(e.fields).length) setServerErrors(e.fields);
    setShowAll(true);
  }, []);

  return { data, setField, editable, errors, status, flush, applyApiError, showAllErrors: () => setShowAll(true) };
}
