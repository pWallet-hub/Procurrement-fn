import { useId, useMemo, useState, type ReactNode } from 'react';
import type { Template } from '../../api/types';
import { Alert } from '../../ui/Alert';
import { FieldRenderer } from './FieldRenderer';
import { FormContext } from './FormContext';
import { evalCondition } from './conditions';
import { describePath } from './paths';
import { fillPlaceholders } from './placeholders';
import type { Errors } from './types';
import { problemSentence } from './problems';

interface Props {
  template: Template;
  data: Record<string, unknown>;
  /** sets one top level key of document.data */
  onChange: (key: string, value: unknown) => void;
  errors?: Errors;
  /** how to fix each problem, by error path */
  hints?: Record<string, string>;
  /** fields still to complete before the draft can be submitted (shown as a checklist) */
  missing?: Errors;
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
export function FormRenderer({ template, data, onChange, errors = {}, hints = {}, missing = {}, readOnly = false, caseId, documentId, fillAt }: Props) {
  const idPrefix = useId().replace(/:/g, '');
  const ctx = useMemo(() => ({ caseId, documentId, idPrefix, fillAt, hints }), [caseId, documentId, idPrefix, fillAt, hints]);
  const errorEntries = Object.entries(errors);
  const missingEntries = Object.entries(missing).filter(([p]) => !(p in errors));
  const [checklistOpen, setChecklistOpen] = useState(false);

  /** Scroll to the input of an error path and focus it (table cells: the cell, else the table). */
  const goTo = (path: string) => {
    const candidates = [path, path.replace(/_other$/, ''), path.split(/[.[]/)[0]];
    for (const p of candidates) {
      const el = document.getElementById(`${idPrefix}-${p.replace(/[^\w]/g, '-')}`);
      if (!el) continue;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el.matches('input, select, textarea, button') ? el : el.querySelector<HTMLElement>('input, select, textarea, button'))?.focus({ preventScroll: true });
      return;
    }
  };
  const problemList = (entries: [string, string][], showProblem: boolean): ReactNode => (
    <ul className="form-errors">
      {entries.map(([path, msg]) => (
        <li key={path}>
          <button type="button" className="form-errors__link" onClick={() => goTo(path)}>{describePath(template, path)}</button>
          {showProblem || msg !== 'required' ? `: ${problemSentence(msg)}.` : ''}
          {hints[path] && <span className="form-errors__hint">{hints[path]}</span>}
        </li>
      ))}
    </ul>
  );

  return (
    <FormContext.Provider value={ctx}>
      <div className="form-renderer">
        {errorEntries.length > 0 && (!readOnly || !!fillAt) && (
          <Alert tone="error">
            <strong>{errorEntries.length === 1 ? '1 field needs attention' : `${errorEntries.length} fields need attention`}</strong>
            {' '}(select a field to go to it)
            {problemList(errorEntries, true)}
          </Alert>
        )}
        {missingEntries.length > 0 && !readOnly && (
          <details className="form-checklist" open={checklistOpen} onToggle={(e) => setChecklistOpen(e.currentTarget.open)}>
            <summary>
              <strong>Still to complete before you can submit: {missingEntries.length}</strong>
            </summary>
            {checklistOpen && problemList(missingEntries, false)}
          </details>
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
