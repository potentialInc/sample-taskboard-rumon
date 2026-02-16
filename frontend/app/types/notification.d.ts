export type NotificationType =
  | 'task_assigned'
  | 'due_date_reminder'
  | 'status_change'
  | 'comment_mention'
  | 'new_comment'
  | 'project_invitation';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    projectId?: string;
    taskId?: string;
    userId?: string;
  };
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}
