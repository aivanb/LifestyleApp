import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import FoodLoggingDashboard from '../FoodLoggingDashboard';
import api from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  getUserGoals: jest.fn(),
  getFoodLogs: jest.fn(),
  getRecentlyLoggedFoods: jest.fn(),
  createFoodLog: jest.fn(),
  deleteFoodLog: jest.fn(),
  updateFoodLog: jest.fn()
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
    api.deleteFoodLog.mockResolvedValue({ data: { success: true } });
    api.updateFoodLog.mockResolvedValue({ data: { success: true } });

    // Mock window.innerWidth for responsive testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  test('renders dashboard with goal progress', async () => {
    render(<FoodLoggingDashboard />);

    // Wait for loading to finish before interacting.
    await waitFor(() => {
      expect(screen.queryByText('Loading food logging dashboard...')).not.toBeInTheDocument();
    });

    // PC header actions are hidden by default; reveal them.
    fireEvent.click(screen.getByLabelText('Show header actions'));
    
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
      expect(screen.queryByText('Loading food logging dashboard...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Show header actions'));
    
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

    // Quick actions live in a flyout opened from the header chevron
    fireEvent.click(screen.getByTitle('Show quick actions'));
    expect(screen.getByTitle('Create Food')).toBeInTheDocument();
  });

  test('deletes a mobile food log item when swiped left', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    api.getFoodLogs.mockResolvedValue({
      data: {
        data: {
          logs: [
            {
              macro_log_id: 101,
              food_name: 'Greek Yogurt',
              servings: 2,
              date_time: '2026-03-26T08:00:00Z',
              consumed_macros: { calories: 180, protein: 20, carbohydrates: 8, fat: 4 },
              food_details: { food_group: 'dairy' }
            }
          ]
        }
      }
    });

    render(<FoodLoggingDashboard />);

    const mobileLogItem = await screen.findByTestId('mobile-food-log-item-101');
    fireEvent.touchStart(mobileLogItem, { touches: [{ clientX: 260 }] });
    fireEvent.touchMove(mobileLogItem, { touches: [{ clientX: 120 }] });
    fireEvent.touchEnd(mobileLogItem, { changedTouches: [{ clientX: 120 }] });

    await waitFor(() => {
      expect(api.deleteFoodLog).toHaveBeenCalledWith(101);
    });
  });
});
