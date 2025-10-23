import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button 
        className={`hamburger-btn ${sidebarOpen ? 'open' : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={closeSidebar}>
            Tracking App
          </Link>
          <button 
            className="sidebar-close"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>
        
        <div className="sidebar-content">
          {isAuthenticated ? (
            <>
              <div className="sidebar-user-info">
                <div className="user-avatar">
                  <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="user-details">
                  <p className="username">{user?.username}</p>
                  <p className="user-email">{user?.email}</p>
                </div>
              </div>
              
              <ul className="sidebar-nav">
                <li>
                  <Link 
                    to="/profile" 
                    className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}
                    onClick={closeSidebar}
                  >
                    <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Profile
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/personalization" 
                    className={`sidebar-link ${isActive('/personalization') ? 'active' : ''}`}
                    onClick={closeSidebar}
                  >
                    <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Personalization
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/food-log" 
                    className={`sidebar-link ${isActive('/food-log') ? 'active' : ''}`}
                    onClick={closeSidebar}
                  >
                    <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Food Log
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/workout-tracker" 
                    className={`sidebar-link ${isActive('/workout-tracker') ? 'active' : ''}`}
                    onClick={closeSidebar}
                  >
                    <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Workout Tracker
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/additional-trackers" 
                    className={`sidebar-link ${isActive('/additional-trackers') ? 'active' : ''}`}
                    onClick={closeSidebar}
                  >
                    <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Additional Trackers
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/data-viewer" 
                    className={`sidebar-link ${isActive('/data-viewer') ? 'active' : ''}`}
                    onClick={closeSidebar}
                  >
                    <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Data Viewer
                  </Link>
                </li>
              </ul>
            </>
          ) : (
            <ul className="sidebar-nav">
              <li>
                <Link 
                  to="/login" 
                  className={`sidebar-link ${isActive('/login') ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Login
                </Link>
              </li>
              <li>
                <Link 
                  to="/register" 
                  className={`sidebar-link ${isActive('/register') ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Register
                </Link>
              </li>
            </ul>
          )}
        </div>
      </nav>

      <style>{`
        /* Hamburger Button */
        .hamburger-btn {
          position: fixed;
          top: var(--space-6);
          left: var(--space-4);
          z-index: 1001;
          background: var(--accent-primary);
          border: none;
          border-radius: var(--radius-md);
          width: 48px;
          height: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s var(--ease-out-cubic);
          box-shadow: var(--shadow-md);
        }

        .hamburger-btn:hover {
          background: var(--accent-primary-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-lg);
        }

        .hamburger-btn span {
          width: 20px;
          height: 2px;
          background: white;
          margin: 2px 0;
          transition: all 0.3s var(--ease-out-cubic);
          border-radius: 1px;
        }

        .hamburger-btn.open span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .hamburger-btn.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger-btn.open span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }

        .hamburger-btn.open {
          opacity: 0;
          pointer-events: none;
        }

        /* Sidebar Overlay */
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          opacity: 0;
          animation: fadeIn 0.3s var(--ease-out-cubic) forwards;
        }

        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }

        /* Sidebar */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100vh;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-primary);
          z-index: 1000;
          transform: translateX(-100%);
          transition: transform 0.3s var(--ease-out-cubic);
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }

        .sidebar.open {
          transform: translateX(0);
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4);
          border-bottom: 1px solid var(--border-primary);
        }

        .sidebar-brand {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          text-decoration: none;
          font-family: var(--font-primary);
        }

        .sidebar-brand:hover {
          color: var(--accent-primary);
        }

        .sidebar-close {
          background: none;
          border: none;
          font-size: var(--text-2xl);
          color: var(--text-secondary);
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .sidebar-close:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .sidebar-content {
          padding: var(--space-4);
        }

        .sidebar-user-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-4);
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: var(--accent-primary);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .user-avatar .icon {
          width: 20px;
          height: 20px;
        }

        .user-details .username {
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          margin: 0;
          font-size: var(--text-sm);
        }

        .user-details .user-email {
          color: var(--text-secondary);
          margin: 0;
          font-size: var(--text-xs);
        }

        .sidebar-nav {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar-nav li {
          margin-bottom: var(--space-1);
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all 0.2s var(--ease-out-cubic);
          font-family: var(--font-primary);
        }

        .sidebar-link:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          transform: translateX(4px);
        }

        .sidebar-link.active {
          background: var(--accent-primary);
          color: white;
          font-weight: var(--font-weight-medium);
        }

        .sidebar-link.active:hover {
          background: var(--accent-primary-dark);
          transform: translateX(4px);
        }

        .sidebar-link .icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            max-width: 320px;
          }
          
          .hamburger-btn {
            width: 44px;
            height: 44px;
          }
        }

        @media (max-width: 480px) {
          .sidebar {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;
