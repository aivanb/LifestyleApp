import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FoodLoggingDashboard from '../FoodLoggingDashboard';
import api from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  getUserGoals: jest.fn(),
  getFoodLogs: jest.fn(),
  getRecentlyLoggedFoods: jest.fn(),
  createFoodLog: jest.fn()
}));

// Mock the other components
jest.mock('../ProgressBar', () => ({
  ProgressGrid: ({ goals, consumed }) => (
    <div data-testid="progress-grid">
      Progress Grid - Calories: {consumed.calories || 0}/{goals.calories_goal || 0}
    </div>
  ),
  ExpandedProgressView: ({ goals, consumed, onClose }) => (
    <div data-testid="expanded-progress">
      Expanded Progress View
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

jest.mock('../FoodLogger', () => ({ onFoodLogged, onClose }) => (
  <div data-testid="food-logger">
    Food Logger
    <button onClick={onFoodLogged}>Log Food</button>
    {onClose && <button onClick={onClose}>Close</button>}
  </div>
));

jest.mock('../FoodCreator', () => ({ onFoodCreated, onClose }) => (
  <div data-testid="food-creator">
    Food Creator
    <button onClick={() => onFoodCreated({})}>Create Food</button>
    {onClose && <button onClick={onClose}>Close</button>}
  </div>
));

jest.mock('../MealCreator', () => ({ onMealCreated, onClose }) => (
  <div data-testid="meal-creator">
    Meal Creator
    <button onClick={() => onMealCreated({})}>Create Meal</button>
    {onClose && <button onClick={onClose}>Close</button>}
  </div>
));

jest.mock('../FoodChatbot', () => ({ onFoodsLogged, onClose }) => (
  <div data-testid="food-chatbot">
    Food Chatbot
    <button onClick={onFoodsLogged}>Log Foods</button>
    {onClose && <button onClick={onClose}>Close</button>}
  </div>
));

describe('FoodLoggingDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses with proper structure
    api.getUserGoals.mockResolvedValue({
      data: {
        data: {
          calories_goal: 2000,
          protein_goal: 150,
          fat_goal: 65,
          carbohydrates_goal: 250
        }
      }
    });

    api.getFoodLogs.mockResolvedValue({
      data: {
        data: {
          logs: []
        }
      }
    });

    // Mock window.innerWidth for responsive testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  test('renders dashboard with goal progress', async () => {
    render(<FoodLoggingDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Create Food')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('expanded-progress')).toBeInTheDocument();
  });

  test('shows food log section', async () => {
    render(<FoodLoggingDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No food logged today')).toBeInTheDocument();
    });
  });

  test('renders action buttons for PC layout', async () => {
    render(<FoodLoggingDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Create Food')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Create Meal')).toBeInTheDocument();
    expect(screen.getByText('AI Logger')).toBeInTheDocument();
  });

  test('handles mobile layout when screen width is small', async () => {
    // Mock mobile width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(<FoodLoggingDashboard />);
    
    // Should still render the main components
    await waitFor(() => {
      expect(screen.getByText('Create Food')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('expanded-progress')).toBeInTheDocument();
  });
});
