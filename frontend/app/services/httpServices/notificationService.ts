import { httpService } from '~/services/httpService';
import type { Notification } from '~/types/notification';

export const notificationService = {
  getNotifications: (params?: { page?: number; limit?: number; filter?: 'all' | 'unread' | 'assignments' | 'comments' | 'deadlines' }) =>
    httpService.get<{ notifications: Notification[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>('/notifications', { params }),

  markAsRead: (id: string) =>
    httpService.patch<{ notification: { id: string; isRead: boolean; readAt: string } }>(`/notifications/${id}/read`, {}),

  markAllRead: () =>
    httpService.post<{ updatedCount: number }>('/notifications/mark-all-read'),

  getUnreadCount: () =>
    httpService.get<{ count: number }>('/notifications/unread-count'),
};
