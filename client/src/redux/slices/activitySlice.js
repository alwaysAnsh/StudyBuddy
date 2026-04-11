import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../config/axios';

const PAGE_LIMIT = 15;

export const getActivitiesPage = createAsyncThunk(
  'activities/getActivitiesPage',
  async ({ skip = 0, append = false, tags = '' }, { rejectWithValue }) => {
    try {
      const params = { skip, limit: PAGE_LIMIT };
      if (tags && String(tags).trim()) {
        params.tags = String(tags).trim();
      }
      const response = await axiosInstance.get('/activities', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch activities');
    }
  }
);

// Create activity
export const createActivity = createAsyncThunk(
  'activities/createActivity',
  async (activityData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/activities', activityData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create activity');
    }
  }
);

export const toggleSupport = createAsyncThunk(
  'activities/toggleSupport',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/activities/${id}/support`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update support');
    }
  }
);

// Delete activity
export const deleteActivity = createAsyncThunk(
  'activities/deleteActivity',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/activities/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete activity');
    }
  }
);

const activitySlice = createSlice({
  name: 'activities',
  initialState: {
    activities: [],
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getActivitiesPage.pending, (state, action) => {
        state.error = null;
        if (action.meta.arg?.append) {
          state.isLoadingMore = true;
        } else {
          state.isLoading = true;
          state.activities = [];
          state.hasMore = true;
        }
      })
      .addCase(getActivitiesPage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        const { items = [], hasMore = false } = action.payload || {};
        if (action.meta.arg?.append) {
          const seen = new Set(state.activities.map((a) => String(a._id)));
          for (const row of items) {
            const id = String(row._id);
            if (!seen.has(id)) {
              seen.add(id);
              state.activities.push(row);
            }
          }
        } else {
          state.activities = items;
        }
        state.hasMore = hasMore;
      })
      .addCase(getActivitiesPage.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload;
      })
      .addCase(createActivity.fulfilled, (state, action) => {
        state.activities.unshift(action.payload);
      })
      .addCase(toggleSupport.fulfilled, (state, action) => {
        const index = state.activities.findIndex((activity) => activity._id === action.payload._id);
        if (index !== -1) {
          state.activities[index] = action.payload;
        }
      })
      .addCase(deleteActivity.fulfilled, (state, action) => {
        state.activities = state.activities.filter((activity) => activity._id !== action.payload);
      });
  },
});

export const { clearError } = activitySlice.actions;
export default activitySlice.reducer;
