import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Personalization from './pages/Personalization';
import DataViewer from './pages/DataViewer';
import FoodLog from './pages/FoodLog';
import WorkoutTracker from './pages/WorkoutTracker';
import AdditionalTrackers from './pages/AdditionalTrackers';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Navigate to="/profile" replace />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/personalization" 
                element={
                  <ProtectedRoute>
                    <Personalization />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/data-viewer" 
                element={
                  <ProtectedRoute>
                    <DataViewer />
                  </ProtectedRoute>
                } 
              />
                  <Route
                    path="/food-log"
                    element={
                      <ProtectedRoute>
                        <div className="food-log-page">
                          <FoodLog />
                        </div>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workout-tracker"
                    element={
                      <ProtectedRoute>
                        <WorkoutTracker />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/additional-trackers/*"
                    element={
                      <ProtectedRoute>
                        <AdditionalTrackers />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Add styles for the main content area
const AppStyles = `
  .main-content {
    padding: var(--space-6) var(--space-4) var(--space-4);
    padding-left: calc(var(--space-4) + 60px); /* Account for hamburger button */
    max-width: 100%;
    margin: 0 auto;
    min-height: 100vh;
  }

  @media (max-width: 768px) {
    .main-content {
      padding-left: calc(var(--space-4) + 52px); /* Smaller hamburger button on mobile */
    }
  }

  @media (max-width: 480px) {
    .main-content {
      padding: var(--space-4) var(--space-2);
      padding-left: calc(var(--space-2) + 52px);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = AppStyles;
  document.head.appendChild(styleSheet);
}

export default App;
