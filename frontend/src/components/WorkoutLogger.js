import React, { useState, useEffect } from 'react';
import { getMuscleDescription } from '../utils/muscleDescriptions';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  InformationCircleIcon,
  ChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import { WORKOUT_TRACKER_CLOSE_BTN_CSS } from '../constants/workoutTrackerCloseButtonCss';
import WorkoutAnalytics from './WorkoutAnalytics';
import {
  WORKOUT_LOG_ATTRIBUTE_OPTIONS as attributeOptions,
  canonicalWorkoutLogAttributesForDisplay,
  sanitizeWorkoutLogAttributesForApi,
} from '../constants/workoutLoggingAttributes';

const WorkoutLogger = ({
  onOpenWorkoutSelection,
  onWorkoutLogged,
  selectedDate,
  onClose,
  preSelectedWorkout,
  initialMuscleFilter = '',
}) => {
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
  const [analyticsWorkout, setAnalyticsWorkout] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [logData, setLogData] = useState({
    weight: '',
    reps: '',
    rir: '',
    attributes: [],
    attributeInputs: {},
    rest_time: ''
  });
  const [isLogging, setIsLogging] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const resetLogData = () => {
    setLogData({
      weight: '',
      reps: '',
      rir: '',
      attributes: [],
      attributeInputs: {},
      rest_time: ''
    });
  };

  const populateLogDataFromWorkout = (workout) => {
    if (workout && workout.recent_log) {
      const recentLog = workout.recent_log;
      const autofillData = {
        weight: recentLog.last_weight ?? '',
        reps: recentLog.last_reps ?? '',
        rir: recentLog.last_rir ?? '',
        attributes: canonicalWorkoutLogAttributesForDisplay(recentLog.last_attributes),
        attributeInputs: recentLog.last_attribute_inputs ? { ...recentLog.last_attribute_inputs } : {},
        rest_time: recentLog.last_rest_time ?? ''
      };
      setLogData(autofillData);
    } else {
      resetLogData();
    }
  };

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
    
    if (preSelectedWorkout) {
      setSelectedWorkout(preSelectedWorkout);
      setShowWorkoutSelectionModal(false);
      setShowWorkoutLoggingModal(true);
      populateLogDataFromWorkout(preSelectedWorkout);
    } else {
      setShowWorkoutLoggingModal(false);
      setSelectedWorkout(null);
      setShowWorkoutSelectionModal(true);
      resetLogData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preSelectedWorkout]);

  useEffect(() => {
    if (!initialMuscleFilter) return;
    setSelectedMuscles([initialMuscleFilter]);
    setMuscleActivationRatings((prev) => ({ ...prev, [initialMuscleFilter]: prev[initialMuscleFilter] ?? '' }));
  }, [initialMuscleFilter]);

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
    populateLogDataFromWorkout(workout);
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
      
      const { attributes, attribute_inputs } = sanitizeWorkoutLogAttributesForApi(
        logData.attributes,
        logData.attributeInputs
      );
      const logPayload = {
        workout: selectedWorkout.workouts_id,
        weight: weight,
        reps: reps,
        rir: rir || null,
        rest_time: rest_time || null,
        attributes,
        attribute_inputs,
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
    <div className="form-container workout-logger">

      {/* Workout Selection Modal */}
      {showWorkoutSelectionModal && (
        <div className="modal-overlay" onClick={closeWorkoutSelectionModal}>
          <div className="modal-content workout-selection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Select Workout to Log</h2>
              <button type="button" className="modal-close-button wk-track-close-btn" onClick={closeWorkoutSelectionModal} aria-label="Close">
                <XMarkIcon className="wk-track-close-icon" strokeWidth={2} aria-hidden />
              </button>
            </div>
            
            <div className="modal-body">
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

              {isMobile && (
                <div className="workout-filter-search-outside">
                  <input
                    type="text"
                    placeholder="Search workouts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="workout-search-input-field"
                  />
                </div>
              )}

              {/* Search and Filter Controls - collapsible on mobile */}
      <details className="workout-filter-details" open={!isMobile}>
        <summary className="workout-filter-details-summary">Filter settings</summary>
      <div className="workout-filter-section">
        <div className="workout-filter-left">
          {!isMobile && (
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search workouts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="workout-search-input-field"
              />
            </div>
          )}
          <div className="filter-controls-multiselect-row">
            <div className="filter-group">
              <select
                multiple
                value={selectedMuscles}
                onChange={(e) => {
                  // `selectedIndex` becomes -1 when the last option is deselected, causing
                  // `clickedOption` to be undefined on mobile. Use `selectedOptions` instead.
                  const selectedValues = Array.from(e.target.selectedOptions, (o) => o.value);

                  setSelectedMuscles(selectedValues);
                  setMuscleActivationRatings(prev => {
                    const next = { ...prev };
                    // Remove ratings for muscles that are no longer selected.
                    Object.keys(next).forEach((key) => {
                      if (!selectedValues.includes(key)) delete next[key];
                    });
                    // Ensure all selected muscles have a rating key.
                    selectedValues.forEach((key) => {
                      if (!(key in next)) next[key] = '';
                    });
                    return next;
                  });
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
                  const selectedValues = Array.from(e.target.selectedOptions, (o) => o.value);
                  setSelectedLocations(selectedValues);
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
                  const selectedValues = Array.from(e.target.selectedOptions, (o) => o.value);
                  setSelectedEquipmentTypes(selectedValues);
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
              type="button"
              className="btn-secondary workout-sort-order-btn"
              aria-label={sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortDirection === 'asc' ? (
                <ChevronDownIcon
                  className={isMobile ? 'workout-sort-dir-icon workout-sort-dir-icon--mobile' : 'workout-sort-dir-icon'}
                  strokeWidth={isMobile ? 3 : 2}
                  aria-hidden
                />
              ) : (
                <ChevronUpIcon
                  className={isMobile ? 'workout-sort-dir-icon workout-sort-dir-icon--mobile' : 'workout-sort-dir-icon'}
                  strokeWidth={isMobile ? 3 : 2}
                  aria-hidden
                />
              )}
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
                    <button
                      type="button"
                      className="wk-track-close-btn wk-track-close-btn--compact"
                      onClick={() => {
                      setSelectedMuscles(prev => prev.filter(m => m !== muscle));
                      setMuscleActivationRatings(prev => {
                        const newRatings = { ...prev };
                        delete newRatings[muscle];
                        return newRatings;
                      });
                    }}
                      aria-label={`Remove ${muscle} filter`}
                    >
                      <XMarkIcon className="wk-track-close-icon" strokeWidth={2} aria-hidden />
                    </button>
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
                  <button
                    type="button"
                    className="wk-track-close-btn wk-track-close-btn--compact"
                    onClick={() => setSelectedLocations(prev => prev.filter(l => l !== location))}
                    aria-label={`Remove location ${location}`}
                  >
                    <XMarkIcon className="wk-track-close-icon" strokeWidth={2} aria-hidden />
                  </button>
                </span>
              ))}
              {selectedEquipmentTypes.map(type => (
                <span key={type} className="active-filter-badge">
                  Equipment: {type}
                  <button
                    type="button"
                    className="wk-track-close-btn wk-track-close-btn--compact"
                    onClick={() => setSelectedEquipmentTypes(prev => prev.filter(t => t !== type))}
                    aria-label={`Remove equipment ${type}`}
                  >
                    <XMarkIcon className="wk-track-close-icon" strokeWidth={2} aria-hidden />
                  </button>
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
      </details>

              {/* Workout Selection Grid */}
              <div className="workout-selection-grid">
          {filteredWorkouts.map(workout => (
                  <div
              key={workout.workouts_id}
                    className="workout-selection-card"
                  >
                    <div className="workout-content" onClick={() => selectWorkout(workout)}>
                      <div className="workout-card-title-block">
                        <div className="workout-name-fade-wrap">
                          <div className="workout-name">{workout.workout_name}</div>
                        </div>
                      </div>
                      {workout.location ? (
                        <div className="workout-card-location" title={workout.location}>
                          {workout.location}
                        </div>
                      ) : null}
                      <table className="workout-muscles-table">
                        <tbody>
                          {workout.muscles.map((muscle) => (
                            <tr
                              key={muscle.muscle_id}
                              className="workout-muscle-table-row"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMuscleClick(muscle.muscle_name);
                              }}
                              title="Click to view muscle description"
                            >
                              <td className="workout-muscle-table-name">{muscle.muscle_name}</td>
                              <td className="workout-muscle-table-rating">{muscle.activation_rating}</td>
                              <td className="workout-muscle-table-info">
                                <InformationCircleIcon className="workout-muscle-table-info-icon" aria-hidden />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      className="workout-analytics-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnalyticsWorkout(workout);
                        setShowAnalytics(true);
                      }}
                      title="View Analytics"
                    >
                      <ChartBarIcon className="w-6 h-6" />
                    </button>
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
            <div className="modal-header workout-logging-modal-header">
              <button 
                className="back-button"
                onClick={goBackToWorkoutSelection}
                title="Back to Workouts"
              >
                <span className="back-button-arrow" aria-hidden="true">←</span>
                <span className="back-button-text">Back to Workouts</span>
              </button>
              <h2 className="modal-title">{selectedWorkout.workout_name}</h2>
              <button
                type="button"
                className="workout-analytics-button-header"
                onClick={(e) => {
                  e.stopPropagation();
                  setAnalyticsWorkout(selectedWorkout);
                  setShowAnalytics(true);
                }}
                title="View Analytics"
              >
                <ChartBarIcon className="w-6 h-6" />
              </button>
              <button type="button" className="modal-close-button wk-track-close-btn" onClick={closeWorkoutLoggingModal} aria-label="Close">
                <XMarkIcon className="wk-track-close-icon" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="modal-body workout-logging-body">
              <div className="workout-logging-content">
                <div className="workout-logging-main">
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
                  {!isMobile && (
                    <div className="flex justify-center workout-logging-log-button-wrap">
                      <button
                        onClick={handleLogWorkout}
                        disabled={isLogging || !logData.weight || !logData.reps}
                        className="btn-primary log-workout-button"
                      >
                        {isLogging ? 'Logging Workout...' : 'Log Workout'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Set modifiers: keys defined in `constants/workoutLoggingAttributes.js` (must match dashboard). */}
                <details className="workout-logging-attributes-details" open={!isMobile}>
                  <summary
                    className="workout-logging-attributes-summary"
                    onClick={(e) => {
                      // On desktop the attributes panel should always stay expanded.
                      if (!isMobile) e.preventDefault();
                    }}
                  >
                    Attributes
                  </summary>
                <div className="workout-logging-attributes">
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
                </details>

                {/* On mobile, place Log Workout button below Attributes */}
                {isMobile && (
                  <div className="flex justify-center workout-logging-log-button-wrap">
                    <button
                      onClick={handleLogWorkout}
                      disabled={isLogging || !logData.weight || !logData.reps}
                      className="btn-primary log-workout-button"
                    >
                      {isLogging ? 'Logging Workout...' : 'Log Workout'}
                    </button>
                  </div>
                )}
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
                type="button"
                className="close-overlay-button wk-track-close-btn"
                onClick={() => setActiveMuscleDescription(null)}
                aria-label="Close"
          >
                <XMarkIcon className="wk-track-close-icon" strokeWidth={2} aria-hidden />
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

      {/* Workout Analytics Modal */}
      {showAnalytics && analyticsWorkout && (
        <WorkoutAnalytics
          workout={analyticsWorkout}
          isOpen={showAnalytics}
          onClose={() => {
            setShowAnalytics(false);
            setAnalyticsWorkout(null);
          }}
        />
      )}
    </div>
  );
};

// CSS Styles
const styles = `
${WORKOUT_TRACKER_CLOSE_BTN_CSS}
  .workout-logger .main-layout {
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

  .workout-logger .main-content {
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

  @keyframes selectionModalLift {
    from {
      opacity: 0;
      transform: translateY(14px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .workout-selection-modal {
    width: 1400px;
    animation: selectionModalLift 0.25s var(--ease-out-cubic);
  }

  .workout-logging-modal {
    width: 1000px;
    animation: selectionModalLift 0.25s var(--ease-out-cubic);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-6);
    border-bottom: 2px solid var(--border-primary);
    background: var(--bg-secondary);
  }

  .modal-header-actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .workout-logging-modal .modal-header {
    background: transparent;
  }

  .workout-selection-modal .modal-header {
    background: transparent;
  }

  .workout-logging-modal .modal-header-actions {
    gap: var(--space-4);
  }

  @media (min-width: 769px) {
    .workout-logging-modal .modal-header-actions {
      gap: var(--space-8);
    }
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

  .modal-close-button.wk-track-close-btn {
    font-size: 0;
    padding: 0;
  }

  .modal-close-button:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  .active-filter-badge .wk-track-close-btn {
    margin-left: var(--space-2);
    flex-shrink: 0;
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

  .back-button-arrow {
    display: none;
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

  .workout-selection-modal .filter-controls-sort-row .btn-secondary.workout-sort-order-btn {
    flex-shrink: 0;
    width: 40px;
    min-width: 40px;
    height: 47px;
    padding: var(--space-2);
    display: flex;
    align-items: center;
    justify-content: center;
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
    color: #000000;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
  }

  .btn-clear-filters:hover {
    background: var(--accent-primary);
    color: #000000;
  }

  .workout-logger .form-select-multiselect {
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

  .workout-logger .form-select-multiselect:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .workout-logger .form-select-multiselect option {
    padding: var(--space-2) var(--space-3);
    margin: var(--space-1) 0;
    border-radius: var(--radius-sm);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-family: var(--font-primary);
    font-size: var(--text-sm);
  }

  .workout-logger .form-select-multiselect option:checked {
    background: rgba(59, 130, 246, 0.2);
    color: var(--accent-primary);
    border: 2px solid white;
    box-shadow: 0 0 0 2px var(--accent-primary);
  }

  .workout-logger .form-select {
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

  .workout-logger .form-select:focus {
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-focus);
    outline: none;
  }

  .workout-logger .workout-selection-modal .form-select {
    height: 47px;
  }

  .workout-logger .btn-secondary {
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

  .workout-logger .btn-secondary svg {
    width: 24px;
    height: 24px;
  }

  .workout-logger .btn-secondary:hover {
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
    align-items: start;
  }

  .workout-selection-card {
    background: var(--bg-secondary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    cursor: pointer;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    position: relative;
    min-width: 0;
    overflow: hidden;
    align-self: start;
  }

  .workout-selection-card > * {
    min-width: 0;
  }

  .workout-selection-card:hover {
    border-color: var(--accent-primary);
    box-shadow: var(--shadow-md);
  }

  .workout-analytics-button {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    background: var(--bg-tertiary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    flex-shrink: 0;
  }

  .workout-analytics-button svg {
    width: 24px;
    height: 24px;
    display: block;
  }

  .workout-analytics-button:hover {
    background: var(--bg-hover);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    transform: scale(1.1);
  }

  .workout-analytics-button-header {
    background: var(--bg-tertiary);
    border: 2px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .workout-analytics-button-header svg {
    width: 24px;
    height: 24px;
    display: block;
  }

  .workout-analytics-button-header:hover {
    background: var(--bg-hover);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    transform: scale(1.1);
  }

  .workout-icon {
    font-size: var(--text-2xl);
    text-align: center;
  }

  .workout-content {
    flex: 0 1 auto;
    min-width: 0;
  }

  .workout-card-title-block {
    padding-right: 3rem;
    margin-bottom: var(--space-2);
    min-width: 0;
  }

  .workout-name-fade-wrap {
    position: relative;
    overflow: hidden;
    min-width: 0;
    max-width: 100%;
  }

  .workout-name-fade-wrap::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 2rem;
    pointer-events: none;
    background: linear-gradient(to right, transparent, var(--bg-secondary));
  }

  .workout-name {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    line-height: 1.3;
  }

  .workout-card-location {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-2);
    line-height: 1.35;
    word-break: break-word;
  }

  .workout-muscles-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
    margin: 0;
  }

  .workout-muscle-table-row {
    cursor: pointer;
    border-bottom: 1px solid var(--border-primary);
    transition: background 0.15s ease;
  }

  .workout-muscle-table-row:last-child {
    border-bottom: none;
  }

  .workout-muscle-table-row:hover {
    background: var(--bg-tertiary);
  }

  .workout-muscle-table-name,
  .workout-muscle-table-rating,
  .workout-muscle-table-info {
    padding: var(--space-2) var(--space-2);
    vertical-align: middle;
  }

  .workout-muscle-table-name {
    text-align: left;
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    width: 55%;
  }

  .workout-muscle-table-rating {
    text-align: center;
    color: #fdba74;
    font-weight: var(--font-weight-bold);
    width: 28%;
  }

  .workout-muscle-table-info {
    text-align: right;
    width: 17%;
  }

  .workout-muscle-table-info-icon {
    width: 1.25rem;
    height: 1.25rem;
    color: #3b82f6;
    display: inline-block;
    vertical-align: middle;
  }

  .workout-sort-dir-icon {
    width: 1rem;
    height: 1rem;
  }

  .workout-sort-dir-icon--mobile {
    width: 0.42rem;
    height: 0.42rem;
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

  .close-overlay-button.wk-track-close-btn {
    font-size: 0;
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

  .attribute-option {
    padding: var(--space-4);
    border-radius: 0;
    background: var(--bg-secondary);
    border: none;
  }

  .attribute-checkbox {
    width: 18px !important;
    height: 18px !important;
    min-width: 18px !important;
    min-height: 18px !important;
    max-width: 18px !important;
    max-height: 18px !important;
    flex-shrink: 0;
    box-sizing: border-box;
    margin: 0;
    vertical-align: middle;
    accent-color: #2563eb;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: #ffffff;
  }

  .attribute-checkbox:checked {
    accent-color: #2563eb;
    border-color: #2563eb;
  }

  .attribute-label {
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
    margin-left: var(--space-4);
  }

  .workout-logger .form-label {
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

  .workout-logger .form-input {
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

  .workout-logger .form-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: var(--bg-tertiary);
  }

  .workout-logging-modal .log-workout-button.btn-primary,
  .workout-logging-modal .log-workout-button {
    padding: var(--space-4) var(--space-8);
    background: #3b82f6;
    color: var(--bg-primary);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .workout-logging-modal .log-workout-button.btn-primary:hover:not(:disabled),
  .workout-logging-modal .log-workout-button:hover:not(:disabled) {
    background: #2563eb;
    color: var(--bg-primary);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    filter: none;
  }

  .log-workout-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .workout-selection-modal {
      width: 100%;
      max-width: 100%;
      height: 90vh;
      max-height: 90vh;
    }

    .workout-selection-modal .modal-header {
      background: transparent;
      padding: var(--space-4);
    }

    .workout-selection-modal .modal-title {
      font-size: var(--text-lg);
    }

    .workout-filter-search-outside {
      margin-bottom: var(--space-3);
    }

    .workout-filter-details-summary {
      list-style: none;
      cursor: pointer;
      padding: var(--space-3) var(--space-4);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      font-weight: var(--font-weight-medium);
      font-size: var(--text-sm);
      margin: 0 var(--space-2) var(--space-2) var(--space-2);
      box-sizing: border-box;
    }

    .workout-filter-details-summary::-webkit-details-marker {
      display: none;
    }

    .back-button {
      max-width: 52px;
      min-width: 44px;
      padding: var(--space-2);
    }

    .back-button-text {
      display: none;
    }

    .back-button-arrow {
      display: inline;
      font-size: var(--text-xl);
    }

    .workout-filter-section {
      flex-direction: column;
      gap: var(--space-3);
    }

    .workout-filter-left,
    .workout-filter-right {
      width: 100%;
    }

    .filter-controls-multiselect-row {
      flex-direction: column;
    }

    .workout-logging-attributes-details {
      width: 100%;
    }

    .workout-logging-attributes-summary {
      list-style: none;
      cursor: pointer;
      padding: var(--space-2) var(--space-3);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-md);
      font-weight: var(--font-weight-medium);
      -webkit-tap-highlight-color: transparent;
    }

    .workout-logging-attributes-summary::-webkit-details-marker {
      display: none;
    }

    .workout-logging-attributes {
      width: 100%;
      max-width: 100%;
    }

    .workout-logging-content {
      flex-direction: column;
    }

    .workout-selection-modal .btn-clear-filters {
      background: #2563eb;
      color: #000000 !important;
      border: 1px solid #1d4ed8;
    }

    .workout-selection-modal .btn-clear-filters:hover {
      background: #2563eb;
      border-color: #1d4ed8;
      color: #000000 !important;
    }

    .workout-filter-search-outside {
      padding-left: var(--space-4);
      padding-right: var(--space-4);
      box-sizing: border-box;
    }

    .workout-selection-modal .modal-body {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .workout-selection-modal {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .workout-selection-modal .modal-header {
      flex-shrink: 0;
    }

    .workout-selection-grid {
      flex: 0 1 auto;
      min-height: 0;
      max-height: none;
      grid-auto-rows: min-content;
      align-content: start;
    }

    .workout-logger .form-select-multiselect {
      height: 110px;
    }

    .filter-controls-sort-row {
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;
      gap: var(--space-2);
      width: 100%;
    }

    .filter-controls-sort-row .filter-group {
      flex: 1 1 0;
      min-width: 0;
    }

    .filter-controls-sort-row .form-select {
      width: 100%;
      min-width: 0;
      font-size: var(--text-xs);
      padding: var(--space-2) var(--space-2);
    }

    .filter-controls-sort-row .btn-secondary.workout-sort-order-btn {
      flex-shrink: 0;
      width: 40px;
      min-width: 40px;
      min-height: 47px;
      height: 47px;
      padding: var(--space-2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Override .workout-logger .btn-secondary svg { 24px } — shrink only the sort chevron */
    .workout-logger .workout-selection-modal .filter-controls-sort-row .btn-secondary.workout-sort-order-btn svg {
      width: 14px !important;
      height: 14px !important;
      max-width: 14px !important;
      max-height: 14px !important;
    }

    /* Block layout avoids column-flex stretching so the card hugs the muscle table */
    .workout-selection-modal .workout-selection-card {
      display: block;
    }

    .workout-selection-modal .workout-selection-card .workout-content {
      display: block;
      width: 100%;
      flex: none;
      min-height: 0;
    }

    .workout-selection-modal .workout-muscles-table {
      height: auto;
      table-layout: auto;
    }

    .workout-selection-modal .workout-muscle-table-name,
    .workout-selection-modal .workout-muscle-table-rating,
    .workout-selection-modal .workout-muscle-table-info {
      padding: 2px 4px;
    }

    .workout-selection-modal .workout-muscle-table-info-icon {
      width: 1rem;
      height: 1rem;
    }

    .workout-selection-card {
      padding: var(--space-3);
      gap: var(--space-2);
      height: auto;
      min-height: 0;
      max-height: none;
    }

    .workout-card-title-block {
      margin-bottom: var(--space-1);
    }

    .workout-card-location {
      margin-bottom: var(--space-1);
      font-size: var(--text-xs);
      line-height: 1.3;
    }

    .workout-name-fade-wrap::after {
      width: 2.5rem;
    }

    .workout-logging-modal .modal-header {
      background: transparent;
      padding: var(--space-4);
      display: grid;
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto auto;
      column-gap: var(--space-2);
      row-gap: var(--space-2);
      align-items: center;
    }

    .workout-logging-modal .modal-title {
      grid-column: 1 / -1;
      grid-row: 1;
      justify-self: center;
      text-align: center;
      font-size: var(--text-xl);
      margin: 0;
    }

    .workout-logging-modal .back-button {
      grid-column: 1;
      grid-row: 2;
      background: transparent;
      border: none;
      padding: var(--space-1) var(--space-2);
      min-width: auto;
      max-width: 40px;
      -webkit-tap-highlight-color: transparent;
    }

    .workout-logging-modal .back-button:hover {
      background: transparent;
      border-color: transparent;
    }

    .workout-logging-modal .workout-analytics-button-header {
      grid-column: 2;
      grid-row: 2;
      justify-self: center;
      -webkit-tap-highlight-color: transparent;
    }

    .workout-logging-modal .modal-close-button {
      grid-column: 3;
      grid-row: 2;
      justify-self: end;
      -webkit-tap-highlight-color: transparent;
    }

    .workout-logging-modal .back-button-arrow {
      font-size: 1.85rem;
      font-weight: 900;
      line-height: 1;
      display: inline-block;
      transform: scaleX(0.75);
      -webkit-text-stroke: 0.055em currentColor;
      paint-order: stroke fill;
    }

    .workout-logging-modal button,
    .workout-logging-modal .stepper-button,
    .workout-logging-modal .log-workout-button {
      -webkit-tap-highlight-color: transparent;
    }

    .workout-logging-modal .workout-logging-attributes-details {
      order: 2;
    }

    .workout-logging-modal .workout-logging-log-button-wrap {
      order: 3;
    }
  }

  @media (min-width: 769px) {
    .workout-filter-details-summary {
      display: none;
    }

    .workout-logging-attributes-details > .workout-logging-attributes-summary {
      list-style: none;
    }

    .workout-logging-attributes-details > .workout-logging-attributes-summary::-webkit-details-marker {
      display: none;
    }

    .workout-logging-attributes-details > .workout-logging-attributes-summary::marker {
      content: '';
    }

    .workout-logging-modal .modal-header {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: var(--space-3);
      justify-content: flex-start;
    }

    .workout-logging-modal .back-button {
      flex-shrink: 0;
    }

    .workout-logging-modal .modal-title {
      flex: 1;
      text-align: center;
      min-width: 0;
      margin: 0;
    }

    .workout-logging-modal .workout-analytics-button-header,
    .workout-logging-modal .modal-close-button {
      flex-shrink: 0;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default WorkoutLogger;

