import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserState, User, UserProfile } from '~/types/user';

const initialState: UserState = {
  users: [],
  currentProfile: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
      state.loading = false;
    },
    setCurrentProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.currentProfile = action.payload;
      state.loading = false;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.currentProfile) {
        state.currentProfile = { ...state.currentProfile, ...action.payload };
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setLoading, setUsers, setCurrentProfile, updateProfile, setError } = userSlice.actions;
export default userSlice.reducer;
