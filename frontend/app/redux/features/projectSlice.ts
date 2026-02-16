import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ProjectState, Project, ProjectDashboard } from '~/types/project';

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  dashboard: null,
  loading: false,
  error: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
      state.loading = false;
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.unshift(action.payload);
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = action.payload;
      }
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
    },
    setDashboard: (state, action: PayloadAction<ProjectDashboard | null>) => {
      state.dashboard = action.payload;
      state.loading = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setLoading,
  setProjects,
  setCurrentProject,
  addProject,
  updateProject,
  removeProject,
  setDashboard,
  setError,
} = projectSlice.actions;
export default projectSlice.reducer;
