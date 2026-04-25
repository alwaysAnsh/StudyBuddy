import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import './Layout.css';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  const toggleMenu = () => {
    setIsMenuOpen((open) => !open);
  };

  const publicNavItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'About', path: '/about', icon: 'ℹ️' },
  ];

  const authenticatedNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  ];

  const navItems = isAuthenticated 
    ? [...publicNavItems, ...authenticatedNavItems]
    : publicNavItems;

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <header className="top-nav">
        <div className="top-nav-inner">
          <div className="logo-container">
            {/* Logo placeholder - user will add their logo here */}
            <div className="logo-placeholder">
              <span className="logo-text">GB</span>
            </div>
            <span className="app-name">GeekBuddy</span>
          </div>

          <button
            className="nav-toggle"
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>

          <nav className={`top-nav-links ${isMenuOpen ? 'open' : ''}`}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
                end={item.path === '/'}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.name}</span>
              </NavLink>
            ))}
            <button
              type="button"
              className="nav-item nav-theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              <span className="nav-icon" aria-hidden>
                {theme === 'dark' ? '☀️' : '🌙'}
              </span>
              <span className="nav-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">GeekBuddy</h3>
            <p className="footer-tagline">
              Master your learning journey together
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              {isAuthenticated && <li><a href="/dashboard">Dashboard</a></li>}
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Creator</h4>
            <ul className="footer-contact">
              <li>👤 Ansh</li>
              <li>📍 Pune, Maharashtra</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Connect</h4>
            <div className="social-links">
              <a href="https://www.linkedin.com/in/ansh-jainy/" target="_blank" rel="noreferrer" className="social-link">LinkedIn</a>
              <a href="https://github.com/alwaysAnsh" target="_blank" rel="noreferrer" className="social-link">GitHub</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            © {new Date().getFullYear()} GeekBuddy. All rights reserved.
          </p>
          <div className="footer-legal">
            <Link to="/license-policy">License Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
