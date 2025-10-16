import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { PlusIcon, ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const WorkoutLogger = ({ selectedDate, onWorkoutLogged }) => {
  const [workouts, setWorkouts] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleThreshold, setMuscleThreshold] = useState(80);
  const [sortBy, setSortBy] = useState('alphabetical');

  // Form state
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('');
  const [attributes, setAttributes] = useState([]);
  const [restTime, setRestTime] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  // Working timer
  const [isWorking, setIsWorking] = useState(false);
  const [workTime, setWorkTime] = useState(0);
  const [workTimerInterval, setWorkTimerInterval] = useState(null);

  const loadLastWorkoutData = useCallback(async () => {
    if (!selectedWorkout) return;

    try {
      const response = await api.getWorkoutLogs({ 
        workout: selectedWorkout.workouts_id,
        limit: 1 
      });
      
      if (response.data.data && response.data.data.length > 0) {
        const lastLog = response.data.data[0];
        setWeight(lastLog.weight || '');
        setReps(lastLog.reps || '');
        setRir(lastLog.rir || '');
        setRestTime(lastLog.rest_time || '');
        setAttributes(lastLog.attributes || []);
      }
    } catch (err) {
      console.error('Failed to load last workout data:', err);
    }
  }, [selectedWorkout]);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const response = await api.getWorkouts();
      setWorkouts(response.data.data || []);
    } catch (err) {
      console.error('Failed to load workouts:', err);
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentWorkouts = async () => {
    try {
      const response = await api.getRecentlyLoggedWorkouts();
      setRecentWorkouts(response.data.data || []);
    } catch (err) {
      console.error('Failed to load recent workouts:', err);
    }
  };

  useEffect(() => {
    loadWorkouts();
    loadRecentWorkouts();
  }, []);

  useEffect(() => {
    if (selectedWorkout) {
      loadLastWorkoutData();
    }
  }, [selectedWorkout, loadLastWorkoutData]);

  const startWorkTimer = () => {
    if (workTimerInterval) {
      clearInterval(workTimerInterval);
    }
    
    setIsWorking(true);
    setWorkTime(0);
    
    const interval = setInterval(() => {
      setWorkTime(prev => prev + 1);
    }, 1000);
    
    setWorkTimerInterval(interval);
  };

  const stopWorkTimer = () => {
    if (workTimerInterval) {
      clearInterval(workTimerInterval);
      setWorkTimerInterval(null);
    }
    setIsWorking(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addAttribute = (type) => {
    const newAttribute = {
      type,
      weight: type === 'dropset' ? '' : undefined,
      reps: '',
      wait_time: type === 'pause' ? '' : undefined
    };
    setAttributes([...attributes, newAttribute]);
  };

  const removeAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index, field, value) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[index] = {
      ...updatedAttributes[index],
      [field]: value
    };
    setAttributes(updatedAttributes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedWorkout) {
      setError('Please select a workout');
      return;
    }

    if (!weight || !reps) {
      setError('Weight and reps are required');
      return;
    }

    setIsLogging(true);

    const logData = {
      workout: selectedWorkout.workouts_id,
      weight: parseFloat(weight),
      reps: parseInt(reps),
      rir: rir ? parseInt(rir) : null,
      attributes: attributes.length > 0 ? attributes : null,
      rest_time: restTime ? parseInt(restTime) : null,
      date_time: selectedDate ? `${selectedDate}T${new Date().toTimeString().split(' ')[0]}` : new Date().toISOString()
    };

    try {
      await api.createWorkoutLog(logData);
      setSuccess('Workout logged successfully!');
      
      // Reset form
      setSelectedWorkout(null);
      setWeight('');
      setReps('');
      setRir('');
      setAttributes([]);
      setRestTime('');
      
      if (onWorkoutLogged) onWorkoutLogged();
    } catch (err) {
      console.error('Error logging workout:', err);
      setError('Failed to log workout');
    } finally {
      setIsLogging(false);
    }
  };

  const quickAddWorkout = (workout) => {
    setSelectedWorkout(workout);
    setWeight(workout.weight || '');
    setReps(workout.reps || '');
    setRir(workout.rir || '');
    setRestTime(workout.rest_time || '');
    setAttributes(workout.attributes || []);
  };

  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = workout.workout_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesThreshold = workout.muscles?.some(muscle => muscle.activation_rating >= muscleThreshold);
    return matchesSearch && matchesThreshold;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        return a.workout_name.localeCompare(b.workout_name);
      case 'muscle_activation':
        const aMaxActivation = Math.max(...(a.muscles?.map(m => m.activation_rating) || [0]));
        const bMaxActivation = Math.max(...(b.muscles?.map(m => m.activation_rating) || [0]));
        return bMaxActivation - aMaxActivation;
      default:
        return 0;
    }
  });

  const attributeTypes = [
    { type: 'dropset', label: 'Dropset', description: 'Reduce weight and continue reps' },
    { type: 'assisted', label: 'Assisted', description: 'Get help to complete reps' },
    { type: 'partial', label: 'Partial', description: 'Perform partial range of motion' },
    { type: 'pause', label: 'Pause', description: 'Hold at specific point during rep' },
    { type: 'negatives', label: 'Negatives', description: 'Focus on eccentric portion' }
  ];

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="form-container">
      <h2 className="text-2xl font-bold mb-4">Workout Logger</h2>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      {/* Working Timer */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ClockIcon className="h-6 w-6" />
            <span className="text-lg font-mono">{formatTime(workTime)}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isWorking ? 'Working' : 'Resting'}
            </span>
          </div>
          <div className="flex space-x-2">
            {!isWorking ? (
              <button onClick={startWorkTimer} className="btn btn-primary">
                Start Work
              </button>
            ) : (
              <button onClick={stopWorkTimer} className="btn btn-secondary">
                Stop Work
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Quick Add from Previous Day</h3>
          <div className="flex flex-wrap gap-2">
            {recentWorkouts.map(workout => (
              <button
                key={workout.workout_log_id}
                onClick={() => quickAddWorkout(workout)}
                className="btn btn-secondary text-sm"
              >
                {workout.workout_emoji} {workout.workout_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            className="form-input flex-grow"
            placeholder="Search workouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="form-select w-32"
            value={muscleThreshold}
            onChange={(e) => setMuscleThreshold(parseInt(e.target.value))}
          >
            <option value={0}>All</option>
            <option value={50}>50+</option>
            <option value={80}>80+</option>
            <option value={90}>90+</option>
          </select>
          <select
            className="form-select w-32"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="alphabetical">A-Z</option>
            <option value="muscle_activation">Activation</option>
          </select>
        </div>
      </div>

      {/* Workout Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Workout</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredWorkouts.map(workout => (
            <button
              key={workout.workouts_id}
              onClick={() => setSelectedWorkout(workout)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedWorkout?.workouts_id === workout.workouts_id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="font-medium">{workout.workout_name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {workout.type} • {workout.muscles?.length || 0} muscles
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Logging Form */}
      {selectedWorkout && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="font-medium mb-2">Logging: {selectedWorkout.workout_name}</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedWorkout.muscles?.map(muscle => 
                `${muscle.muscle_name} (${muscle.activation_rating}%)`
              ).join(', ')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-section">
              <label htmlFor="weight" className="form-label">Weight (lbs/kg):</label>
              <input
                type="number"
                id="weight"
                className="form-input"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                step="0.1"
                required
              />
            </div>

            <div className="form-section">
              <label htmlFor="reps" className="form-label">Reps:</label>
              <input
                type="number"
                id="reps"
                className="form-input"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                min="1"
                required
              />
            </div>

            <div className="form-section">
              <label htmlFor="rir" className="form-label">RIR:</label>
              <input
                type="number"
                id="rir"
                className="form-input"
                value={rir}
                onChange={(e) => setRir(e.target.value)}
                min="0"
                max="10"
              />
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Reps in Reserve (0-10)
              </div>
            </div>
          </div>

          <div className="form-section">
            <label htmlFor="restTime" className="form-label">Rest Time (seconds):</label>
            <input
              type="number"
              id="restTime"
              className="form-input"
              value={restTime}
              onChange={(e) => setRestTime(e.target.value)}
              min="0"
            />
          </div>

          {/* Attributes */}
          <div className="form-section">
            <h3 className="text-lg font-semibold mb-2">Attributes</h3>
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {attributeTypes.map(type => (
                  <button
                    key={type.type}
                    type="button"
                    onClick={() => addAttribute(type.type)}
                    className="btn btn-secondary text-sm"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {attributes.map((attr, index) => {
                const typeInfo = attributeTypes.find(t => t.type === attr.type);
                return (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <span className="text-sm font-medium">{typeInfo?.label}</span>
                    
                    {attr.type === 'dropset' && (
                      <input
                        type="number"
                        className="form-input w-20 text-sm"
                        placeholder="Weight"
                        value={attr.weight || ''}
                        onChange={(e) => updateAttribute(index, 'weight', e.target.value)}
                        step="0.1"
                      />
                    )}
                    
                    <input
                      type="number"
                      className="form-input w-16 text-sm"
                      placeholder="Reps"
                      value={attr.reps || ''}
                      onChange={(e) => updateAttribute(index, 'reps', e.target.value)}
                      min="1"
                    />
                    
                    {attr.type === 'pause' && (
                      <input
                        type="number"
                        className="form-input w-20 text-sm"
                        placeholder="Wait (s)"
                        value={attr.wait_time || ''}
                        onChange={(e) => updateAttribute(index, 'wait_time', e.target.value)}
                        min="1"
                      />
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeAttribute(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Progressive Overload Reminder
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Progressive overload should be done if not in a caloric deficit.
                </p>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={isLogging}
          >
            {isLogging ? 'Logging...' : 'Log Workout'}
          </button>
        </form>
      )}
    </div>
  );
};

export default WorkoutLogger;
