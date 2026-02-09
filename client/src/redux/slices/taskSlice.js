import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// const API_URL = 'https://harshita-3fe5.onrender.com/api';
// https://harshita-3fe5.onrender.com/api
// const API_URL ='http://localhost:5050/api';
const API_URL = 'https://studdybuddy-oy5j.onrender.com/api'; 

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Get my tasks (assigned to me)
export const getMyTasks = createAsyncThunk(
  'tasks/getMyTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/tasks/my-tasks`, getAuthHeader());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get tasks assigned by me
export const getAssignedByMe = createAsyncThunk(
  'tasks/getAssignedByMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/tasks/assigned-by-me`, getAuthHeader());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Create task
export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/tasks`, taskData, getAuthHeader());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Update task status
export const updateTaskStatus = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ id, status, notes }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}/tasks/${id}`,
        { status, notes },
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Delete task
export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`, getAuthHeader());
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get all users
// export const getAllUsers = createAsyncThunk(
//   'tasks/getAllUsers',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await axios.get(`${API_URL}/users`, getAuthHeader());
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response.data.message);
//     }
//   }
// );

// Get buddies (replaced getAllUsers)
export const getBuddies = createAsyncThunk(
  'tasks/getBuddies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/buddies`, getAuthHeader());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// const taskSlice = createSlice({
//   name: 'tasks',
//   initialState: {
//     myTasks: [],
//     assignedByMe: [],
//     users: [],
//     isLoading: false,
//     error: null,
//   },
//   reducers: {
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Get my tasks
//       .addCase(getMyTasks.pending, (state) => {
//         state.isLoading = true;
//       })
//       .addCase(getMyTasks.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.myTasks = action.payload;
//       })
//       .addCase(getMyTasks.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload;
//       })
//       // Get assigned by me
//       .addCase(getAssignedByMe.fulfilled, (state, action) => {
//         state.assignedByMe = action.payload;
//       })
//       // Create task
//       .addCase(createTask.fulfilled, (state, action) => {
//         state.assignedByMe.unshift(action.payload);
//       })
//       // Update task status
//       .addCase(updateTaskStatus.fulfilled, (state, action) => {
//         const index = state.myTasks.findIndex(task => task._id === action.payload._id);
//         if (index !== -1) {
//           state.myTasks[index] = action.payload;
//         }
//       })
//       // Delete task
//       .addCase(deleteTask.fulfilled, (state, action) => {
//         state.myTasks = state.myTasks.filter(task => task._id !== action.payload);
//         state.assignedByMe = state.assignedByMe.filter(task => task._id !== action.payload);
//       })
//       // Get all users
//       .addCase(getAllUsers.fulfilled, (state, action) => {
//         state.users = action.payload;
//       });
//   },
// });

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    myTasks: [],
    assignedByMe: [],
    buddies: [],
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
      // Get my tasks
      .addCase(getMyTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMyTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myTasks = action.payload;
      })
      .addCase(getMyTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get assigned by me
      .addCase(getAssignedByMe.fulfilled, (state, action) => {
        state.assignedByMe = action.payload;
      })
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        state.assignedByMe.unshift(action.payload);
      })
      // Update task status
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.myTasks.findIndex(task => task._id === action.payload._id);
        if (index !== -1) {
          state.myTasks[index] = action.payload;
        }
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.myTasks = state.myTasks.filter(task => task._id !== action.payload);
        state.assignedByMe = state.assignedByMe.filter(task => task._id !== action.payload);
      })
      // Get buddies
      .addCase(getBuddies.fulfilled, (state, action) => {
        // console.log("getbuddiess: ",action.payload)
        state.buddies = action.payload?.buddies || [];
      });
  },
});

export const { clearError } = taskSlice.actions;
export default taskSlice.reducer;