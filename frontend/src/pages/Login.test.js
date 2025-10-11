import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Login from './Login';
import api from '../services/api';

// Mock the API service
jest.mock('../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  setAuthToken: jest.fn(),
  getUsageStats: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

const renderLogin = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('renders login form', () => {
    renderLogin();
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('allows user to input credentials', () => {
    renderLogin();
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    
    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('testpass');
  });

  test('handles successful login', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        data: {
          user: { username: 'testuser', email: 'test@example.com' },
          tokens: { access: 'access-token', refresh: 'refresh-token' }
        }
      }
    });

    api.get.mockResolvedValueOnce({
      data: {
        data: { username: 'testuser', email: 'test@example.com' }
      }
    });

    renderLogin();
    
    fireEvent.change(screen.getByLabelText(/username/i), { 
      target: { value: 'testuser' } 
    });
    fireEvent.change(screen.getByLabelText(/password/i), { 
      target: { value: 'testpass' } 
    });
    
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login/', {
        username: 'testuser',
        password: 'testpass'
      });
    });
  });

  test('handles login error', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          error: { message: 'Invalid credentials' }
        }
      }
    });

    renderLogin();
    
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
