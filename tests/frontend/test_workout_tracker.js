import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import api from '../../src/services/api';

// Mock API
jest.mock('../../src/services/api', () => ({
  getWorkouts: jest.fn(),
  createWorkout: jest.fn(),
  updateWorkout: jest.fn(),
  deleteWorkout: jest.fn(),
  getMuscles: jest.fn(),
  getMusclePriorities: jest.fn(),
  updateMusclePriorities: jest.fn(),
  getSplits: jest.fn(),
  createSplit: jest.fn(),
  updateSplit: jest.fn(),
  deleteSplit: jest.fn(),
  activateSplit: jest.fn(),
  getWorkoutLogs: jest.fn(),
  createWorkoutLog: jest.fn(),
  getWorkoutStats: jest.fn(),
  getRecentlyLoggedWorkouts: jest.fn(),
  getWorkoutIcons: jest.fn(),
}));

// Mock user context
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com'
};

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
};

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider value={mockAuthContext}>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

// Mock data
const mockMuscles = [
  { muscles_id: 1, muscle_name: 'Chest', muscle_group: 'Upper Body' },
  { muscles_id: 2, muscle_name: 'Triceps', muscle_group: 'Upper Body' },
  { muscles_id: 3, muscle_name: 'Quads', muscle_group: 'Lower Body' }
];

const mockWorkouts = [
  {
    workouts_id: 1,
    workout_name: '🏋️ Bench Press',
    type: 'barbell',
    equipment_brand: 'Rogue',
    location: 'Home Gym',
    notes: 'Focus on form',
    make_public: true,
    muscles: [
      { muscle: 1, muscle_name: 'Chest', muscle_group: 'Upper Body', activation_rating: 100 },
      { muscle: 2, muscle_name: 'Triceps', muscle_group: 'Upper Body', activation_rating: 75 }
    ]
  }
];

const mockMusclePriorities = [
  {
    muscle_log_id: 1,
    muscle_name: 'Chest',
    muscle_group: 'Upper Body',
    importance: 85
  }
];

const mockSplits = [
  {
    splits_id: 1,
    split_name: 'Push/Pull/Legs',
    start_date: null,
    is_active: false,
    split_days: [
      {
        split_days_id: 1,
        day_name: 'Push Day',
        day_order: 1,
        targets: [
          { muscle: 1, muscle_name: 'Chest', muscle_group: 'Upper Body', target_activation: 225 }
        ]
      }
    ]
  }
];

const mockWorkoutIcons = ['🏋️', '💪', '🔥', '🏃', '🤸'];

describe('WorkoutAdder Component', () => {
  beforeEach(() => {
    api.getMuscles.mockResolvedValue({ data: { data: mockMuscles } });
    api.getWorkoutIcons.mockResolvedValue({ data: { data: mockWorkoutIcons } });
    api.createWorkout.mockResolvedValue({ data: { data: mockWorkouts[0] } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders workout creation form', async () => {
    const WorkoutAdder = require('../../src/components/WorkoutAdder').default;
    
    render(
      <TestWrapper>
        <WorkoutAdder />
      </TestWrapper>
    );

    expect(screen.getByText('Create New Workout')).toBeInTheDocument();
    expect(screen.getByLabelText('Workout Name:')).toBeInTheDocument();
    expect(screen.getByLabelText('Type:')).toBeInTheDocument();
    expect(screen.getByText('Muscle Activation')).toBeInTheDocument();
  });

  test('loads muscles and icons on mount', async () => {
    const WorkoutAdder = require('../../src/components/WorkoutAdder').default;
    
    render(
      <TestWrapper>
        <WorkoutAdder />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(api.getMuscles).toHaveBeenCalled();
      expect(api.getWorkoutIcons).toHaveBeenCalled();
    });
  });

  test('creates workout with valid data', async () => {
    const WorkoutAdder = require('../../src/components/WorkoutAdder').default;
    const onWorkoutAdded = jest.fn();
    
    render(
      <TestWrapper>
        <WorkoutAdder onWorkoutAdded={onWorkoutAdded} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Workout Name:')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText('Workout Name:'), {
      target: { value: 'Bench Press' }
    });

    fireEvent.change(screen.getByLabelText('Type:'), {
      target: { value: 'barbell' }
    });

    // Add muscle
    fireEvent.change(screen.getByLabelText('Select Muscle'), {
      target: { value: '1' }
    });

    fireEvent.change(screen.getByLabelText('Activation Rating'), {
      target: { value: '100' }
    });

    fireEvent.click(screen.getByRole('button', { name: /add muscle/i }));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create workout/i }));

    await waitFor(() => {
      expect(api.createWorkout).toHaveBeenCalledWith({
        workout_name: 'Bench Press',
        equipment_brand: '',
        type: 'barbell',
        location: '',
        notes: '',
        make_public: false,
        muscles: [{ muscle: 1, activation_rating: 100 }],
        emoji: ''
      });
    });
  });

  test('shows error for invalid data', async () => {
    const WorkoutAdder = require('../../src/components/WorkoutAdder').default;
    
    render(
      <TestWrapper>
        <WorkoutAdder />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create workout/i })).toBeInTheDocument();
    });

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /create workout/i }));

    await waitFor(() => {
      expect(screen.getByText('Workout name cannot be empty.')).toBeInTheDocument();
    });
  });
});

