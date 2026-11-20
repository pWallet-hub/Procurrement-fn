import { api } from './client';
import type { AdminUser, BudgetLine, Department, Program, Supplier, Template, TravellerProfile } from './types';

type List<T> = { items: T[] };

export interface InviteBody {
  email: string;
  full_name: string;
  position: string;
  department_id: string | null;
  roles: string[];
}
export interface UserPatch {
  full_name?: string;
  position?: string;
  department_id?: string | null;
  roles?: string[];
  active?: boolean;
}

export const adminApi = {
  users: () => api<List<AdminUser>>('/admin/users'),
  createUser: (body: InviteBody) => api<{ user: AdminUser }>('/admin/users', { method: 'POST', body }),
  patchUser: (id: string, body: UserPatch) => api<AdminUser>(`/admin/users/${id}`, { method: 'PATCH', body }),
  resendInvite: (id: string) => api<{ ok: true }>(`/admin/users/${id}/resend-invite`, { method: 'POST' }),
  resetPassword: (id: string) => api<unknown>(`/admin/users/${id}/reset-password`, { method: 'POST' }),
  resetTotp: (id: string) => api<unknown>(`/admin/users/${id}/reset-totp`, { method: 'POST' }),

  departments: () => api<List<Department>>('/admin/departments'),
  createDepartment: (body: Partial<Department>) => api<Department>('/admin/departments', { method: 'POST', body }),
  patchDepartment: (id: string, body: Partial<Department>) =>
    api<Department>(`/admin/departments/${id}`, { method: 'PATCH', body }),

  budgetLines: () => api<List<BudgetLine>>('/admin/budget-lines'),
  createBudgetLine: (body: Partial<BudgetLine>) => api<BudgetLine>('/admin/budget-lines', { method: 'POST', body }),
  patchBudgetLine: (id: string, body: Partial<BudgetLine>) =>
    api<BudgetLine>(`/admin/budget-lines/${id}`, { method: 'PATCH', body }),

  suppliers: () => api<List<Supplier>>('/admin/suppliers'),
  createSupplier: (body: Partial<Supplier>) => api<Supplier>('/admin/suppliers', { method: 'POST', body }),
  patchSupplier: (id: string, body: Partial<Supplier>) =>
    api<Supplier>(`/admin/suppliers/${id}`, { method: 'PATCH', body }),

  programs: () => api<List<Program>>('/admin/programs'),
  createProgram: (body: Partial<Program>) => api<Program>('/admin/programs', { method: 'POST', body }),
  patchProgram: (id: string, body: Partial<Program>) => api<Program>(`/admin/programs/${id}`, { method: 'PATCH', body }),

  travellers: () => api<List<TravellerProfile>>('/admin/travellers'),
  patchTraveller: (id: string, body: Partial<TravellerProfile>) => api<{ id: string }>(`/admin/travellers/${id}`, { method: 'PATCH', body }),

  templates: () => api<List<Template>>('/admin/templates'),
};
