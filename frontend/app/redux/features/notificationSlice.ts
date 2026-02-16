import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { NotificationState, Notification } from '~/types/notification';

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.loading = false;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setLoading,
  setNotifications,
  setUnreadCount,
  markAsRead,
  markAllRead,
  addNotification,
  setError,
} = notificationSlice.actions;
export default notificationSlice.reducer;
