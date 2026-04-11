import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import taskReducer from './slices/taskSlice';
import noteReducer from './slices/noteSlice';
import activityReducer from './slices/activitySlice';
import buddyReducer from './slices/buddySlice';
import studyRoomReducer from './slices/studyRoomSlice';
import notificationReducer from './slices/notificationSlice';
import { taskListenerMiddleware } from './taskListeners';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    notes: noteReducer,
    activities: activityReducer,
    buddies: buddyReducer,
    studyRooms: studyRoomReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(taskListenerMiddleware.middleware),
});