import type { ComponentType } from 'react';
import type { FieldProps } from './types';
import { TextField } from './fields/TextField';
import { TextareaField } from './fields/TextareaField';
import { DateField } from './fields/DateField';
import { TimeField } from './fields/TimeField';
import { NumberField } from './fields/NumberField';
import { MoneyField } from './fields/MoneyField';
import { SelectField } from './fields/SelectField';
import { RadioField } from './fields/RadioField';
import { CheckboxGroupField } from './fields/CheckboxGroupField';
import { YesNoField } from './fields/YesNoField';
import { TableField } from './fields/TableField';
import { FileField } from './fields/FileField';
import { UserRefField } from './fields/UserRefField';
import { SupplierRefField } from './fields/SupplierRefField';
import { BudgetLineRefField } from './fields/BudgetLineRefField';
import { ComputedField } from './fields/ComputedField';
import { CaseRefField } from './fields/CaseRefField';

export type FieldComponent = ComponentType<FieldProps>;

/**
 * Field type -> component. To add a new field type: create fields/MyField.tsx,
 * add it here (or call registerField at startup). Unknown types fall back to TextField.
 */
const registry: Record<string, FieldComponent> = {
  text: TextField,
  textarea: TextareaField,
  date: DateField,
  time: TimeField,
  number: NumberField,
  money: MoneyField,
  select: SelectField,
  radio: RadioField,
  checkbox_group: CheckboxGroupField,
  yes_no: YesNoField,
  table: TableField,
  file: FileField,
  user_ref: UserRefField,
  supplier_ref: SupplierRefField,
  budget_line_ref: BudgetLineRefField,
  computed: ComputedField,
  case_ref: CaseRefField,
};

export function registerField(type: string, component: FieldComponent) {
  registry[type] = component;
}

export function getFieldComponent(type: string): FieldComponent {
  return registry[type] ?? TextField;
}

/** Types that should span the full grid width. */
export const WIDE_TYPES = new Set(['textarea', 'table', 'checkbox_group', 'radio', 'file']);
