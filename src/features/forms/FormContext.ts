import { createContext, useContext } from 'react';

export interface FormContextValue {
  /** used by file fields when calling POST /attachments */
  caseId?: string | null;
  documentId?: string | null;
  idPrefix: string;
  /** slot key whose fill_at fields are editable right now (signing panel open) */
  fillAt?: string | null;
}

export const FormContext = createContext<FormContextValue>({ idPrefix: 'form' });
export const useFormContext = () => useContext(FormContext);
