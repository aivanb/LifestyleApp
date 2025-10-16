import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import DataViewer from './pages/DataViewer';
import FoodLog from './pages/FoodLog';
import WorkoutTracker from './pages/WorkoutTracker';
import AdditionalTrackers from './pages/AdditionalTrackers';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeSwitcher from './components/ThemeSwitcher';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="container">
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
            <ThemeSwitcher />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
