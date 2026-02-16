import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthUser } from '~/types/auth';

function loadPersistedUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

const persistedUser = loadPersistedUser();

const initialState: AuthState = {
  user: persistedUser,
  isAuthenticated: !!persistedUser,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      localStorage.setItem('auth_user', JSON.stringify(action.payload));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      localStorage.removeItem('auth_user');
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('auth_user', JSON.stringify(action.payload));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
