import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../config/axios';

export const fetchMyStudyGroups = createAsyncThunk(
  'studyRooms/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/study-groups/mine');
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load study rooms');
    }
  }
);

export const createStudyGroup = createAsyncThunk(
  'studyRooms/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/study-groups', payload);
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create room');
    }
  }
);

export const fetchStudyGroupInvites = createAsyncThunk(
  'studyRooms/fetchInvites',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/study-groups/invites/received');
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load invites');
    }
  }
);

export const loadStudyRoom = createAsyncThunk(
  'studyRooms/loadDetail',
  async (groupId, { rejectWithValue }) => {
    try {
      const [group, tasks, notes, challenges, progress] = await Promise.all([
        axiosInstance.get(`/study-groups/${groupId}`),
        axiosInstance.get(`/study-groups/${groupId}/tasks`),
        axiosInstance.get(`/study-groups/${groupId}/notes`),
        axiosInstance.get(`/study-groups/${groupId}/challenges`),
        axiosInstance.get(`/study-groups/${groupId}/progress`),
      ]);
      return {
        group: group.data,
        tasks: tasks.data,
        notes: notes.data,
        challenges: challenges.data,
        progress: progress.data,
      };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to load room');
    }
  }
);

export const updateStudyGroup = createAsyncThunk(
  'studyRooms/update',
  async ({ groupId, ...body }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/study-groups/${groupId}`, body);
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update room');
    }
  }
);

export const deleteStudyGroup = createAsyncThunk(
  'studyRooms/delete',
  async (groupId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/study-groups/${groupId}`);
      return groupId;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to delete room');
    }
  }
);

export const inviteBuddyToRoom = createAsyncThunk(
  'studyRooms/invite',
  async ({ groupId, buddyUserId }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/study-groups/${groupId}/invites`, {
        buddyUserId,
      });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to send invite');
    }
  }
);

export const acceptStudyRoomInvite = createAsyncThunk(
  'studyRooms/acceptInvite',
  async (inviteId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/study-groups/invites/${inviteId}/accept`);
      return { group: data, inviteId };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to accept invite');
    }
  }
);

export const declineStudyRoomInvite = createAsyncThunk(
  'studyRooms/declineInvite',
  async (inviteId, { rejectWithValue }) => {
    try {
      await axiosInstance.post(`/study-groups/invites/${inviteId}/decline`);
      return inviteId;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to decline invite');
    }
  }
);

export const leaveStudyGroup = createAsyncThunk(
  'studyRooms/leave',
  async (groupId, { rejectWithValue }) => {
    try {
      await axiosInstance.post(`/study-groups/${groupId}/leave`);
      return groupId;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to leave room');
    }
  }
);

export const createRoomTask = createAsyncThunk(
  'studyRooms/createTask',
  async ({ groupId, ...body }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/study-groups/${groupId}/tasks`, body);
      return { groupId, task: data };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateRoomTaskProgress = createAsyncThunk(
  'studyRooms/updateTask',
  async ({ groupId, taskId, status, personalNotes }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(
        `/study-groups/${groupId}/tasks/${taskId}`,
        { status, personalNotes }
      );
      return { groupId, task: data };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteRoomTask = createAsyncThunk(
  'studyRooms/deleteTask',
  async ({ groupId, taskId }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/study-groups/${groupId}/tasks/${taskId}`);
      return { groupId, taskId };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to delete task');
    }
  }
);

export const createRoomNote = createAsyncThunk(
  'studyRooms/createNote',
  async ({ groupId, ...body }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/study-groups/${groupId}/notes`, body);
      return { groupId, note: data };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to add note');
    }
  }
);

export const updateRoomNote = createAsyncThunk(
  'studyRooms/updateNote',
  async ({ groupId, noteId, ...body }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(
        `/study-groups/${groupId}/notes/${noteId}`,
        body
      );
      return { groupId, note: data };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to update note');
    }
  }
);

export const deleteRoomNote = createAsyncThunk(
  'studyRooms/deleteNote',
  async ({ groupId, noteId }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/study-groups/${groupId}/notes/${noteId}`);
      return { groupId, noteId };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to delete note');
    }
  }
);

