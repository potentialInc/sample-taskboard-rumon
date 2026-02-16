import { httpService } from '~/services/httpService';
import type { Project, CreateProjectRequest, ProjectMember, Column } from '~/types/project';

export const projectService = {
  // Backend returns { projects, pagination } in data field
  getProjects: (params?: { filter?: string; search?: string; sort?: string; page?: number; limit?: number }) =>
    httpService.get<{ projects: Project[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>('/projects', { params }),

  // Backend returns project entity directly in data field
  getProjectById: (id: string) =>
    httpService.get<Project>(`/projects/${id}`),

  createProject: (data: { title: string; description?: string; deadline?: string; template?: string; customColumns?: string[]; inviteEmails?: string[] }) =>
    httpService.post<Project>('/projects', data),

  updateProject: (id: string, data: Partial<CreateProjectRequest>) =>
    httpService.patch<Project>(`/projects/${id}`, data),

  deleteProject: (id: string) =>
    httpService.delete<void>(`/projects/${id}`),

  archiveProject: (id: string) =>
    httpService.post<Project>(`/projects/${id}/archive`),

  restoreProject: (id: string) =>
    httpService.post<Project>(`/projects/${id}/restore`),

  // Backend returns array of members directly in data field
  getMembers: (projectId: string) =>
    httpService.get<ProjectMember[]>(`/projects/${projectId}/members`),

  addMembers: (projectId: string, emails: string[]) =>
    httpService.post<{ invited: string[]; alreadyMembers: string[] }>(`/projects/${projectId}/members`, { emails }),

  removeMember: (projectId: string, userId: string) =>
    httpService.delete<void>(`/projects/${projectId}/members/${userId}`),

  // Backend returns dashboard stats object directly in data field
  getDashboard: (projectId: string, params?: { startDate?: string; endDate?: string; assigneeId?: string; priority?: string }) =>
    httpService.get<any>(`/projects/${projectId}/dashboard`, { params }),

  exportProject: (projectId: string, params?: { format?: string; include?: string[] }) =>
    httpService.get<Blob>(`/projects/${projectId}/export`, { params, responseType: 'blob' } as never),

  // Backend returns array of columns directly in data field
  getColumns: (projectId: string) =>
    httpService.get<Column[]>(`/projects/${projectId}/columns`),

  createColumn: (projectId: string, data: { name: string; position?: number; wipLimit?: number }) =>
    httpService.post<Column>(`/projects/${projectId}/columns`, data),

  updateColumn: (columnId: string, data: Partial<{ name: string; wipLimit: number }>) =>
    httpService.patch<Column>(`/columns/${columnId}`, data),

  deleteColumn: (columnId: string) =>
    httpService.delete<void>(`/columns/${columnId}`),

  reorderColumn: (columnId: string, newPosition: number) =>
    httpService.post<Column[]>(`/columns/${columnId}/reorder`, { newPosition }),

  // Project Member actions
  leaveProject: (projectId: string) =>
    httpService.delete<void>(`/projects/${projectId}/leave`),

  acceptInvitation: (token: string) =>
    httpService.post<unknown>('/project-members/accept-invitation', { token }),

  declineInvitation: (token: string) =>
    httpService.post<void>('/project-members/decline-invitation', { token }),
};
