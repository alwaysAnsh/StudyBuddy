import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, changePassword } from '../redux/slices/authSlice';
import './ProfileSettings.css';

const ProfileSettings = ({ onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  console.log('user in ProfileSettings:', user);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 1);
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const avatars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,11,12,13,14,15,16,17,18,19];

  const getAvatarUrl = (avatarNum) => {
    return `/avatars/avatar-${avatarNum}.png`;
  };

  // const handleProfileUpdate = async (e) => {
  //   e.preventDefault();
  //   debugger
    
  //   if (!name.trim()) {
      
  //     alert('Name cannot be empty');
  //     return;
  //   }

  //   setIsUpdating(true);
    
  //   try {
      
  //     await dispatch(updateUserProfile({
        
  //       name: name.trim(),
  //       avatar: selectedAvatar
  //     }))
      
  //     alert('Profile updated successfully!');
  //     onClose();
  //   } catch (error) {
  //     debugger
  //     alert(error || 'Failed to update profile');
  //   } finally {
  //     setIsUpdating(false);
  //   }
  // };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    // remove debugger during normal flow
    if (!name.trim()) {
      alert('Name cannot be empty');
      return;
    }

    setIsUpdating(true);
    try {
      // log payload before dispatch
      console.log('Dispatching updateUserProfile with', { name: name.trim(), avatar: selectedAvatar });

      const resultAction = await dispatch(updateUserProfile({
        name: name.trim(),
        avatar: selectedAvatar
      }));

      // If you want to use unwrap, do it explicitly to get thrown error:
      // await dispatch(updateUserProfile(payload)).unwrap();

      // Check whether thunk fulfilled or rejected
      if (updateUserProfile.fulfilled.match(resultAction)) {
        console.log('Profile update fulfilled:', resultAction.payload);
        alert('Profile updated successfully!');
        onClose();
      } else {
        console.error('Profile update rejected action:', resultAction);
        const errMsg = resultAction.payload?.message || resultAction.error?.message || JSON.stringify(resultAction);
        alert(errMsg || 'Failed to update profile');
      }
    } catch (error) {
      // More robust error parsing for axios / thunk errors
      console.error('Update profile caught error:', error);
      const message =
        error?.message ||
        error?.payload?.message ||
        error?.response?.data?.message ||
        (typeof error === 'string' ? error : JSON.stringify(error));
      alert(message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setIsUpdating(true);
    
    try {
      await dispatch(changePassword({
        currentPassword,
        newPassword
      })).unwrap();
      
      alert('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      alert(error || 'Failed to change password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="modal-overlay-pro" onClick={onClose}>
      <div className="modal-content-pro settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-pro">
          <h2>Profile Settings</h2>
          <button className="modal-close-pro" onClick={onClose}>&times;</button>
        </div>
        

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Edit Profile
          </button>
          <button
            className={`settings-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleProfileUpdate} className="settings-form">
            <div className="form-section">
              <h3>Choose Avatar</h3>
              <div className="avatar-grid">
                {avatars.map((avatarNum) => (
                  <div
                    key={avatarNum}
                    className={`avatar-option ${selectedAvatar === avatarNum ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(avatarNum)}
                  >
                    <img
                      src={getAvatarUrl(avatarNum)}
                      alt={`Avatar ${avatarNum}`}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=Avatar${avatarNum}&background=4f46e5&color=fff&size=80`;
                      }}
                    />
                    {selectedAvatar === avatarNum && (
                      <div className="selected-indicator">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-group-pro">
                <label htmlFor="username">Username (Cannot be changed)</label>
                <input
                  type="text"
                  id="username"
                  value={user?.username || ''}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group-pro">
                <label htmlFor="name">Display Name *</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group-pro">
                <label htmlFor="email">Email (Cannot be changed)</label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="disabled-input"
                />
              </div>
            </div>

            <div className="form-actions-pro">
              <button type="button" className="cancel-btn-pro" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-btn-pro" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordChange} className="settings-form">
            <div className="form-section">
              <h3>Change Password</h3>
              <p className="security-note">
                For your security, please enter your current password before setting a new one.
              </p>

              <div className="form-group-pro">
                <label htmlFor="currentPassword">Current Password *</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-group-pro">
                <label htmlFor="newPassword">New Password *</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group-pro">
                <label htmlFor="confirmPassword">Confirm New Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength="6"
                />
              </div>
            </div>

            <div className="form-actions-pro">
              <button type="button" className="cancel-btn-pro" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="submit-btn-pro" disabled={isUpdating}>
                {isUpdating ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;