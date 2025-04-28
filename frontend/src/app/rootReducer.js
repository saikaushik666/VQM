import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import queueReducer from '../features/queue/queueSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  queue: queueReducer,
});

export default rootReducer;