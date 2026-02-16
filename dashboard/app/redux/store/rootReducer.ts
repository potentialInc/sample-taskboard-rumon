import { combineReducers } from '@reduxjs/toolkit';
import userReducer from '~/redux/features/userSlice';
import counterReducer from '~/redux/features/counterSlice';
import adminReducer from '~/redux/features/adminSlice';

const rootReducer = combineReducers({
  user: userReducer,
  counter: counterReducer,
  admin: adminReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;