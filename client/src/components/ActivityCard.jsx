import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteActivity, toggleCompletion } from '../redux/slices/activitySlice';
import './ActivityCard.css';

const ActivityCard = ({ activity }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const isCreator = activity.createdBy._id === user?.id;
  const hasCompleted = activity.completedBy.some(u => u._id === user?.id);
  const completionCount = activity.completedBy.length;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      dispatch(deleteActivity(activity._id));
    }
  };

  const handleToggleCompletion = () => {
    dispatch(toggleCompletion(activity._id));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="activity-card">
      <div className="activity-card-header">
        <div className="activity-header-left">
          <div className="activity-avatar">
            {activity.createdBy.name.charAt(0).toUpperCase()}
          </div>
          <div className="activity-user-info">
            <span className="activity-user-name">{activity.createdBy.name}</span>
            <span className="activity-timestamp">{formatDate(activity.createdAt)}</span>
          </div>
        </div>
        <div className="activity-header-right">
          <span className="activity-category-badge">{activity.category}</span>
          {isCreator && (
            <button 
              className="activity-delete-btn" 
              onClick={handleDelete}
              title="Delete activity"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="activity-content">
        <h3 className="activity-title">{activity.title}</h3>
        <p className="activity-description">{activity.description}</p>
        
        {activity.link && (
          <a 
            href={activity.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="activity-link"
          >
            🔗 View Link →
          </a>
        )}
      </div>

      <div className="activity-footer">
        <div className="activity-completion">
          <button 
            className={`completion-btn ${hasCompleted ? 'completed' : ''}`}
            onClick={handleToggleCompletion}
          >
            {hasCompleted ? '✓ I did this' : '+ I did this too'}
          </button>
          
          {completionCount > 0 && (
            <div className="completion-list">
              <span className="completion-count">
                {completionCount} {completionCount === 1 ? 'person' : 'people'} completed this
              </span>
              <div className="completed-users">
                {activity.completedBy.map(u => (
                  <span key={u._id} className="completed-user-badge" title={u.name}>
                    {u.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;