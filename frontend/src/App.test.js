import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

// Mock the API service
jest.mock('./services/api', () => ({
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

const renderApp = () => {
  return render(<App />);
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('renders login page by default when not authenticated', () => {
    renderApp();
    
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByText('Register here')).toBeInTheDocument();
  });

  test('renders navbar', () => {
    renderApp();
    
    expect(screen.getByText('Tracking App')).toBeInTheDocument();
  });
});
