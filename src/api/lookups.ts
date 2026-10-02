import { api } from './client';
import type { BudgetLine, Department, LookupUser, Supplier } from './types';

export const lookupsApi = {
  users: () => api<{ items: LookupUser[] }>('/lookups/users'),
  suppliers: () => api<{ items: Supplier[] }>('/lookups/suppliers'),
  budgetLines: () => api<{ items: BudgetLine[] }>('/lookups/budget-lines'),
  departments: () => api<{ items: Department[] }>('/lookups/departments'),
  createSupplier: (body: Partial<Omit<Supplier, 'id'>> & { name: string }) =>
    api<Supplier>('/lookups/suppliers', { method: 'POST', body }),
};
