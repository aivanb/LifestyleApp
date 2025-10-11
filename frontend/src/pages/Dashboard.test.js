import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Dashboard from './Dashboard';
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

const renderDashboard = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('access-token');
    // Mock the profile API call
    api.get.mockImplementation((url) => {
      if (url === '/auth/profile/') {
        return Promise.resolve({
          data: {
            data: { username: 'testuser', email: 'test@example.com' }
          }
        });
      }
      return Promise.reject(new Error('Unexpected API call'));
    });
  });

  test('renders dashboard content', async () => {
    renderDashboard();
    
    await screen.findByText('Welcome, testuser!');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