export const createRoomChallenge = createAsyncThunk(
  'studyRooms/createChallenge',
  async ({ groupId, ...body }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/study-groups/${groupId}/challenges`,
        body
      );
      return { groupId, challenge: data };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Failed to create challenge');
    }
  }
);

export const completeRoomChallenge = createAsyncThunk(
  'studyRooms/completeChallenge',
  async ({ groupId, challengeId }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/study-groups/${groupId}/challenges/${challengeId}/complete`
      );
      return { groupId, challenge: data.challenge, xpEarned: data.xpEarned };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Could not complete challenge');
    }
  }
);

const initialDetail = {
  group: null,
  tasks: [],
  notes: [],
  challenges: [],
  progress: null,
};

const studyRoomSlice = createSlice({
  name: 'studyRooms',
  initialState: {
    groups: [],
    invites: [],
    detail: initialDetail,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearStudyRoomDetail: (state) => {
      state.detail = initialDetail;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyStudyGroups.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyStudyGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.groups = action.payload;
      })
      .addCase(fetchMyStudyGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createStudyGroup.fulfilled, (state, action) => {
        state.groups.unshift(action.payload);
      })
      .addCase(fetchStudyGroupInvites.fulfilled, (state, action) => {
        state.invites = action.payload;
      })
      .addCase(loadStudyRoom.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStudyRoom.fulfilled, (state, action) => {
        state.isLoading = false;
        state.detail = action.payload;
      })
      .addCase(loadStudyRoom.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateStudyGroup.fulfilled, (state, action) => {
        const g = action.payload;
        state.groups = state.groups.map((x) => (x._id === g._id ? g : x));
        if (state.detail.group?._id === g._id) {
          const outgoing = state.detail.group.outgoingPendingInvites;
          state.detail.group = { ...g, outgoingPendingInvites: outgoing || [] };
        }
      })
      .addCase(deleteStudyGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter((g) => g._id !== action.payload);
        if (state.detail.group?._id === action.payload) state.detail = initialDetail;
      })
      .addCase(acceptStudyRoomInvite.fulfilled, (state, action) => {
        const { group: g, inviteId } = action.payload;
        state.invites = state.invites.filter((i) => i._id !== inviteId);
        const rest = state.groups.filter((x) => x._id !== g._id);
        state.groups = [g, ...rest];
      })
      .addCase(declineStudyRoomInvite.fulfilled, (state, action) => {
        state.invites = state.invites.filter((i) => i._id !== action.payload);
      })
      .addCase(leaveStudyGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter((g) => g._id !== action.payload);
        if (state.detail.group?._id === action.payload) state.detail = initialDetail;
      })
      .addCase(createRoomTask.fulfilled, (state, action) => {
        if (state.detail.group?._id === action.payload.groupId) {
          state.detail.tasks.unshift(action.payload.task);
        }
      })
      .addCase(updateRoomTaskProgress.fulfilled, (state, action) => {
        if (state.detail.group?._id !== action.payload.groupId) return;
        const t = action.payload.task;
        state.detail.tasks = state.detail.tasks.map((x) => (x._id === t._id ? t : x));
      })
      .addCase(deleteRoomTask.fulfilled, (state, action) => {
        if (state.detail.group?._id !== action.payload.groupId) return;
        state.detail.tasks = state.detail.tasks.filter((x) => x._id !== action.payload.taskId);
      })
      .addCase(createRoomNote.fulfilled, (state, action) => {
        if (state.detail.group?._id === action.payload.groupId) {
          state.detail.notes.unshift(action.payload.note);
        }
      })
      .addCase(updateRoomNote.fulfilled, (state, action) => {
        if (state.detail.group?._id !== action.payload.groupId) return;
        const n = action.payload.note;
        state.detail.notes = state.detail.notes.map((x) => (x._id === n._id ? n : x));
      })
      .addCase(deleteRoomNote.fulfilled, (state, action) => {
        if (state.detail.group?._id !== action.payload.groupId) return;
        state.detail.notes = state.detail.notes.filter((x) => x._id !== action.payload.noteId);
      })
      .addCase(createRoomChallenge.fulfilled, (state, action) => {
        if (state.detail.group?._id === action.payload.groupId) {
          state.detail.challenges.unshift(action.payload.challenge);
        }
      })
      .addCase(completeRoomChallenge.fulfilled, (state, action) => {
        if (state.detail.group?._id !== action.payload.groupId) return;
        const c = action.payload.challenge;
        state.detail.challenges = state.detail.challenges.map((x) => (x._id === c._id ? c : x));
      });
  },
});

export const { clearStudyRoomDetail, clearError } = studyRoomSlice.actions;
export default studyRoomSlice.reducer;
