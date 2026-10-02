import type { FieldDef, Template } from '../../api/types';
import { fillPlaceholders } from '../forms/placeholders';
import { isVisible } from '../forms/conditions';
import { isEmpty } from './format';
import type { ResolvedPaper } from './paperMeta';
import { SignOffGrid, type SignOffSlot } from './SignOff';
import { Blank, PaperValue, type ValueCtx } from './Values';

interface Props {
  template: Template;
  paper: ResolvedPaper;
  data: Record<string, unknown>;
  ctx: ValueCtx;
  documentId: string;
  slots: SignOffSlot[];
}

type Row = Record<string, unknown>;

/** "Tax Declaration: This contract ..." -> bold label + text. */
function splitClause(text: string): { label?: string; body: string } {
  const m = /^([^:\n]{2,40}):\s*([\s\S]*)$/.exec(text.trim());
  return m ? { label: m[1].trim(), body: m[2].trim() } : { body: text.trim() };
}

/** Plain legal layout (paper.layout === 'contract'): title, parties, scope list, clauses, two signature blocks. */
export function ContractPaper({ template, paper, data, ctx, documentId, slots }: Props) {
  const sections = template.schema.sections;
  const parties = sections[0];
  const scope = sections.find((s) => s.fields.some((f) => f.type === 'table'));
  const rest = sections.filter((s) => s !== parties && s !== scope);

  // "This financial contract is made between Contractor Alliance ..." -> heading + contractor text
  const desc = parties?.description ?? '';
  const m = /^(.*?\bmade between)\s*(?:Contractor)?\s*([\s\S]*)$/i.exec(desc);
  const heading = m ? m[1] : 'This contract is made between';
  const contractor = m ? m[2] : desc;

  const clauses: Array<{ label?: string; body: string; extra?: FieldDef; key: string }> = [];
  for (const s of rest) {
    for (const f of s.fields.filter((x) => isVisible(x, data))) {
      if (!f.help) continue; // fields without text (advance %, days) are merged into the clauses below
      clauses.push({ key: f.key, label: f.label, body: fillPlaceholders(f.help, data), extra: f });
    }
    if (s.description) {
      s.description.split(/\n\s*\n/).filter(Boolean).forEach((p, i) => clauses.push({ key: `${s.key}-${i}`, ...splitClause(fillPlaceholders(p, data)) }));
    }
  }

  const scopeField = scope?.fields.find((f) => f.type === 'table');
  const scopeRows = (Array.isArray(data[scopeField?.key ?? '']) ? (data[scopeField!.key] as Row[]) : []);
  const scopeCount = Math.max(scopeRows.length, scopeField?.min_rows ?? 0, 1);
  const scopeCols = (scopeField?.columns ?? []).filter((c) => isVisible(c, data));

  return (
    <>
      <img className="paper__logo" src="/logo.png" alt="Alliance for Science Rwanda" />
      <h2 className="pc-title">{paper.title}</h2>
      {paper.intro && <p className="paper__intro">{paper.intro}</p>}

      <h3 className="pc-heading">{heading}</h3>
      <dl className="pc-parties">
        <dt>Contractor</dt>
        <dd>{contractor}</dd>
        <dt>Supplier</dt>
        <dd>
          {(parties?.fields ?? []).filter((f) => isVisible(f, data)).map((f) => (
            <div key={f.key}>
              {f.type === 'supplier_ref' ? "Supplier's Name" : f.label}: <PaperValue field={f} value={data[f.key]} ctx={ctx} />
            </div>
          ))}
        </dd>
      </dl>

      {scope && scopeField && (
        <>
          <h3 className="pc-heading">{scope.description ?? scope.title}</h3>
          <ol className="pc-scope">
            {Array.from({ length: scopeCount }, (_, i) => {
              const row = scopeRows[i] ?? {};
              return (
                <li key={i}>
                  <span className="pc-scope__cols">
                    {scopeCols.map((c) => (
                      <span key={c.key} title={c.label}>
                        {isEmpty(row[c.key]) ? <Blank wide /> : <PaperValue field={c} value={row[c.key]} ctx={{ ...ctx, container: row }} />}
                      </span>
                    ))}
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}

      <div className="pc-clauses">
        {clauses.map((c) => (
          <div key={c.key} className="pc-clause">
            {c.label && <h4>{c.label}:</h4>}
            <p>{c.body}</p>
            {c.extra && (c.extra.type === 'money' || c.extra.type === 'computed') && (
              <p className="pc-clause__value"><PaperValue field={c.extra} value={data[c.extra.key]} ctx={ctx} /></p>
            )}
          </div>
        ))}
      </div>

      {slots.length > 0 && (
        <section className="pc-sign">
          <h3 className="pc-heading">Signatures</h3>
          <SignOffGrid documentId={documentId} slots={slots} plain />
        </section>
      )}
      <footer className="paper__footer paper__footer--letterhead">{paper.footer}</footer>
    </>
  );
}

