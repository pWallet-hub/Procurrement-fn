import { useFormContext } from './FormContext';
import { getFieldComponent, WIDE_TYPES } from './registry';
import { cx } from '../../ui/cx';
import { isRequired, isServerFilled, isVisible } from './conditions';
import type { FieldDef } from '../../api/types';
import type { Errors } from './types';

interface Props {
  field: FieldDef;
  /** object holding this field's value: document.data or a table row */
  container: Record<string, unknown>;
  onChangeKey: (key: string, value: unknown) => void;
  /** path prefix for error lookup, '' at top level or `items[0].` in a table row */
  pathPrefix?: string;
  errors: Errors;
  readOnly: boolean;
  rootData: Record<string, unknown>;
  inline?: boolean;
}

/** Resolves visibility / required / readonly, then delegates to the registered component. */
export function FieldRenderer({ field, container, onChangeKey, pathPrefix = '', errors, readOnly, rootData, inline }: Props) {
  const { idPrefix } = useFormContext();
  if (!isVisible(field, rootData)) return null;

  const Component = getFieldComponent(field.type);
  const path = `${pathPrefix}${field.key}`;
  const other = container[`${field.key}_other`];
  const el = (
    <Component
      field={field}
      path={path}
      id={`${idPrefix}-${path.replace(/[^\w]/g, '-')}`}
      value={container[field.key]}
      onChange={(v) => onChangeKey(field.key, v)}
      otherValue={typeof other === 'string' ? other : undefined}
      onOtherChange={(v) => onChangeKey(`${field.key}_other`, v)}
      error={errors[path]}
      errors={errors}
      readOnly={readOnly || isServerFilled(field)}
      required={isRequired(field, rootData)}
      inline={inline}
      rootData={rootData}
    />
  );
  return inline ? el : <div className={cx('form-field', WIDE_TYPES.has(field.type) && 'form-field--wide')}>{el}</div>;
}
