import { Fragment, useMemo } from 'react';
import type { FieldDef, Section, Template, Doc } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { evalCondition, isVisible } from '../forms/conditions';
import { cx } from '../../ui/cx';
import { ContractPaper } from './ContractPaper';
import { isEmpty, paperDate } from './format';
import { resolvePaper, type ResolvedPaper } from './paperMeta';
import { SignOffGrid, toSignOffSlots } from './SignOff';
import { PaperValue, type ValueCtx } from './Values';
import { PaperBlocks } from './PaperBlocks';
import { useRefLabels } from './useRefLabels';

export interface PaperFormProps {
  template: Template;
  /** only id, slots and doc_type are needed */
  doc: Pick<Doc, 'id' | 'slots' | 'doc_type'>;
  /** document data; pass the live (unsaved) data to preview a draft */
  data: Record<string, unknown>;
  className?: string;
}

/**
 * Renders a document as its printed AfS-Rwanda form. Generic: driven by template.schema.paper, sections, fields,
 * document.data and document.slots. See README "How the PaperForm works".
 */
export function PaperForm({ template, doc, data, className }: PaperFormProps) {
  const { user } = useAuth();
  const refs = useRefLabels(!!user);
  const paper = useMemo(() => resolvePaper(template), [template]);
  const ctx: ValueCtx = { refs, container: data };
  const slots = useMemo(() => toSignOffSlots(doc.slots, template), [doc.slots, template]);

  if (paper.layout === 'contract') {
    return (
      <article className={cx('paper paper--contract', className)} aria-label={paper.title}>
        <ContractPaper template={template} paper={paper} data={data} ctx={ctx} documentId={doc.id} slots={slots} />
      </article>
    );
  }

  // header date: the document's own date (same choice as the generated PDF)
  const dateKeys = ['date_of_request', 'collection_date', 'mpv_date', 'issue_date', 'evaluation_date', 'date_submitted'];
  const dateField = dateKeys.find((k) => data[k]);
  const headerDate = dateField ? paperDate(data[dateField]) : '';

  const intro = paper.intro && (
    <div className="paper__intro">
      <PaperBlocks blocks={[{ t: 'text', text: paper.intro, style: 'intro' }]} template={template} data={data} slots={slots} documentId={doc.id} refs={refs} />
    </div>
  );

  // forms with a printed layout (template.schema.paper.blocks): drawn exactly like the reference form
  if (paper.blocks) {
    return (
      <article className={cx('paper paper--layout', className)} aria-label={paper.title}>
        <img className="paper__logo" src="/logo.png" alt="Alliance for Science Rwanda" />
        {paper.header === 'title' ? (
          <header className="pf-title">
            <h2 className="pf-title__main">{paper.title}</h2>
            {paper.subtitle && <p className="pf-title__sub">{paper.subtitle}</p>}
          </header>
        ) : (
          <HeaderBox paper={paper} headerDate={headerDate} />
        )}
        {intro}
        <PaperBlocks blocks={paper.blocks} template={template} data={data} slots={slots} documentId={doc.id} refs={refs} />
        <footer className="paper__footer">{paper.footer}</footer>
      </article>
    );
  }

  const signoff = slots.length > 0 && (
    <section className="pf-section">
      <h3 className="pf-section__title">{paper.signoff_title}</h3>
      <SignOffGrid documentId={doc.id} slots={slots} />
    </section>
  );

  return (
    <article className={cx('paper', className)} aria-label={paper.title}>
      <img className="paper__logo" src="/logo.png" alt="Alliance for Science Rwanda" />

      <HeaderBox paper={paper} headerDate={headerDate} />
      {intro}

      {template.schema.sections.map((section) => (
        <Fragment key={section.key}>
          {signoff && paper.signoff_before === section.key && signoff}
          {evalCondition(section.visible_if, data) ? <PaperSection section={section} data={data} ctx={ctx} /> : null}
        </Fragment>
      ))}

      {!(paper.signoff_before && template.schema.sections.some((s) => s.key === paper.signoff_before)) && signoff}

      {paper.notes && <p className="paper__notes">{paper.notes}</p>}
      <footer className="paper__footer">{paper.footer}</footer>
    </article>
  );
}

