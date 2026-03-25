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

    // getFoodLogs is called multiple times (for daily progress and streak calculation)
    // Use mockResolvedValue so it works for all calls
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

    // Default is condensed progress (PC + mobile DOM both mount; CSS hides one)
    expect(screen.getAllByTestId('progress-grid').length).toBeGreaterThanOrEqual(1);

    // Clicking the progress section expands it
    const progressGrid = screen.getAllByTestId('progress-grid')[0];
    progressGrid.parentElement.click();
    expect((await screen.findAllByTestId('expanded-progress')).length).toBeGreaterThanOrEqual(1);
  });

  test('shows food log section', async () => {
    render(<FoodLoggingDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('12am').length).toBeGreaterThanOrEqual(1);
    });
  });

  test('renders action buttons for PC layout', async () => {
    render(<FoodLoggingDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Create Food')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Create Meal')).toBeInTheDocument();
    expect(screen.getByText('Voice Logger')).toBeInTheDocument();
    expect(screen.getByText('Log Water')).toBeInTheDocument();
  });

  test('handles mobile layout when screen width is small', async () => {
    // Mock mobile width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(<FoodLoggingDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('progress-grid').length).toBeGreaterThanOrEqual(1);
    });

    // PC header actions are not mounted on mobile; icon row uses title attributes
    expect(screen.getByTitle('Create Food')).toBeInTheDocument();
  });
});
