import { useQuery } from '@tanstack/react-query';
import { lookupsApi } from '../../../api/lookups';
import type { FieldProps } from '../types';
import { RefSelect } from './RefSelect';

export function SupplierRefField(props: FieldProps) {
  const q = useQuery({ queryKey: ['lookups', 'suppliers'], queryFn: lookupsApi.suppliers, staleTime: 60_000 });
  const options = (q.data?.items ?? []).map((s) => ({ id: s.id, label: s.name }));
  return <RefSelect props={props} options={options} loading={q.isLoading} />;
}
