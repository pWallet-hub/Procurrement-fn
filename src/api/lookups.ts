import { api } from './client';
import type { BudgetLine, Department, LookupUser, Program, Supplier, TravellerOption } from './types';

export const lookupsApi = {
  users: () => api<{ items: LookupUser[] }>('/lookups/users'),
  suppliers: () => api<{ items: Supplier[] }>('/lookups/suppliers'),
  budgetLines: () => api<{ items: BudgetLine[] }>('/lookups/budget-lines'),
  departments: () => api<{ items: Department[] }>('/lookups/departments'),
  programs: () => api<{ items: Program[] }>('/lookups/programs'),
  travellers: () => api<{ items: TravellerOption[] }>('/lookups/travellers'),
  /** administrators only */
  createProgram: (name: string) => api<Program>('/lookups/programs', { method: 'POST', body: { name } }),
  createSupplier: (body: Partial<Omit<Supplier, 'id'>> & { name: string }) =>
    api<Supplier>('/lookups/suppliers', { method: 'POST', body }),
  /** needs the budget.manage permission */
  createBudgetLine: (body: Partial<Omit<BudgetLine, 'id'>> & { code: string }) =>
    api<BudgetLine>('/lookups/budget-lines', { method: 'POST', body }),
};
