import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import OpenAI from './OpenAI';
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

const renderOpenAI = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <OpenAI />
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('OpenAI Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('access-token');
    
    // Mock API calls based on URL
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
    
    // Mock usage stats
    api.getUsageStats.mockResolvedValueOnce({
      data: {
        data: {
          total_tokens: 0,
          total_cost: 0,
          total_requests: 0,
          successful_requests: 0,
          success_rate: 0
        }
      }
    });
  });

  test('renders OpenAI integration page', async () => {
    renderOpenAI();
    
    await screen.findByText('OpenAI Integration');
    expect(screen.getByLabelText(/your prompt/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send prompt/i })).toBeInTheDocument();
  });

  test('allows user to input prompt', () => {
    renderOpenAI();
    
    const promptInput = screen.getByLabelText(/your prompt/i);
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });
    
    expect(promptInput.value).toBe('Test prompt');
  });

  test('handles successful prompt submission', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        data: {
          response: 'Test AI response',
          tokens_used: 15,
          cost: 0.002,
          response_time: 2.1
        }
      }
    });

    renderOpenAI();
    
    const promptInput = screen.getByLabelText(/your prompt/i);
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });
    
    // Submit the form instead of just clicking the button
    const form = promptInput.closest('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/openai/prompt/', {
        prompt: 'Test prompt'
      });
    });
  });

  test('handles prompt submission error', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          error: { message: 'API rate limit exceeded' }
        }
      }
    });

    renderOpenAI();
    
    const promptInput = screen.getByLabelText(/your prompt/i);
    fireEvent.change(promptInput, { target: { value: 'Test prompt' } });
    
    // Submit the form instead of just clicking the button
    const form = promptInput.closest('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument();
    });
  });
});
