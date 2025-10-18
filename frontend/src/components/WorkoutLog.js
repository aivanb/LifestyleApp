import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { CalendarIcon, ChartBarIcon, ClockIcon, PlayIcon, PauseIcon, PlusIcon } from '@heroicons/react/24/outline';

const WorkoutLog = ({ selectedDate, onDateChange, onWorkoutLogged, refreshTrigger }) => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [workoutStats, setWorkoutStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSplit, setActiveSplit] = useState(null);
  const [currentSplitDay, setCurrentSplitDay] = useState(null);
  const [muscleProgress, setMuscleProgress] = useState({});
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  
  // Timer state
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  
  // Add Set Modal state
  const [showAddSetModal, setShowAddSetModal] = useState(false);
  const [selectedWorkoutForSet, setSelectedWorkoutForSet] = useState(null);
  const [setData, setSetData] = useState({
    weight: '',
    reps: '',
    rir: '',
    attributes: [],
    attributeInputs: {},
    rest_time: ''
  });

  const loadWorkoutLogs = useCallback(async () => {
    try {
      const response = await api.getWorkoutLogs({ 
        date_from: selectedDate, 
        date_to: selectedDate 
      });
      setWorkoutLogs(response.data.data || []);
    } catch (err) {
      console.error('Failed to load workout logs:', err);
      setError('Failed to load workout logs');
    }
  }, [selectedDate]);

  const loadWorkoutStats = useCallback(async () => {
    try {
      const response = await api.getWorkoutStats();
      setWorkoutStats(response.data.data || {});
    } catch (err) {
      console.error('Failed to load workout stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateMuscleProgress = useCallback((splitDay, logs) => {
    if (!splitDay || !splitDay.targets) {
      setMuscleProgress({});
      return;
    }

    const progress = {};
    splitDay.targets.forEach(target => {
      const muscleId = target.muscle;
      const targetActivation = target.target_activation;
      
      // Calculate current activation from workout logs
      const currentActivation = logs
        .filter(log => log.workout && log.workout.muscles)
        .reduce((total, log) => {
          const muscleActivation = log.workout.muscles.find(
            wm => wm.muscle === muscleId
          );
          if (muscleActivation) {
            return total + (muscleActivation.activation_rating * (log.reps || 1));
          }
          return total;
        }, 0);
      
      const percentage = targetActivation > 0 ? (currentActivation / targetActivation) * 100 : 0;
      
      progress[muscleId] = {
        current: currentActivation,
        target: targetActivation,
        percentage: Math.min(percentage, 100),
        muscleName: target.muscle_name
      };
    });
    
    setMuscleProgress(progress);
  }, []);

  const loadActiveSplit = useCallback(async () => {
    try {
      const response = await api.getCurrentSplitDay(selectedDate);
      if (response.data.success) {
        const { active_split, current_split_day } = response.data.data;
        setActiveSplit(active_split);
        setCurrentSplitDay(current_split_day);
      }
    } catch (err) {
      console.error('Failed to load active split:', err);
    }
  }, [selectedDate]);

  const loadRecentWorkouts = useCallback(async () => {
    try {
      const response = await api.getRecentlyLoggedWorkouts();
      setRecentWorkouts(response.data.data || []);
    } catch (err) {
      console.error('Failed to load recent workouts:', err);
    }
  }, []);

  const addSetToWorkout = async (workoutId) => {
    try {
      // Find the workout and most recent log for this workout
      const workout = workoutLogs.find(log => log.workout.workouts_id === workoutId)?.workout;
      const recentLog = workoutLogs
        .filter(log => log.workout.workouts_id === workoutId)
        .sort((a, b) => new Date(b.date_time) - new Date(a.date_time))[0];
      
      if (workout && recentLog) {
        // Set up the modal with the workout and recent log data
        setSelectedWorkoutForSet(workout);
        setSetData({
          weight: recentLog.weight || '',
          reps: recentLog.reps || '',
          rir: recentLog.rir || '',
          attributes: recentLog.attributes || [],
          attributeInputs: recentLog.attributeInputs || {},
          rest_time: recentLog.rest_time || ''
        });
        setShowAddSetModal(true);
      }
    } catch (err) {
      console.error('Failed to open add set modal:', err);
      setError('Failed to open add set modal');
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#10B981'; // Green
    if (percentage >= 75) return '#34D399'; // Light green
    if (percentage >= 50) return '#FBBF24'; // Yellow
    if (percentage >= 25) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  // Modal functions
  const closeAddSetModal = () => {
    setShowAddSetModal(false);
    setSelectedWorkoutForSet(null);
    setSetData({
      weight: '',
      reps: '',
      rir: '',
      attributes: [],
      attributeInputs: {},
      rest_time: ''
    });
  };

  const handleSetDataChange = (field, value) => {
    setSetData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAttributeToggle = (attribute) => {
    setSetData(prev => ({
      ...prev,
      attributes: prev.attributes.includes(attribute)
        ? prev.attributes.filter(attr => attr !== attribute)
        : [...prev.attributes, attribute]
    }));
  };

  const handleAttributeInputChange = (attributeKey, inputKey, value) => {
    setSetData(prev => ({
      ...prev,
      attributeInputs: {
        ...prev.attributeInputs,
        [`${attributeKey}_${inputKey}`]: value
      }
    }));
  };

  const submitAddSet = async () => {
    try {
      const logData = {
        workout: selectedWorkoutForSet.workouts_id,
        weight: setData.weight ? parseFloat(setData.weight) : null,
        reps: setData.reps ? parseInt(setData.reps) : null,
        rir: setData.rir ? parseInt(setData.rir) : null,
        attributes: setData.attributes,
        attributeInputs: setData.attributeInputs,
        rest_time: setData.rest_time ? parseInt(setData.rest_time) : null,
        date_time: selectedDate ? `${selectedDate}T${new Date().toTimeString().split(' ')[0]}` : new Date().toISOString()
      };

      const response = await api.logWorkout(logData);
      if (response.data.success) {
        // Reload data
        await loadWorkoutLogs();
        await loadWorkoutStats();
        if (onWorkoutLogged) onWorkoutLogged();
        closeAddSetModal();
      }
    } catch (err) {
      console.error('Failed to add set:', err);
      setError('Failed to add set');
    }
  };

  // Attribute options for the modal
  const attributeOptions = [
    { 
      key: 'dropset', 
      label: 'Dropset', 
      description: 'Reduce weight and continue reps',
      hasInput: true,
      inputs: [
        { key: 'weight', label: 'Dropset Weight (lbs)', type: 'number', step: '0.5' },
        { key: 'reps', label: 'Dropset Reps', type: 'number', step: '1' }
      ]
    },
    { 
      key: 'assisted', 
      label: 'Assisted', 
      description: 'Get help with the movement',
      hasInput: true,
      inputs: [
        { key: 'reps', label: 'Assisted Reps', type: 'number', step: '1' }
      ]
    },
    { 
      key: 'partial', 
      label: 'Partial', 
      description: 'Incomplete range of motion',
      hasInput: true,
      inputs: [
        { key: 'reps', label: 'Partial Reps', type: 'number', step: '1' }
      ]
    },
    { 
      key: 'pause', 
      label: 'Pause', 
      description: 'Hold at bottom/top position',
      hasInput: true,
      inputs: [
        { key: 'pause_time', label: 'Pause Time (seconds)', type: 'number', step: '0.5', min: '0' },
        { key: 'reps', label: 'Pause Reps', type: 'number', step: '1' }
      ]
    },
    { 
      key: 'negatives', 
      label: 'Negatives', 
      description: 'Slow controlled lowering',
      hasInput: true,
      inputs: [
        { key: 'reps', label: 'Negative Reps', type: 'number', step: '1' }
      ]
    }
  ];

  const groupWorkoutsByType = (logs) => {
    const grouped = {};
    logs.forEach(log => {
      const workoutId = log.workout.workouts_id;
      if (!grouped[workoutId]) {
        grouped[workoutId] = {
          workout: log.workout,
          sets: []
        };
      }
      grouped[workoutId].sets.push(log);
    });
    return Object.values(grouped);
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadWorkoutLogs(),
        loadWorkoutStats(),
        loadActiveSplit(),
        loadRecentWorkouts()
      ]);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (currentSplitDay && workoutLogs.length > 0) {
      calculateMuscleProgress(currentSplitDay, workoutLogs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSplitDay, workoutLogs]);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      const refreshData = async () => {
        await Promise.all([
          loadWorkoutLogs(),
          loadWorkoutStats(),
          loadActiveSplit(),
          loadRecentWorkouts()
        ]);
      };
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Timer functions
  const startTimer = () => {
    if (!isTimerRunning) {
      setIsTimerRunning(true);
      const interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    }
  };

  const pauseTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimer(0);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-8" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>Loading...</div>;
  }

  const groupedWorkouts = groupWorkoutsByType(workoutLogs);

  return (
    <div className="form-container">
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-bold)' }}>
        Workout Log
      </h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {/* Date Selection */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <CalendarIcon 
            className="h-4 w-4"
            style={{
              width: '16px',
              height: '16px',
              minWidth: '16px',
              minHeight: '16px',
              color: 'var(--text-secondary)'
            }}
          />
          <label htmlFor="date" className="form-label" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
            Date:
          </label>
        </div>
        <input
          type="date"
          id="date"
          className="form-input w-48"
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-normal)',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            padding: 'var(--spacing-sm) var(--spacing-md)'
          }}
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {/* Timer */}
      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClockIcon 
              className="h-5 w-5"
              style={{
                width: '20px',
                height: '20px',
                minWidth: '20px',
                minHeight: '20px',
                color: 'var(--accent-color)'
              }}
            />
            <span className="text-2xl font-mono font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
              {formatTime(timer)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {!isTimerRunning ? (
              <button
                onClick={startTimer}
                className="btn btn-primary flex items-center space-x-1 px-3 py-2"
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--text-on-primary)',
                  backgroundColor: 'var(--accent-color)',
                  border: '1px solid var(--accent-color)',
                  borderRadius: 'var(--border-radius)',
                  padding: 'var(--spacing-xs) var(--spacing-sm)'
                }}
              >
                <PlayIcon 
                  className="h-4 w-4"
                  style={{
                    width: '16px',
                    height: '16px',
                    minWidth: '16px',
                    minHeight: '16px'
                  }}
                />
                <span>Start</span>
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="btn btn-secondary flex items-center space-x-1 px-3 py-2"
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  padding: 'var(--spacing-xs) var(--spacing-sm)'
                }}
              >
                <PauseIcon 
                  className="h-4 w-4"
                  style={{
                    width: '16px',
                    height: '16px',
                    minWidth: '16px',
                    minHeight: '16px'
                  }}
                />
                <span>Pause</span>
              </button>
            )}
            <button
              onClick={resetTimer}
              className="btn btn-secondary px-3 py-2"
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-normal)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                padding: 'var(--spacing-xs) var(--spacing-sm)'
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Active Split and Current Day Info */}
      {activeSplit && (
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
            Active Split: {activeSplit.split_name}
          </h3>
          {currentSplitDay ? (
            <>
              <p className="text-md font-medium mb-3" style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-primary)' }}>
                Today's Workout: {currentSplitDay.day_name}
              </p>
              <div className="mt-3 space-y-2">
                {currentSplitDay.targets.map(target => {
                  const progress = muscleProgress[target.muscle] || {};
                  const percentage = progress.percentage || 0;
                  const progressColor = getProgressColor(percentage);

                  return (
                    <div key={target.muscle} className="flex items-center space-x-2">
                      <span className="text-sm font-medium w-32" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                        {target.muscle_name}
                      </span>
                      <div className="flex-1 rounded-full h-2.5" style={{ backgroundColor: 'var(--bg-primary)' }}>
                        <div 
                          className="h-2.5 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${Math.min(100, percentage)}%`,
                            backgroundColor: progressColor
                          }}
                        ></div>
                      </div>
                      <span className="text-xs w-20 text-right" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                        {Math.round(progress.current || 0)} / {target.target_activation}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
              No specific workout day for today in this split.
            </p>
          )}
        </div>
      )}

      {/* Workout Logs for Selected Date */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
          Workouts Logged on {selectedDate}
        </h3>
        {groupedWorkouts.length > 0 ? (
          <div className="space-y-4">
            {groupedWorkouts.map(group => (
              <div key={group.workout.workouts_id} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-xl mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-bold)' }}>
                      {group.workout.workout_name}
                    </h4>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                      {group.workout.type} • {group.sets.length} set{group.sets.length !== 1 ? 's' : ''}
                    </p>
                    {group.workout.muscles && group.workout.muscles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {group.workout.muscles.map(muscle => (
                          <span key={muscle.muscle} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)', border: '1px solid var(--border-color)' }}>
                            {muscle.muscle_name} ({muscle.activation_rating})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => addSetToWorkout(group.workout.workouts_id)}
                    className="btn btn-primary flex items-center space-x-1 px-3 py-2"
                    style={{
                      fontFamily: 'var(--font-primary)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-weight-normal)',
                      color: 'var(--text-on-primary)',
                      backgroundColor: 'var(--accent-color)',
                      border: '1px solid var(--accent-color)',
                      borderRadius: 'var(--border-radius)',
                      padding: 'var(--spacing-xs) var(--spacing-sm)'
                    }}
                    title="Add another set with same parameters"
                  >
                    <PlusIcon 
                      className="h-4 w-4"
                      style={{
                        width: '16px',
                        height: '16px',
                        minWidth: '16px',
                        minHeight: '16px'
                      }}
                    />
                    <span>Add Set</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {group.sets.map((set, index) => (
                    <div key={set.workout_log_id} className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                      <div className="flex items-center space-x-4 flex-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                          Set {index + 1}
                        </span>
                        <span className="text-lg font-bold px-2 py-1 rounded" style={{ 
                          color: 'var(--text-primary)', 
                          fontFamily: 'var(--font-primary)', 
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          {group.workout.workout_name}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                          {set.weight} lbs × {set.reps} reps
                        </span>
                        {set.rir && (
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                            RIR: {set.rir}
                          </span>
                        )}
                        {set.attributes && set.attributes.length > 0 && (
                          <div className="flex space-x-1">
                            {set.attributes.map(attr => (
                              <span key={attr} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-primary)', fontFamily: 'var(--font-primary)' }}>
                                {attr}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                          {new Date(set.date_time).toLocaleTimeString()}
                        </span>
                      </div>
                      <button
                        onClick={() => addSetToWorkout(group.workout.workouts_id)}
                        className="btn btn-primary flex items-center space-x-1 px-2 py-1 ml-2"
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-normal)',
                          color: 'var(--text-on-primary)',
                          backgroundColor: 'var(--accent-color)',
                          border: '1px solid var(--accent-color)',
                          borderRadius: 'var(--border-radius)',
                          padding: 'var(--spacing-xs)'
                        }}
                        title="Add another set with same parameters"
                      >
                        <PlusIcon 
                          className="h-3 w-3"
                          style={{
                            width: '12px',
                            height: '12px',
                            minWidth: '12px',
                            minHeight: '12px'
                          }}
                        />
                        <span>Add Set</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
            No workouts logged for this date.
          </p>
        )}
      </div>

      {/* Workout Stats */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
          Today's Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <ChartBarIcon 
              className="h-6 w-6 mx-auto mb-2"
              style={{
                width: '24px',
                height: '24px',
                minWidth: '24px',
                minHeight: '24px',
                color: 'var(--accent-color)'
              }}
            />
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
              {workoutStats.total_sets || 0}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
              Total Sets
            </div>
          </div>
          
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
              {workoutStats.total_weight_lifted || 0}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
              Weight Lifted (lbs)
            </div>
          </div>
          
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
              {workoutStats.total_reps || 0}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
              Total Reps
            </div>
          </div>
          
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
              {workoutStats.total_rir || 0}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
              Total RIR
            </div>
          </div>
        </div>
      </div>

      {/* Recent Workouts Quick Add */}
      {recentWorkouts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
            Quick Add Recent Workouts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentWorkouts.slice(0, 4).map(workout => (
              <button
                key={workout.workout_id}
                className="p-3 rounded-lg text-left transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  padding: 'var(--spacing-sm)'
                }}
                onClick={() => addSetToWorkout(workout.workout_id)}
              >
                <div className="font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                  {workout.workout_name}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                  Last: {workout.last_weight} lbs × {workout.last_reps} reps
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Set Modal */}
      {showAddSetModal && selectedWorkoutForSet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                Add Set - {selectedWorkoutForSet.workout_name}
              </h3>
              <button
                onClick={closeAddSetModal}
                className="text-gray-500 hover:text-gray-700"
                style={{ color: 'var(--text-tertiary)' }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Weight */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={setData.weight}
                  onChange={(e) => handleSetDataChange('weight', e.target.value)}
                  className="w-full p-2 border rounded"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-primary)',
                    borderRadius: 'var(--border-radius)'
                  }}
                />
              </div>

              {/* Reps */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                  Reps
                </label>
                <input
                  type="number"
                  step="1"
                  value={setData.reps}
                  onChange={(e) => handleSetDataChange('reps', e.target.value)}
                  className="w-full p-2 border rounded"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-primary)',
                    borderRadius: 'var(--border-radius)'
                  }}
                />
              </div>

              {/* RIR */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                  RIR (Reps in Reserve)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="10"
                  value={setData.rir}
                  onChange={(e) => handleSetDataChange('rir', e.target.value)}
                  className="w-full p-2 border rounded"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-primary)',
                    borderRadius: 'var(--border-radius)'
                  }}
                />
              </div>

              {/* Rest Time */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                  Rest Time (seconds)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={setData.rest_time}
                  onChange={(e) => handleSetDataChange('rest_time', e.target.value)}
                  className="w-full p-2 border rounded"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-primary)',
                    borderRadius: 'var(--border-radius)'
                  }}
                />
              </div>

              {/* Attributes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                  Attributes
                </label>
                <div className="space-y-2">
                  {attributeOptions.map(attr => (
                    <div key={attr.key}>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={setData.attributes.includes(attr.key)}
                          onChange={() => handleAttributeToggle(attr.key)}
                          className="rounded"
                          style={{ accentColor: 'var(--accent-color)' }}
                        />
                        <span className="text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                          {attr.label}
                        </span>
                      </label>
                      {setData.attributes.includes(attr.key) && attr.hasInput && (
                        <div className="ml-6 mt-2 space-y-2">
                          {attr.inputs.map(input => (
                            <div key={input.key}>
                              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                                {input.label}
                              </label>
                              <input
                                type={input.type}
                                step={input.step}
                                min={input.min}
                                value={setData.attributeInputs[`${attr.key}_${input.key}`] || ''}
                                onChange={(e) => handleAttributeInputChange(attr.key, input.key, e.target.value)}
                                className="w-full p-1 text-xs border rounded"
                                style={{
                                  backgroundColor: 'var(--bg-secondary)',
                                  borderColor: 'var(--border-color)',
                                  color: 'var(--text-primary)',
                                  fontFamily: 'var(--font-primary)',
                                  borderRadius: 'var(--border-radius)'
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={closeAddSetModal}
                  className="flex-1 px-4 py-2 border rounded"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-primary)',
                    borderRadius: 'var(--border-radius)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitAddSet}
                  className="flex-1 px-4 py-2 rounded text-white"
                  style={{
                    backgroundColor: 'var(--accent-color)',
                    color: 'var(--text-on-primary)',
                    fontFamily: 'var(--font-primary)',
                    borderRadius: 'var(--border-radius)'
                  }}
                >
                  Add Set
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutLog;
