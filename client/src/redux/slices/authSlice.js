import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../config/axios';

// Load user from localStorage
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');
const API_URL = 'http://localhost:5050/api';

// Check username availability
export const checkUsername = createAsyncThunk(
  'auth/checkUsername',
  async (username, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/auth/check-username/${username}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Check failed');
    }
  }
);

// Signup
export const signup = createAsyncThunk(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/auth/signup', userData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Signup failed');
    }
  }
);

// Login
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/auth/login', {
        username,
        password,
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Update user profile (name and avatar)
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      // use axiosInstance so baseURL / headers are applied
      const response = await axiosInstance.patch('/users/update-profile', profileData);
      return response.data.user;
    } catch (error) {
      console.error('updateUserProfile error:', error);
      const message = error.response?.data?.message || error.message || String(error);
      return rejectWithValue(message);
    }
  }
);

// Change password (when logged in)
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        '/auth/change-password',
        passwordData
      );
      return response.data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change password');
    }
  }
);

// Get current user
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user');
    }
  }
);

// Update user profile
// export const updateProfile = createAsyncThunk(
//   'auth/updateProfile',
//   async (profileData, { rejectWithValue }) => {
//     try {
//       const response = await axiosInstance.patch('/users/profile', profileData);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
//     }
//   }
// );

// Add custom category
export const addCustomCategory = createAsyncThunk(
  'auth/addCustomCategory',
  async (category, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/users/categories', { category });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add category');
    }
  }
);

// Get all categories
export const getAllCategories = createAsyncThunk(
  'auth/getAllCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/users/all-categories');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get all categories');
    }
  }
);

// Delete custom category
export const deleteCustomCategory = createAsyncThunk(
  'auth/deleteCustomCategory',
  async (category, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/users/categories/${encodeURIComponent(category)}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: user || null,
    token: token || null,
    isLoading: false,
    error: null,
    isAuthenticated: !!token,
    allCategories: [],
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check username
      .addCase(checkUsername.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkUsername.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(checkUsername.rejected, (state) => {
        state.isLoading = false;
      })
      // Signup
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get current user
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // Update profile
      // .addCase(updateProfile.fulfilled, (state, action) => {
      //   state.user = action.payload;
      //   localStorage.setItem('user', JSON.stringify(action.payload));
      // })
      // Add custom category
      .addCase(addCustomCategory.fulfilled, (state, action) => {
        if (state.user) {
          state.user.customCategories = action.payload.customCategories;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      // Delete custom category
      .addCase(deleteCustomCategory.fulfilled, (state, action) => {
        if (state.user) {
          state.user.customCategories = action.payload.customCategories;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      // Get all categories
  .addCase(getAllCategories.pending, (state) => {
    state.isLoading = true;
    state.error = null;
  })
  .addCase(getAllCategories.fulfilled, (state, action) => {
    state.isLoading = false;
    state.allCategories = action.payload.categories; // ✅ correct
  })
  .addCase(getAllCategories.rejected, (state, action) => {
    state.isLoading = false;
    state.error = action.payload;
  })
  // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;