import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../redux/slices/notificationSlice';
import './Notifications.css';

const scopeLabel = (s) =>
  ({
    buddies: 'Buddies',
    study_rooms: 'Study rooms',
    my_tasks: 'My tasks',
    assigned_by_me: 'Assigned by me',
    notes: 'Notes',
    activity: 'Activity',
  }[s] || s);

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, isLoading } = useSelector((s) => s.notifications);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const openItem = async (n) => {
    if (!n.read) {
      await dispatch(markNotificationRead(n._id)).unwrap().catch(() => {});
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="notifications-actions">
          <button
            type="button"
            className="notif-btn"
            onClick={() => dispatch(markAllNotificationsRead()).unwrap().catch(() => {})}
          >
            Mark all read
          </button>
          <Link to="/dashboard" className="notif-btn secondary">
            Dashboard
          </Link>
        </div>
      </div>
      <p className="notifications-intro">
        Activity from buddies, study rooms, tasks, shared notes, and the activity feed. Opening a
        section from the dashboard clears its badge; you can also clear items here.
      </p>

      {isLoading && <p>Loading…</p>}
      {!isLoading && list.length === 0 && (
        <p className="notifications-empty">You are all caught up.</p>
      )}
      <ul className="notifications-list">
        {list.map((n) => (
          <li key={n._id}>
            <button
              type="button"
              className={`notification-row ${n.read ? 'read' : 'unread'}`}
              onClick={() => openItem(n)}
            >
              <span className="notification-scope">{scopeLabel(n.scope)}</span>
              <span className="notification-title">{n.title}</span>
              {n.body && <span className="notification-body">{n.body}</span>}
              <span className="notification-time">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
