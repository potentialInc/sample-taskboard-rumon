import { httpService } from '~/services/httpService';
import type { ActivityLog } from '~/types/activity';

export const activityService = {
  getTaskActivities: (taskId: string) =>
    httpService.get<ActivityLog[]>(`/tasks/${taskId}/activities`),

  getProjectActivities: (projectId: string) =>
    httpService.get<ActivityLog[]>(`/projects/${projectId}/activities`),

  getRecentActivities: () =>
    httpService.get<ActivityLog[]>('/activities/recent'),
};
