import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { createTask, updateTaskStatus, deleteTask } from './slices/taskSlice';
import {
  updateRoomTaskProgress,
  completeRoomChallenge,
} from './slices/studyRoomSlice';
import { getCurrentUser } from './slices/authSlice';
import { notify } from '../utils/notify';

export const taskListenerMiddleware = createListenerMiddleware();

taskListenerMiddleware.startListening({
  matcher: isAnyOf(
    createTask.fulfilled,
    updateTaskStatus.fulfilled,
    updateRoomTaskProgress.fulfilled,
    completeRoomChallenge.fulfilled
  ),
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(getCurrentUser());
  },
});

taskListenerMiddleware.startListening({
  matcher: isAnyOf(createTask.fulfilled, deleteTask.fulfilled),
  effect: (action) => {
    if (createTask.fulfilled.match(action)) {
      notify({ type: 'success', message: 'Task assigned successfully.' });
    } else if (deleteTask.fulfilled.match(action)) {
      notify({ type: 'success', message: 'Task deleted successfully.' });
    }
  },
});

taskListenerMiddleware.startListening({
  matcher: isAnyOf(
    createTask.rejected,
    updateTaskStatus.rejected,
    deleteTask.rejected
  ),
  effect: (action) => {
    const msg = action.payload;
    notify({
      type: 'error',
      message: typeof msg === 'string' && msg ? msg : 'Task action failed.',
    });
  },
});
