import { Fragment, type ReactNode } from 'react';
import type { FieldDef, Template } from '../../api/types';
import { cx } from '../../ui/cx';
import { isMoney, looksLikeId, optionLabel, paperDate, paperMoney, paperNumber } from './format';
import { expandBlocks, fieldMap, inlinePieces, type FlatBlock, type InlineCtx, type LayoutField, type PaperBlock, type PaperCell, type Piece } from './layoutCore';
import { SignatureMark, type SignOffSlot } from './SignOff';
import type { RefLabels } from './useRefLabels';

const STATUS_TEXT: Record<string, string> = {
  pending: 'Awaiting signature',
  waiting: 'Waiting for an earlier signature',
  declined: 'Declined',
  skipped: 'Not required',
  unsigned: 'Not yet submitted for signing',
};

interface Props {
  blocks: PaperBlock[];
  template: Template;
  data: Record<string, unknown>;
  slots: SignOffSlot[];
  documentId: string;
  refs: RefLabels;
}

/** Printable text of one value; check boxes, blanks and signatures are handled by layoutCore. */
function fmtValue(refs: RefLabels) {
  return (f: LayoutField, v: unknown): string => {
    const field = f as FieldDef;
    switch (field.type) {
      case 'date': return paperDate(v);
      case 'money': return paperMoney(v);
      case 'number': return typeof v === 'number' ? paperNumber(v) : String(v);
      case 'select': case 'radio': return optionLabel(field, v);
      case 'user_ref': case 'supplier_ref': case 'budget_line_ref': {
        const id = String(v);
        const label = field.type === 'user_ref' ? refs.user(id) : field.type === 'supplier_ref' ? refs.supplier(id) : refs.budget(id);
        return label ?? (looksLikeId(id) ? '' : id); // never print a raw uuid on a form
      }
      default:
        if (isMoney(v)) return paperMoney(v);
        if (typeof v === 'number') return paperNumber(v);
        return typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
  };
}

/**
 * Sections that have their own printed look. The heading text decides which look the grid right under it gets:
 *   B. TYPE OF REQUEST — Tick the applicable category   -> pf-grid--request
 *   E. REVIEW & APPROVAL                                 -> pf-grid--review
 *   F. FINANCE / ADMINISTRATION ACTION                   -> pf-grid--finance
 */
type GridVariant = 'request' | 'review' | 'finance';
function gridVariant(text: string | undefined): GridVariant | undefined {
  const t = text ?? '';
  if (/type of request/i.test(t)) return 'request';
  if (/review\s*(&|and)\s*approval/i.test(t)) return 'review';
  if (/finance\s*\/?\s*administration/i.test(t)) return 'finance';
  return undefined;
}

/** Cells of the request grid that need their own look (recognised by their printed text). */
function requestCellClass(text: string | undefined): string | false {
  const t = (text ?? '').trim();
  if (/^estimated/i.test(t)) return 'pf-cell--plain';
  if (/^noted/i.test(t)) return 'pf-cell--noted';
  if (/other/i.test(t) && /specify/i.test(t)) return 'pf-cell--other';
  return false;
}

/** The form body exactly as printed (template.schema.paper.blocks): headings, paragraphs and bordered grids. */
export function PaperBlocks({ blocks, template, data, slots, documentId, refs }: Props) {
  const ctx: InlineCtx = {
    data,
    fields: fieldMap(template.schema.sections as unknown as { fields: LayoutField[] }[]),
    slots: new Map(slots.map((s) => [s.key, { status: s.status, name: s.signer, position: s.position, signedAt: s.signedAt, assigned: s.assignedTo }])),
    fmt: fmtValue(refs),
  };
  const bySlot = new Map(slots.map((s) => [s.key, s]));
  const flat = expandBlocks(blocks, data);
  return (
    <>
      {flat.map((b, i) => (
        <Block key={i} block={b} prev={flat[i - 1]} ctx={ctx} documentId={documentId} bySlot={bySlot} />
      ))}
    </>
  );
}

function Block({ block: b, prev, ctx, documentId, bySlot }: { block: FlatBlock; prev?: FlatBlock; ctx: InlineCtx; documentId: string; bySlot: Map<string, SignOffSlot> }) {
  const render = (text: string, cell: Partial<PaperCell> = {}, bold = false, italic = false) =>
    <Pieces pieces={inlinePieces(text, cell, ctx, bold, italic)} documentId={documentId} bySlot={bySlot} />;

  if (b.t === 'heading') {
    // "B. TYPE OF REQUEST — Tick the applicable category": printed as one bold line, same size
    const dash = b.text.indexOf(' — ');
    const caps = (b.style ?? 'caps') === 'caps';
    const form = !!gridVariant(b.text);
    return (
      <h3 className={cx('pf-h', `pf-h--${b.style ?? 'caps'}`, form && 'pf-h--request')}>
        {dash > 0 && caps
          ? <>{b.text.slice(0, dash)} <span className="pf-h__tail">{b.text.slice(dash + 1)}</span></>
          : b.text}
      </h3>
    );
  }
  if (b.t === 'text') return <p className={cx('pf-text', `pf-text--${b.style ?? 'plain'}`)}>{render(b.text, {}, false, b.style === 'note')}</p>;

  const total = b.cols.reduce((a, c) => a + c, 0);
  const variant = prev?.t === 'heading' ? gridVariant(prev.text) : undefined;
  return (
    <div className={cx('pf-grid-wrap', b.attach && prev?.t === 'grid' && 'pf-grid-wrap--attach')}>
      <table className={cx('pf-grid', `pf-grid--${b.frame ?? 'solid'}`, b.dots && 'pf-grid--dots', b.small && 'pf-grid--small', b.cols.length > 4 && 'pf-grid--wide', variant && `pf-grid--${variant}`)}>
        <colgroup>
          {b.cols.map((c, i) => <col key={i} style={{ width: `${(c / total) * 100}%` }} />)}
        </colgroup>
        <tbody>
          {b.rows.map((row, r) => {
            // a row with nothing printed in it (the thin empty strip under the sign-off boxes)
            const emptyRow = row.every((cell) => !(cell.c ?? '').trim() && !cell.sub);
            return (
              <tr key={r} className={cx(emptyRow && 'pf-row--blank')}>
                {row.map((cell, c) => {
                  const Tag = cell.head ? 'th' : 'td';
                  return (
                    <Tag
                      key={c}
                      colSpan={cell.span}
                      rowSpan={cell.rspan}
                      scope={cell.head ? 'col' : undefined}
                      className={cx(
                        cell.label && 'pf-cell--label', cell.head && 'pf-cell--head', cell.small && 'pf-cell--small', cell.italic && 'pf-cell--italic',
                        cell.tone && `pf-cell--${cell.tone}`, cell.box && 'pf-cell--box', !!cell.h && 'pf-cell--top', cell.align && `pf-cell--${cell.align}`,
                        variant === 'request' && requestCellClass(cell.c),
                      )}
                      style={cell.h ? { height: `${cell.h}pt` } : undefined}
                    >
                      {render(cell.c ?? '', cell, !!(cell.label || cell.head || cell.bold), !!cell.italic)}
                      {cell.sub && <div className="pf-cell__sub">{render(cell.sub, cell)}</div>}
                    </Tag>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Pieces({ pieces, documentId, bySlot }: { pieces: Piece[]; documentId: string; bySlot: Map<string, SignOffSlot> }) {
  // a check box stays on the same line as its (short) label
  const skip = new Set<number>();
  const out: ReactNode[] = pieces.map((p, i) => {
    if (skip.has(i)) return null;
    const next = pieces[i + 1];
    if (p.k === 'box' && next && (next.k === 'text' || next.k === 'value') && next.s.trim().length <= 40) {
      skip.add(i + 1);
      return (
        <span key={i} className="pf-opt">
          <span className={cx('pf-box', p.on && 'pf-box--on')} role="img" aria-label={p.on ? 'checked' : 'not checked'} />
          {next.k === 'value' ? <span className="pf-v">{next.s}</span> : next.bold ? <strong>{next.s}</strong> : next.s}
        </span>
      );
    }
    switch (p.k) {
      case 'br': return <br key={i} />;
      case 'text': {
        let n: ReactNode = p.s;
        if (p.italic) n = <em>{n}</em>;
        if (p.bold) n = <strong>{n}</strong>;
        return <Fragment key={i}>{n}</Fragment>;
      }
      case 'value': return <span key={i} className={cx('pf-v', p.bold && 'pf-v--bold')}>{p.s}</span>;
      case 'box': return <span key={i} className={cx('pf-box', p.on && 'pf-box--on')} role="img" aria-label={p.on ? 'checked' : 'not checked'} />;
      case 'blank':
        return p.date
          ? <span key={i} className="pf-date" aria-hidden="true"><span className="pf-blank" />/<span className="pf-blank" />/<span className="pf-blank pf-blank--year" /></span>
          : <span key={i} className="pf-blank" style={{ width: `${Math.max(2, p.n * 0.45)}em` }} aria-hidden="true" />;
      case 'sig': {
        const s = bySlot.get(p.slot);
        return s ? <span key={i} className="pf-sig"><SignatureMark documentId={documentId} slot={s} /></span> : null;
      }
      case 'status':
        return (
          <span key={i} className={cx('pf-sign__status', `pf-sign__status--${p.status}`)}>
            {STATUS_TEXT[p.status] ?? p.status}
            {p.assigned && p.status !== 'unsigned' ? ` - ${p.assigned}` : ''}
          </span>
        );
      default: return null;
    }
  });
  return <>{out}</>;
}