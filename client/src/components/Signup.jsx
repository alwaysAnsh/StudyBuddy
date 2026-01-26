import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signup, checkUsername, clearError } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const avatars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    avatar: 1
  });
  
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [errors, setErrors] = useState({});
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Real-time username availability check
  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (formData.username.length >= 3) {
        setCheckingUsername(true);
        const result = await dispatch(checkUsername(formData.username)).unwrap();
        setUsernameAvailable(result.available);
        setCheckingUsername(false);
      } else {
        setUsernameAvailable(null);
      }
    };

    const timeoutId = setTimeout(checkUsernameAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarSelect = (avatarNum) => {
    setFormData(prev => ({ ...prev, avatar: avatarNum }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    } else if (!usernameAvailable) {
      newErrors.username = 'Username is already taken';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const { confirmPassword, ...signupData } = formData;
      dispatch(signup(signupData));
    }
  };

  return (
  <div className="signup-page">
    <div className="signup-overlay" />

    <div className="signup-wrapper">
      <div className="signup-card">
        <div className="signup-header">
          <h1>Create Account</h1>
          <p>Join the learning community</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form two-column">
  {/* LEFT SIDE – FORM */}
  <div className="form-left">
    {error && <div className="error-message">{error}</div>}

    {/* Name */}
    <div className="form-group">
      <label htmlFor="name">Full Name *</label>
      <input
        type="text"
        id="name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="John Doe"
        className={errors.name ? 'error' : ''}
      />
      {errors.name && <span className="error-text">{errors.name}</span>}
    </div>

    {/* Username */}
    <div className="form-group">
      <label htmlFor="username">Username * (unique)</label>
      <div className="input-with-status">
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="johndoe"
          className={errors.username ? 'error' : ''}
        />
        {checkingUsername && (
          <span className="username-status checking">Checking...</span>
        )}
        {usernameAvailable === true && (
          <span className="username-status available">✓ Available</span>
        )}
        {usernameAvailable === false && (
          <span className="username-status taken">✗ Taken</span>
        )}
      </div>
      {errors.username && <span className="error-text">{errors.username}</span>}
      <small className="help-text">This will be your unique identifier</small>
    </div>

    {/* Email */}
    <div className="form-group">
      <label htmlFor="email">Email *</label>
      <input
        type="email"
        id="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="john@example.com"
        className={errors.email ? 'error' : ''}
      />
      {errors.email && <span className="error-text">{errors.email}</span>}
    </div>

    {/* Password */}
    <div className="form-group">
      <label htmlFor="password">Password *</label>
      <input
        type="password"
        id="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="At least 6 characters"
        className={errors.password ? 'error' : ''}
      />
      {errors.password && <span className="error-text">{errors.password}</span>}
    </div>

    {/* Confirm Password */}
    <div className="form-group">
      <label htmlFor="confirmPassword">Confirm Password *</label>
      <input
        type="password"
        id="confirmPassword"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Re-enter password"
        className={errors.confirmPassword ? 'error' : ''}
      />
      {errors.confirmPassword && (
        <span className="error-text">{errors.confirmPassword}</span>
      )}
    </div>

    <button
      type="submit"
      className="signup-btn"
      disabled={isLoading || checkingUsername}
    >
      {isLoading ? 'Creating Account...' : 'Sign Up'}
    </button>
  </div>

  {/* RIGHT SIDE – AVATARS */}
  <div className="form-right">
    <label className="avatar-title">Choose Avatar</label>
    <div className="avatar-grid">
      {avatars.map(num => (
        <div
          key={num}
          className={`avatar-option ${
            formData.avatar === num ? 'selected' : ''
          }`}
          onClick={() => handleAvatarSelect(num)}
        >
          <img
            src={`/avatars/avatar-${num}.png`}
            alt={`Avatar ${num}`}
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${num}&background=667eea&color=fff&size=80`;
            }}
          />
        </div>
      ))}
    </div>
  </div>
</form>


        <div className="signup-footer">
          <p>
            Already have an account? <a href="/login">Login</a>
          </p>
        </div>
      </div>
    </div>
  </div>
);

};

export default Signup;