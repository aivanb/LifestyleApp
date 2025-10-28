import React, { useState, useEffect } from 'react';
import { getMuscleDescription } from '../utils/muscleDescriptions';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const WorkoutLogger = ({ onOpenWorkoutSelection, onWorkoutLogged, selectedDate, onClose, preSelectedWorkout }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [muscleActivationRatings, setMuscleActivationRatings] = useState({}); // { muscleName: rating }
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [activeMuscleDescription, setActiveMuscleDescription] = useState(null);
  const [showWorkoutSelectionModal, setShowWorkoutSelectionModal] = useState(false);
  const [showWorkoutLoggingModal, setShowWorkoutLoggingModal] = useState(false);
  const [logData, setLogData] = useState({
    weight: '',
    reps: '',
    rir: '',
    attributes: [],
    attributeInputs: {},
    rest_time: ''
  });
  const [isLogging, setIsLogging] = useState(false);

  const attributeOptions = [
    {
      key: 'drop_set',
      label: 'Drop Set',
      description: 'Reducing weight and continuing the set without rest',
      inputs: [
        { key: 'weight', label: 'Weight (lbs)', type: 'number', placeholder: 'Weight' },
        { key: 'reps', label: 'Reps', type: 'number', placeholder: 'Reps' }
      ]
    },
    {
      key: 'partials',
      label: 'Partials',
      description: 'Performing partial range of motion repetitions',
      inputs: [
        { key: 'reps', label: 'Reps', type: 'number', placeholder: 'Reps' }
      ]
    },
    {
      key: 'assisted_sets',
      label: 'Assisted Sets',
      description: 'Using assistance to complete additional repetitions',
      inputs: [
        { key: 'reps', label: 'Reps', type: 'number', placeholder: 'Reps' }
      ]
    },
    {
      key: 'negatives',
      label: 'Negatives',
      description: 'Focusing on the eccentric (lowering) portion of the movement',
      inputs: [
        { key: 'reps', label: 'Reps', type: 'number', placeholder: 'Reps' }
      ]
    },
    {
      key: 'rest_pause',
      label: 'Rest Pause',
      description: 'Brief rest within a set to continue with additional reps',
      inputs: [
        { key: 'rest_time', label: 'Rest Time (sec)', type: 'number', placeholder: 'Rest time' },
        { key: 'reps', label: 'Reps', type: 'number', placeholder: 'Reps' }
      ]
    }
  ];

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/');
      if (response.data.success) {
        setWorkouts(response.data.data);
      } else {
        setError('Failed to load workouts');
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
      setError('Failed to load workouts');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadWorkouts();
    
    // If a workout is pre-selected, set it and open logging modal
    if (preSelectedWorkout) {
      setSelectedWorkout(preSelectedWorkout);
      setShowWorkoutLoggingModal(true);
    } else {
      // Automatically open workout selection modal when component mounts
      setShowWorkoutSelectionModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedWorkout]);

  const getUniqueMuscles = () => {
    const muscles = new Set();
    workouts.forEach(workout => {
      workout.muscles.forEach(muscle => {
        muscles.add(muscle.muscle_name);
      });
    });
    return Array.from(muscles).sort();
  };

  // eslint-disable-next-line no-unused-vars
  const getWorkoutIcon = (type) => {
    const icons = {
      'strength': '💪',
      'cardio': '❤️',
      'flexibility': '🤸',
      'balance': '⚖️',
      'endurance': '🏃',
      'power': '⚡',
      'agility': '🏃‍♂️',
      'coordination': '🎯'
    };
    return icons[type] || '🏋️';
  };

  const getUniqueLocations = () => {
    const locations = new Set();
    workouts.forEach(workout => {
      if (workout.location) {
        locations.add(workout.location);
      }
    });
    return Array.from(locations).sort();
  };

  const getUniqueEquipmentTypes = () => {
    const types = new Set();
    workouts.forEach(workout => {
      if (workout.type) {
        types.add(workout.type);
      }
    });
    return Array.from(types).sort();
  };

  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = workout.workout_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if muscles match selected muscles AND their activation ratings
    let matchesMuscles = selectedMuscles.length === 0;
    if (selectedMuscles.length > 0) {
      matchesMuscles = workout.muscles.some(muscle => {
        if (!selectedMuscles.includes(muscle.muscle_name)) return false;
        // Check if this muscle has an activation rating requirement
        const requiredRating = muscleActivationRatings[muscle.muscle_name];
        if (requiredRating === undefined || requiredRating === '') return true;
        return muscle.activation_rating >= parseInt(requiredRating);
      });
    }
    
    const matchesLocations = selectedLocations.length === 0 || selectedLocations.includes(workout.location);
    const matchesEquipmentTypes = selectedEquipmentTypes.length === 0 || selectedEquipmentTypes.includes(workout.type);
    
    return matchesSearch && matchesMuscles && matchesLocations && matchesEquipmentTypes;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'alphabetical':
        comparison = a.workout_name.localeCompare(b.workout_name);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'muscle_count':
        comparison = a.muscles.length - b.muscles.length;
        break;
      case 'max_activation':
        const maxA = Math.max(...a.muscles.map(m => m.activation_rating));
        const maxB = Math.max(...b.muscles.map(m => m.activation_rating));
        comparison = maxA - maxB;
        break;
      case 'total_muscle_activation':
        // Sort by total muscle activation (sum of all activation ratings)
        const totalA = a.muscles.reduce((sum, m) => sum + m.activation_rating, 0);
        const totalB = b.muscles.reduce((sum, m) => sum + m.activation_rating, 0);
        comparison = totalA - totalB;
        break;
      case 'unique_muscles':
        // Sort by unique number of muscles
        const uniqueCountA = new Set(a.muscles.map(m => m.muscle_id)).size;
        const uniqueCountB = new Set(b.muscles.map(m => m.muscle_id)).size;
        comparison = uniqueCountA - uniqueCountB;
        break;
      case 'frequency_logged':
        // Sort by frequency logged (if available in future)
        const freqA = a.recent_log?.frequency || 0;
        const freqB = b.recent_log?.frequency || 0;
        comparison = freqA - freqB;
        break;
      default:
        comparison = 0;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // eslint-disable-next-line no-unused-vars
  const openWorkoutSelectionModal = () => {
    if (onOpenWorkoutSelection) {
      onOpenWorkoutSelection();
    } else {
      setShowWorkoutSelectionModal(true);
    }
  };

  const closeWorkoutSelectionModal = () => {
    setShowWorkoutSelectionModal(false);
    // If we have a parent close callback, call it to close the parent modal
    if (onClose) {
      onClose();
    }
  };

  const closeWorkoutLoggingModal = () => {
    setShowWorkoutLoggingModal(false);
    setSelectedWorkout(null);
    // If we have a parent close callback, call it to close the parent modal
    if (onClose) {
      onClose();
    }
  };

  const goBackToWorkoutSelection = () => {
    setShowWorkoutLoggingModal(false);
    setShowWorkoutSelectionModal(true);
    setSelectedWorkout(null);
  };

  const selectWorkout = (workout) => {
    setSelectedWorkout(workout);
    setShowWorkoutSelectionModal(false);
    setShowWorkoutLoggingModal(true);
    
    if (workout.recent_log) {
      // Parse attributes and attribute inputs from the recent log
      const recentAttributes = workout.recent_log.last_attributes || [];
      const attributeInputs = {};
      
      // Process attribute inputs - the backend stores them as a flat object
      // We need to reconstruct them based on the attribute structure
      if (workout.recent_log.last_attribute_inputs) {
        Object.keys(workout.recent_log.last_attribute_inputs).forEach(key => {
          attributeInputs[key] = workout.recent_log.last_attribute_inputs[key];
        });
      }
      
      const autofillData = {
        weight: workout.recent_log.last_weight || '',
        reps: workout.recent_log.last_reps || '',
        rir: workout.recent_log.last_rir || '',
        attributes: recentAttributes,
        attributeInputs: attributeInputs,
        rest_time: workout.recent_log.last_rest_time || ''
      };
      setLogData(autofillData);
    } else {
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

  const handleAttributeInputChange = (key, value) => {
    setLogData(prev => ({
      ...prev,
      attributeInputs: {
        ...prev.attributeInputs,
        [key]: value
      }
    }));
  };

  const handleMuscleClick = (muscleName) => {
    if (activeMuscleDescription === muscleName) {
      setActiveMuscleDescription(null);
    } else {
      setActiveMuscleDescription(muscleName);
    }
  };

  const handleLogWorkout = async () => {
    if (!selectedWorkout || !logData.weight || !logData.reps) {
      setError('Please fill in weight and reps');
      return;
    }
    
    setIsLogging(true);
    setError('');

    try {
      // Parse input values and handle empty/invalid values
      const weight = logData.weight && logData.weight !== '' ? parseFloat(logData.weight) : null;
      const reps = logData.reps && logData.reps !== '' ? parseInt(logData.reps) : null;
      // RIR must be between 0-10 (Reps in Reserve)
      let rir = logData.rir && logData.rir !== '' ? parseInt(logData.rir) : null;
      if (rir !== null) {
        // Clamp RIR to valid range
        if (rir < 0) rir = 0;
        if (rir > 10) rir = 10;
      }
      const rest_time = logData.rest_time && logData.rest_time !== '' ? parseInt(logData.rest_time) : null;
      
      const logPayload = {
        workout: selectedWorkout.workouts_id,
        weight: weight,
        reps: reps,
        rir: rir || null,
        rest_time: rest_time || null,
        attributes: logData.attributes || [],
        attribute_inputs: logData.attributeInputs || {},
        date_time: selectedDate ? new Date(selectedDate).toISOString() : new Date().toISOString()
      };

      console.log('Logging workout with payload:', logPayload);
      const response = await api.post('/workouts/logs/', logPayload);
      console.log('Workout log response:', response.data);
      console.log('Workout log response status:', response.status);
      
      // Check for successful response (200 or 201)
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        setLogData({
          weight: '',
          reps: '',
          rir: '',
          attributes: [],
          attributeInputs: {},
          rest_time: ''
        });
        
        await loadWorkouts();
        
        closeWorkoutLoggingModal();
        
        // Call the parent callback to refresh data and close parent modal
        if (onWorkoutLogged) {
          console.log('Calling onWorkoutLogged callback');
          await onWorkoutLogged();
        }
      } else {
        setError(response.data?.message || 'Failed to log workout');
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      // Log more detailed error information
      if (error.response) {
        console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Error response status:', error.response.status);
      }
      
      // Extract detailed error message
      let errorMessage = 'Failed to log workout. Please try again.';
      if (error.response?.data?.error) {
        const errorObj = error.response.data.error;
        
        // Check if it's an object with field-specific errors
        if (typeof errorObj === 'object' && !errorObj.message) {
          const fieldErrors = Object.keys(errorObj).map(field => {
            const messages = Array.isArray(errorObj[field]) ? errorObj[field] : [errorObj[field]];
            return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${messages.join(', ')}`;
          });
          errorMessage = fieldErrors.join('; ');
        } else if (typeof errorObj === 'string') {
          errorMessage = errorObj;
        } else if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.non_field_errors) {
          errorMessage = errorObj.non_field_errors.join(', ');
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLogging(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading workouts...</div>;
  }

  return (
    <div className="form-container">

      {/* Workout Selection Modal */}
      {showWorkoutSelectionModal && (
        <div className="modal-overlay" onClick={closeWorkoutSelectionModal}>
          <div className="modal-content workout-selection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Select Workout to Log</h2>
              <button className="modal-close-button" onClick={closeWorkoutSelectionModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

              {/* Search and Filter Controls */}
      <div className="workout-filter-section">
        <div className="workout-filter-left">
          <div className="search-input-container">
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="workout-search-input-field"
          />
        </div>
          <div className="filter-controls-multiselect-row">
            <div className="filter-group">
              <select
                multiple
                value={selectedMuscles}
                onChange={(e) => {
                  const clickedOption = e.target.options[e.target.selectedIndex];
                  const clickedValue = clickedOption.value;
                  
                  // Toggle selection
                  if (selectedMuscles.includes(clickedValue)) {
                    setSelectedMuscles(prev => prev.filter(m => m !== clickedValue));
                    setMuscleActivationRatings(prev => {
                      const newRatings = { ...prev };
                      delete newRatings[clickedValue];
                      return newRatings;
                    });
                  } else {
                    setSelectedMuscles(prev => [...prev, clickedValue]);
                    setMuscleActivationRatings(prev => ({ ...prev, [clickedValue]: '' }));
                  }
                }}
                className="form-select-multiselect"
              >
                {getUniqueMuscles().map(muscle => (
                  <option key={muscle} value={muscle}>{muscle}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <select
                multiple
                value={selectedLocations}
                onChange={(e) => {
                  const clickedOption = e.target.options[e.target.selectedIndex];
                  const clickedValue = clickedOption.value;
                  setSelectedLocations(prev => 
                    prev.includes(clickedValue) 
                      ? prev.filter(l => l !== clickedValue)
                      : [...prev, clickedValue]
                  );
                }}
                className="form-select-multiselect"
              >
                {getUniqueLocations().map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
          </div>
            <div className="filter-group">
            <select
                multiple
                value={selectedEquipmentTypes}
                onChange={(e) => {
                  const clickedOption = e.target.options[e.target.selectedIndex];
                  const clickedValue = clickedOption.value;
                  setSelectedEquipmentTypes(prev => 
                    prev.includes(clickedValue) 
                      ? prev.filter(t => t !== clickedValue)
                      : [...prev, clickedValue]
                  );
                }}
                className="form-select-multiselect"
              >
                {getUniqueEquipmentTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          </div>
          <div className="filter-controls-sort-row">
            <div className="filter-group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
                className="form-select"
            >
              <option value="alphabetical">Alphabetical</option>
                <option value="type">Type</option>
                <option value="muscle_count">Muscle Count</option>
                <option value="max_activation">Max Activation</option>
                <option value="total_muscle_activation">Total Muscle Activation</option>
                <option value="unique_muscles">Unique Muscles</option>
                <option value="frequency_logged">Frequency Logged</option>
            </select>
          </div>
            <button
              onClick={toggleSortDirection}
              className="btn-secondary"
              style={{width: '40px'}}
            >
              {sortDirection === 'asc' ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="workout-filter-right">
          <div className="active-filters-container">
            <div className="active-filters-title">Active Filters:</div>
            <div className="active-filters-list">
              {selectedMuscles.map(muscle => (
                <div key={muscle}>
                  <span className="active-filter-badge">
                    {muscle}
                    <button onClick={() => {
                      setSelectedMuscles(prev => prev.filter(m => m !== muscle));
                      setMuscleActivationRatings(prev => {
                        const newRatings = { ...prev };
                        delete newRatings[muscle];
                        return newRatings;
                      });
                    }}>×</button>
                  </span>
                  <div className="muscle-activation-input-group">
                    <div className="muscle-activation-stepper">
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseInt(muscleActivationRatings[muscle]) || 0;
                          const newValue = Math.max(0, current - 10);
                          setMuscleActivationRatings(prev => ({ ...prev, [muscle]: newValue.toString() }));
                        }}
                        className="stepper-button"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="10"
                        placeholder="Min rating"
                        value={muscleActivationRatings[muscle] || ''}
                        onChange={(e) => setMuscleActivationRatings(prev => ({ ...prev, [muscle]: e.target.value }))}
                        className="muscle-activation-input"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = parseInt(muscleActivationRatings[muscle]) || 0;
                          const newValue = Math.min(100, current + 10);
                          setMuscleActivationRatings(prev => ({ ...prev, [muscle]: newValue.toString() }));
                        }}
                        className="stepper-button"
                      >
                        +
            </button>
                    </div>
                  </div>
                </div>
              ))}
              {selectedLocations.map(location => (
                <span key={location} className="active-filter-badge">
                  Location: {location}
                  <button onClick={() => setSelectedLocations(prev => prev.filter(l => l !== location))}>×</button>
                </span>
              ))}
              {selectedEquipmentTypes.map(type => (
                <span key={type} className="active-filter-badge">
                  Equipment: {type}
                  <button onClick={() => setSelectedEquipmentTypes(prev => prev.filter(t => t !== type))}>×</button>
                </span>
              ))}
            </div>
            {(selectedMuscles.length > 0 || selectedLocations.length > 0 || selectedEquipmentTypes.length > 0) && (
              <button 
                onClick={() => {
                  setSelectedMuscles([]);
                  setSelectedLocations([]);
                  setSelectedEquipmentTypes([]);
                  setMuscleActivationRatings({});
                }}
                className="btn-clear-filters"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </div>

              {/* Workout Selection Grid */}
              <div className="workout-selection-grid">
          {filteredWorkouts.map(workout => (
                  <div
              key={workout.workouts_id}
                    className="workout-selection-card"
              onClick={() => selectWorkout(workout)}
                  >
                    <div className="workout-content">
                      <div className="workout-name">{workout.workout_name}</div>
                      <div className="workout-muscles">
                {workout.muscles.map(muscle => (
                          <div 
                    key={muscle.muscle_id} 
                    className="muscle-tag"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMuscleClick(muscle.muscle_name);
                    }}
                    title="Click to view muscle description"
                  >
                    <span>{muscle.muscle_name}</span>
                    <span className="muscle-rating">
                      {muscle.activation_rating}
                    </span>
                    <span className="muscle-description-icon">
                      <InformationCircleIcon className="w-5 h-5" />
                    </span>
                  </div>
                ))}
              </div>
                    </div>
                  </div>
          ))}
        </div>
      </div>
          </div>
        </div>
      )}

      {/* Workout Logging Modal */}
      {showWorkoutLoggingModal && selectedWorkout && (
        <div className="modal-overlay" onClick={closeWorkoutLoggingModal}>
          <div className="modal-content workout-logging-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button 
                className="back-button"
                onClick={goBackToWorkoutSelection}
              >
                ← Back to Workouts
              </button>
              <h2 className="modal-title">Log Workout: {selectedWorkout.workout_name}</h2>
              <button className="modal-close-button" onClick={closeWorkoutLoggingModal}>
                ×
              </button>
            </div>

            <div className="modal-body workout-logging-body">
              <div className="workout-logging-content">
                <div className="workout-logging-main">
                  <div className="p-4 rounded-lg workout-info-card">
                    <h3 className="text-lg font-semibold mb-2">
              Logging: {selectedWorkout.workout_name}
            </h3>
                    <div className="workout-muscles-info">
                  {selectedWorkout.muscles.map(muscle => (
                        <span 
                          key={muscle.muscle_id} 
                          className="muscle-info-tag"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMuscleClick(muscle.muscle_name);
                          }}
                          title="Click to view muscle description"
                        >
                      <span>{muscle.muscle_name}</span>
                          <span className="muscle-rating">{muscle.activation_rating}</span>
                          <span className="muscle-description-icon">
                            <InformationCircleIcon className="w-5 h-5" />
                      </span>
                      </span>
                  ))}
            </div>
          </div>

                  {/* Logging Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Weight (lbs)</label>
              <div className="input-stepper">
                <button
                  type="button"
                  onClick={() => {
                    const current = parseFloat(logData.weight) || 0;
                    const newValue = Math.max(0, current - 5);
                    handleLogDataChange('weight', newValue.toString());
                  }}
                  className="stepper-button"
                >
                  -
                </button>
              <input
                type="number"
                value={logData.weight}
                onChange={(e) => handleLogDataChange('weight', e.target.value)}
                className="form-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = parseFloat(logData.weight) || 0;
                    const newValue = current + 5;
                    handleLogDataChange('weight', newValue.toString());
                  }}
                  className="stepper-button"
                >
                  +
                </button>
              </div>
            </div>
            
            <div>
              <label className="form-label">Reps</label>
              <div className="input-stepper">
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(logData.reps) || 0;
                    const newValue = Math.max(0, current - 1);
                    handleLogDataChange('reps', newValue.toString());
                  }}
                  className="stepper-button"
                >
                  -
                </button>
              <input
                type="number"
                value={logData.reps}
                onChange={(e) => handleLogDataChange('reps', e.target.value)}
                className="form-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(logData.reps) || 0;
                    const newValue = current + 1;
                    handleLogDataChange('reps', newValue.toString());
                  }}
                  className="stepper-button"
                >
                  +
                </button>
              </div>
            </div>
            
            <div>
              <label className="form-label">RIR (Reps in Reserve)</label>
              <div className="input-stepper">
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(logData.rir) || 0;
                    const newValue = Math.max(0, current - 1);
                    handleLogDataChange('rir', newValue.toString());
                  }}
                  className="stepper-button"
                >
                  -
                </button>
              <input
                type="number"
                min="0"
                max="10"
                value={logData.rir}
                onChange={(e) => handleLogDataChange('rir', e.target.value)}
                className="form-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(logData.rir) || 0;
                    const newValue = Math.min(10, current + 1);
                    handleLogDataChange('rir', newValue.toString());
                  }}
                  className="stepper-button"
                >
                  +
                </button>
              </div>
            </div>
            
            <div>
              <label className="form-label">Rest Time (seconds)</label>
              <div className="input-stepper">
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(logData.rest_time) || 0;
                    const newValue = Math.max(0, current - 5);
                    handleLogDataChange('rest_time', newValue.toString());
                  }}
                  className="stepper-button"
                >
                  -
                </button>
              <input
                type="number"
                value={logData.rest_time}
                onChange={(e) => handleLogDataChange('rest_time', e.target.value)}
                className="form-input"
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = parseInt(logData.rest_time) || 0;
                    const newValue = current + 5;
                    handleLogDataChange('rest_time', newValue.toString());
                  }}
                  className="stepper-button"
                >
                  +
                </button>
              </div>
            </div>
          </div>

                  {/* Log Workout Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleLogWorkout}
                      disabled={isLogging || !logData.weight || !logData.reps}
                      className="btn-primary log-workout-button"
                    >
                      {isLogging ? 'Logging Workout...' : 'Log Workout'}
                    </button>
                  </div>
                </div>

                {/* Attributes Section */}
                <div className="workout-logging-attributes">
                  <label className="form-label">Attributes</label>
            <div className="space-y-3">
              {attributeOptions.map(attr => (
                      <div key={attr.key} className="attribute-option">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logData.attributes.includes(attr.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleLogDataChange('attributes', [...logData.attributes, attr.key]);
                              } else {
                                handleLogDataChange('attributes', logData.attributes.filter(a => a !== attr.key));
                              }
                            }}
                            className="mt-1 attribute-checkbox"
                    />
                    <div className="flex-1">
                            <div className="attribute-label">{attr.label}</div>
                            {attr.inputs && logData.attributes.includes(attr.key) && (
                        <div className="mt-2 space-y-2">
                          {attr.inputs.map(input => (
                                  <div key={input.key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {input.label}
                                    </label>
                            <div className="input-stepper">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseFloat(logData.attributeInputs[`${attr.key}_${input.key}`]) || 0;
                                  const step = input.key === 'weight' ? 5 : (input.key === 'rest_time' ? 5 : 1);
                                  const newValue = Math.max(0, current - step);
                                  handleAttributeInputChange(`${attr.key}_${input.key}`, newValue.toString());
                                }}
                                className="stepper-button"
                              >
                                -
                              </button>
                            <input
                              type={input.type}
                              value={logData.attributeInputs[`${attr.key}_${input.key}`] || ''}
                                      onChange={(e) => handleAttributeInputChange(`${attr.key}_${input.key}`, e.target.value)}
                                      placeholder={input.placeholder}
                                      className="form-input"
                                    />
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseFloat(logData.attributeInputs[`${attr.key}_${input.key}`]) || 0;
                                  const step = input.key === 'weight' ? 5 : (input.key === 'rest_time' ? 5 : 1);
                                  const newValue = current + step;
                                  handleAttributeInputChange(`${attr.key}_${input.key}`, newValue.toString());
                                }}
                                className="stepper-button"
                              >
                                +
                              </button>
                            </div>
                                  </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Muscle Description Overlay */}
      {activeMuscleDescription && (
        <div className="muscle-description-overlay" onClick={() => setActiveMuscleDescription(null)}>
          <div className="muscle-description-modal" onClick={(e) => e.stopPropagation()}>
            <div className="muscle-description-header">
              <h2 className="muscle-description-title">{activeMuscleDescription}</h2>
          <button
                className="close-overlay-button"
                onClick={() => setActiveMuscleDescription(null)}
              >
                ×
          </button>
            </div>
            <div className="muscle-description-content">
              <div className="muscle-description-detail">
                <strong>Description:</strong> {getMuscleDescription(activeMuscleDescription).description}
              </div>
              <div className="muscle-description-detail">
                <strong>Location:</strong> {getMuscleDescription(activeMuscleDescription).location}
              </div>
              <div className="muscle-description-detail">
                <strong>Function:</strong> {getMuscleDescription(activeMuscleDescription).function}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS Styles
const styles = `
  .main-layout {
    display: flex;
    gap: var(--space-6);
    min-height: 100vh;
  }

  .muscle-progress-sidebar {
    width: 300px;
    background: var(--bg-secondary);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    border: 2px solid var(--border-primary);
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: var(--space-4);
    height: fit-content;
  }

  .muscle-progress-stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .workout-selection-section {
    background: var(--bg-secondary);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    border: 2px solid var(--border-primary);
    box-shadow: var(--shadow-sm);
  }

  .workout-selection-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--bg-tertiary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-sm);
  }

  .workout-selection-button:hover {
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .button-icon {
    font-size: var(--text-3xl);
  }

  .button-content {
    flex: 1;
    text-align: left;
  }

  .button-title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
  }

  .button-subtitle {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .button-arrow {
    font-size: var(--text-xl);
    color: var(--accent-primary);
    font-weight: var(--font-weight-bold);
  }

  .quick-add-section {
    background: var(--bg-secondary);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    border: 2px solid var(--border-primary);
    box-shadow: var(--shadow-sm);
  }

  .section-title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-4);
  }

  .quick-add-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--space-3);
  }

  .quick-add-workout-card {
    background: var(--bg-tertiary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .quick-add-workout-card:hover {
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .workout-stats-section {
    background: var(--bg-secondary);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    border: 2px solid var(--border-primary);
    box-shadow: var(--shadow-sm);
  }

  .stats-placeholder {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
    padding: var(--space-8);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--space-4);
  }

  .modal-content {
    background: var(--bg-primary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .workout-selection-modal {
    width: 1400px;
  }

  .workout-logging-modal {
    width: 1000px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-6);
    border-bottom: 2px solid var(--border-primary);
    background: var(--bg-secondary);
  }

  .modal-title {
    font-size: var(--text-xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin: 0;
  }

  .modal-close-button {
    background: none;
    border: none;
    font-size: var(--text-2xl);
    cursor: pointer;
    color: var(--text-secondary);
    transition: color 0.3s ease;
    padding: var(--space-2);
    border-radius: var(--radius-md);
  }

  .modal-close-button:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  .modal-body {
    padding: var(--space-6);
    overflow-y: auto;
    flex: 1;
  }

  .workout-logging-body {
    padding: var(--space-10);
  }

  .workout-logging-content {
    display: flex;
    gap: var(--space-6);
    padding: var(--space-6);
  }

  .workout-logging-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .workout-logging-attributes {
    width: 350px;
    max-height: 600px;
    overflow-y: auto;
    padding: var(--space-4);
    background: var(--bg-secondary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
  }

  .back-button {
    padding: var(--space-2) var(--space-4);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .back-button:hover {
    background: var(--bg-hover);
    border-color: var(--accent-primary);
  }

  .workout-filter-section {
    display: flex;
    gap: var(--space-6);
    margin-top: var(--space-4);
    margin-right: var(--space-4);
    margin-left: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .workout-filter-left {
    flex: 1;
  }

  .search-input-container {
    margin-bottom: var(--space-4);
  }

  .filter-controls-row {
    display: flex;
    gap: var(--space-4);
    align-items: center;
    flex-wrap: wrap;
  }

  .filter-controls-multiselect-row {
    display: flex;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
    width: 100%;
    justify-content: space-between;
  }

  .filter-controls-sort-row {
    display: flex;
    gap: var(--space-4);
    align-items: flex-start;
  }

  .filter-group {
    flex: 1;
  }

  .muscle-activation-inputs {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-top: var(--space-3);
    padding: var(--space-4);
    background: var(--bg-secondary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
  }

  .muscle-activation-input-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .muscle-activation-stepper {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .stepper-button {
    width: 32px;
    height: 32px;
    padding: var(--space-1);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-sm);
    font-size: var(--text-base);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stepper-button:hover {
    background: var(--bg-hover);
    border-color: var(--accent-primary);
  }

  .stepper-button:active {
    transform: scale(0.95);
  }

  .muscle-activation-label {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
  }

  .muscle-activation-input {
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    width: 80px;
    text-align: center;
  }

  .muscle-activation-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .workout-filter-right {
    width: 300px;
  }

  .active-filters-container {
    background: var(--bg-secondary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }

  .active-filters-title {
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-3);
    color: var(--text-primary);
  }

  .active-filters-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .active-filters-list > div {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .active-filter-badge {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
  }

  .active-filter-badge button {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: var(--text-lg);
    line-height: 1;
    padding: 0;
    margin-left: var(--space-2);
  }

  .active-filter-badge button:hover {
    color: var(--accent-primary);
  }

  .btn-clear-filters {
    margin-top: var(--space-3);
    width: 100%;
    padding: var(--space-2);
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
  }

  .btn-clear-filters:hover {
    background: var(--accent-dark);
  }

  .form-select-multiselect {
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-lg);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-family: var(--font-primary);
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    height: 220px;
    width: 100%;
    outline: none;
    transition: all 0.3s ease;
  }

  .form-select-multiselect:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-select-multiselect option {
    padding: var(--space-2) var(--space-3);
    margin: var(--space-1) 0;
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-family: var(--font-primary);
    font-size: var(--text-sm);
  }

  .form-select-multiselect option:checked {
    background: rgba(59, 130, 246, 0.2);
    color: var(--accent-primary);
    border: 2px solid white;
    box-shadow: 0 0 0 2px var(--accent-primary);
  }

  .form-select {
    font-family: var(--font-primary);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    background-color: var(--bg-secondary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    transition: all 0.3s ease;
    box-shadow: var(--shadow-sm);
    min-width: 150px;
  }

  .form-select:focus {
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-focus);
    outline: none;
  }

  .btn-secondary {
    font-family: var(--font-primary);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    background-color: var(--bg-secondary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    transition: all 0.3s ease;
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 50px;
    height: 47px;
  }

  .btn-secondary svg {
    width: 24px;
    height: 24px;
  }

  .btn-secondary:hover {
    background-color: var(--bg-hover);
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-md);
  }

  .workout-search-input-field {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    font-size: var(--text-base);
    font-family: var(--font-primary);
    font-weight: var(--font-weight-medium);
    transition: all 0.3s ease;
    box-shadow: var(--shadow-sm);
  }

  .workout-search-input-field::placeholder {
    color: var(--text-secondary);
  }

  .workout-search-input-field:focus {
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-focus);
    outline: none;
  }

  .workout-selection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-4);
    max-height: 60vh;
    overflow-y: auto;
    padding: var(--space-2);
  }

  .workout-selection-card {
    background: var(--bg-secondary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .workout-selection-card:hover {
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .workout-icon {
    font-size: var(--text-2xl);
    text-align: center;
  }

  .workout-content {
    flex: 1;
  }

  .workout-name {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-4);
  }

  .workout-muscles {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .muscle-tag {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    background: var(--bg-tertiary);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    border: 1px solid var(--border-primary);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .muscle-tag:hover {
    background: var(--bg-hover);
    border-color: var(--accent-primary);
    transform: translateY(-1px);
  }

  .muscle-rating {
    color: #ea580c;
    font-weight: var(--font-weight-bold);
    font-size: 0.875rem;
  }

  .muscle-description-icon {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    transition: all 0.3s ease;
    width: 20px;
    height: 20px;
  }

  .muscle-description-icon svg {
    width: 20px;
    height: 20px;
  }

  .muscle-description-icon:hover {
    color: #2563eb;
    transform: scale(1.1);
  }

  .muscle-description-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
  }

  .muscle-description-modal {
    background: var(--bg-primary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow-xl);
  }

  .muscle-description-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-2);
    border-bottom: 2px solid var(--border-primary);
  }

  .muscle-description-title {
    font-size: var(--text-xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin: 0;
  }

  .close-overlay-button {
    background: none;
    border: none;
    font-size: var(--text-2xl);
    cursor: pointer;
    color: var(--text-secondary);
    transition: color 0.3s ease;
  }

  .close-overlay-button:hover {
    color: var(--text-primary);
  }

  .muscle-description-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .muscle-description-detail {
    margin-bottom: var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .workout-info-card {
    background: var(--bg-secondary);
    border: 2px solid var(--border-primary);
    padding: var(--space-4);
  }

  .workout-muscles-info {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .muscle-info-tag {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    background: var(--bg-tertiary);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    border: 1px solid var(--border-primary);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .muscle-info-tag:hover {
    background: var(--bg-hover);
    border-color: var(--accent-primary);
    transform: translateY(-1px);
  }

  .attribute-option {
    padding: var(--space-4);
    border-radius: 0;
    background: var(--bg-secondary);
    border: none;
  }

  .attribute-checkbox {
    width: 18px;
    height: 18px;
    accent-color: var(--accent-color);
  }

  .attribute-label {
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin-left: var(--space-4);
  }

  .form-label {
    display: block;
    font-size: var(--text-xs);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin-bottom: var(--space-1);
    text-align: center;
  }

  .input-stepper {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    justify-content: center;
  }

  .input-stepper .stepper-button {
    width: 40px;
    height: 40px;
    padding: var(--space-1);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-sm);
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .input-stepper .stepper-button:hover {
    background: var(--bg-hover);
    border-color: var(--accent-primary);
  }

  .input-stepper .stepper-button:active {
    transform: scale(0.95);
  }

  .form-input {
    width: 120px;
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    transition: all 0.3s ease;
    text-align: center;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: var(--bg-tertiary);
  }

  .log-workout-button {
    padding: var(--space-4) var(--space-8);
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .log-workout-button:hover:not(:disabled) {
    background: #2563eb;
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .log-workout-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default WorkoutLogger;