describe('MusclePriority Component', () => {
  beforeEach(() => {
    api.getMusclePriorities.mockResolvedValue({ data: { data: mockMusclePriorities } });
    api.updateMusclePriorities.mockResolvedValue({ data: { detail: 'Success' } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders muscle priority interface', async () => {
    const MusclePriority = require('../../src/components/MusclePriority').default;
    
    render(
      <TestWrapper>
        <MusclePriority />
      </TestWrapper>
    );

    expect(screen.getByText('Muscle Priority')).toBeInTheDocument();
    expect(screen.getByText('Muscle Priority Explanation')).toBeInTheDocument();
  });

  test('loads muscle priorities on mount', async () => {
    const MusclePriority = require('../../src/components/MusclePriority').default;
    
    render(
      <TestWrapper>
        <MusclePriority />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(api.getMusclePriorities).toHaveBeenCalled();
    });
  });

  test('updates muscle priorities', async () => {
    const MusclePriority = require('../../src/components/MusclePriority').default;
    
    render(
      <TestWrapper>
        <MusclePriority />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update priorities/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /update priorities/i }));

    await waitFor(() => {
      expect(api.updateMusclePriorities).toHaveBeenCalledWith({
        muscle_logs: [
          { muscle_name: 'Chest', importance: 85 }
        ]
      });
    });
  });

  test('resets priorities to default', async () => {
    const MusclePriority = require('../../src/components/MusclePriority').default;
    
    render(
      <TestWrapper>
        <MusclePriority />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset to default/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /reset to default/i }));

    // Check that priority values are reset to 80
    await waitFor(() => {
      const sliders = screen.getAllByRole('slider');
      sliders.forEach(slider => {
        expect(slider.value).toBe('80');
      });
    });
  });
});

describe('SplitCreator Component', () => {
  beforeEach(() => {
    api.getSplits.mockResolvedValue({ data: { data: mockSplits } });
    api.getMuscles.mockResolvedValue({ data: { data: mockMuscles } });
    api.getMusclePriorities.mockResolvedValue({ data: { data: mockMusclePriorities } });
    api.createSplit.mockResolvedValue({ data: { data: mockSplits[0] } });
    api.activateSplit.mockResolvedValue({ data: { data: mockSplits[0] } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders split creator interface', async () => {
    const SplitCreator = require('../../src/components/SplitCreator').default;
    
    render(
      <TestWrapper>
        <SplitCreator />
      </TestWrapper>
    );

    expect(screen.getByText('Split Creator')).toBeInTheDocument();
    expect(screen.getByText('Your Splits')).toBeInTheDocument();
  });

  test('loads splits and muscles on mount', async () => {
    const SplitCreator = require('../../src/components/SplitCreator').default;
    
    render(
      <TestWrapper>
        <SplitCreator />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(api.getSplits).toHaveBeenCalled();
      expect(api.getMuscles).toHaveBeenCalled();
      expect(api.getMusclePriorities).toHaveBeenCalled();
    });
  });

  test('creates new split', async () => {
    const SplitCreator = require('../../src/components/SplitCreator').default;
    
    render(
      <TestWrapper>
        <SplitCreator />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Split Name:')).toBeInTheDocument();
    });

    // Fill split name
    fireEvent.change(screen.getByLabelText('Split Name:'), {
      target: { value: 'Upper/Lower' }
    });

    // Add day
    fireEvent.change(screen.getByPlaceholderText('Day name (e.g., Push Day)'), {
      target: { value: 'Upper Day' }
    });

    fireEvent.click(screen.getByRole('button', { name: /add day/i }));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create split/i }));

    await waitFor(() => {
      expect(api.createSplit).toHaveBeenCalled();
    });
  });

  test('activates split', async () => {
    const SplitCreator = require('../../src/components/SplitCreator').default;
    
    render(
      <TestWrapper>
        <SplitCreator />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /activate/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /activate/i }));

    await waitFor(() => {
      expect(api.activateSplit).toHaveBeenCalledWith(1, expect.any(String));
    });
  });
});

