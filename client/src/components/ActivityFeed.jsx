import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllActivities } from '../redux/slices/activitySlice';
import ActivityCard from './ActivityCard';
import PostActivity from './PostActivity';
import './ActivityFeed.css';

const ActivityFeed = () => {
  const dispatch = useDispatch();
  const { activities, isLoading } = useSelector((state) => state.activities);
  const [showPostModal, setShowPostModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    dispatch(getAllActivities());
  }, [dispatch]);

  const categories = ['all', 'General', 'DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];

  const filterActivities = (activities) => {
    if (filterCategory === 'all') return activities;
    return activities.filter(activity => activity.category === filterCategory);
  };

  const filteredActivities = filterActivities(activities);

  return (
    <div className="activity-feed-container">
      <div className="activity-feed-header">
        <div className="activity-header-content">
          <h2>🎯 Activity Feed</h2>
          <p>Share what you've accomplished and see what others are doing</p>
        </div>
        <button className="post-activity-btn" onClick={() => setShowPostModal(true)}>
          + Post Activity
        </button>
      </div>

      {/* Category Filter */}
      <div className="activity-filter">
        <label>Filter by Category:</label>
        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-pill ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Display */}
      <div className="activity-feed-content">
        {isLoading ? (
          <div className="loading">Loading activities...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="empty-state">
            <p>No activities yet.</p>
            <p className="empty-subtitle">Be the first to share what you've accomplished!</p>
          </div>
        ) : (
          <div className="activities-list">
            {filteredActivities.map(activity => (
              <ActivityCard key={activity._id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      {/* Post Activity Modal */}
      {showPostModal && (
        <PostActivity onClose={() => setShowPostModal(false)} />
      )}
    </div>
  );
};

export default ActivityFeed;