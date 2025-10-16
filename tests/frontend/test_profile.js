import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import Profile from '../pages/Profile';
import api from '../services/api';

// Mock the API service
jest.mock('../services/api');
const mockApi = api;

// Mock user data
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  height: 175,
  birthday: '1990-01-01',
  gender: 'male',
  unit_preference: { unit_id: 1, unit_name: 'Metric' },
  activity_level: { activity_level_id: 3, activity_name: 'Moderate' }
};

const mockGoals = {
  weight_goal: 70,
  lean_mass_goal: 50,
  fat_mass_goal: 20,
  calories_goal: 2000,
  protein_goal: 150,
  fat_goal: 80,
  carbohydrates_goal: 200
};

const mockMetrics = {
  bmi: 22.5,
  bmr: 1800,
  tdee: 2500,
  waist_to_height_ratio: 0.45,
  waist_to_shoulder_ratio: 0.8,
  legs_to_height_ratio: 0.45,
  fat_mass_percentage: 15,
  lean_mass_percentage: 85,
  ffbmi: 19.1,
  fitness_rank: {
    current_rank: 'gold',
    next_rank: 'ruby',
    current_bmi: 22.5,
    bmi_to_next: 0.5
  }
};

const mockHistorical = {
  total_weight_change: -5.2,
  weekly_recommendation: -0.5,
  weight_trend: 'losing',
  weight_logs: [
    { date: '2024-01-01', weight: 75.2 },
    { date: '2024-01-08', weight: 74.8 },
    { date: '2024-01-15', weight: 74.5 }
  ]
};

const mockProfileResponse = {
  data: {
    user: mockUser,
    goals: mockGoals,
    metrics: mockMetrics,
    historical: mockHistorical
  }
};

const mockMacroCalculationResponse = {
  data: {
    calories: 1800,
    protein: 140,
    fat: 70,
    carbohydrates: 180,
    fiber: 25,
    sodium: 2300,
    warnings: ['Weight loss goal is aggressive for the timeframe']
  }
};

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Profile Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockApi.get.mockResolvedValue(mockProfileResponse);
    mockApi.put.mockResolvedValue({ data: { success: true } });
    mockApi.post.mockResolvedValue(mockMacroCalculationResponse);
  });

  test('renders profile page with user information', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('GOLD')).toBeInTheDocument();
    expect(screen.getByText('Personal Info')).toBeInTheDocument();
  });

  test('switches between tabs correctly', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Personal Info')).toBeInTheDocument();
    });

    // Click on Goals tab
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getByText('Goals & Macros')).toBeInTheDocument();

    // Click on Body Metrics tab
    fireEvent.click(screen.getByText('Body Metrics'));
    expect(screen.getByText('Body Metrics')).toBeInTheDocument();

    // Click on History tab
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText('Historical Data')).toBeInTheDocument();
  });

  test('edits personal information', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Personal Info')).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByText('Edit'));

    // Update height field
    const heightInput = screen.getByDisplayValue('175');
    fireEvent.change(heightInput, { target: { value: '180' } });

    // Save changes
    fireEvent.click(screen.getByText('Save Changes'));

    expect(mockApi.put).toHaveBeenCalledWith('/users/profile/', {
      height: '180',
      birthday: '1990-01-01',
      gender: 'male',
      unit_preference: 1,
      activity_level: 3
    });
  });

  test('calculates macros from weight goal', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Goals & Macros')).toBeInTheDocument();
    });

    // Switch to Goals tab
    fireEvent.click(screen.getByText('Goals'));

    await waitFor(() => {
      expect(screen.getByText('Calculate Macros from Weight Goal')).toBeInTheDocument();
    });

    // Enter weight goal and timeframe
    const weightInput = screen.getByLabelText('Target Weight (kg)');
    const timeframeInput = screen.getByLabelText('Timeframe (weeks)');

    fireEvent.change(weightInput, { target: { value: '65' } });
    fireEvent.change(timeframeInput, { target: { value: '12' } });

    // Click calculate button
    fireEvent.click(screen.getByText('Calculate'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/users/calculate-macros/', {
        weight_goal: 65,
        timeframe_weeks: 12
      });
    });

    // Check if calculated macros are displayed
    await waitFor(() => {
      expect(screen.getByText('1800')).toBeInTheDocument(); // Calories
      expect(screen.getByText('140g')).toBeInTheDocument(); // Protein
    });
  });

  test('applies calculated macros to goals', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Goals & Macros')).toBeInTheDocument();
    });

    // Switch to Goals tab
    fireEvent.click(screen.getByText('Goals'));

    await waitFor(() => {
      expect(screen.getByText('Calculate Macros from Weight Goal')).toBeInTheDocument();
    });

    // Enter weight goal and timeframe
    const weightInput = screen.getByLabelText('Target Weight (kg)');
    const timeframeInput = screen.getByLabelText('Timeframe (weeks)');

    fireEvent.change(weightInput, { target: { value: '65' } });
    fireEvent.change(timeframeInput, { target: { value: '12' } });

    // Click calculate button
    fireEvent.click(screen.getByText('Calculate'));

    await waitFor(() => {
      expect(screen.getByText('Apply to Goals')).toBeInTheDocument();
    });

    // Click apply button
    fireEvent.click(screen.getByText('Apply to Goals'));

    expect(mockApi.put).toHaveBeenCalledWith('/users/goals/', {
      calories_goal: 1800,
      protein_goal: 140,
      fat_goal: 70,
      carbohydrates_goal: 180,
      fiber_goal: 25,
      sodium_goal: 2300
    });
  });

  test('displays body metrics correctly', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Body Metrics')).toBeInTheDocument();
    });

    // Switch to Metrics tab
    fireEvent.click(screen.getByText('Body Metrics'));

    await waitFor(() => {
      expect(screen.getByText('22.5')).toBeInTheDocument(); // BMI
      expect(screen.getByText('1800')).toBeInTheDocument(); // BMR
      expect(screen.getByText('2500')).toBeInTheDocument(); // TDEE
    });

    // Check fitness rank display
    expect(screen.getByText('GOLD')).toBeInTheDocument();
    expect(screen.getByText('Current Rank:')).toBeInTheDocument();
  });

  test('displays historical data', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Historical Data')).toBeInTheDocument();
    });

    // Switch to History tab
    fireEvent.click(screen.getByText('History'));

    await waitFor(() => {
      expect(screen.getByText('-5.2 kg')).toBeInTheDocument(); // Total weight change
      expect(screen.getByText('-0.5 kg/week')).toBeInTheDocument(); // Weekly recommendation
      expect(screen.getByText('losing')).toBeInTheDocument(); // Weight trend
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    mockApi.get.mockRejectedValue(new Error('API Error'));

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load profile data')).toBeInTheDocument();
    });
  });

  test('validates macro calculation inputs', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Goals & Macros')).toBeInTheDocument();
    });

    // Switch to Goals tab
    fireEvent.click(screen.getByText('Goals'));

    await waitFor(() => {
      expect(screen.getByText('Calculate Macros from Weight Goal')).toBeInTheDocument();
    });

    // Try to calculate without entering values
    fireEvent.click(screen.getByText('Calculate'));

    await waitFor(() => {
      expect(screen.getByText('Please enter both weight goal and timeframe')).toBeInTheDocument();
    });
  });

  test('displays warnings for extreme weight goals', async () => {
    const mockWarningResponse = {
      data: {
        calories: 1200,
        protein: 100,
        fat: 50,
        carbohydrates: 120,
        fiber: 20,
        sodium: 2000,
        warnings: [
          'Weight loss goal is extremely aggressive for the timeframe',
          'Calorie deficit may be too large for sustainable weight loss'
        ]
      }
    };

    mockApi.post.mockResolvedValue(mockWarningResponse);

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Goals & Macros')).toBeInTheDocument();
    });

    // Switch to Goals tab
    fireEvent.click(screen.getByText('Goals'));

    await waitFor(() => {
      expect(screen.getByText('Calculate Macros from Weight Goal')).toBeInTheDocument();
    });

    // Enter extreme weight goal
    const weightInput = screen.getByLabelText('Target Weight (kg)');
    const timeframeInput = screen.getByLabelText('Timeframe (weeks)');

    fireEvent.change(weightInput, { target: { value: '50' } });
    fireEvent.change(timeframeInput, { target: { value: '4' } });

    // Click calculate button
    fireEvent.click(screen.getByText('Calculate'));

    await waitFor(() => {
      expect(screen.getByText('Warnings:')).toBeInTheDocument();
      expect(screen.getByText('Weight loss goal is extremely aggressive for the timeframe')).toBeInTheDocument();
    });
  });

  test('logout button works correctly', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    // Click logout button
    fireEvent.click(screen.getByText('Logout'));

    // Note: The actual logout functionality is tested in AuthContext tests
    // This test just ensures the button is present and clickable
  });

  test('responsive design works on mobile', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // Check that tabs are still accessible on mobile
    expect(screen.getByText('Personal Info')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Body Metrics')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });
});

