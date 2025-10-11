import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../frontend/src/contexts/AuthContext';
import Login from '../../frontend/src/pages/Login';
import Register from '../../frontend/src/pages/Register';
import Dashboard from '../../frontend/src/pages/Dashboard';
import OpenAI from '../../frontend/src/pages/OpenAI';
import Profile from '../../frontend/src/pages/Profile';
import Navbar from '../../frontend/src/components/Navbar';
import ProtectedRoute from '../../frontend/src/components/ProtectedRoute';
import api from '../../frontend/src/services/api';

// Mock the API service
jest.mock('../../frontend/src/services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  setAuthToken: jest.fn(),
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Authentication Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Component', () => {
    test('renders login form', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('handles form submission', async () => {
      const mockLogin = jest.fn().mockResolvedValue({ success: true });
      
      // Mock the AuthContext
      jest.spyOn(React, 'useContext').mockReturnValue({
        login: mockLogin,
        user: null,
        isAuthenticated: false,
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'testpass' }
      });

      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass');
      });
    });

    test('displays error message on login failure', async () => {
      const mockLogin = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Invalid credentials' 
      });
      
      jest.spyOn(React, 'useContext').mockReturnValue({
        login: mockLogin,
        user: null,
        isAuthenticated: false,
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpass' }
      });

      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('Register Component', () => {
    test('renders registration form', () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    test('validates password confirmation', async () => {
      render(
        <TestWrapper>
          <Register />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'different123' }
      });

      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });
  });
});

describe('Protected Components', () => {
  describe('ProtectedRoute Component', () => {
    test('redirects to login when not authenticated', () => {
      jest.spyOn(React, 'useContext').mockReturnValue({
        isAuthenticated: false,
        loading: false,
      });

      render(
        <TestWrapper>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      // Should redirect to login, so protected content should not be visible
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('renders children when authenticated', () => {
      jest.spyOn(React, 'useContext').mockReturnValue({
        isAuthenticated: true,
        loading: false,
      });

      render(
        <TestWrapper>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('shows loading spinner when loading', () => {
      jest.spyOn(React, 'useContext').mockReturnValue({
        isAuthenticated: false,
        loading: true,
      });

      render(
        <TestWrapper>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});

describe('Main Components', () => {
  describe('Navbar Component', () => {
    test('shows login/register links when not authenticated', () => {
      jest.spyOn(React, 'useContext').mockReturnValue({
        isAuthenticated: false,
        user: null,
        logout: jest.fn(),
      });

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    test('shows user menu when authenticated', () => {
      const mockLogout = jest.fn();
      
      jest.spyOn(React, 'useContext').mockReturnValue({
        isAuthenticated: true,
        user: { username: 'testuser' },
        logout: mockLogout,
      });

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    test('handles logout', () => {
      const mockLogout = jest.fn();
      
      jest.spyOn(React, 'useContext').mockReturnValue({
        isAuthenticated: true,
        user: { username: 'testuser' },
        logout: mockLogout,
      });

      render(
        <TestWrapper>
          <Navbar />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Logout'));
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Dashboard Component', () => {
    test('displays user information', () => {
      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        access_level: 'user',
        created_at: '2024-01-01T00:00:00Z'
      };

      jest.spyOn(React, 'useContext').mockReturnValue({
        user: mockUser,
      });

      render(
        <TestWrapper>
          <Dashboard />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
    });
  });

  describe('OpenAI Component', () => {
    test('renders prompt form', () => {
      render(
        <TestWrapper>
          <OpenAI />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/your prompt/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send prompt/i })).toBeInTheDocument();
    });

    test('handles prompt submission', async () => {
      const mockSendPrompt = jest.fn().mockResolvedValue({
        data: {
          data: {
            response: 'Test AI response',
            tokens_used: 10,
            cost: 0.001
          }
        }
      });

      api.sendPrompt = mockSendPrompt;

      render(
        <TestWrapper>
          <OpenAI />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText(/your prompt/i), {
        target: { value: 'Test prompt' }
      });

      fireEvent.click(screen.getByRole('button', { name: /send prompt/i }));

      await waitFor(() => {
        expect(mockSendPrompt).toHaveBeenCalledWith('Test prompt');
      });
    });

    test('displays AI response', async () => {
      const mockSendPrompt = jest.fn().mockResolvedValue({
        data: {
          data: {
            response: 'Test AI response',
            tokens_used: 10,
            cost: 0.001
          }
        }
      });

      api.sendPrompt = mockSendPrompt;

      render(
        <TestWrapper>
          <OpenAI />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText(/your prompt/i), {
        target: { value: 'Test prompt' }
      });

      fireEvent.click(screen.getByRole('button', { name: /send prompt/i }));

      await waitFor(() => {
        expect(screen.getByText('Test AI response')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Component', () => {
    test('renders profile form with user data', () => {
      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        height: '175',
        birthday: '1990-01-01',
        gender: 'male'
      };

      jest.spyOn(React, 'useContext').mockReturnValue({
        user: mockUser,
        updateProfile: jest.fn(),
      });

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('175')).toBeInTheDocument();
    });

    test('handles profile update', async () => {
      const mockUpdateProfile = jest.fn().mockResolvedValue({ success: true });
      
      jest.spyOn(React, 'useContext').mockReturnValue({
        user: { username: 'testuser', email: 'test@example.com' },
        updateProfile: mockUpdateProfile,
      });

      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'newusername' }
      });

      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          username: 'newusername',
          email: 'test@example.com'
        });
      });
    });
  });
});

describe('API Service', () => {
  test('sets auth token correctly', () => {
    api.setAuthToken('test-token');
    expect(api.setAuthToken).toHaveBeenCalledWith('test-token');
  });

  test('handles login request', async () => {
    const mockResponse = {
      data: {
        data: {
          user: { username: 'testuser' },
          tokens: { access: 'access-token', refresh: 'refresh-token' }
        }
      }
    };

    api.post.mockResolvedValue(mockResponse);

    const result = await api.login({ username: 'testuser', password: 'testpass' });

    expect(api.post).toHaveBeenCalledWith('/auth/login/', { username: 'testuser', password: 'testpass' });
    expect(result).toEqual(mockResponse);
  });

  test('handles registration request', async () => {
    const mockResponse = {
      data: {
        data: {
          user: { username: 'newuser' },
          tokens: { access: 'access-token', refresh: 'refresh-token' }
        }
      }
    };

    api.post.mockResolvedValue(mockResponse);

    const userData = { username: 'newuser', email: 'new@example.com', password: 'newpass' };
    const result = await api.register(userData);

    expect(api.post).toHaveBeenCalledWith('/auth/register/', userData);
    expect(result).toEqual(mockResponse);
  });
});
