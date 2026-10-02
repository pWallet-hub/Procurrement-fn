import type { PaperMeta, Template } from '../../api/types';

export type ResolvedPaper = Required<Omit<PaperMeta, 'intro' | 'notes' | 'signoff_before'>> & { intro?: string; notes?: string; signoff_before?: string };

const ORG = 'ALLIANCE FOR SCIENCE RWANDA (AfS-Rwanda)';

/**
 * template.schema.paper describes the printed form (header box, footer, notes ...). Older backends do not send it,
 * so every value has a fallback derived from the template itself.
 */
export function resolvePaper(t: Template): ResolvedPaper {
  const p = t.schema.paper ?? {};
  return {
    layout: p.layout ?? (t.code === 'CONTRACT' ? 'contract' : 'form'),
    form_label: p.form_label ?? `AfS-Rwa_${t.code}`,
    title: p.title ?? t.title,
    version: p.version ?? `${t.version}.0`,
    date_label: p.date_label ?? 'Date',
    org: p.org ?? ORG,
    footer: p.footer ?? `AfS-Rwanda Procurement System | ${t.code} | Controlled Internal Form`,
    signoff_title: p.signoff_title ?? 'Review & Sign-off',
    intro: p.intro,
    signoff_before: p.signoff_before,
    notes: p.notes ?? t.workflow.footer_note,
  };
}
