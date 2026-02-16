export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  jobTitle?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserProfile extends User {
  projectCount: number;
  taskCount: number;
  completedTaskCount: number;
  totalTimeLogged: number;
  bio?: string;
  phone?: string;
  timezone?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  jobTitle?: string;
  bio?: string;
  phone?: string;
  timezone?: string;
  avatar?: File;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailyDigest: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface UserState {
  users: User[];
  currentProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
}
