import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Personalization from './pages/Personalization';
import MusclePriorityPage from './pages/MusclePriorityPage';
import SplitsHome from './pages/SplitsHome';
import SplitEditor from './pages/SplitEditor';
import SplitNew from './pages/SplitNew';
import DataViewer from './pages/DataViewer';
import FoodLog from './pages/FoodLog';
import WorkoutTracker from './pages/WorkoutTracker';
import AdditionalTrackers from './pages/AdditionalTrackers';
import Analytics from './pages/Analytics';
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
                path="/personalization/splits"
                element={
                  <ProtectedRoute>
                    <SplitsHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personalization/muscle-priority"
                element={
                  <ProtectedRoute>
                    <MusclePriorityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personalization/splits/:splitId/edit"
                element={
                  <ProtectedRoute>
                    <SplitEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personalization/splits/new"
                element={
                  <ProtectedRoute>
                    <SplitNew />
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
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <Analytics />
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
    max-width: 100%;
    margin: var(--space-4);
    padding: var(--space-6);
    min-height: calc(100vh - calc(var(--space-4) * 2));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .main-content > * {
    width: 100%;
    max-width: 100%;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = AppStyles;
  document.head.appendChild(styleSheet);
}

export default App;
