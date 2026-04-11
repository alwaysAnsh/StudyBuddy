import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import Login from './components/Login';

import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import './App.css';
import Signup from './components/Signup';
import UserSearch from './components/UserSearch';
import Buddies from './components/Buddies';
import ForgotPassword from './components/ForgotPassword';
import ToastHost from './components/ToastHost';
import StudyRooms from './components/StudyRooms';
import StudyRoomDetail from './components/StudyRoomDetail';
import Notifications from './components/Notifications';
import NotificationPoller from './components/NotificationPoller';
import PublicActivity from './components/PublicActivity';
import { ConfirmProvider } from './context/ConfirmContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <ConfirmProvider>
        <NotificationPoller />
        <ToastHost />
        <Routes>
        {/* Public routes with Layout */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
        
        {/* Auth routes without Layout (full screen) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/p/:code" element={<PublicActivity />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
              
            </PrivateRoute>
          }
        />
        <Route
          path="/buddies"
          element={
            <PrivateRoute>
              <Buddies />
              
            </PrivateRoute>
          }
        />
        <Route
          path="/study-rooms"
          element={
            <PrivateRoute>
              <StudyRooms />
            </PrivateRoute>
          }
        />
        <Route
          path="/study-rooms/:groupId"
          element={
            <PrivateRoute>
              <StudyRoomDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </ConfirmProvider>
    </Router>
  );
}

export default App;