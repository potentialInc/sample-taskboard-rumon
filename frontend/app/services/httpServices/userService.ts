import { httpService } from '~/services/httpService';
import type { User, UserProfile, UpdateProfileRequest, UserPreferences } from '~/types/user';
import type { TimeEntry } from '~/types/task';

export const userService = {
  getMe: () =>
    httpService.get<UserProfile>('/users/me'),

  getUserById: (id: string) =>
    httpService.get<User>(`/users/${id}`),

  updateProfile: (data: UpdateProfileRequest) => {
    if (data.avatar) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value as string | Blob);
        }
      });
      return httpService.patch<UserProfile>('/users/me', formData);
    }
    return httpService.patch<UserProfile>('/users/me', data);
  },

  updatePreferences: (data: Partial<UserPreferences>) =>
    httpService.patch<UserPreferences>('/users/me/preferences', data),

  getPreferences: () =>
    httpService.get<UserPreferences>('/users/me/preferences'),

  getMyTimeEntries: (params?: { startDate?: string; endDate?: string; taskId?: string }) =>
    httpService.get<{ timeEntries: TimeEntry[]; totalTime: number }>('/users/me/time-entries', { params }),

  searchByEmail: (email: string) =>
    httpService.get<User[]>('/users/search', { params: { email } }),

  getActiveUsers: () =>
    httpService.get<User[]>('/users/active'),
};
