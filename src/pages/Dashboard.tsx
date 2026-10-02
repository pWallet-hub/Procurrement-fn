import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { casesApi } from '../api/cases';
import { signingApi } from '../api/signing';
import { useAuth } from '../auth/AuthContext';
import { CASE_CREATOR_ROLES, hasRole } from '../auth/permissions';
import { formatDateTime } from '../lib/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorState } from '../ui/ErrorState';
import { PageHeader } from '../ui/PageHeader';
import { PageSpinner } from '../ui/Spinner';
import { StatusBadge, humanize } from '../ui/StatusBadge';
import { DataTable } from '../ui/Table';

/** "My actions": pending signature tasks + open cases. */
export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const tasks = useQuery({ queryKey: ['signing-tasks'], queryFn: signingApi.tasks });
  const cases = useQuery({ queryKey: ['cases', { status: 'open', limit: 10 }], queryFn: () => casesApi.list({ status: 'open', limit: 10 }) });

  return (
    <div className="stack">
      <PageHeader
        title={`Welcome, ${user?.full_name.split(' ')[0] ?? ''}`}
        subtitle="Documents waiting for your signature and your open procurement cases."
        actions={hasRole(user, ...CASE_CREATOR_ROLES) && <Button variant="primary" onClick={() => navigate('/cases/new')}>New procurement case</Button>}
      />

      <Card title="Waiting for my signature">
        {tasks.isLoading ? <PageSpinner /> : tasks.error ? <ErrorState error={tasks.error} /> : (
          <DataTable
            rows={tasks.data?.items ?? []}
            rowKey={(t) => `${t.document_id}:${t.slot_key}`}
            empty="Nothing is waiting for your signature."
            onRowClick={(t) => navigate(`/documents/${t.document_id}`)}
            columns={[
              { header: 'Document', cell: (t) => <Link to={`/documents/${t.document_id}`}>{t.title}</Link> },
              { header: 'Type', cell: (t) => t.doc_type },
              { header: 'Request', cell: (t) => t.request_no ?? '—' },
              { header: 'Your role', cell: (t) => t.label },
              { header: 'Since', cell: (t) => formatDateTime(t.created_at) },
            ]}
          />
        )}
      </Card>

      <Card title="Open cases" actions={<Link to="/cases">All cases</Link>}>
        {cases.isLoading ? <PageSpinner /> : cases.error ? <ErrorState error={cases.error} /> : (
          <DataTable
            rows={cases.data?.items ?? []}
            rowKey={(c) => c.id}
            empty="No open cases."
            onRowClick={(c) => navigate(`/cases/${c.id}`)}
            columns={[
              { header: 'Request no', cell: (c) => <Link to={`/cases/${c.id}`}>{c.request_no}</Link> },
              { header: 'Project', cell: (c) => c.project },
              { header: 'Stage', cell: (c) => humanize(c.current_stage) },
              { header: 'Status', cell: (c) => <StatusBadge status={c.status} /> },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
