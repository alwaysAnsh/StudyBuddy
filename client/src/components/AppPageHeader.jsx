import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchNotificationCounts } from '../redux/slices/notificationSlice';
import { useTheme } from '../context/ThemeContext';
import { APP_TOUR_EVENT } from './AppTour';
import './AppPageHeader.css';

const AppPageHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const total = useSelector((s) => s.notifications?.counts?.total ?? 0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    dispatch(fetchNotificationCounts());
  }, [dispatch]);

  return (
    <div className="app-page-header">
      <div className="app-page-header-spacer" />
      <div className="app-page-header-actions">
        <button
          type="button"
          className="app-page-header-bell"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <span aria-hidden>&#128276;</span>
          {total > 0 && (
            <span className="app-page-header-badge">{total > 99 ? '99+' : total}</span>
          )}
        </button>
        <Link to="/dashboard" className="app-page-header-dash">
          Dashboard
        </Link>
        <button
          type="button"
          className="app-page-header-dash"
          onClick={() => window.dispatchEvent(new Event(APP_TOUR_EVENT))}
        >
          Take Tour
        </button>
        <button type="button" className="app-page-header-dash" onClick={toggleTheme}>
          {theme === 'dark' ? 'Light' : 'Dark'} Theme
        </button>
      </div>
    </div>
  );
};

export default AppPageHeader;
