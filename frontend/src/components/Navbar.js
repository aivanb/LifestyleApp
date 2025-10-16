import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            Tracking App
          </Link>
          
          <ul className="navbar-nav">
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/profile">Profile</Link>
                </li>
                    <li>
                      <Link to="/food-log">Food Log</Link>
                    </li>
                    <li>
                      <Link to="/workout-tracker">Workout Tracker</Link>
                    </li>
                    <li>
                      <Link to="/additional-trackers">Additional Trackers</Link>
                    </li>
                    <li>
                      <Link to="/data-viewer">Data Viewer</Link>
                    </li>
                <li>
                  <span>Welcome, {user?.username}</span>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
