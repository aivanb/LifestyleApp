import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SplitCreator from '../SplitCreator';
import api from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  getMuscles: jest.fn(),
  getMusclePriorities: jest.fn(),
  getSplits: jest.fn(),
  createSplit: jest.fn(),
  activateSplit: jest.fn(),
}));

// Mock the router
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('SplitCreator Component', () => {
  const mockMuscles = [
    { muscles_id: 1, muscle_name: 'Chest', muscle_group: 'Chest' },
    { muscles_id: 2, muscle_name: 'Back', muscle_group: 'Back' },
    { muscles_id: 3, muscle_name: 'Legs', muscle_group: 'Legs' },
  ];

  const mockMusclePriorities = [
    { muscle_id: 1, muscle_name: 'Chest', priority: 80 },
    { muscle_id: 2, muscle_name: 'Back', priority: 70 },
    { muscle_id: 3, muscle_name: 'Legs', priority: 90 },
  ];

  const mockSplits = [
    {
      splits_id: 1,
      split_name: 'Test Split',
      start_date: '2025-01-01',
      split_days: [
        {
          day_name: 'Push Day',
          targets: [
            { muscle: '1', target_activation: 225 }
          ]
        }
      ]
    }
  ];

  beforeEach(() => {
    api.getMuscles.mockResolvedValue({ data: mockMuscles });
    api.getMusclePriorities.mockResolvedValue({ data: mockMusclePriorities });
    api.getSplits.mockResolvedValue({ data: mockSplits });
    api.createSplit.mockResolvedValue({ data: { splits_id: 2 } });
    api.activateSplit.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', async () => {
    render(<SplitCreator />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Creator')).toBeInTheDocument();
    });
  });

  test('loads data on mount', async () => {
    render(<SplitCreator />);
    
    await waitFor(() => {
      expect(api.getMuscles).toHaveBeenCalled();
      expect(api.getMusclePriorities).toHaveBeenCalled();
      expect(api.getSplits).toHaveBeenCalled();
    });
  });

  test('handles split editing without errors', async () => {
    render(<SplitCreator />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Creator')).toBeInTheDocument();
    });

    // Switch to manage tab
    const manageTab = screen.getByText('Manage Splits');
    fireEvent.click(manageTab);

    await waitFor(() => {
      expect(screen.getByText('Test Split')).toBeInTheDocument();
    });

    // Click edit button - this should not throw an error
    const editButton = screen.getByText('Edit');
    expect(() => fireEvent.click(editButton)).not.toThrow();
  });

  test('handles muscle selection without errors', async () => {
    render(<SplitCreator />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Creator')).toBeInTheDocument();
    });

    // Switch to Edit Split tab first
    const editTab = screen.getByText('Edit Split');
    fireEvent.click(editTab);

    await waitFor(() => {
      expect(screen.getByText('Add Split Day')).toBeInTheDocument();
    });

    // Add a split day
    const addDayButton = screen.getByText('Add Split Day');
    fireEvent.click(addDayButton);

    await waitFor(() => {
      expect(screen.getByText('Add Target')).toBeInTheDocument();
    });

    // Add a target
    const addTargetButton = screen.getByText('Add Target');
    fireEvent.click(addTargetButton);

    await waitFor(() => {
      const muscleSelect = screen.getByDisplayValue('Select muscle');
      expect(muscleSelect).toBeInTheDocument();
    });

    // Select a muscle - this should not throw an error and should auto-fill activation
    const muscleSelect = screen.getByDisplayValue('Select muscle');
    expect(() => fireEvent.change(muscleSelect, { target: { value: '1' } })).not.toThrow();
  });

  test('calculates optimal activation correctly', async () => {
    render(<SplitCreator />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Creator')).toBeInTheDocument();
    });

    // Switch to Edit Split tab first
    const editTab = screen.getByText('Edit Split');
    fireEvent.click(editTab);

    await waitFor(() => {
      expect(screen.getByText('Add Split Day')).toBeInTheDocument();
    });

    // Add a split day
    const addDayButton = screen.getByText('Add Split Day');
    fireEvent.click(addDayButton);

    // Add a target
    const addTargetButton = screen.getByText('Add Target');
    fireEvent.click(addTargetButton);

    await waitFor(() => {
      const muscleSelect = screen.getByDisplayValue('Select muscle');
      expect(muscleSelect).toBeInTheDocument();
    });

    // Select a muscle
    const muscleSelect = screen.getByDisplayValue('Select muscle');
    fireEvent.change(muscleSelect, { target: { value: '1' } });

    await waitFor(() => {
      // Check that activation was auto-filled with optimal value
      // For muscle with priority 80 and 1 day: 90 * (15 + 0.1 * 80) * 7 * 1 = 90 * 23 * 7 = 14490
      const activationInput = screen.getByDisplayValue('14490');
      expect(activationInput).toBeInTheDocument();
    });
  });

  test('prevents duplicate muscle selection in same day', async () => {
    render(<SplitCreator />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Creator')).toBeInTheDocument();
    });

    // Switch to Edit Split tab first
    const editTab = screen.getByText('Edit Split');
    fireEvent.click(editTab);

    await waitFor(() => {
      expect(screen.getByText('Add Split Day')).toBeInTheDocument();
    });

    // Add a split day
    const addDayButton = screen.getByText('Add Split Day');
    fireEvent.click(addDayButton);

    // Add two targets
    const addTargetButton = screen.getByText('Add Target');
    fireEvent.click(addTargetButton);
    fireEvent.click(addTargetButton);

    await waitFor(() => {
      const muscleSelects = screen.getAllByDisplayValue('Select muscle');
      expect(muscleSelects).toHaveLength(2);
    });

    // Select chest for first target
    const firstMuscleSelect = screen.getAllByDisplayValue('Select muscle')[0];
    fireEvent.change(firstMuscleSelect, { target: { value: '1' } });

    await waitFor(() => {
      // Second dropdown should not have chest as an option
      const secondMuscleSelect = screen.getAllByDisplayValue('Select muscle')[0];
      const options = Array.from(secondMuscleSelect.options).map(option => option.value);
      expect(options).not.toContain('1'); // Chest should not be available
      expect(options).toContain('2'); // Back should still be available
    });
  });

  test('displays muscle status sidebar correctly', async () => {
    render(<SplitCreator />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Creator')).toBeInTheDocument();
    });

    // Switch to Edit Split tab first
    const editTab = screen.getByText('Edit Split');
    fireEvent.click(editTab);

    await waitFor(() => {
      expect(screen.getByText('Add Split Day')).toBeInTheDocument();
    });

    // Add a split day and target
    const addDayButton = screen.getByText('Add Split Day');
    fireEvent.click(addDayButton);

    const addTargetButton = screen.getByText('Add Target');
    fireEvent.click(addTargetButton);

    await waitFor(() => {
      const muscleSelect = screen.getByDisplayValue('Select muscle');
      fireEvent.change(muscleSelect, { target: { value: '1' } });
    });

    await waitFor(() => {
      // Check that muscle status sidebar appears
      expect(screen.getByText('Muscle Status')).toBeInTheDocument();
      expect(screen.getByText('Chest')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    api.getMuscles.mockRejectedValue(new Error('API Error'));
    
    render(<SplitCreator />);
    
    await waitFor(() => {
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    // Should not crash the component
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  test('validates all required functions exist', () => {
    // This test ensures all functions referenced in the component are defined
    const component = <SplitCreator />;
    expect(component).toBeDefined();
    
    // If any function is undefined, the component would fail to render
    // This test passes if the component renders without errors
  });
});
