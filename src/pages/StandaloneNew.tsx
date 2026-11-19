import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { documentsApi } from '../api/documents';
import { errorMessage } from '../api/client';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';

/** Creates an empty standalone draft (POST /documents) and opens it. */
export function StandaloneNew({ docType, title, basePath, listLabel }: { docType: string; title: string; basePath: string; listLabel: string }) {
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: () => documentsApi.create(docType),
    onSuccess: (d) => navigate(`/documents/${d.id}`, { replace: true }),
  });
  return (
    <div className="stack">
      <PageHeader back={{ to: basePath, label: listLabel }} title={title} />
      <Card>
        <p>This creates an empty draft {docType} that you can fill in and submit for signing.</p>
        {create.error && <Alert tone="error">{errorMessage(create.error)}</Alert>}
        <div className="row">
          <Button variant="primary" loading={create.isPending} onClick={() => create.mutate()}>Create draft</Button>
          <Button onClick={() => navigate(basePath)}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}
