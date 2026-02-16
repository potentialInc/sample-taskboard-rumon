import { combineReducers } from '@reduxjs/toolkit';
import counterReducer from '~/redux/features/counterSlice';
import authReducer from '~/redux/features/authSlice';
import userReducer from '~/redux/features/userSlice';
import projectReducer from '~/redux/features/projectSlice';
import taskReducer from '~/redux/features/taskSlice';
import notificationReducer from '~/redux/features/notificationSlice';
import labelReducer from '~/redux/features/labelSlice';

const rootReducer = combineReducers({
  counter: counterReducer,
  auth: authReducer,
  user: userReducer,
  project: projectReducer,
  task: taskReducer,
  notification: notificationReducer,
  label: labelReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