describe('WorkoutLogger Component', () => {
  beforeEach(() => {
    api.getWorkouts.mockResolvedValue({ data: { data: mockWorkouts } });
    api.getRecentlyLoggedWorkouts.mockResolvedValue({ data: { data: [] } });
    api.createWorkoutLog.mockResolvedValue({ data: { data: {} } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders workout logger interface', async () => {
    const WorkoutLogger = require('../../src/components/WorkoutLogger').default;
    
    render(
      <TestWrapper>
        <WorkoutLogger selectedDate="2024-01-01" />
      </TestWrapper>
    );

    expect(screen.getByText('Workout Logger')).toBeInTheDocument();
    expect(screen.getByText('Working')).toBeInTheDocument();
    expect(screen.getByText('Resting')).toBeInTheDocument();
  });

  test('loads workouts on mount', async () => {
    const WorkoutLogger = require('../../src/components/WorkoutLogger').default;
    
    render(
      <TestWrapper>
        <WorkoutLogger selectedDate="2024-01-01" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(api.getWorkouts).toHaveBeenCalled();
      expect(api.getRecentlyLoggedWorkouts).toHaveBeenCalled();
    });
  });

  test('starts and stops work timer', async () => {
    const WorkoutLogger = require('../../src/components/WorkoutLogger').default;
    
    render(
      <TestWrapper>
        <WorkoutLogger selectedDate="2024-01-01" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start work/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /start work/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop work/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /stop work/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start work/i })).toBeInTheDocument();
    });
  });

  test('logs workout with valid data', async () => {
    const WorkoutLogger = require('../../src/components/WorkoutLogger').default;
    
    render(
      <TestWrapper>
        <WorkoutLogger selectedDate="2024-01-01" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });

    // Select workout
    fireEvent.click(screen.getByText('Bench Press'));

    // Fill form
    fireEvent.change(screen.getByLabelText('Weight (lbs/kg):'), {
      target: { value: '135' }
    });

    fireEvent.change(screen.getByLabelText('Reps:'), {
      target: { value: '10' }
    });

    fireEvent.change(screen.getByLabelText('RIR:'), {
      target: { value: '2' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /log workout/i }));

    await waitFor(() => {
      expect(api.createWorkoutLog).toHaveBeenCalledWith({
        workout: 1,
        weight: 135,
        reps: 10,
        rir: 2,
        attributes: null,
        rest_time: null,
        date_time: expect.any(String)
      });
    });
  });
});

