import { createContext, useContext } from 'react';

export interface FormContextValue {
  /** used by file fields when calling POST /attachments */
  caseId?: string | null;
  documentId?: string | null;
  idPrefix: string;
  /** slot key whose fill_at fields are editable right now (signing panel open) */
  fillAt?: string | null;
  /** later slots whose fill_at fields this user may fill while editing the draft (see SlotDef.draft_fill) */
  draftFillSlots?: string[];
  /** how to fix each invalid field, by error path (from the server) */
  hints?: Record<string, string>;
}

export const FormContext = createContext<FormContextValue>({ idPrefix: 'form' });
export const useFormContext = () => useContext(FormContext);
