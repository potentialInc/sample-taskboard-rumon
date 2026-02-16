import { httpService } from '../httpService';
import type {
  DashboardStats,
  AdminUserBackend,
  AdminProjectBackend,
  UserFilters,
  UserCreateDTO,
  UserUpdateDTO,
  ProjectFilters,
  AdminSettings,
} from '~/types/admin';

// --- Backend response shapes (before extractData unwrap) ---

interface UsersResponse {
  users: AdminUserBackend[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ProjectsResponse {
  projects: AdminProjectBackend[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const adminService = {
  // --- Auth ---
  adminLogin: (data: { email: string; password: string }) =>
    httpService.post<{ user: AdminUserBackend }>('/auth/admin-login', data),

  checkLogin: () =>
    httpService.get<AdminUserBackend>('/auth/check-login'),

  logout: () =>
    httpService.get<string>('/auth/logout'),

  changeUserPassword: (data: { currentPassword: string; newPassword: string }) =>
    httpService.post<{ user: AdminUserBackend }>('/auth/change-user-password', data),

  // --- Dashboard ---
  getDashboardStats: () =>
    httpService.get<DashboardStats>('/admin/dashboard'),

  // --- Users ---
  getUsers: (filters: UserFilters) => {
    // Map frontend status filter to backend isActive string param
    let isActive: string | undefined;
    if (filters.status === 'Active') {
      isActive = 'true';
    } else if (filters.status === 'Inactive') {
      isActive = 'false';
    }

    return httpService.get<UsersResponse>('/admin/users', {
      params: {
        search: filters.search || undefined,
        role: filters.role && filters.role !== 'all' ? filters.role : undefined,
        isActive,
        page: filters.page,
        limit: filters.limit,
      },
    });
  },

  createUser: (data: UserCreateDTO) =>
    httpService.post<AdminUserBackend>('/admin/users', data),

  updateUser: (id: string, data: UserUpdateDTO) =>
    httpService.patch<AdminUserBackend>(`/admin/users/${id}`, data),

  deleteUser: (id: string) =>
    httpService.delete<null>(`/admin/users/${id}`),

  suspendUser: (id: string) =>
    httpService.post<AdminUserBackend>(`/admin/users/${id}/suspend`),

  activateUser: (id: string) =>
    httpService.post<AdminUserBackend>(`/admin/users/${id}/activate`),

  // --- Projects ---
  getProjects: (filters: ProjectFilters) =>
    httpService.get<ProjectsResponse>('/admin/projects', {
      params: {
        search: filters.search || undefined,
        page: filters.page,
        limit: filters.limit,
      },
    }),

  deleteProject: (id: string) =>
    httpService.delete<null>(`/admin/projects/${id}`),

  // --- Settings ---
  getSettings: () =>
    httpService.get<AdminSettings>('/admin/settings'),

  updateSettings: (settings: Partial<AdminSettings>) =>
    httpService.patch<AdminSettings & { updatedAt: string }>('/admin/settings', settings),

  // --- Export ---
  exportData: () =>
    httpService.get<{ users: unknown[]; projects: unknown[]; exportedAt: string }>('/admin/export'),
};