describe('WorkoutLog Component', () => {
  const mockWorkoutLogs = [
    {
      workout_log_id: 1,
      workout_name: 'Bench Press',
      type: 'barbell',
      weight: 135,
      reps: 10,
      rir: 2,
      date_time: '2024-01-01T10:00:00Z'
    }
  ];

  const mockWorkoutStats = {
    total_workouts: 1,
    total_sets: 1,
    total_weight_lifted: 1350,
    total_reps: 10,
    total_rir: 2
  };

  beforeEach(() => {
    api.getWorkoutLogs.mockResolvedValue({ data: { data: mockWorkoutLogs } });
    api.getWorkoutStats.mockResolvedValue({ data: { data: mockWorkoutStats } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders workout log interface', async () => {
    const WorkoutLog = require('../../src/components/WorkoutLog').default;
    
    render(
      <TestWrapper>
        <WorkoutLog selectedDate="2024-01-01" onDateChange={jest.fn()} />
      </TestWrapper>
    );

    expect(screen.getByText('Workout Log')).toBeInTheDocument();
    expect(screen.getByLabelText('Date:')).toBeInTheDocument();
  });

  test('loads workout logs and stats on mount', async () => {
    const WorkoutLog = require('../../src/components/WorkoutLog').default;
    
    render(
      <TestWrapper>
        <WorkoutLog selectedDate="2024-01-01" onDateChange={jest.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(api.getWorkoutLogs).toHaveBeenCalledWith({
        date_from: '2024-01-01',
        date_to: '2024-01-01'
      });
      expect(api.getWorkoutStats).toHaveBeenCalled();
    });
  });

  test('displays workout logs for selected date', async () => {
    const WorkoutLog = require('../../src/components/WorkoutLog').default;
    
    render(
      <TestWrapper>
        <WorkoutLog selectedDate="2024-01-01" onDateChange={jest.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Workouts Logged on 2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
      expect(screen.getByText('135 lbs × 10 reps')).toBeInTheDocument();
    });
  });

  test('displays workout stats', async () => {
    const WorkoutLog = require('../../src/components/WorkoutLog').default;
    
    render(
      <TestWrapper>
        <WorkoutLog selectedDate="2024-01-01" onDateChange={jest.fn()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Total sets
      expect(screen.getByText('1350')).toBeInTheDocument(); // Total weight lifted
      expect(screen.getByText('10')).toBeInTheDocument(); // Total reps
      expect(screen.getByText('2')).toBeInTheDocument(); // Total RIR
    });
  });

  test('handles date change', async () => {
    const onDateChange = jest.fn();
    const WorkoutLog = require('../../src/components/WorkoutLog').default;
    
    render(
      <TestWrapper>
        <WorkoutLog selectedDate="2024-01-01" onDateChange={onDateChange} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Date:'), {
      target: { value: '2024-01-02' }
    });

    expect(onDateChange).toHaveBeenCalledWith('2024-01-02');
  });
});

describe('WorkoutTracker Page', () => {
  test('renders workout tracker page', () => {
    const WorkoutTracker = require('../../src/pages/WorkoutTracker').default;
    
    render(
      <TestWrapper>
        <WorkoutTracker />
      </TestWrapper>
    );

    expect(screen.getByText('Workout Tracker')).toBeInTheDocument();
    expect(screen.getByText('Muscle Priority')).toBeInTheDocument();
    expect(screen.getByText('Workout Adder')).toBeInTheDocument();
    expect(screen.getByText('Split Creator')).toBeInTheDocument();
    expect(screen.getByText('Workout Logger')).toBeInTheDocument();
    expect(screen.getByText('Workout Log')).toBeInTheDocument();
  });

  test('switches between tabs', () => {
    const WorkoutTracker = require('../../src/pages/WorkoutTracker').default;
    
    render(
      <TestWrapper>
        <WorkoutTracker />
      </TestWrapper>
    );

    // Default tab should be muscle priority
    expect(screen.getByText('Muscle Priority')).toBeInTheDocument();

    // Switch to workout adder
    fireEvent.click(screen.getByText('Workout Adder'));
    expect(screen.getByText('Create New Workout')).toBeInTheDocument();

    // Switch to split creator
    fireEvent.click(screen.getByText('Split Creator'));
    expect(screen.getByText('Split Creator')).toBeInTheDocument();

    // Switch to workout logger
    fireEvent.click(screen.getByText('Workout Logger'));
    expect(screen.getByText('Workout Logger')).toBeInTheDocument();

    // Switch to workout log
    fireEvent.click(screen.getByText('Workout Log'));
    expect(screen.getByText('Workout Log')).toBeInTheDocument();
  });
});
