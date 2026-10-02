import type { FieldDef } from '../../api/types';

export type Errors = Record<string, string>;

/** Props every field component receives. See fields/ and registry.ts. */
export interface FieldProps {
  field: FieldDef;
  /** error path, e.g. `items[0].qty`; also the basis for the DOM id */
  path: string;
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
  /** value / setter of the companion `${key}_other` text (allow_other) */
  otherValue?: string;
  onOtherChange: (value: string) => void;
  error?: string;
  /** all errors (table fields look up row/cell errors by path) */
  errors: Errors;
  readOnly: boolean;
  required: boolean;
  /** inside a table cell: hide label visually */
  inline?: boolean;
  /** whole document data (for conditions) */
  rootData: Record<string, unknown>;
}
