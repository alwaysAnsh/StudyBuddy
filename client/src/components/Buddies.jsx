import React, { useState, useEffect, useMemo } from 'react';
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
import { markScopeRead } from '../redux/slices/notificationSlice';
import { useConfirm } from '../context/ConfirmContext';
import { notify } from '../utils/notify';
import AppPageHeader from './AppPageHeader';
import { resolveUserAvatarUrl, uiAvatarsFallback } from '../utils/avatarUrl';
import './Buddies.css';

const Buddies = () => {
  const dispatch = useDispatch();
  const { confirm } = useConfirm();
  const { buddies, searchResults, receivedRequests, sentRequests, isLoading } = useSelector(
    (state) => state.buddies
  );
  const { user } = useSelector((state) => state.auth);
  // const [buddyRequestSent, setBuddyRequestSent ] = useState(false)

  // console.log("searchResults: ", searchResults);
  // console.log("user: ", user);

  

  const [activeTab, setActiveTab] = useState('buddies');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingUserIds, setSendingUserIds] = useState([]);

  const sentRequestUserIds = useMemo(
    () =>
      new Set(
        (sentRequests || [])
          .map((req) => req?.receiver?._id || req?.receiver)
          .filter(Boolean)
          .map((id) => String(id))
      ),
    [sentRequests]
  );

  useEffect(() => {
    dispatch(getBuddies());
    dispatch(getReceivedRequests());
    dispatch(getSentRequests());
    dispatch(markScopeRead('buddies'));
  }, [dispatch]);

  useEffect(() => {
    if (activeTab !== 'search') return undefined;

    const q = searchQuery.trim();
    if (q.length < 2) {
      dispatch(clearSearchResults());
      return undefined;
    }

    const t = setTimeout(() => {
      dispatch(searchUsers(q));
    }, 400);

    return () => clearTimeout(t);
  }, [searchQuery, activeTab, dispatch]);

  const handleSendRequest = async (userId) => {
    const uid = String(userId);
    if (sentRequestUserIds.has(uid) || sendingUserIds.includes(uid)) return;
    setSendingUserIds((prev) => [...prev, uid]);
    try {
      await dispatch(sendBuddyRequest(userId)).unwrap();
      notify({ type: 'success', message: 'Buddy request sent.' });
      const q = searchQuery.trim();
      if (q.length >= 2) {
        dispatch(searchUsers(q));
      }
      dispatch(getSentRequests());
    } catch (error) {
      notify({ type: 'error', message: error || 'Failed to send request' });
    } finally {
      setSendingUserIds((prev) => prev.filter((id) => id !== uid));
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await dispatch(acceptBuddyRequest(requestId)).unwrap();
      dispatch(getBuddies());
      notify({ type: 'success', message: 'Buddy request accepted.' });
    } catch (error) {
      notify({ type: 'error', message: error || 'Failed to accept request' });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await dispatch(rejectBuddyRequest(requestId)).unwrap();
      notify({ type: 'success', message: 'Buddy request rejected.' });
    } catch (error) {
      notify({ type: 'error', message: error || 'Failed to reject request' });
    }
  };

  const handleCancelRequest = async (requestId) => {
    const ok = await confirm({
      title: 'Cancel buddy request?',
      message: 'The other person will no longer see this pending request.',
      confirmLabel: 'Cancel request',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await dispatch(cancelBuddyRequest(requestId)).unwrap();
      notify({ type: 'success', message: 'Buddy request cancelled.' });
    } catch (error) {
      notify({ type: 'error', message: error || 'Failed to cancel request' });
    }
  };

  const handleRemoveBuddy = async (buddyId, buddyName) => {
    const ok = await confirm({
      title: `Remove ${buddyName}?`,
      message: 'You can send a new request later if you change your mind.',
      confirmLabel: 'Remove buddy',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await dispatch(removeBuddy(buddyId)).unwrap();
      notify({ type: 'success', message: 'Buddy removed.' });
    } catch (error) {
      notify({ type: 'error', message: error || 'Failed to remove buddy' });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    dispatch(clearSearchResults());
    // setBuddyRequestSent(false)
  };

  return (
    <div className="buddies-container">
      <AppPageHeader />
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
                      src={resolveUserAvatarUrl(buddy)}
                      alt={buddy.name}
                      className="buddy-avatar"
                      onError={(e) => {
                        e.target.src = uiAvatarsFallback(buddy.name);
                      }}
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
                      src={resolveUserAvatarUrl(request.sender)}
                      alt={request.sender.name}
                      className="request-avatar"
                      onError={(e) => {
                        e.target.src = uiAvatarsFallback(request.sender.name);
                      }}
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
                      src={resolveUserAvatarUrl(request.receiver)}
                      alt={request.receiver.name}
                      className="request-avatar"
                      onError={(e) => {
                        e.target.src = uiAvatarsFallback(request.receiver.name);
                      }}
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
            <div className="search-form">
              <input
                type="text"
                placeholder="Search by username (type at least 2 characters)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Search users by username"
              />
              {searchResults.length > 0 && (
                <button type="button" className="clear-btn" onClick={clearSearch}>
                  Clear
                </button>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((user) => (
                  <div key={user._id} className="search-result-card">
                    <img
                      src={resolveUserAvatarUrl(user)}
                      alt={user.name}
                      className="result-avatar"
                      onError={(e) => {
                        e.target.src = uiAvatarsFallback(user.name);
                      }}
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
                    ) : sentRequestUserIds.has(String(user._id)) || sendingUserIds.includes(String(user._id)) ? (
                      <button className="add-buddy-btn" disabled>
                        {sendingUserIds.includes(String(user._id)) ? 'Sending...' : 'Pending'}
                      </button>
                    ) : (
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