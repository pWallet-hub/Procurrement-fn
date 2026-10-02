import { useQuery } from '@tanstack/react-query';
import { lookupsApi } from '../../../api/lookups';
import type { FieldProps } from '../types';
import { RefSelect } from './RefSelect';

export function UserRefField(props: FieldProps) {
  const q = useQuery({ queryKey: ['lookups', 'users'], queryFn: lookupsApi.users, staleTime: 5 * 60_000 });
  const options = (q.data?.items ?? []).map((u) => ({ id: u.id, label: u.position ? `${u.full_name} (${u.position})` : u.full_name }));
  return <RefSelect props={props} options={options} loading={q.isLoading} />;
}
