import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TaskState, Task, CalendarTask } from '~/types/task';

const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  trashTasks: [],
  calendarTasks: [],
  myTasks: [],
  loading: false,
  error: null,
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      state.loading = false;
    },
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.unshift(action.payload);
    },
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
      if (state.currentTask?.id === action.payload.id) {
        state.currentTask = action.payload;
      }
    },
    removeTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
    },
    setTrashTasks: (state, action: PayloadAction<Task[]>) => {
      state.trashTasks = action.payload;
    },
    setCalendarTasks: (state, action: PayloadAction<CalendarTask[]>) => {
      state.calendarTasks = action.payload;
    },
    setMyTasks: (state, action: PayloadAction<Task[]>) => {
      state.myTasks = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setLoading,
  setTasks,
  setCurrentTask,
  addTask,
  updateTask,
  removeTask,
  setTrashTasks,
  setCalendarTasks,
  setMyTasks,
  setError,
} = taskSlice.actions;
export default taskSlice.reducer;
