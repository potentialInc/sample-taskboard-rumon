import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  DashboardStats,
  AdminUser,
  AdminProject,
  ActivityItem,
} from '~/types/admin';

interface AdminState {
  dashboard: DashboardStats | null;
  users: AdminUser[];
  usersTotal: number;
  projects: AdminProject[];
  projectsTotal: number;
  activities: ActivityItem[];
  activitiesTotal: number;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  dashboard: null,
  users: [],
  usersTotal: 0,
  projects: [],
  projectsTotal: 0,
  activities: [],
  activitiesTotal: 0,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setDashboard(state, action: PayloadAction<DashboardStats>) {
      state.dashboard = action.payload;
    },
    setUsers(state, action: PayloadAction<{ data: AdminUser[]; total: number }>) {
      state.users = action.payload.data;
      state.usersTotal = action.payload.total;
    },
    setProjects(state, action: PayloadAction<{ data: AdminProject[]; total: number }>) {
      state.projects = action.payload.data;
      state.projectsTotal = action.payload.total;
    },
    setActivities(state, action: PayloadAction<{ data: ActivityItem[]; total: number }>) {
      state.activities = action.payload.data;
      state.activitiesTotal = action.payload.total;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setDashboard,
  setUsers,
  setProjects,
  setActivities,
  setLoading,
  setError,
  clearError,
} = adminSlice.actions;

export default adminSlice.reducer;
