import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import taskReducer from './slices/taskSlice';
import noteReducer from './slices/noteSlice'
import activityReducer from './slices/activitySlice';
import buddyReducer from './slices/buddySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    notes: noteReducer,
    activities: activityReducer,
    buddies: buddyReducer,
  },
});