export type ActivityAction =
  | 'task_created'
  | 'task_updated'
  | 'task_moved'
  | 'task_assigned'
  | 'task_unassigned'
  | 'task_deleted'
  | 'task_restored'
  | 'comment_added'
  | 'comment_deleted'
  | 'subtask_added'
  | 'subtask_completed'
  | 'subtask_deleted'
  | 'attachment_added'
  | 'attachment_deleted'
  | 'label_added'
  | 'label_removed'
  | 'member_added'
  | 'member_removed'
  | 'project_created'
  | 'project_updated'
  | 'project_archived'
  | 'column_created'
  | 'column_updated'
  | 'column_deleted';

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  description: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  projectId?: string;
  projectTitle?: string;
  taskId?: string;
  taskTitle?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
