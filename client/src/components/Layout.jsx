import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Layout.css';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const publicNavItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'About', path: '/about', icon: 'ℹ️' },
    { name: 'Contact', path: '/contact', icon: '📧' },
  ];

  const authenticatedNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  ];

  const navItems = isAuthenticated 
    ? [...publicNavItems, ...authenticatedNavItems]
    : publicNavItems;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            {/* Logo placeholder - user will add their logo here */}
            <div className="logo-placeholder">
              <span className="logo-text">LA</span>
            </div>
            {isSidebarOpen && <span className="app-name">StuddyBuddy</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              end={item.path === '/'}
            >
              <span className="nav-icon">{item.icon}</span>
              {isSidebarOpen && <span className="nav-label">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <span className="toggle-icon">
            {isSidebarOpen ? '◀' : '▶'}
          </span>
        </button>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${isSidebarOpen ? '' : 'expanded'}`}>
        {children}
      </main>

      {/* Footer */}
      <footer className={`app-footer ${isSidebarOpen ? '' : 'expanded'}`}>
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">StuddyBuddy</h3>
            <p className="footer-tagline">
              Master your learning journey together
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
              {isAuthenticated && <li><a href="/dashboard">Dashboard</a></li>}
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-contact">
              <li>📧 hello@learningapp.com</li>
              <li>📱 +1 (555) 123-4567</li>
              <li>📍 San Francisco, CA</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Connect</h4>
            <div className="social-links">
              <a href="#" className="social-link">Twitter</a>
              <a href="#" className="social-link">LinkedIn</a>
              <a href="#" className="social-link">GitHub</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            © {new Date().getFullYear()} StuddyBuddy. All rights reserved.
          </p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;