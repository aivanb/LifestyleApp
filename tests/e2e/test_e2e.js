import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../frontend/src/contexts/AuthContext';
import App from '../../frontend/src/App';
import api from '../../frontend/src/services/api';

// Mock the API service
jest.mock('../../frontend/src/services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  setAuthToken: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Authentication Flow', () => {
    test('complete user registration and login flow', async () => {
      // Mock successful registration
      api.post.mockResolvedValueOnce({
        data: {
          data: {
            user: { username: 'newuser', email: 'new@example.com' },
            tokens: { access: 'access-token', refresh: 'refresh-token' }
          }
        }
      });

      // Mock successful profile fetch
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'newuser', email: 'new@example.com' }
        }
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Should redirect to login initially
      expect(screen.getByText('Login')).toBeInTheDocument();

      // Navigate to registration
      fireEvent.click(screen.getByText('Register'));

      // Fill registration form
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'newuser' }
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'new@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'newpass123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'newpass123' }
      });

      // Submit registration
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      // Should redirect to dashboard after successful registration
      await waitFor(() => {
        expect(screen.getByText('Welcome, newuser!')).toBeInTheDocument();
      });
    });

    test('user login flow', async () => {
      // Mock successful login
      api.post.mockResolvedValueOnce({
        data: {
          data: {
            user: { username: 'testuser', email: 'test@example.com' },
            tokens: { access: 'access-token', refresh: 'refresh-token' }
          }
        }
      });

      // Mock successful profile fetch
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'testuser', email: 'test@example.com' }
        }
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Fill login form
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'testpass' }
      });

      // Submit login
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Should redirect to dashboard after successful login
      await waitFor(() => {
        expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
      });
    });

    test('user logout flow', async () => {
      // Mock successful login
      api.post.mockResolvedValueOnce({
        data: {
          data: {
            user: { username: 'testuser', email: 'test@example.com' },
            tokens: { access: 'access-token', refresh: 'refresh-token' }
          }
        }
      });

      // Mock successful profile fetch
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'testuser', email: 'test@example.com' }
        }
      });

      // Mock successful logout
      api.post.mockResolvedValueOnce({
        data: { data: { message: 'Logged out successfully' } }
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Login first
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'testpass' }
      });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
      });

      // Logout
      fireEvent.click(screen.getByText('Logout'));

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Flow', () => {
    test('navigation between protected routes', async () => {
      // Mock authentication
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'testuser', email: 'test@example.com' }
        }
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Should be on dashboard
      await waitFor(() => {
        expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
      });

      // Navigate to OpenAI page
      fireEvent.click(screen.getByText('OpenAI'));
      expect(screen.getByText('OpenAI Integration')).toBeInTheDocument();

      // Navigate to Profile page
      fireEvent.click(screen.getByText('Profile'));
      expect(screen.getByText('Profile')).toBeInTheDocument();

      // Navigate back to Dashboard
      fireEvent.click(screen.getByText('Dashboard'));
      expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
    });
  });

  describe('OpenAI Integration Flow', () => {
    test('complete OpenAI prompt flow', async () => {
      // Mock authentication
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'testuser', email: 'test@example.com' }
        }
      });

      // Mock OpenAI prompt response
      api.post.mockResolvedValueOnce({
        data: {
          data: {
            response: 'This is a test AI response',
            tokens_used: 15,
            cost: 0.002,
            response_time: 2.1
          }
        }
      });

      // Mock usage stats
      api.get.mockResolvedValueOnce({
        data: {
          data: {
            total_tokens: 50,
            total_cost: 0.005,
            total_requests: 3,
            successful_requests: 3,
            success_rate: 100
          }
        }
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Navigate to OpenAI page
      await waitFor(() => {
        fireEvent.click(screen.getByText('OpenAI'));
      });

      // Fill prompt form
      fireEvent.change(screen.getByLabelText(/your prompt/i), {
        target: { value: 'Tell me a joke' }
      });

      // Submit prompt
      fireEvent.click(screen.getByRole('button', { name: /send prompt/i }));

      // Should display AI response
      await waitFor(() => {
        expect(screen.getByText('This is a test AI response')).toBeInTheDocument();
      });

      // Should display usage statistics
      expect(screen.getByText('50')).toBeInTheDocument(); // total tokens
      expect(screen.getByText('$0.005')).toBeInTheDocument(); // total cost
      expect(screen.getByText('3')).toBeInTheDocument(); // total requests
      expect(screen.getByText('100%')).toBeInTheDocument(); // success rate
    });

    test('OpenAI error handling', async () => {
      // Mock authentication
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'testuser', email: 'test@example.com' }
        }
      });

      // Mock OpenAI error response
      api.post.mockRejectedValueOnce({
        response: {
          data: {
            error: { message: 'API rate limit exceeded' }
          }
        }
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Navigate to OpenAI page
      await waitFor(() => {
        fireEvent.click(screen.getByText('OpenAI'));
      });

      // Fill prompt form
      fireEvent.change(screen.getByLabelText(/your prompt/i), {
        target: { value: 'Tell me a joke' }
      });

      // Submit prompt
      fireEvent.click(screen.getByRole('button', { name: /send prompt/i }));

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Management Flow', () => {
    test('profile update flow', async () => {
      // Mock authentication
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { 
            username: 'testuser', 
            email: 'test@example.com',
            height: '175',
            birthday: '1990-01-01',
            gender: 'male'
          }
        }
      });

      // Mock profile update
      api.put.mockResolvedValueOnce({
        data: {
          data: { 
            username: 'updateduser', 
            email: 'updated@example.com',
            height: '180',
            birthday: '1990-01-01',
            gender: 'male'
          }
        }
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Navigate to Profile page
      await waitFor(() => {
        fireEvent.click(screen.getByText('Profile'));
      });

      // Update profile fields
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'updateduser' }
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'updated@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/height/i), {
        target: { value: '180' }
      });

      // Submit update
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

      // Should display success message
      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Flow', () => {
    test('handles network errors gracefully', async () => {
      // Mock authentication failure
      api.get.mockRejectedValueOnce({
        response: { status: 401 }
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Should redirect to login on auth failure
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });
    });

    test('handles invalid token gracefully', async () => {
      // Mock invalid token
      localStorageMock.getItem.mockReturnValue('invalid-token');
      api.get.mockRejectedValueOnce({
        response: { status: 401 }
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });
    });
  });
});