/** Org / FORM / title / version box at the top of the procurement forms. */
function HeaderBox({ paper, headerDate }: { paper: ResolvedPaper; headerDate: string }) {
  return (
    <table className="pf-header">
      <tbody>
        <tr>
          <td className="pf-header__org">{paper.org}</td>
          <td className="pf-header__meta pf-header__meta--form">FORM: {paper.form_label}</td>
        </tr>
        <tr>
          <td className="pf-header__title">{paper.title}</td>
          <td className="pf-header__meta">
            <div>Version: {paper.version}</div>
            <div>{paper.date_label}: {headerDate || <span className="pf-date"><span className="pf-blank" />/<span className="pf-blank" />/<span className="pf-blank" /></span>}</div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function PaperSection({ section, data, ctx }: { section: Section; data: Record<string, unknown>; ctx: ValueCtx }) {
  const fields = section.fields.filter((f) => isVisible(f, data));
  if (fields.length === 0) return null;
  // consecutive non-table fields share one label/value table; tables break the run
  const blocks: Array<{ kind: 'kv'; fields: FieldDef[] } | { kind: 'table'; field: FieldDef }> = [];
  for (const f of fields) {
    if (f.type === 'table') blocks.push({ kind: 'table', field: f });
    else {
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'kv') last.fields.push(f);
      else blocks.push({ kind: 'kv', fields: [f] });
    }
  }
  return (
    <section className="pf-section">
      <h3 className="pf-section__title">{section.title}</h3>
      {blocks.map((b, i) =>
        b.kind === 'kv' ? (
          <table key={i} className="pf-kv">
            <tbody>
              {b.fields.map((f) => (
                <tr key={f.key}>
                  <th scope="row" className="pf-kv__label">{f.label}</th>
                  <td className="pf-kv__value"><PaperValue field={f} value={data[f.key]} ctx={ctx} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <PaperTable key={b.field.key} field={b.field} rows={data[b.field.key]} data={data} ctx={ctx} showTitle={section.fields.length > 1} />
        ),
      )}
    </section>
  );
}

type Row = Record<string, unknown>;

/** Item table: light blue header row, numbered rows, blank rows up to min_rows so an empty draft still looks like the form. */
export function PaperTable({ field, rows, data, ctx, showTitle }: { field: FieldDef; rows: unknown; data: Record<string, unknown>; ctx: ValueCtx; showTitle?: boolean }) {
  const list: Row[] = Array.isArray(rows) ? (rows as Row[]) : [];
  const columns = (field.columns ?? []).filter((c) => isVisible(c, data));
  const count = Math.max(list.length, field.min_rows ?? 0, 1);
  return (
    <div className="pf-table-wrap">
      {showTitle && <div className="pf-table__caption">{field.label}</div>}
      <table className="pf-table">
        <thead>
          <tr>
            <th scope="col" className="pf-table__num">#</th>
            {columns.map((c) => <th key={c.key} scope="col">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: count }, (_, i) => {
            const row = list[i] ?? {};
            return (
              <tr key={i}>
                <td className="pf-table__num">{i + 1}</td>
                {columns.map((c) => (
                  <td key={c.key} className={cx(c.type === 'number' || c.type === 'money' || c.type === 'computed' ? 'pf-table__right' : undefined)}>
                    {isEmpty(row[c.key]) && !['yes_no', 'checkbox_group', 'radio', 'date'].includes(c.type) && list[i] === undefined
                      ? null
                      : <PaperValue field={c} value={row[c.key]} ctx={{ ...ctx, container: row }} compact />}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

