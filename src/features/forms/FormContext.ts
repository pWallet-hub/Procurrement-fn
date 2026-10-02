import { createContext, useContext } from 'react';

export interface FormContextValue {
  /** used by file fields when calling POST /attachments */
  caseId?: string | null;
  documentId?: string | null;
  idPrefix: string;
}

export const FormContext = createContext<FormContextValue>({ idPrefix: 'form' });
export const useFormContext = () => useContext(FormContext);
