import { useId, useMemo } from 'react';
import type { Template } from '../../api/types';
import { Alert } from '../../ui/Alert';
import { FieldRenderer } from './FieldRenderer';
import { FormContext } from './FormContext';
import { evalCondition } from './conditions';
import { describePath } from './paths';
import type { Errors } from './types';

/** CONTRACT clauses: substitute {advance_percent}, {advance_days}, {balance_percent} from document data. */
function fillPlaceholders(text: string, data: Record<string, unknown>): string {
  const adv = Number(data.advance_percent);
  return text
    .replace(/\{advance_percent\}/g, data.advance_percent != null ? String(data.advance_percent) : '{advance_percent}')
    .replace(/\{advance_days\}/g, data.advance_days != null ? String(data.advance_days) : '{advance_days}')
    .replace(/\{balance_percent\}/g, data.advance_percent != null && !isNaN(adv) ? String(100 - adv) : '{balance_percent}');
}

interface Props {
  template: Template;
  data: Record<string, unknown>;
  /** sets one top level key of document.data */
  onChange: (key: string, value: unknown) => void;
  errors?: Errors;
  /** frozen documents and non-editors */
  readOnly?: boolean;
  caseId?: string | null;
  documentId?: string | null;
  /** slot key being signed: its fill_at fields become editable */
  fillAt?: string | null;
}

/**
 * Schema driven form. Controlled: owns no state. Pair it with useDocumentEditor for autosave.
 * Renders template.schema.sections; each field is resolved through registry.ts.
 */
export function FormRenderer({ template, data, onChange, errors = {}, readOnly = false, caseId, documentId, fillAt }: Props) {
  const idPrefix = useId().replace(/:/g, '');
  const ctx = useMemo(() => ({ caseId, documentId, idPrefix, fillAt }), [caseId, documentId, idPrefix, fillAt]);
  const errorEntries = Object.entries(errors);

  return (
    <FormContext.Provider value={ctx}>
      <div className="form-renderer">
        {errorEntries.length > 0 && (!readOnly || !!fillAt) && (
          <Alert tone="error">
            <strong>Please fix the following:</strong>
            <ul className="form-errors">
              {errorEntries.map(([path, msg]) => (
                <li key={path}>
                  {describePath(template, path)}: {msg}
                </li>
              ))}
            </ul>
          </Alert>
        )}
        {template.schema.sections.map((section) =>
          evalCondition(section.visible_if, data) ? (
            <fieldset key={section.key} className="form-section">
              <legend className="form-section__title">{section.title}</legend>
              {section.description && <p className="form-section__desc">{fillPlaceholders(section.description, data)}</p>}
              <div className="form-section__fields">
                {section.fields.map((f) => (
                  <FieldRenderer
                    key={f.key}
                    field={f}
                    container={data}
                    onChangeKey={onChange}
                    errors={errors}
                    readOnly={readOnly}
                    rootData={data}
                  />
                ))}
              </div>
            </fieldset>
          ) : null,
        )}
        {template.workflow.footer_note && <p className="form-footer-note">{template.workflow.footer_note}</p>}
      </div>
    </FormContext.Provider>
  );
}
