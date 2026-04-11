import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../config/axios';

const emptyCounts = {
  buddies: 0,
  study_rooms: 0,
  my_tasks: 0,
  assigned_by_me: 0,
  notes: 0,
  activity: 0,
  tabTotal: 0,
  total: 0,
};

export const fetchNotificationCounts = createAsyncThunk(
  'notifications/fetchCounts',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/notifications/counts');
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load counts');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/notifications');
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load notifications');
    }
  }
);

export const markScopeRead = createAsyncThunk(
  'notifications/markScope',
  async (scope, { dispatch, rejectWithValue }) => {
    try {
      await axiosInstance.post('/notifications/mark-scope-read', { scope });
      await dispatch(fetchNotificationCounts());
      return scope;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markOne',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/notifications/${id}/read`);
      await dispatch(fetchNotificationCounts());
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAll',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await axiosInstance.post('/notifications/mark-scope-read', { scope: 'all' });
      await dispatch(fetchNotificationCounts());
      await dispatch(fetchNotifications());
      return true;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    counts: emptyCounts,
    list: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationCounts.fulfilled, (state, action) => {
        state.counts = { ...emptyCounts, ...action.payload };
      })
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const n = action.payload;
        state.list = state.list.map((x) => (x._id === n._id ? { ...x, read: true } : x));
      });
  },
});

export default notificationSlice.reducer;
