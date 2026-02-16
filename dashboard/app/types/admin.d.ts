// ============================================================
// Admin Dashboard Types
// ============================================================

// --- Dashboard ---

export interface TrendPoint {
  label: string;
  date: string;
  value: number;
}

export interface TopProject {
  id: string;
  name: string;
  completionPercentage: number;
  taskCount: number;
}

export interface ActivityItem {
  id: string;
  actionType: string;
  description: string;
  userName: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalProjects: number;
  totalTasks: number;
  userRegistrationTrend: TrendPoint[];
  projectCreationTrend: TrendPoint[];
  taskCreationTrend: TrendPoint[];
  topProjects: TopProject[];
  recentActivity: ActivityItem[];
}

// --- Users ---

// Backend UserRole enum values: 'admin' | 'owner' | 'member'
export type UserRole = 'admin' | 'owner' | 'member';

// Display-friendly role labels
export type UserRoleDisplay = 'Admin' | 'Owner' | 'Member';

// Status derived from isActive boolean
export type UserStatus = 'Active' | 'Inactive';

// Backend user response shape (after sensitive fields removed)
export interface AdminUserBackend {
  id: string;
  email: string;
  name: string;
  jobTitle: string | null;
  profilePhotoUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
  notificationPreferences: {
    push: boolean;
    email: boolean;
    emailDigest: 'off' | 'daily' | 'weekly';
  };
  googleId: string | null;
}

// Frontend display user (mapped from backend)
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  avatarBgColor: string;
  avatarTextColor: string;
  role: UserRole;
  roleDisplay: UserRoleDisplay;
  status: UserStatus;
  isActive: boolean;
  jobTitle: string | null;
  projectsCount: number | null;
  tasksCount: number | null;
  registeredAt: string;
  lastActive: string;
}

export interface UserFilters {
  search?: string;
  role?: UserRole | 'all';
  status?: UserStatus | 'All Status';
  page?: number;
  limit?: number;
}

export interface UserCreateDTO {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  jobTitle?: string;
}

export interface UserUpdateDTO {
  name?: string;
  role?: UserRole;
  jobTitle?: string;
  isActive?: boolean;
}

// --- Projects ---

// Backend ProjectStatus enum values: 'active' | 'completed' | 'archived'
export type ProjectStatus = 'active' | 'completed' | 'archived';

export type ProjectStatusDisplay = 'Active' | 'Completed' | 'Archived';

// Backend project response shape
export interface AdminProjectBackend {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  status: ProjectStatus;
  completionPercentage: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

// Frontend display project (mapped from backend)
export interface AdminProject {
  id: string;
  name: string;
  description?: string;
  owner: string;
  ownerInitials: string;
  ownerEmail: string;
  status: ProjectStatus;
  statusDisplay: ProjectStatusDisplay;
  completionRate: number;
  createdAt: string;
  deadline: string;
}

export interface ProjectFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProjectMember {
  id: string;
  name: string;
  initials: string;
  avatarBgColor: string;
  avatarTextColor: string;
  role: string;
}

export interface ProjectActivity {
  id: string;
  description: string;
  timestamp: string;
  dotColor: string;
}

// --- Settings ---

export interface AdminSettings {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxProjectsPerUser: number;
  maxMembersPerProject: number;
  trashRetentionDays: number;
}

// --- Paginated Response ---

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
