import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ProtectedRoute from './ProtectedRoute';
import JoinQueuePage from '../pages/JoinQueuePage';
import MyQueue from '../pages/MyQueue';
import AllQueues from '../pages/AllQueues';
import SettingsPage from '../pages/SettingsPage';
import HelpCenter from '../pages/HelpCenter';
import QueueHistoryPage from '../pages/QueueHistoryPage';


const AppRouter = () => {
  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/queue-history"
        element={
          <ProtectedRoute>
            <QueueHistoryPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/help-center"
        element={
          <ProtectedRoute>
            <HelpCenter />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-queues"
        element={
          <ProtectedRoute>
            <AllQueues />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-queue"
        element={
          <ProtectedRoute>
            <MyQueue />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/join-queue"
        element={
          <ProtectedRoute>
            <JoinQueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRouter;