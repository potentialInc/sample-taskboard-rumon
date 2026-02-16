export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  columnId: string;
  columnTitle?: string;
  projectId?: string;
  assignee?: TaskAssignee;
  labels: TaskLabel[];
  subtasks: SubTask[];
  commentsCount: number;
  attachmentsCount: number;
  timeLogged: number;
  isCompleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignee {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
}

export interface TaskComment {
  id: string;
  text: string;
  authorId: string;
  author?: { id: string; fullName: string; avatar?: string };
  mentions: string[];
  parentCommentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  durationSeconds: number;
  description?: string | null;
  entryType: 'manual' | 'timer';
  startedAt?: string | null;
  endedAt?: string | null;
  loggedAt: string;
  user?: { id: string; fullName: string; avatar?: string };
}

export interface CalendarTask {
  id: string;
  title: string;
  dueDate: string;
  priority: TaskPriority;
  projectId: string;
  projectTitle: string;
  isCompleted: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  columnId: string;
  assigneeId?: string;
}

export interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  trashTasks: Task[];
  calendarTasks: CalendarTask[];
  myTasks: Task[];
  loading: boolean;
  error: string | null;
}
