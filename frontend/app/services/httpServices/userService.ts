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
      if (data.fullName !== undefined) formData.append('fullName', data.fullName);
      if (data.jobTitle !== undefined) formData.append('jobTitle', data.jobTitle);
      if (data.bio !== undefined) formData.append('bio', data.bio);
      if (data.phone !== undefined) formData.append('phone', data.phone);
      if (data.timezone !== undefined) formData.append('timezone', data.timezone);
      formData.append('avatar', data.avatar);
      return httpService.patch<UserProfile>('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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
