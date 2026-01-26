import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../config/axios';

// Get all activities
export const getAllActivities = createAsyncThunk(
  'activities/getAllActivities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/activities');
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

// Toggle completion (I did this too)
export const toggleCompletion = createAsyncThunk(
  'activities/toggleCompletion',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(`/activities/${id}/toggle-completion`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle completion');
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
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all activities
      .addCase(getAllActivities.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllActivities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activities = action.payload;
      })
      .addCase(getAllActivities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create activity
      .addCase(createActivity.fulfilled, (state, action) => {
        state.activities.unshift(action.payload);
      })
      // Toggle completion
      .addCase(toggleCompletion.fulfilled, (state, action) => {
        const index = state.activities.findIndex(activity => activity._id === action.payload._id);
        if (index !== -1) {
          state.activities[index] = action.payload;
        }
      })
      // Delete activity
      .addCase(deleteActivity.fulfilled, (state, action) => {
        state.activities = state.activities.filter(activity => activity._id !== action.payload);
      });
  },
});

export const { clearError } = activitySlice.actions;
export default activitySlice.reducer;