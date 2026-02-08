import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

const API_URL = 'http://localhost:5050/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: username, 2: security question, 3: new password
  const [username, setUsername] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      alert('Please enter your username');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/auth/security-question/${username}`);
      setSecurityQuestion(response.data.securityQuestion);
      setStep(2);
    } catch (error) {
      alert(error.response?.data?.message || 'User not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityAnswerSubmit = async (e) => {
    e.preventDefault();
    
    if (!securityAnswer.trim()) {
      alert('Please answer the security question');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/auth/verify-security`, {
        username,
        securityAnswer
      });
      
      setResetToken(response.data.resetToken);
      setStep(3);
    } catch (error) {
      alert(error.response?.data?.message || 'Incorrect security answer');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      alert('Please fill all password fields');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        resetToken,
        newPassword
      });
      
      alert('Password reset successfully! You can now login with your new password.');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2>Reset Password</h2>
        <div className="steps-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {step === 1 && (
          <form onSubmit={handleUsernameSubmit} className="reset-form">
            <p className="step-description">Enter your username to continue</p>
            <div className="form-group-reset">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <button type="submit" className="submit-btn-reset" disabled={isLoading}>
              {isLoading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSecurityAnswerSubmit} className="reset-form">
            <p className="step-description">Answer your security question</p>
            <div className="security-question-display">
              <strong>Security Question:</strong>
              <p>{securityQuestion}</p>
            </div>
            <div className="form-group-reset">
              <label htmlFor="securityAnswer">Your Answer</label>
              <input
                type="text"
                id="securityAnswer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Enter your answer"
                required
              />
            </div>
            <div className="button-group">
              <button type="button" className="back-btn-reset" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="submit-btn-reset" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordReset} className="reset-form">
            <p className="step-description">Create your new password</p>
            <div className="form-group-reset">
              <label htmlFor="newPassword">New Password</label>
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
            <div className="form-group-reset">
              <label htmlFor="confirmPassword">Confirm Password</label>
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
            <div className="button-group">
              <button type="button" className="back-btn-reset" onClick={() => setStep(2)}>
                Back
              </button>
              <button type="submit" className="submit-btn-reset" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        <div className="back-to-login">
          <button onClick={() => navigate('/login')}>Back to Login</button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;