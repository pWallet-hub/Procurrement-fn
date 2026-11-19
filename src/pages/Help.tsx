import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { CASE_CREATOR_ROLES, hasRole } from '../auth/permissions';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';

/** The procurement stages in order, with the form used in each (see Procurrement-bn src/workflow/stages.ts). */
const STEPS: Array<{ stage: string; form?: string; text: string }> = [
  { stage: 'Requisition', form: 'PR-01', text: 'The requester describes what is needed, the budget line and the date it is needed by, then submits it for approval signatures.' },
  { stage: 'Quotations', form: 'QC-02', text: 'Quotations from suppliers are collected and recorded in the quotation register.' },
  { stage: 'Market check', form: 'MPV-03', text: 'Only when the case is marked “Market check required”: the market verifier confirms the prices are fair.' },
  { stage: 'Evaluation', form: 'QE-03', text: 'The quotations are compared, a supplier is recommended and the purchase order is authorised.' },
  { stage: 'Purchase order', form: 'PO-09', text: 'The purchase order is issued to the chosen supplier. When “Contract required” is ticked, a contract is signed too.' },
  { stage: 'Delivery', text: 'When the goods or services arrive, the accountant records the delivery date, invoice and delivery note on the case page.' },
  { stage: 'Payment', form: 'PA-04', text: 'The final compliance approval is signed and the supplier is paid.' },
  { stage: 'Closed', text: 'The case is complete. A single purchase file (PDF) with every signed document can be downloaded from the case page.' },
];

const FORMS: Array<{ code: string; name: string; where: string }> = [
  { code: 'PR-01', name: 'Procurement Requisition', where: 'Starts every procurement case' },
  { code: 'QC-02', name: 'Supplier Quotation Collection Register', where: 'Quotations stage' },
  { code: 'MPV-03', name: 'Market Price Verification', where: 'Market check stage (when required)' },
  { code: 'QE-03', name: 'Quotation Evaluation, Supplier Recommendation and PO Authorization', where: 'Evaluation stage' },
  { code: 'PO-09', name: 'Purchase Order', where: 'Purchase order stage' },
  { code: 'CONTRACT', name: 'Financial Contract (event management, communication materials and other supplies)', where: 'Purchase order stage (when required)' },
  { code: 'PA-04', name: 'Purchase / Service Payment Final Compliance Approval', where: 'Payment stage' },
  { code: 'GR-06', name: 'General Requisition and Activity Support Request', where: 'Requests, outside a case' },
  { code: 'IM-08', name: 'Internal Memorandum: Issue, Recommendation and Management Decision', where: 'Memos, outside a case' },
  { code: 'TC-10', name: 'Travel Clearance', where: 'Travel clearances, outside a case' },
];

const FAQ: Array<{ q: string; a: ReactNode; admin?: boolean }> = [
  { q: 'Where do I find what I need to sign?', a: <>On <Link to="/">My actions</Link>. Every document waiting for your signature is listed there with a <strong>Review &amp; sign</strong> button. You also get an email and a notification.</> },
  { q: 'How do I sign a document?', a: <>Open it, read the form, then use the signature box on the right. Save your signature once in <Link to="/profile">My account</Link> and you can sign with one click after that. If something is wrong, click <strong>Decline</strong> and give the reason: the document goes back to its author.</> },
  { q: 'I made a mistake after submitting. What now?', a: <>A submitted document is locked. Ask the signer who is next to <strong>Decline</strong> it with a reason. It comes back to you as <em>Returned</em>; click <strong>Revise</strong> to correct it and submit it again as a new version.</> },
  { q: 'Why can I not submit my draft?', a: 'The yellow box above the form lists what is still missing. Fill in every required field (marked with *) and the Submit button becomes available.' },
  { q: 'Why does a case not move to the next step?', a: <>Each stage moves on when its document is fully signed. Open the case: the <strong>Next step</strong> box at the top says exactly what it is waiting for, and who.</> },
  { q: 'A signer is away. Can someone else sign?', a: 'On the document, the person managing it can assign that signature to a specific person. An administrator can also give the role to someone else in Users.' },
  { q: 'How do I know a PDF is genuine?', a: 'Every signed PDF carries a QR code and a link to the verification page, which confirms that the document and its signatures have not been changed.' },
  { q: 'I am not getting emails.', a: 'Check your spam folder first. If they still do not arrive, tell an administrator: they can see failed emails on Administration › Overview and send them again.', },
  { q: 'Someone has not accepted their invitation.', a: <>In <Link to="/admin/users">Administration › Users</Link>, open the person’s menu and choose <strong>Resend invite</strong>.</>, admin: true },
  { q: 'How do I check that everything is working?', a: <><Link to="/admin/system">Administration › System health</Link> checks the database, file storage, background worker, email, PDFs, sign-in and the audit trail, and says how to fix anything that is broken.</>, admin: true },
  { q: 'A document has waited a long time for a signature.', a: <>On <Link to="/admin">Administration › Overview</Link>, “Signatures waiting” lists the oldest first, with a <strong>Remind now</strong> button. Reminders are also sent automatically every morning.</>, admin: true },
];

