import { httpService } from '~/services/httpService';
import type {
  Task,
  CreateTaskRequest,
  SubTask,
  TaskComment,
  TaskAttachment,
  TimeEntry,
  CalendarTask,
} from '~/types/task';

export interface TaskFilters {
  projectId?: string;
  columnId?: string;
  assigneeId?: string;
  status?: string;
  priority?: string;
  search?: string;
  dueDate?: string;
  labels?: string[];
  page?: number;
  limit?: number;
  sort?: string;
}

export const taskService = {
  // Backend returns { tasks, pagination } in data field
  getTasks: (params?: TaskFilters) =>
    httpService.get<{ tasks: Task[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>('/tasks', { params }),

  // Backend returns task entity directly in data field
  getTaskById: (id: string) =>
    httpService.get<Task>(`/tasks/${id}`),

  createTask: (data: CreateTaskRequest) =>
    httpService.post<Task>('/tasks', data),

  updateTask: (id: string, data: Partial<CreateTaskRequest>) =>
    httpService.patch<Task>(`/tasks/${id}`, data),

  deleteTask: (id: string) =>
    httpService.delete<void>(`/tasks/${id}`),

  // Task Actions - backend returns task entity directly
  moveTask: (id: string, columnId: string, position?: number) =>
    httpService.post<Task>(`/tasks/${id}/move`, { columnId, position }),

  assignTask: (id: string, assigneeId: string) =>
    httpService.post<Task>(`/tasks/${id}/assign`, { assigneeId }),

  unassignTask: (id: string) =>
    httpService.delete<Task>(`/tasks/${id}/assign`),

  // Labels
  addLabel: (taskId: string, labelId: string) =>
    httpService.post<any>(`/tasks/${taskId}/labels`, { labelId }),

  removeLabel: (taskId: string, labelId: string) =>
    httpService.delete<void>(`/tasks/${taskId}/labels/${labelId}`),

  // Trash - backend returns array directly
  getTrash: (projectId: string) =>
    httpService.get<Task[]>('/tasks/trash', { params: { projectId } }),

  restoreTask: (id: string) =>
    httpService.post<Task>(`/tasks/${id}/restore`),

  permanentlyDelete: (id: string) =>
    httpService.delete<void>(`/tasks/${id}/permanent`),

  // Calendar - backend returns data directly
  getCalendarTasks: (params: { startDate: string; endDate: string; projectId?: string }) =>
    httpService.get<CalendarTask[]>('/tasks/calendar', { params }),

  // My Tasks & Overdue
  getMyTasks: (params?: { dueDate?: string; sort?: string }) =>
    httpService.get<{ tasks: Task[]; pagination: any }>('/tasks', { params: { ...params, assignee: 'me' } }),

  getOverdueTasks: (params?: { projectId?: string; assigneeId?: string }) =>
    httpService.get<Task[]>('/tasks/overdue', { params }),

  // Sub-tasks
  getSubtasks: (taskId: string) =>
    httpService.get<SubTask[]>(`/tasks/${taskId}/subtasks`),

  createSubtask: (taskId: string, title: string) =>
    httpService.post<SubTask>(`/tasks/${taskId}/subtasks`, { title }),

  updateSubtask: (subtaskId: string, data: Partial<{ title: string }>) =>
    httpService.patch<SubTask>(`/subtasks/${subtaskId}`, data),

  deleteSubtask: (subtaskId: string) =>
    httpService.delete<void>(`/subtasks/${subtaskId}`),

  toggleSubtask: (subtaskId: string) =>
    httpService.post<SubTask>(`/subtasks/${subtaskId}/toggle`),

  reorderSubtask: (subtaskId: string, newPosition: number) =>
    httpService.post<void>(`/subtasks/${subtaskId}/reorder`, { newPosition }),

  // Comments
  getComments: (taskId: string, params?: { page?: number; limit?: number }) =>
    httpService.get<TaskComment[]>(`/tasks/${taskId}/comments`, { params }),

  createComment: (taskId: string, data: { text: string; mentions?: string[] }) =>
    httpService.post<TaskComment>(`/tasks/${taskId}/comments`, data),

  updateComment: (commentId: string, text: string) =>
    httpService.patch<TaskComment>(`/comments/${commentId}`, { text }),

  deleteComment: (commentId: string) =>
    httpService.delete<void>(`/comments/${commentId}`),

  replyToComment: (commentId: string, text: string) =>
    httpService.post<TaskComment>(`/comments/${commentId}/replies`, { text }),

  // Attachments
  getAttachments: (taskId: string) =>
    httpService.get<TaskAttachment[]>(`/tasks/${taskId}/attachments`),

  uploadAttachment: (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpService.post<TaskAttachment>(`/tasks/${taskId}/attachments`, formData);
  },

  deleteAttachment: (attachmentId: string) =>
    httpService.delete<void>(`/attachments/${attachmentId}`),

  getPresignedUrl: (attachmentId: string, expiresIn?: number) =>
    httpService.get<{ url: string; expiresAt: string }>(`/attachments/${attachmentId}/presigned-url`, { params: expiresIn ? { expiresIn } : undefined }),

  // Time Entries
  getTimeEntries: (taskId: string) =>
    httpService.get<TimeEntry[]>(`/tasks/${taskId}/time-entries`),

  createTimeEntry: (taskId: string, data: { durationSeconds: number; description?: string }) =>
    httpService.post<TimeEntry>(`/tasks/${taskId}/time-entries`, data),

  updateTimeEntry: (timeEntryId: string, data: { durationSeconds?: number; description?: string }) =>
    httpService.patch<TimeEntry>(`/time-entries/${timeEntryId}`, data),

  deleteTimeEntry: (timeEntryId: string) =>
    httpService.delete<void>(`/time-entries/${timeEntryId}`),

  startTimer: (taskId: string, description?: string) =>
    httpService.post<TimeEntry>('/time-entries/start', { taskId, description }),

  stopTimer: () =>
    httpService.post<TimeEntry>('/time-entries/stop'),

  // Activities
  getTaskActivities: (taskId: string) =>
    httpService.get<any>(`/tasks/${taskId}/activities`),
};
