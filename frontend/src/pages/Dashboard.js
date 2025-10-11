import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="card">
        <h2>Welcome, {user?.username}!</h2>
        <p>This is your personal tracking dashboard.</p>
        
        <div style={{ marginTop: '20px' }}>
          <h3>Quick Stats</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="card">
              <h4>Profile</h4>
              <p>Email: {user?.email}</p>
              <p>Access Level: {user?.access_level}</p>
            </div>
            <div className="card">
              <h4>Recent Activity</h4>
              <p>No recent activity to display.</p>
            </div>
            <div className="card">
              <h4>Goals</h4>
              <p>Set up your tracking goals to get started.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
