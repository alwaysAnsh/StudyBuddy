import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axios';
import { resolveUserAvatarUrl, uiAvatarsFallback } from '../utils/avatarUrl';
import './UserSearch.css';

const UserSearch = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await axiosInstance.get(`/users/search/${query.trim()}`);
        setResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Search Users</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="search-container">
          <div className="search-input-wrapper">
            {/* <span className="search-icon">🔍</span> */}
            <input
              type="text"
              className="search-input"
              placeholder="Search by username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="search-results">
            {searching && (
              <div className="search-status">Searching...</div>
            )}

            {!searching && query.length >= 2 && results.length === 0 && (
              <div className="search-status">No users found</div>
            )}

            {!searching && query.length < 2 && (
              <div className="search-status">Type at least 2 characters to search</div>
            )}

            {!searching && results.length > 0 && (
              <div className="user-results-list">
                {results.map((user) => (
                  <div
                    key={user._id}
                    className="user-result-item"
                    onClick={() => handleUserClick(user.username)}
                  >
                    <div className="user-result-avatar">
                      <img
                        src={resolveUserAvatarUrl(user)}
                        alt={user.name}
                        onError={(e) => {
                          e.target.src = uiAvatarsFallback(user.name, 80);
                        }}
                      />
                    </div>
                    <div className="user-result-info">
                      <div className="user-result-name">{user.name}</div>
                      <div className="user-result-username">@{user.username}</div>
                      <div className="user-result-stats">
                        <span>🏆 Level {user.level}</span>
                        <span>🔥 {user.streak} day streak</span>
                      </div>
                    </div>
                    <div className="user-result-arrow">→</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;