describe('Profile Component Integration', () => {
  test('complete profile workflow', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // 1. Load profile data
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // 2. Edit personal information
    fireEvent.click(screen.getByText('Edit'));
    const heightInput = screen.getByDisplayValue('175');
    fireEvent.change(heightInput, { target: { value: '180' } });
    fireEvent.click(screen.getByText('Save Changes'));

    // 3. Calculate macros
    fireEvent.click(screen.getByText('Goals'));
    await waitFor(() => {
      expect(screen.getByText('Calculate Macros from Weight Goal')).toBeInTheDocument();
    });

    const weightInput = screen.getByLabelText('Target Weight (kg)');
    const timeframeInput = screen.getByLabelText('Timeframe (weeks)');
    fireEvent.change(weightInput, { target: { value: '70' } });
    fireEvent.change(timeframeInput, { target: { value: '8' } });
    fireEvent.click(screen.getByText('Calculate'));

    // 4. Apply macros to goals
    await waitFor(() => {
      expect(screen.getByText('Apply to Goals')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Apply to Goals'));

    // 5. View metrics
    fireEvent.click(screen.getByText('Body Metrics'));
    await waitFor(() => {
      expect(screen.getByText('22.5')).toBeInTheDocument();
    });

    // 6. View history
    fireEvent.click(screen.getByText('History'));
    await waitFor(() => {
      expect(screen.getByText('-5.2 kg')).toBeInTheDocument();
    });

    // Verify all API calls were made
    expect(mockApi.get).toHaveBeenCalledWith('/users/profile/');
    expect(mockApi.put).toHaveBeenCalledWith('/users/profile/', expect.any(Object));
    expect(mockApi.post).toHaveBeenCalledWith('/users/calculate-macros/', expect.any(Object));
    expect(mockApi.put).toHaveBeenCalledWith('/users/goals/', expect.any(Object));
  });
});
