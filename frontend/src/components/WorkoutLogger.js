import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { MagnifyingGlassIcon, InformationCircleIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const WorkoutLogger = ({ selectedDate, onWorkoutLogged }) => {
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleThreshold, setMuscleThreshold] = useState(80);
  const [sortBy, setSortBy] = useState('alphabetical');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [logData, setLogData] = useState({
    weight: '',
    reps: '',
    rir: '',
    attributes: [],
    attributeInputs: {},
    rest_time: ''
  });

  const loadWorkouts = async () => {
    try {
      const response = await api.getWorkouts();
      if (response.data.success) {
        console.log('Workouts loaded:', response.data.data);
        setWorkouts(response.data.data);
      }
    } catch (err) {
      console.error('Error loading workouts:', err);
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };

  const filterWorkouts = useCallback(() => {
    let filtered = workouts.filter(workout => {
      // Text search
      const matchesSearch = workout.workout_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           workout.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Muscle activation threshold
      const hasHighActivation = workout.muscles.some(muscle => muscle.activation_rating >= muscleThreshold);
      
      // Selected muscle filter
      const matchesMuscle = !selectedMuscle || workout.muscles.some(muscle => 
        muscle.muscle_name.toLowerCase().includes(selectedMuscle.toLowerCase())
      );
      
      return matchesSearch && hasHighActivation && matchesMuscle;
    });

    // Sort
    if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => {
        const comparison = a.workout_name.localeCompare(b.workout_name);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } else if (sortBy === 'activation') {
      filtered.sort((a, b) => {
        const aMax = Math.max(...a.muscles.map(m => m.activation_rating));
        const bMax = Math.max(...b.muscles.map(m => m.activation_rating));
        return sortDirection === 'asc' ? aMax - bMax : bMax - aMax;
      });
    } else if (sortBy === 'most_logged') {
      filtered.sort((a, b) => {
        const aCount = a.log_count || 0;
        const bCount = b.log_count || 0;
        return sortDirection === 'asc' ? aCount - bCount : bCount - aCount;
      });
    } else if (sortBy === 'recently_logged') {
      filtered.sort((a, b) => {
        const aDate = a.last_logged ? new Date(a.last_logged) : new Date(0);
        const bDate = b.last_logged ? new Date(b.last_logged) : new Date(0);
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      });
    }

    setFilteredWorkouts(filtered);
  }, [workouts, searchTerm, muscleThreshold, sortBy, sortDirection, selectedMuscle]);

  useEffect(() => {
    loadWorkouts();
  }, []);

  useEffect(() => {
    filterWorkouts();
  }, [filterWorkouts]);

  const getUniqueMuscles = useCallback(() => {
    const muscleSet = new Set();
    workouts.forEach(workout => {
      workout.muscles.forEach(muscle => {
        muscleSet.add(muscle.muscle_name);
      });
    });
    return Array.from(muscleSet).sort();
  }, [workouts]);

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const selectWorkout = (workout) => {
    setSelectedWorkout(workout);
    
    // Debug logging
    console.log('Selected workout:', workout);
    console.log('Recent log data:', workout.recent_log);
    
    // Autofill from most recent log if available
    if (workout.recent_log) {
      const autofillData = {
        weight: workout.recent_log.last_weight || '',
        reps: workout.recent_log.last_reps || '',
        rir: workout.recent_log.last_rir || '',
        attributes: [],
        attributeInputs: {},
        rest_time: workout.recent_log.last_rest_time || ''
      };
      
      console.log('Autofill data:', autofillData);
      setLogData(autofillData);
    } else {
      console.log('No recent log data available');
      setLogData({
        weight: '',
        reps: '',
        rir: '',
        attributes: [],
        attributeInputs: {},
        rest_time: ''
      });
    }
  };

  const handleLogDataChange = (field, value) => {
    setLogData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAttributeInputChange = (attributeKey, inputKey, value) => {
    setLogData(prev => ({
      ...prev,
      attributeInputs: {
        ...prev.attributeInputs,
        [`${attributeKey}_${inputKey}`]: value
      }
    }));
  };

  const toggleAttribute = (attribute) => {
    setLogData(prev => ({
      ...prev,
      attributes: prev.attributes.includes(attribute)
        ? prev.attributes.filter(a => a !== attribute)
        : [...prev.attributes, attribute]
    }));
  };

  const logWorkout = async () => {
    if (!selectedWorkout) return;
    
    setIsLogging(true);
    setError('');
    setSuccess('');

    try {
      const logDataToSend = {
        workout: selectedWorkout.workouts_id,
        weight: logData.weight ? parseFloat(logData.weight) : null,
        reps: logData.reps ? parseInt(logData.reps) : null,
        rir: logData.rir ? parseInt(logData.rir) : null,
        attributes: logData.attributes,
        attributeInputs: logData.attributeInputs,
        rest_time: logData.rest_time ? parseInt(logData.rest_time) : null,
        date_time: selectedDate ? `${selectedDate}T${new Date().toTimeString().split(' ')[0]}` : new Date().toISOString()
      };

      const response = await api.logWorkout(logDataToSend);
      if (response.data.success) {
        setSuccess('Workout logged successfully!');
        setSelectedWorkout(null);
        setLogData({
          weight: '',
          reps: '',
          rir: '',
          attributes: [],
          attributeInputs: {},
          rest_time: ''
        });
        
        if (onWorkoutLogged) onWorkoutLogged();
      }
    } catch (err) {
      console.error('Error logging workout:', err);
      setError('Failed to log workout');
    } finally {
      setIsLogging(false);
    }
  };

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

  if (loading) {
    return <div className="text-center py-8">Loading workouts...</div>;
  }

  return (
    <div className="form-container">
      <h2 className="text-2xl font-bold mb-6">Log Workout</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 rounded">
          {success}
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-2">
          <MagnifyingGlassIcon 
            className="h-4 w-4"
            style={{
              width: '16px',
              height: '16px',
              minWidth: '16px',
              minHeight: '16px',
              color: 'var(--text-secondary)'
            }}
          />
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input flex-1"
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
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
              Muscle Activation Threshold
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={muscleThreshold}
              onChange={(e) => setMuscleThreshold(parseInt(e.target.value))}
              className="w-full"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--border-radius)'
              }}
            />
            <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Min activation: {muscleThreshold}
            </div>
          </div>
          
          <div>
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
              Filter by Muscle
            </label>
            <select
              value={selectedMuscle}
              onChange={(e) => setSelectedMuscle(e.target.value)}
              className="form-input"
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
              <option value="">All Muscles</option>
              {getUniqueMuscles().map(muscle => (
                <option key={muscle} value={muscle}>{muscle}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input"
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
              <option value="alphabetical">Alphabetical</option>
              <option value="activation">Activation Rating</option>
              <option value="most_logged">Most Commonly Logged</option>
              <option value="recently_logged">Most Recently Logged</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={toggleSortDirection}
              className="btn btn-secondary flex items-center space-x-2 px-3 py-2"
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
              {sortDirection === 'asc' ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
              <span>{sortDirection === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workout Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
          Select Workout
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {filteredWorkouts.map(workout => (
            <button
              key={workout.workouts_id}
              onClick={() => selectWorkout(workout)}
              className={`p-3 rounded-lg text-left transition-colors ${
                selectedWorkout?.workouts_id === workout.workouts_id
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-normal)',
                color: selectedWorkout?.workouts_id === workout.workouts_id ? 'var(--text-on-primary)' : 'var(--text-primary)',
                backgroundColor: selectedWorkout?.workouts_id === workout.workouts_id ? 'var(--accent-color)' : 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                padding: 'var(--spacing-sm)'
              }}
            >
              <div className="font-medium mb-1">{workout.workout_name}</div>
              <div className="text-xs opacity-75 mb-2">{workout.type}</div>
              <div className="space-y-1">
                {workout.muscles.map(muscle => (
                  <div key={muscle.muscle_id} className="flex justify-between items-center text-xs">
                    <span>{muscle.muscle_name}</span>
                    <span className="font-medium" style={{ color: 'var(--accent-color)' }}>
                      {muscle.activation_rating}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Workout Logging Form */}
      {selectedWorkout && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
              Logging: {selectedWorkout.workout_name}
            </h3>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div>Type: {selectedWorkout.type}</div>
              <div className="mt-1">
                <span className="font-medium">Muscles & Activation:</span>
                <div className="mt-1 space-y-1">
                  {selectedWorkout.muscles.map(muscle => (
                    <div key={muscle.muscle_id} className="flex justify-between items-center">
                      <span>{muscle.muscle_name}</span>
                      <span className="font-medium" style={{ color: 'var(--accent-color)' }}>
                        {muscle.activation_rating}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Log Data Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                Weight (lbs)
              </label>
              <input
                type="number"
                step="0.5"
                value={logData.weight}
                onChange={(e) => handleLogDataChange('weight', e.target.value)}
                className="form-input"
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
                placeholder="135.5"
              />
            </div>
            
            <div>
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                Reps
              </label>
              <input
                type="number"
                value={logData.reps}
                onChange={(e) => handleLogDataChange('reps', e.target.value)}
                className="form-input"
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
                placeholder="10"
              />
            </div>
            
            <div>
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                RIR (Reps in Reserve)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={logData.rir}
                onChange={(e) => handleLogDataChange('rir', e.target.value)}
                className="form-input"
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
                placeholder="2"
              />
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                How many more reps you could have done (0-10)
              </div>
            </div>
            
            <div>
              <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                Rest Time (seconds)
              </label>
              <input
                type="number"
                value={logData.rest_time}
                onChange={(e) => handleLogDataChange('rest_time', e.target.value)}
                className="form-input"
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
                placeholder="90"
              />
            </div>
          </div>

          {/* Attributes */}
          <div>
            <label className="form-label" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)' }}>
              Attributes
            </label>
            <div className="space-y-3">
              {attributeOptions.map(attr => (
                <div key={attr.key} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logData.attributes.includes(attr.key)}
                      onChange={() => toggleAttribute(attr.key)}
                      className="form-checkbox mt-1"
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: 'var(--accent-color)'
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-medium)' }}>
                        {attr.label}
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {attr.description}
                      </div>
                      {attr.hasInput && logData.attributes.includes(attr.key) && (
                        <div className="mt-2 space-y-2">
                          {attr.inputs.map(input => (
                            <input
                              key={input.key}
                              type={input.type}
                              step={input.step}
                              min={input.min}
                              max={input.max}
                              value={logData.attributeInputs[`${attr.key}_${input.key}`] || ''}
                              onChange={(e) => handleAttributeInputChange(attr.key, input.key, e.target.value)}
                              placeholder={input.label}
                              className="form-input w-full"
                              style={{
                                fontFamily: 'var(--font-primary)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 'var(--font-weight-normal)',
                                color: 'var(--text-primary)',
                                backgroundColor: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--border-radius)',
                                padding: 'var(--spacing-xs) var(--spacing-sm)'
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Progressive Overload Message */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center space-x-2">
              <InformationCircleIcon 
                className="h-4 w-4"
                style={{
                  width: '16px',
                  height: '16px',
                  minWidth: '16px',
                  minHeight: '16px',
                  color: 'var(--accent-color)'
                }}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-primary)' }}>
                Progressive overload should be done if not in a caloric deficit.
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={logWorkout}
            disabled={isLogging}
            className="btn btn-primary w-full px-6 py-3"
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-on-primary)',
              backgroundColor: 'var(--accent-color)',
              border: '1px solid var(--accent-color)',
              borderRadius: 'var(--border-radius)',
              padding: 'var(--spacing-md) var(--spacing-lg)'
            }}
          >
            {isLogging ? 'Logging Workout...' : 'Log Workout'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkoutLogger;
