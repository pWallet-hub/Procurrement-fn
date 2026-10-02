import { useQuery } from '@tanstack/react-query';
import { lookupsApi } from '../../../api/lookups';
import { formatNumber } from '../../../lib/format';
import type { FieldProps } from '../types';
import { RefSelect } from './RefSelect';

export function BudgetLineRefField(props: FieldProps) {
  const q = useQuery({ queryKey: ['lookups', 'budget-lines'], queryFn: lookupsApi.budgetLines, staleTime: 60_000 });
  const options = (q.data?.items ?? []).map((b) => ({
    id: b.id,
    label: `${b.code} - ${b.project} (${formatNumber(b.available)} ${b.currency} available)`,
  }));
  return <RefSelect props={props} options={options} loading={q.isLoading} />;
}
