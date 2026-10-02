import { api } from './client';
import type { Notification, Paginated } from './types';

export const notificationsApi = {
  list: () => api<Paginated<Notification>>('/notifications'),
  markRead: (id: string) => api<Notification>(`/notifications/${id}/read`, { method: 'POST' }),
};
