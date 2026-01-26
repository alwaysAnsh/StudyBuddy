import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../config/axios';
import './UserProfile.css';

const UserProfile = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/users/profile/${username}`);
        setUser(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-error">{error}</div>
      </div>
    );
  }

  if (!user) return null;

  const getAvatarUrl = (avatarNum) => {
    return `/avatars/avatar-${avatarNum}.png`;
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-large">
            <img 
              src={getAvatarUrl(user.avatar)} 
              alt={user.name}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=667eea&color=fff&size=200`;
              }}
            />
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-username">@{user.username}</p>
            {user.bio && <p className="profile-bio">{user.bio}</p>}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{user.level}</div>
            <div className="stat-label">Level</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-value">{user.xp}</div>
            <div className="stat-label">Total XP</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-value">{user.streak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="activity-stats">
          <h2 className="section-title">Activity Overview</h2>
          <div className="activity-grid">
            <div className="activity-item">
              <span className="activity-icon">✓</span>
              <span className="activity-count">{user.stats.tasksCompleted}</span>
              <span className="activity-label">Tasks Completed</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📋</span>
              <span className="activity-count">{user.stats.tasksAssigned}</span>
              <span className="activity-label">Tasks Assigned</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📝</span>
              <span className="activity-count">{user.stats.notesCreated}</span>
              <span className="activity-label">Notes Created</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🎯</span>
              <span className="activity-count">{user.stats.activitiesPosted}</span>
              <span className="activity-label">Activities Posted</span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="xp-section">
          <h2 className="section-title">Level Progress</h2>
          <div className="xp-bar-container">
            <div className="xp-bar-bg">
              <div 
                className="xp-bar-fill" 
                style={{ width: `${(user.xp % 100)}%` }}
              />
            </div>
            <div className="xp-text">
              {user.xp % 100} / 100 XP to Level {user.level + 1}
            </div>
          </div>
        </div>

        {/* Custom Categories */}
        {user.customCategories && user.customCategories.length > 0 && (
          <div className="categories-section">
            <h2 className="section-title">Custom Categories</h2>
            <div className="categories-list">
              {user.customCategories.map((cat, index) => (
                <span key={index} className="category-badge">{cat}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;