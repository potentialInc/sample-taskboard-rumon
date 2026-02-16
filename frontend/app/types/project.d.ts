export interface Project {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  status: 'active' | 'completed' | 'archived';
  progress: number;
  totalTasks: number;
  completedTasks: number;
  templateType: 'default' | 'minimal' | 'custom';
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  members: ProjectMember[];
  columns: Column[];
}

export interface ProjectMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  wipLimit?: number;
  taskCount: number;
  color?: string;
  projectId: string;
}

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  columns: string[];
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  deadline?: string;
  templateType: 'default' | 'minimal' | 'custom';
  customColumns?: { title: string; wipLimit?: number }[];
  memberEmails?: string[];
}

export interface ProjectDashboard {
  project: Project;
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
  memberWorkload: { memberId: string; memberName: string; taskCount: number }[];
  completionTrend: { date: string; completed: number }[];
  overdueTasks: number;
  totalTimeLogged: number;
}

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  dashboard: ProjectDashboard | null;
  loading: boolean;
  error: string | null;
}
