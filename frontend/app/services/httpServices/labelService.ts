import { httpService } from '~/services/httpService';
import type { Label } from '~/types/label';

export const labelService = {
  getLabels: (params?: { projectId?: string }) =>
    httpService.get<Label[]>('/labels', { params }),

  createLabel: (projectId: string, data: { name: string; color: string }) =>
    httpService.post<Label>(`/projects/${projectId}/labels`, data),

  updateLabel: (labelId: string, data: Partial<{ name: string; color: string }>) =>
    httpService.patch<Label>(`/labels/${labelId}`, data),

  deleteLabel: (labelId: string) =>
    httpService.delete<void>(`/labels/${labelId}`),
};