const SECTIONS = [
  { id: 'start', label: 'Getting started' },
  { id: 'steps', label: 'Steps of a case' },
  { id: 'signing', label: 'Signing' },
  { id: 'forms', label: 'Forms' },
  { id: 'faq', label: 'Questions' },
];

/** In-app help: how the procurement process works, how signing works, what each form is, and common questions. */
export function Help() {
  const { user } = useAuth();
  const { hash } = useLocation();
  const [q, setQ] = useState('');
  const isAdmin = hasRole(user, 'admin');
  const canCreate = hasRole(user, ...CASE_CREATOR_ROLES);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash]);

  const term = q.trim().toLowerCase();
  const faq = useMemo(() => FAQ.filter((f) => (!f.admin || isAdmin)), [isAdmin]);
  const text = (n: ReactNode): string => (typeof n === 'string' ? n : Array.isArray(n) ? n.map(text).join(' ') : n && typeof n === 'object' && 'props' in n ? text((n as { props: { children?: ReactNode } }).props.children) : '');
  const faqShown = term ? faq.filter((f) => `${f.q} ${text(f.a)}`.toLowerCase().includes(term)) : faq;
  const formsShown = term ? FORMS.filter((f) => `${f.code} ${f.name} ${f.where}`.toLowerCase().includes(term)) : FORMS;

  return (
    <div className="stack help">
      <PageHeader title="Help" subtitle="How the procurement system works, step by step." />

      <div className="list-toolbar" role="search">
        <label className="list-toolbar__search">
          <span className="visually-hidden">Search help</span>
          <Icon name="search" size={18} />
          <Input type="search" placeholder="Search questions and forms, e.g. “sign”, “PO-09”, “email”" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      {!term && (
        <nav className="help-toc" aria-label="On this page">
          {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="help-toc__link">{s.label}</a>)}
        </nav>
      )}

      {!term && (
        <>
          <section id="start" className="card card__body help-section">
            <h2>Getting started</h2>
            <ol className="help-steps">
              <li><strong>Save your signature.</strong> In <Link to="/profile">My account</Link>, draw or upload it once; you then sign with one click.</li>
              <li><strong>Check My actions.</strong> <Link to="/">My actions</Link> lists everything waiting for you. Notifications (the bell) tell you when something changes.</li>
              {canCreate && <li><strong>Start a purchase.</strong> Use <strong>New › Procurement case</strong> in the top bar. It creates the case and its requisition (PR-01) for you to fill in.</li>}
              <li><strong>Other documents.</strong> Requests (GR-06), memos (IM-08) and travel clearances (TC-10) are not part of a case; start them from <strong>New</strong> too.</li>
            </ol>
          </section>

          <section id="steps" className="card card__body help-section">
            <h2>Steps of a procurement case</h2>
            <p className="muted">Each step has a form. When the form is fully signed, the case moves to the next step automatically.</p>
            <ol className="help-timeline">
              {STEPS.map((s, i) => (
                <li key={s.stage}>
                  <span className="help-timeline__n" aria-hidden="true">{i + 1}</span>
                  <div><strong>{s.stage}</strong>{s.form && <span className="doc-chip help-timeline__chip">{s.form}</span>}<p>{s.text}</p></div>
                </li>
              ))}
            </ol>
          </section>

          <section id="signing" className="card card__body help-section">
            <h2>How signing works</h2>
            <ul className="help-points">
              <li><Icon name="edit" size={18} /><span>The author fills in the form and clicks <strong>Sign &amp; submit</strong>: on requisitions, memos and travel clearances the requester signs their own box first, so a request never goes out unsigned. From then on the content is locked and fingerprinted, so nobody can change what was signed.</span></li>
              <li><Icon name="bell" size={18} /><span>Each signer is asked in turn, by email and on <strong>My actions</strong>. A reminder follows automatically if they wait too long.</span></li>
              <li><Icon name="check" size={18} /><span>A signer can <strong>sign</strong>, or <strong>decline</strong> with a reason: the document is then returned to its author to correct and resubmit.</span></li>
              <li><Icon name="file" size={18} /><span>When everyone has signed, a PDF with all signatures and a verification QR code is produced and kept with the case.</span></li>
              <li><Icon name="shield" size={18} /><span>Every action is recorded in the audit log, which cannot be edited.</span></li>
            </ul>
          </section>
        </>
      )}

      <section id="forms" className="card card__body help-section">
        <h2>Forms</h2>
        {formsShown.length === 0 ? <p className="muted">No form matches “{q}”.</p> : (
          <dl className="help-forms">
            {formsShown.map((f) => (
              <div key={f.code}><dt><span className="doc-chip">{f.code}</span></dt><dd><strong>{f.name}</strong><span className="muted">{f.where}</span></dd></div>
            ))}
          </dl>
        )}
      </section>

      <section id="faq" className="card card__body help-section">
        <h2>Questions</h2>
        {faqShown.length === 0 ? <p className="muted">Nothing matches “{q}”. Try another word, or ask your administrator.</p> : (
          <div className="help-faq">
            {faqShown.map((f) => (
              <details key={f.q} className="collapse" open={!!term}>
                <summary>{f.q}</summary>
                <div className="collapse__body"><p>{f.a}</p></div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
