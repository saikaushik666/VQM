// src/features/queue/queueSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Initial state
const initialState = {
  currentQueue: null,
  queueList: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  position: null,
  waitTime: null,
  activeAgents: 0,
  queueStats: {
    servedToday: 0,
    avgWaitTime: 0,
    noShows: 0
  }
};

// Async Thunks
export const joinQueue = createAsyncThunk(
  'queue/join',
  async (queueData, { rejectWithValue }) => {
    try {
      const response = await authAPI.joinQueue(queueData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getCurrentQueue = createAsyncThunk(
  'queue/getCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getQueues();
      const user = JSON.parse(localStorage.getItem('user'));
      const activeQueues = response.data.filter(
        q => q.user?.id === user?.id && ['waiting', 'serving'].includes(q.status)
      );
      return activeQueues.length > 0 ? activeQueues[0] : null;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const leaveQueue = createAsyncThunk(
  'queue/leave',
  async (queueId, { rejectWithValue }) => {
    try {
      await api.deleteQueue(queueId);
      return queueId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const resetQueue = createAsyncThunk(
  'queue/reset',
  async (_, { rejectWithValue }) => {
    try {
      await api.deleteQueue('all'); // Your backend should handle this
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getQueueStats = createAsyncThunk(
  'queue/stats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getQueues('/stats'); // Your stats endpoint
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    clearQueueError: (state) => {
      state.error = null;
    },
    resetQueueStatus: (state) => {
      state.status = 'idle';
    },
    // Manual reset without API call
    manualResetQueue: (state) => {
      state.currentQueue = null;
      state.position = null;
      state.waitTime = null;
      state.status = 'idle';
      state.error = null;
    },
    updateQueuePosition: (state, action) => {
      state.position = action.payload.position;
      state.waitTime = action.payload.waitTime;
    }
  },
  extraReducers: (builder) => {
    builder
      // Join Queue
      .addCase(joinQueue.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(joinQueue.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentQueue = action.payload;
        state.position = action.payload.position;
        state.waitTime = action.payload.wait_time;
      })
      .addCase(joinQueue.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Get Current Queue
      .addCase(getCurrentQueue.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getCurrentQueue.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentQueue = action.payload;
        if (action.payload) {
          state.position = action.payload.position;
          state.waitTime = action.payload.wait_time;
        }
      })
      .addCase(getCurrentQueue.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // Leave Queue
      .addCase(leaveQueue.fulfilled, (state) => {
        state.currentQueue = null;
        state.position = null;
        state.waitTime = null;
        state.status = 'idle';
      })
      
      // Reset Queue
      .addCase(resetQueue.fulfilled, (state) => {
        state.currentQueue = null;
        state.queueList = [];
        state.position = null;
        state.waitTime = null;
        state.status = 'idle';
      })
      
      // Get Queue Stats
      .addCase(getQueueStats.fulfilled, (state, action) => {
        state.queueStats = {
          servedToday: action.payload.served_today,
          avgWaitTime: action.payload.avg_wait_time,
          noShows: action.payload.no_shows
        };
        state.activeAgents = action.payload.active_agents;
      });
  }
});

// Action Creators
export const { 
  clearQueueError, 
  resetQueueStatus, 
  manualResetQueue,
  updateQueuePosition 
} = queueSlice.actions;

// Selectors
export const selectCurrentQueue = (state) => state.queue.currentQueue;
export const selectQueueStatus = (state) => state.queue.status;
export const selectQueueError = (state) => state.queue.error;
export const selectQueuePosition = (state) => state.queue.position;
export const selectWaitTime = (state) => state.queue.waitTime;
export const selectQueueStats = (state) => state.queue.queueStats;
export const selectActiveAgents = (state) => state.queue.activeAgents;

export default queueSlice.reducer;