import { useQuery } from '@tanstack/react-query';
import { lookupsApi } from '../../api/lookups';

export interface RefLabels {
  user: (id: string) => string | undefined;
  supplier: (id: string) => string | undefined;
  budget: (id: string) => string | undefined;
}

/** Resolves user_ref / supplier_ref / budget_line_ref uuids to printable text. Disabled for public pages (no login). */
export function useRefLabels(enabled: boolean): RefLabels {
  const opts = { staleTime: 5 * 60_000, enabled };
  const users = useQuery({ queryKey: ['lookups', 'users'], queryFn: lookupsApi.users, ...opts });
  const suppliers = useQuery({ queryKey: ['lookups', 'suppliers'], queryFn: lookupsApi.suppliers, ...opts });
  const budgets = useQuery({ queryKey: ['lookups', 'budget-lines'], queryFn: lookupsApi.budgetLines, ...opts });
  return {
    user: (id) => users.data?.items.find((u) => u.id === id)?.full_name,
    supplier: (id) => suppliers.data?.items.find((s) => s.id === id)?.name,
    budget: (id) => {
      const b = budgets.data?.items.find((x) => x.id === id);
      return b ? `${b.code}${b.project ? ` - ${b.project}` : ''}` : undefined;
    },
  };
}
