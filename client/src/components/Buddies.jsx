import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getBuddies,
  searchUsers,
  sendBuddyRequest,
  getReceivedRequests,
  getSentRequests,
  acceptBuddyRequest,
  rejectBuddyRequest,
  cancelBuddyRequest,
  removeBuddy,
  clearSearchResults
} from '../redux/slices/buddySlice';
import './Buddies.css';

const Buddies = () => {
  const dispatch = useDispatch();
  const { buddies, searchResults, receivedRequests, sentRequests, isLoading } = useSelector(
    (state) => state.buddies
  );
  const { user } = useSelector((state) => state.auth);
  // const [buddyRequestSent, setBuddyRequestSent ] = useState(false)

  // console.log("searchResults: ", searchResults);
  // console.log("user: ", user);

  

  const [activeTab, setActiveTab] = useState('buddies');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    dispatch(getBuddies());
    dispatch(getReceivedRequests());
    dispatch(getSentRequests());
  }, [dispatch]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim().length < 2) {
      alert('Please enter at least 2 characters');
      return;
    }
    setIsSearching(true);
    await dispatch(searchUsers(searchQuery));
    setIsSearching(false);
  };

  const handleSendRequest = async (userId) => {
    try {
      await dispatch(sendBuddyRequest(userId)).unwrap();
      alert('Buddy request sent!');
      // setBuddyRequestSent(true)
      dispatch(searchUsers(searchQuery)); // Refresh search results
      dispatch(getSentRequests());
    } catch (error) {
      alert(error || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await dispatch(acceptBuddyRequest(requestId)).unwrap();
      dispatch(getBuddies());
      alert('Buddy request accepted!');
    } catch (error) {
      alert(error || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await dispatch(rejectBuddyRequest(requestId)).unwrap();
      alert('Buddy request rejected');
    } catch (error) {
      alert(error || 'Failed to reject request');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (window.confirm('Cancel this buddy request?')) {
      try {
        await dispatch(cancelBuddyRequest(requestId)).unwrap();
        alert('Buddy request cancelled');
      } catch (error) {
        alert(error || 'Failed to cancel request');
      }
    }
  };

  const handleRemoveBuddy = async (buddyId, buddyName) => {
    if (window.confirm(`Remove ${buddyName} from your buddies?`)) {
      try {
        await dispatch(removeBuddy(buddyId)).unwrap();
        alert('Buddy removed');
      } catch (error) {
        alert(error || 'Failed to remove buddy');
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    dispatch(clearSearchResults());
    // setBuddyRequestSent(false)
  };

  const getAvatarUrl = (avatarNum) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarNum}`;
  };

  return (
    <div className="buddies-container">
      <div className="buddies-header">
        <h1>🤝 Buddies</h1>
        <p className="buddies-subtitle">Connect with friends to assign tasks</p>
      </div>

      {/* Tabs */}
      <div className="buddies-tabs">
        <button
          className={`tab-btn ${activeTab === 'buddies' ? 'active' : ''}`}
          onClick={() => setActiveTab('buddies')}
        >
          My Buddies ({buddies.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({receivedRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Add Buddy
        </button>
      </div>

      {/* Tab Content */}
      <div className="buddies-content">
        {/* MY BUDDIES TAB */}
        {activeTab === 'buddies' && (
          <div className="tab-panel">
            {isLoading ? (
              <div className="loading">Loading buddies...</div>
            ) : buddies.length === 0 ? (
              <div className="empty-state">
                <p>No buddies yet</p>
                <p className="empty-subtitle">
                  Add buddies to start assigning tasks to each other
                </p>
                <button className="add-buddy-cta" onClick={() => setActiveTab('search')}>
                  + Add Your First Buddy
                </button>
              </div>
            ) : (
              <div className="buddies-list">
                {buddies.map((buddy) => (
                  <div key={buddy._id} className="buddy-card">
                    <img
                      src={getAvatarUrl(buddy.avatar)}
                      alt={buddy.name}
                      className="buddy-avatar"
                    />
                    <div className="buddy-info">
                      <h3>{buddy.name}</h3>
                      <p className="buddy-username">@{buddy.username}</p>
                      <div className="buddy-stats">
                        <span>Level {buddy.level}</span>
                        <span>🔥 {buddy.streak} streak</span>
                      </div>
                    </div>
                    <button
                      className="remove-buddy-btn"
                      onClick={() => handleRemoveBuddy(buddy._id, buddy.name)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="tab-panel">
            <h2 className="section-title">Received Requests</h2>
            {receivedRequests.length === 0 ? (
              <p className="empty-message">No pending requests</p>
            ) : (
              <div className="requests-list">
                {receivedRequests.map((request) => (
                  <div key={request._id} className="request-card">
                    <img
                      src={getAvatarUrl(request.sender.avatar)}
                      alt={request.sender.name}
                      className="request-avatar"
                    />
                    <div className="request-info">
                      <h3>{request.sender.name}</h3>
                      <p className="request-username">@{request.sender.username}</p>
                    </div>
                    <div className="request-actions">
                      <button
                        className="accept-btn"
                        onClick={() => handleAcceptRequest(request._id)}
                      >
                        Accept
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleRejectRequest(request._id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="section-title" style={{ marginTop: '2rem' }}>Sent Requests</h2>
            {sentRequests.length === 0 ? (
              <p className="empty-message">No pending sent requests</p>
            ) : (
              <div className="requests-list">
                {sentRequests.map((request) => (
                  <div key={request._id} className="request-card">
                    <img
                      src={getAvatarUrl(request.receiver.avatar)}
                      alt={request.receiver.name}
                      className="request-avatar"
                    />
                    <div className="request-info">
                      <h3>{request.receiver.name}</h3>
                      <p className="request-username">@{request.receiver.username}</p>
                      <span className="pending-badge">Pending</span>
                    </div>
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelRequest(request._id)}
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <div className="tab-panel">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn" disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </button>
              {searchResults.length > 0 && (
                <button type="button" className="clear-btn" onClick={clearSearch}>
                  Clear
                </button>
              )}
            </form>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((user) => (
                  <div key={user._id} className="search-result-card">
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt={user.name}
                      className="result-avatar"
                    />
                    <div className="result-info">
                      <h3>{user.name}</h3>
                      <p className="result-username">@{user.username}</p>
                      <div className="result-stats">
                        <span>Level {user.level}</span>
                        <span>🔥 {user.streak}</span>
                      </div>
                    </div>
                    {user.isBuddy ? (
                      <span className="already-buddy-badge">✓ Buddy</span>
                    ) :  (
                      <button
                        className="add-buddy-btn"
                        onClick={() => handleSendRequest(user._id)}
                      >
                        + Add Buddy
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Buddies;