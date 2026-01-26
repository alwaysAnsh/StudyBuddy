import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5050/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Search users
export const searchUsers = createAsyncThunk(
  'buddies/searchUsers',
  async (query, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/search/${query}`, getAuthHeader());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search users');
    }
  }
);

// Send buddy request
export const sendBuddyRequest = createAsyncThunk(
  'buddies/sendRequest',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/buddies/request/${userId}`, {}, getAuthHeader());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send buddy request');
    }
  }
);

// Get received buddy requests
export const getReceivedRequests = createAsyncThunk(
  'buddies/getReceivedRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/buddies/requests/received`, getAuthHeader());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get requests');
    }
  }
);

// Get sent buddy requests
export const getSentRequests = createAsyncThunk(
  'buddies/getSentRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/buddies/requests/sent`, getAuthHeader());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get sent requests');
    }
  }
);

// Accept buddy request
export const acceptBuddyRequest = createAsyncThunk(
  'buddies/acceptRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/buddies/requests/${requestId}/accept`, {}, getAuthHeader());
      return requestId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept request');
    }
  }
);

// Reject buddy request
export const rejectBuddyRequest = createAsyncThunk(
  'buddies/rejectRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/buddies/requests/${requestId}/reject`, {}, getAuthHeader());
      return requestId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject request');
    }
  }
);

// Cancel buddy request (sender cancels)
export const cancelBuddyRequest = createAsyncThunk(
  'buddies/cancelRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/buddies/requests/${requestId}`, getAuthHeader());
      return requestId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel request');
    }
  }
);

// Get all buddies
export const getBuddies = createAsyncThunk(
  'buddies/getBuddies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/buddies`, getAuthHeader());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get buddies');
    }
  }
);

// Remove buddy
export const removeBuddy = createAsyncThunk(
  'buddies/removeBuddy',
  async (buddyId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/buddies/${buddyId}`, getAuthHeader());
      return buddyId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove buddy');
    }
  }
);

const buddySlice = createSlice({
  name: 'buddies',
  initialState: {
    buddies: [],
    searchResults: [],
    receivedRequests: [],
    sentRequests: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Send buddy request
      .addCase(sendBuddyRequest.fulfilled, (state, action) => {
        state.sentRequests.push(action.payload);
      })
      .addCase(sendBuddyRequest.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Get received requests
      .addCase(getReceivedRequests.fulfilled, (state, action) => {
        state.receivedRequests = action.payload;
      })
      // Get sent requests
      .addCase(getSentRequests.fulfilled, (state, action) => {
        state.sentRequests = action.payload;
      })
      // Accept buddy request
      .addCase(acceptBuddyRequest.fulfilled, (state, action) => {
        state.receivedRequests = state.receivedRequests.filter(
          req => req._id !== action.payload
        );
      })
      // Reject buddy request
      .addCase(rejectBuddyRequest.fulfilled, (state, action) => {
        state.receivedRequests = state.receivedRequests.filter(
          req => req._id !== action.payload
        );
      })
      // Cancel buddy request
      .addCase(cancelBuddyRequest.fulfilled, (state, action) => {
        state.sentRequests = state.sentRequests.filter(
          req => req._id !== action.payload
        );
      })
      // Get buddies
      .addCase(getBuddies.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBuddies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.buddies = action.payload;
      })
      .addCase(getBuddies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Remove buddy
      .addCase(removeBuddy.fulfilled, (state, action) => {
        state.buddies = state.buddies.filter(buddy => buddy._id !== action.payload);
      });
  },
});

export const { clearError, clearSearchResults } = buddySlice.actions;
export default buddySlice.reducer;