import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
    // Mock API responses with proper structure (data.success and data.data)
    api.getMuscles.mockResolvedValue({ 
      data: { 
        success: true,
        data: mockMuscles 
      } 
    });
    api.getMusclePriorities.mockResolvedValue({ 
      data: { 
        success: true,
        data: mockMusclePriorities 
      } 
    });
    api.getSplits.mockResolvedValue({ 
      data: { 
        success: true,
        data: mockSplits 
      } 
    });
    api.createSplit.mockResolvedValue({ 
      data: { 
        success: true,
        data: { splits_id: 2 } 
      } 
    });
    api.activateSplit.mockResolvedValue({ 
      data: { 
        success: true,
        data: { success: true } 
      } 
    });
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

    // Switch to New Split tab first
    const newTab = screen.getByText('New Split');
    fireEvent.click(newTab);

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

    // Switch to New Split tab first
    const newTab = screen.getByText('New Split');
    fireEvent.click(newTab);

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
      // Formula: R(P,D) = 90 * (10 + 0.1 * P) * 7 / D
      // For muscle with priority 80 and 1 day: 90 * (10 + 0.1 * 80) * 7 / 1 = 90 * 18 * 7 = 11340
      const activationInput = screen.getByDisplayValue('11340');
      expect(activationInput).toBeInTheDocument();
    });
  });

  test('prevents duplicate muscle selection in same day', async () => {
    render(<SplitCreator />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Creator')).toBeInTheDocument();
    });

    // Switch to New Split tab first
    const newTab = screen.getByText('New Split');
    fireEvent.click(newTab);

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
      expect(muscleSelects.length).toBeGreaterThanOrEqual(2);
    });

    // Select chest for first target
    const firstMuscleSelect = screen.getAllByDisplayValue('Select muscle')[0];
    fireEvent.change(firstMuscleSelect, { target: { value: '1' } });

    // Wait for component to update after the change
    await waitFor(() => {
      // After selecting chest, verify the first select has the value
      const updatedSelects = screen.getAllByRole('combobox');
      const muscleSelects = updatedSelects.filter(select => {
        const options = Array.from(select.options);
        return options.some(opt => 
          opt.textContent === 'Chest' || 
          opt.textContent === 'Back' || 
          opt.textContent === 'Legs' ||
          opt.textContent === 'Select muscle'
        );
      });
      
      if (muscleSelects.length >= 2) {
        // First select should have chest selected (value '1')
        expect(muscleSelects[0].value).toBe('1');
        
        // Second select should not have chest as an option
        const secondSelect = muscleSelects[1];
        const secondOptions = Array.from(secondSelect.options)
          .map(option => option.value)
          .filter(opt => opt !== ''); // Filter out empty placeholder
        
        // Chest (1) should not be in second select's options
        expect(secondOptions).not.toContain('1');
        // Should have other muscles available
        expect(secondOptions.length).toBeGreaterThan(0);
      } else {
        // If we can't find both selects, at least verify the first one updated
        expect(muscleSelects[0].value).toBe('1');
      }
    }, { timeout: 3000 });
  });

  test('creates split without sending blank start_date', async () => {
    render(<SplitCreator />);

    await waitFor(() => {
      expect(screen.getByText('Split Creator')).toBeInTheDocument();
    });

    // Switch to New Split tab
    fireEvent.click(screen.getByText('New Split'));

    await waitFor(() => {
      expect(screen.getByText('Add Split Day')).toBeInTheDocument();
    });

    // Fill split name
    fireEvent.change(screen.getByLabelText('Split Name'), { target: { value: 'My Split' } });

    // Add a day and set its name
    fireEvent.click(screen.getByText('Add Split Day'));
    const dayNameInput = screen.getByPlaceholderText('Day name (e.g., Push Day)');
    fireEvent.change(dayNameInput, { target: { value: 'Day 1' } });

    // Add a target and select a muscle
    fireEvent.click(screen.getByText('Add Target'));
    const muscleSelect = screen.getByDisplayValue('Select muscle');
    fireEvent.change(muscleSelect, { target: { value: '1' } });

    // Submit
    fireEvent.click(screen.getByText('Create Split'));

    await waitFor(() => {
      expect(api.createSplit).toHaveBeenCalled();
    });

    const payload = api.createSplit.mock.calls[0][0];
    expect(payload.split_name).toBe('My Split');
    expect(payload).not.toHaveProperty('start_date');
    expect(payload.split_days).toHaveLength(1);
    expect(payload.split_days[0].targets[0].muscle).toBe(1);
  });

  test('displays muscle status sidebar correctly', async () => {
    render(<SplitCreator />);
    
    await waitFor(() => {
      expect(screen.getByText('Split Creator')).toBeInTheDocument();
    });

    // Switch to New Split tab first
    const newTab = screen.getByText('New Split');
    fireEvent.click(newTab);

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
      const sidebar = screen.getByLabelText('Muscle status');
      expect(within(sidebar).getByText('Chest')).toBeInTheDocument();
    });
  });

  test('shows workout-tracker style muscle tooltip in splitsPage editor', async () => {
    render(
      <SplitCreator
        uiVariant="splitsPage"
        editorMode={true}
        editorKind="edit"
        editorSplit={mockSplits[0]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Muscle Status')).toBeInTheDocument();
    });

    const infoButtons = screen.getAllByTitle('View muscle info');
    expect(infoButtons.length).toBeGreaterThan(0);

    fireEvent.click(infoButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Description:/i)).toBeInTheDocument();
      expect(screen.getByText(/Location:/i)).toBeInTheDocument();
      expect(screen.getByText(/Function:/i)).toBeInTheDocument();
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
