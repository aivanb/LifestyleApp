import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import WorkoutLogger from './WorkoutLogger';
import WorkoutAdder from './WorkoutAdder';
import { LinearProgressBar } from './ProgressBar';

/**
 * WorkoutLoggingDashboard Component
 * 
 * Main interface for workout logging with PC/mobile responsive design.
 * Features:
 * - Workout log list with time-based separation
 * - Integrated workout logging and creation
 * - Responsive layout for PC and mobile
 * - Real-time data from database
 */
const WorkoutLoggingDashboard = () => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [workoutStats, setWorkoutStats] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => {
    // Use EST timezone for date calculation
    const now = new Date();
    // Get the date in EST timezone
    const estDate = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    // Format as YYYY-MM-DD
    const year = estDate.getFullYear();
    const month = String(estDate.getMonth() + 1).padStart(2, '0');
    const day = String(estDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showWorkoutCreator, setShowWorkoutCreator] = useState(false);
  const [showWorkoutSelectionModal, setShowWorkoutSelectionModal] = useState(false);
  const [preSelectedWorkout, setPreSelectedWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [currentSplitDay, setCurrentSplitDay] = useState(null);
  const [muscleProgress, setMuscleProgress] = useState({});
  const [previousDayWorkouts, setPreviousDayWorkouts] = useState([]);

  const loadWorkoutLogs = useCallback(async () => {
    try {
      console.log('Loading workout logs for date:', selectedDate);
      const response = await api.getWorkoutLogs({ 
        date_from: selectedDate, 
        date_to: selectedDate 
      });
      console.log('Workout logs response:', response.data);
      if (response.data.data) {
        console.log('Setting workout logs:', response.data.data);
        setWorkoutLogs(response.data.data);
      } else {
        console.log('No workout logs data in response');
        setWorkoutLogs([]);
      }
    } catch (err) {
      console.error('Failed to load workout logs:', err);
      setError('Failed to load workout logs');
    }
  }, [selectedDate]);

  const loadWorkoutStats = useCallback(async () => {
    try {
      const response = await api.getWorkoutStats({ 
        date_from: selectedDate, 
        date_to: selectedDate 
      });
      if (response.data.data) {
        setWorkoutStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load workout stats:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadSplitData = useCallback(async (targetDate = null) => {
    try {
      console.log('Loading split data...');
      const response = await api.get('/workouts/splits/');
      if (response.data.success && response.data.data.length > 0) {
        const split = response.data.data[0];
        console.log('Active split:', split);
        
        const currentDate = targetDate ? new Date(targetDate) : new Date();
        const startDate = new Date(split.start_date);
        const daysDiff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        const splitLength = split.split_days.length;
        const currentDayIndex = daysDiff % splitLength;
        
        console.log('Current day index:', currentDayIndex);
        console.log('Current split day:', split.split_days[currentDayIndex]);
        
        setCurrentSplitDay(split.split_days[currentDayIndex]);
        
        await loadMuscleProgress(split.split_days[currentDayIndex], targetDate);
      }
    } catch (error) {
      console.error('Failed to load split data:', error);
    }
  }, []);

  const loadMuscleProgress = async (splitDay, targetDate = null) => {
    try {
      console.log('Loading muscle progress for split day:', splitDay);
      const today = targetDate ? new Date(targetDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const response = await api.get(`/workouts/logs/?date_from=${today}&date_to=${today}`);
      
      if (response.data.success) {
        const logs = response.data.data;
        const progress = {};
        const allMuscles = new Set(); // Track all muscles from workouts
        const musclesNotInSplit = {}; // Track muscles not in split
        
        console.log('Split day targets:', splitDay.targets);
        
        // Initialize targets from split
        if (splitDay.targets && splitDay.targets.length > 0) {
          splitDay.targets.forEach(target => {
            progress[target.muscle_name] = {
              target: target.target_activation,
              current: 0,
              muscleGroup: target.muscle_group,
              isInSplit: true
            };
          });
        }
        
        // Calculate current activation from workout logs
        logs.forEach(log => {
          if (log.workout && log.workout.muscles) {
            log.workout.muscles.forEach(muscle => {
              const muscleName = muscle.muscle_name;
              const activation = muscle.activation_rating || 0;
              allMuscles.add(muscleName);
              
              if (progress[muscleName]) {
                // Muscle is in split, add to current
                progress[muscleName].current += activation;
              } else {
                // Muscle not in split, track separately
                if (!musclesNotInSplit[muscleName]) {
                  musclesNotInSplit[muscleName] = {
                    target: 100,
                    current: 100,
                    muscleGroup: muscle.muscle_group || 'Other',
                    isInSplit: false
                  };
                } else {
                  // Keep it at 100% (full bar)
                  musclesNotInSplit[muscleName].current = 100;
                }
              }
            });
          }
        });
        
        // Add muscles not in split to progress
        Object.entries(musclesNotInSplit).forEach(([muscleName, data]) => {
          progress[muscleName] = data;
        });
        
        console.log('Muscle progress set:', progress);
        setMuscleProgress(progress);
      }
    } catch (error) {
      console.error('Failed to load muscle progress:', error);
    }
  };

  const loadPreviousDayWorkouts = async (targetDate = null) => {
    try {
      console.log('Loading previous day workouts for date:', targetDate);
      // Calculate the previous day's date based on split
      const currentDate = targetDate ? new Date(targetDate) : new Date();
      const response = await api.get('/workouts/splits/');
      
      if (response.data.success && response.data.data.length > 0) {
        const split = response.data.data[0];
        const startDate = new Date(split.start_date);
        const daysDiff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        const splitLength = split.split_days.length;
        
        // Calculate previous day index
        const currentDayIndex = daysDiff % splitLength;
        const previousDayIndex = (currentDayIndex - 1 + splitLength) % splitLength;
        // eslint-disable-next-line no-unused-vars
        const previousSplitDay = split.split_days[previousDayIndex];
        
        console.log('Previous day index:', previousDayIndex);
        console.log('Previous split day:', previousSplitDay);
        
        // Calculate the actual date for the previous split day
        const previousDate = new Date(startDate);
        previousDate.setDate(startDate.getDate() + previousDayIndex);
        const previousDateStr = previousDate.toISOString().split('T')[0];
        
        console.log('Previous date calculated:', previousDateStr);
        console.log('Previous day index:', previousDayIndex);
        console.log('Start date:', startDate.toISOString().split('T')[0]);
        
        // Get workouts logged on the previous day
        const logsResponse = await api.get(`/workouts/logs/?date_from=${previousDateStr}&date_to=${previousDateStr}`);
        
        if (logsResponse.data.success) {
          const previousDayLogs = logsResponse.data.data;
          console.log('Previous day logs:', previousDayLogs);
          
          // Extract unique workouts from the logs
          const uniqueWorkouts = [];
          const seenWorkoutIds = new Set();
          
          previousDayLogs.forEach(log => {
            if (log.workout && !seenWorkoutIds.has(log.workout.workouts_id)) {
              seenWorkoutIds.add(log.workout.workouts_id);
              uniqueWorkouts.push(log.workout);
            }
          });
          
          console.log('Unique workouts from previous day:', uniqueWorkouts);
          setPreviousDayWorkouts(uniqueWorkouts);
        }
      }
    } catch (error) {
      console.error('Failed to load previous day workouts:', error);
    }
  };


  useEffect(() => {
    loadWorkoutLogs();
    loadWorkoutStats();
    loadSplitData(selectedDate);
    loadPreviousDayWorkouts(selectedDate);
  }, [selectedDate, loadWorkoutLogs, loadWorkoutStats, loadSplitData]);


  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const getSortedWorkoutLogs = () => {
    const sorted = [...workoutLogs].sort((a, b) => {
      const dateA = new Date(a.date_time);
      const dateB = new Date(b.date_time);
      return dateB - dateA; // Sort descending (latest first)
    });
    return sorted;
  };


  const handleWorkoutLogged = async () => {
    // Refresh data immediately with a small delay to ensure API call completes
    await loadWorkoutLogs();
    await loadWorkoutStats();
    await loadSplitData(selectedDate);
  };

  const handleWorkoutCreated = () => {
    loadWorkoutLogs();
    setShowWorkoutCreator(false);
  };

  const deleteWorkoutLog = async (logId) => {
    try {
      await api.deleteWorkoutLog(logId);
      loadWorkoutLogs();
      loadWorkoutStats();
    } catch (err) {
      console.error('Failed to delete workout log:', err);
    }
  };


  const getWorkoutIcon = (workoutName) => {
    // Extract emoji from workout name if present
    const emojiMatch = workoutName.match(/^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
    return emojiMatch ? emojiMatch[0] : '🏋️';
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      days.push({
        day: currentDate.getDate(),
        date: dateString,
        isCurrentMonth: currentDate.getMonth() === month
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const handleCustomDateSelect = (date) => {
    setSelectedDate(date);
    setShowCustomCalendar(false);
    handleDateChange(date);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCustomCalendar && !event.target.closest('.custom-date-picker')) {
        setShowCustomCalendar(false);
      }
    };

    if (showCustomCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCustomCalendar]);

  const isMobile = window.innerWidth <= 768;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading workout logging dashboard...</p>
      </div>
    );
  }

  return (
    <div className="workout-logging-dashboard">
      {/* Header */}
      <div className="dashboard-header">
          <div className="header-content">
            {/* Left side - Calendar */}
            <div className="header-left">
              <div className="controls-section">
                <div className="custom-date-picker">
                  <input
                    type="text"
                    value={selectedDate}
                    readOnly
                    className="form-input date-input"
                    onClick={() => setShowCustomCalendar(!showCustomCalendar)}
                    title="Click to open calendar"
                  />
                  {showCustomCalendar && (
                    <div className="custom-calendar-popup">
                      <div className="calendar-header">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                          ←
                        </button>
                        <span>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                          →
                        </button>
                      </div>
                      <div className="calendar-grid">
                        <div className="calendar-day-header">Sun</div>
                        <div className="calendar-day-header">Mon</div>
                        <div className="calendar-day-header">Tue</div>
                        <div className="calendar-day-header">Wed</div>
                        <div className="calendar-day-header">Thu</div>
                        <div className="calendar-day-header">Fri</div>
                        <div className="calendar-day-header">Sat</div>
                        {getCalendarDays().map((day, index) => (
                          <button
                            key={index}
                            className={`calendar-day ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${day.date === selectedDate ? 'selected' : ''}`}
                            onClick={() => handleCustomDateSelect(day.date)}
                            disabled={!day.isCurrentMonth}
                          >
                            {day.day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center - Title */}
            <div className="header-center">
              <div className="header-title">
                Workout Tracker
              </div>
            </div>
            
            {/* Right side - Action Buttons */}
            <div className="header-actions">
              <button
                className="btn-secondary-header"
                onClick={() => setShowWorkoutSelectionModal(true)}
                title="Select Workout"
              >
                <span>Select Workout</span>
              </button>
              <button
                className="btn-primary-header"
                onClick={() => setShowWorkoutCreator(true)}
                title="Create Workout"
              >
                <span>Create Workout</span>
              </button>
            </div>
          </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* PC Layout */}
        {!isMobile && (
          <div className="dashboard-layout-pc">
            {/* Left Side - Muscle Progress Sidebar */}
            {currentSplitDay && (
              <div className="muscle-progress-sidebar">
                <h3 className="section-title">Today's Muscle Targets</h3>
                {Object.keys(muscleProgress).length > 0 ? (
                  <div className="muscle-progress-stack">
                    {/* Render muscles in split first */}
                    {Object.entries(muscleProgress)
                      .filter(([_, progress]) => progress.isInSplit)
                      .map(([muscleName, progress]) => (
                        <LinearProgressBar
                          key={muscleName}
                          current={progress.current}
                          target={progress.target}
                          label={muscleName}
                          unit=""
                          color="var(--accent-primary)"
                          height={12}
                          showValues={true}
                          showRemaining={true}
                        />
                      ))}
                    {/* Render muscles not in split below in red */}
                    {Object.entries(muscleProgress)
                      .filter(([_, progress]) => !progress.isInSplit)
                      .map(([muscleName, progress]) => (
                        <LinearProgressBar
                          key={muscleName}
                          current={progress.current}
                          target={progress.target}
                          label={muscleName}
                          unit=""
                          color="var(--accent-danger)"
                          height={12}
                          showValues={true}
                          showRemaining={true}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="no-progress-message">
                    <p>No muscle targets available for today.</p>
                    <p>Current split day: {currentSplitDay?.day_name}</p>
                    <p>Muscle progress keys: {Object.keys(muscleProgress).length}</p>
                  </div>
                )}
              </div>
            )}

            {/* Right Side - Main Content Sections */}
            <div className="main-content-sections">
              {/* Workout Stats */}
              <div className="workout-stats-section card">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{workoutStats.total_sets || 0}</div>
                    <div className="stat-label">Total Sets</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{workoutStats.total_weight_lifted || 0}</div>
                    <div className="stat-label">Weight Lifted (lbs)</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{workoutStats.total_reps || 0}</div>
                    <div className="stat-label">Total Reps</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{workoutStats.total_rir || 0}</div>
                    <div className="stat-label">Total RIR</div>
                  </div>
                </div>
              </div>

              {/* Quick Add Section */}
              <div className="quick-add-section card">
                <h3 className="section-title">Quick Add - Previous Day Workouts</h3>
                {previousDayWorkouts.length > 0 ? (
                  <div className="quick-add-grid">
                    {previousDayWorkouts.slice(0, 6).map(workout => (
                      <button
                        key={workout.workouts_id}
                        className="quick-add-workout-card"
                        onClick={() => {
                          setPreSelectedWorkout(workout);
                          setShowWorkoutSelectionModal(true);
                        }}
                      >
                        <div className="workout-icon">{getWorkoutIcon(workout.type)}</div>
                        <div className="workout-name">{workout.workout_name}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="no-quick-add-message">
                    <p>No workouts from previous day available.</p>
                    <p>Previous day workouts count: {previousDayWorkouts.length}</p>
                    <p>Current split day: {currentSplitDay?.day_name}</p>
                  </div>
                )}
              </div>

              {/* Workout Log List */}
              <div className="workout-log-section card">
                <div className="workout-log-list">
                  {getSortedWorkoutLogs().length === 0 ? (
                    <div className="empty-state">
                      <p>No workouts logged yet. Start logging your workouts!</p>
                    </div>
                  ) : (
                    <div className="workout-log-items">
                      {(() => {
                        const sortedLogs = getSortedWorkoutLogs();
                        console.log('Sorted logs for rendering:', sortedLogs.length, sortedLogs);
                        
                        // Group logs by workout ID
                        const groupedByWorkout = {};
                        sortedLogs.forEach(log => {
                          // Check multiple possible property paths for workout ID
                          const workoutId = log.workout?.workouts_id || log.workout?.workout_id || log.workout_id;
                          console.log('Processing log:', log.workout_log_id, 'workout object:', log.workout, 'workout_id:', workoutId);
                          if (workoutId) {
                            if (!groupedByWorkout[workoutId]) {
                              groupedByWorkout[workoutId] = [];
                            }
                            groupedByWorkout[workoutId].push(log);
                          } else {
                            console.warn('Log has no workout_id:', log);
                          }
                        });
                        
                        console.log('Grouped workouts:', Object.keys(groupedByWorkout).length, groupedByWorkout);

                        // Render each set (grouped by workout)
                        return Object.entries(groupedByWorkout).map(([workoutId, logs]) => {
                          // Calculate set totals
                          const totalLogs = logs.length;
                          const totalWeight = logs.reduce((sum, log) => sum + parseFloat(log.weight || 0), 0);
                          const averageWeight = totalLogs > 0 ? (totalWeight / totalLogs).toFixed(0) : 0;
                          const totalReps = logs.reduce((sum, log) => sum + parseInt(log.reps || 0), 0);
                          const totalRir = logs.reduce((sum, log) => sum + parseInt(log.rir || 0), 0);
                          const totalRestTime = logs.reduce((sum, log) => sum + parseInt(log.rest_time || 0), 0);
                          
                          const workout = logs[0].workout;
                          const workoutName = workout?.workout_name || 'Unknown Workout';
                          
                          // Extract emoji from workout name
                          const emojiMatch = workoutName.match(/^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
                          const workoutEmoji = emojiMatch ? emojiMatch[0] : '🏋️';
                          
                          // Extract workout name without emoji
                          let nameWithoutEmoji = workoutName.replace(/^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u, '').trim();
                          
                          // If the entire name was just an emoji, use the full name as fallback
                          if (!nameWithoutEmoji) {
                            nameWithoutEmoji = workoutName;
                          }
                          
                          // Collect unique muscles from all logs
                          const uniqueMuscles = new Set();
                          logs.forEach(log => {
                            if (log.workout?.muscles) {
                              log.workout.muscles.forEach(muscle => {
                                uniqueMuscles.add(muscle.muscle_name);
                              });
                            }
                          });
                          
                          // Collect unique attributes from all logs
                          const uniqueAttributes = new Set();
                          logs.forEach(log => {
                            if (log.attributes && Array.isArray(log.attributes)) {
                              log.attributes.forEach(attr => uniqueAttributes.add(attr));
                            }
                          });

                        return (
                          <div key={workoutId} className="workout-set-group">
                            <div className="workout-set-header">
                              <div className="workout-emoji-box">{workoutEmoji}</div>
                              <div className="workout-details">
                                <div className="workout-name">{nameWithoutEmoji}</div>
                              </div>
                              <button
                                className="btn-add-set"
                                onClick={() => {
                                  setPreSelectedWorkout(workout);
                                  setShowWorkoutSelectionModal(true);
                                }}
                                title="Add another set"
                              >
                                + Add Set
                              </button>
                            </div>
                            <div className="workout-set-totals">
                              <div className="metric-item">
                                <span className="metric-value">{averageWeight}</span>
                                <span className="metric-label">Avg Weight (lbs)</span>
                              </div>
                              <div className="metric-item">
                                <span className="metric-value">{totalReps}</span>
                                <span className="metric-label">Total Reps</span>
                              </div>
                              <div className="metric-item">
                                <span className="metric-value">{totalRir}</span>
                                <span className="metric-label">Total RIR</span>
                              </div>
                              <div className="metric-item">
                                <span className="metric-value">{totalRestTime}</span>
                                <span className="metric-label">Rest (s)</span>
                              </div>
                              {uniqueMuscles.size > 0 && (
                                <div className="metric-item full-width">
                                  <span className="metric-label">Muscles: {Array.from(uniqueMuscles).join(', ')}</span>
                                </div>
                              )}
                              {uniqueAttributes.size > 0 && (
                                <div className="metric-item full-width">
                                  <span className="metric-label">Attributes: {Array.from(uniqueAttributes).join(', ')}</span>
                                </div>
                              )}
                            </div>
                            <div className="workout-set-logs">
                              {logs.map((log) => (
                                <div key={log.workout_log_id} className="workout-log-item">
                                  <div className="workout-info">
                                    <div className="workout-details">
                                      <div className="workout-log-line">
                                        <div className="workout-log-metric">
                                          <span className="metric-label-small">Weight</span>
                                          <span className="metric-value-small">{Math.round(log.weight) || 0} lbs</span>
                                        </div>
                                        <div className="workout-log-metric">
                                          <span className="metric-label-small">Reps</span>
                                          <span className="metric-value-small">{log.reps || 0}</span>
                                        </div>
                                        <div className="workout-log-metric">
                                          <span className="metric-label-small">RIR</span>
                                          <span className="metric-value-small">{log.rir || 0}</span>
                                        </div>
                                        <div className="workout-log-metric">
                                          <span className="metric-label-small">Rest</span>
                                          <span className="metric-value-small">{log.rest_time || 0}s</span>
                                        </div>
                                        {log.attributes && log.attributes.length > 0 && log.attributes.map((attr, idx) => {
                                          console.log('Attribute:', attr, 'Log attribute_inputs:', log.attribute_inputs);
                                          // Find all attribute inputs that start with this attribute key
                                          const attrInputs = log.attribute_inputs 
                                            ? Object.entries(log.attribute_inputs)
                                                .filter(([key]) => key.startsWith(`${attr}_`))
                                                .map(([key, value]) => value)
                                            : [];
                                          return (
                                            <div key={idx} className="workout-log-metric">
                                              <span className="metric-label-small">{attr.replace('_', ' ')}</span>
                                              {attrInputs.length > 0 ? (
                                                <span className="metric-value-small">
                                                  {attrInputs.join(' / ')}
                                                </span>
                                              ) : (
                                                <span className="metric-value-small">-</span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="workout-actions">
                                    <button
                                      className="btn-icon-delete"
                                      onClick={() => deleteWorkoutLog(log.workout_log_id)}
                                      title="Remove from log"
                                    >
                                      <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <div className="dashboard-layout-mobile">
            {/* Workout Stats */}
            <div className="workout-stats-section card">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{workoutStats.total_sets || 0}</div>
                  <div className="stat-label">Total Sets</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{workoutStats.total_weight_lifted || 0}</div>
                  <div className="stat-label">Weight Lifted (lbs)</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{workoutStats.total_reps || 0}</div>
                  <div className="stat-label">Total Reps</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{workoutStats.total_rir || 0}</div>
                  <div className="stat-label">Total RIR</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mobile-actions">
              
              <button
                className="btn-icon-mobile"
                onClick={() => setShowWorkoutCreator(true)}
                title="Create Workout"
              >
                <span className="icon icon-lg">🏋️</span>
              </button>
            </div>

            {/* Workout Log List */}
            <div className="workout-log-section card">
              <div className="workout-log-list">
                {getSortedWorkoutLogs().length === 0 ? (
                  <div className="empty-state">
                    <p>No workouts logged yet. Start logging your workouts!</p>
                  </div>
                ) : (
                  <div className="workout-log-items">
                    {(() => {
                      const sortedLogs = getSortedWorkoutLogs();
                      
                      // Group logs by workout ID
                      const groupedByWorkout = {};
                      sortedLogs.forEach(log => {
                        // Check multiple possible property paths for workout ID
                        const workoutId = log.workout?.workouts_id || log.workout?.workout_id || log.workout_id;
                        if (workoutId) {
                          if (!groupedByWorkout[workoutId]) {
                            groupedByWorkout[workoutId] = [];
                          }
                          groupedByWorkout[workoutId].push(log);
                        }
                      });

                      // Render each set (grouped by workout)
                      return Object.entries(groupedByWorkout).map(([workoutId, logs]) => {
                        // Calculate set totals
                        const totalLogs = logs.length;
                        const totalWeight = logs.reduce((sum, log) => sum + parseFloat(log.weight || 0), 0);
                        const averageWeight = totalLogs > 0 ? (totalWeight / totalLogs).toFixed(0) : 0;
                        const totalReps = logs.reduce((sum, log) => sum + parseInt(log.reps || 0), 0);
                        const totalRir = logs.reduce((sum, log) => sum + parseInt(log.rir || 0), 0);
                        const totalRestTime = logs.reduce((sum, log) => sum + parseInt(log.rest_time || 0), 0);
                        
                        const workout = logs[0].workout;
                        const workoutName = workout?.workout_name || 'Unknown Workout';
                        
                        // Extract emoji from workout name
                        const emojiMatch = workoutName.match(/^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
                        const workoutEmoji = emojiMatch ? emojiMatch[0] : '🏋️';
                        
                        // Extract workout name without emoji
                        let nameWithoutEmoji = workoutName.replace(/^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u, '').trim();
                        
                        // If the entire name was just an emoji, use the full name as fallback
                        if (!nameWithoutEmoji) {
                          nameWithoutEmoji = workoutName;
                        }
                        
                        // Collect unique muscles from all logs
                        const uniqueMuscles = new Set();
                        logs.forEach(log => {
                          if (log.workout?.muscles) {
                            log.workout.muscles.forEach(muscle => {
                              uniqueMuscles.add(muscle.muscle_name);
                            });
                          }
                        });
                        
                        // Collect unique attributes from all logs
                        const uniqueAttributes = new Set();
                        logs.forEach(log => {
                          if (log.attributes && Array.isArray(log.attributes)) {
                            log.attributes.forEach(attr => uniqueAttributes.add(attr));
                          }
                        });

                      return (
                        <div key={workoutId} className="workout-set-group">
                          <div className="workout-set-header">
                            <div className="workout-emoji-box">{workoutEmoji}</div>
                            <div className="workout-details">
                              <div className="workout-name">{nameWithoutEmoji}</div>
                            </div>
                            <button
                              className="btn-add-set"
                              onClick={() => {
                                setPreSelectedWorkout(workout);
                                setShowWorkoutSelectionModal(true);
                              }}
                              title="Add another set"
                            >
                              + Add Set
                            </button>
                          </div>
                          <div className="workout-set-totals">
                            <div className="metric-item">
                              <span className="metric-value">{averageWeight}</span>
                              <span className="metric-label">Avg Weight (lbs)</span>
                            </div>
                            <div className="metric-item">
                              <span className="metric-value">{totalReps}</span>
                              <span className="metric-label">Total Reps</span>
                            </div>
                            <div className="metric-item">
                              <span className="metric-value">{totalRir}</span>
                              <span className="metric-label">Total RIR</span>
                            </div>
                            <div className="metric-item">
                              <span className="metric-value">{totalRestTime}</span>
                              <span className="metric-label">Rest (s)</span>
                            </div>
                            {uniqueMuscles.size > 0 && (
                              <div className="metric-item full-width">
                                <span className="metric-label">Muscles: {Array.from(uniqueMuscles).join(', ')}</span>
                              </div>
                            )}
                            {uniqueAttributes.size > 0 && (
                              <div className="metric-item full-width">
                                <span className="metric-label">Attributes: {Array.from(uniqueAttributes).join(', ')}</span>
                              </div>
                            )}
                          </div>
                          <div className="workout-set-logs">
                            {logs.map((log) => (
                              <div key={log.workout_log_id} className="workout-log-item mobile">
                                <div className="workout-info">
                                  <div className="workout-details">
                                    <div className="workout-log-line">
                                      <div className="workout-log-metric">
                                        <span className="metric-label-small">Weight</span>
                                        <span className="metric-value-small">{Math.round(log.weight) || 0} lbs</span>
                                      </div>
                                      <div className="workout-log-metric">
                                        <span className="metric-label-small">Reps</span>
                                        <span className="metric-value-small">{log.reps || 0}</span>
                                      </div>
                                      <div className="workout-log-metric">
                                        <span className="metric-label-small">RIR</span>
                                        <span className="metric-value-small">{log.rir || 0}</span>
                                      </div>
                                      <div className="workout-log-metric">
                                        <span className="metric-label-small">Rest</span>
                                        <span className="metric-value-small">{log.rest_time || 0}s</span>
                                      </div>
                                      {log.attributes && log.attributes.length > 0 && log.attributes.map((attr, idx) => {
                                        console.log('Attribute:', attr, 'Log attribute_inputs:', log.attribute_inputs);
                                        // Find all attribute inputs that start with this attribute key
                                        const attrInputs = log.attribute_inputs 
                                          ? Object.entries(log.attribute_inputs)
                                              .filter(([key]) => key.startsWith(`${attr}_`))
                                              .map(([key, value]) => value)
                                          : [];
                                        return (
                                          <div key={idx} className="workout-log-metric">
                                            <span className="metric-label-small">{attr.replace('_', ' ')}</span>
                                            {attrInputs.length > 0 ? (
                                              <span className="metric-value-small">
                                                {attrInputs.join(' / ')}
                                              </span>
                                            ) : (
                                              <span className="metric-value-small">-</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                                <div className="workout-actions">
                                  <button
                                    className="btn-icon-delete"
                                    onClick={() => deleteWorkoutLog(log.workout_log_id)}
                                    title="Remove from log"
                                  >
                                    <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals for Mobile */}
      {isMobile && (
        <>

          {showWorkoutCreator && (
            <div className="modal-backdrop" onClick={() => setShowWorkoutCreator(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Create Workout</h2>
                  <button 
                    className="close-button"
                    onClick={() => setShowWorkoutCreator(false)}
                  >
                    ×
                  </button>
                </div>
                <WorkoutAdder
                  onWorkoutAdded={handleWorkoutCreated}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* PC Modals */}
      {!isMobile && (
        <>
          {showWorkoutCreator && (
            <div className="modal-backdrop" onClick={() => setShowWorkoutCreator(false)}>
              <div className="modal-content workout-creator-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Create Workout</h2>
                  <button 
                    className="modal-close-button"
                    onClick={() => setShowWorkoutCreator(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <WorkoutAdder
                    onWorkoutAdded={handleWorkoutCreated}
                  />
                </div>
              </div>
            </div>
          )}

          {showWorkoutSelectionModal && (
            <WorkoutLogger
              onWorkoutLogged={handleWorkoutLogged}
              selectedDate={selectedDate}
              onOpenWorkoutSelection={() => setShowWorkoutSelectionModal(true)}
              onClose={() => {
                setShowWorkoutSelectionModal(false);
                setPreSelectedWorkout(null);
              }}
              preSelectedWorkout={preSelectedWorkout}
            />
          )}
        </>
      )}

      <style>{`
        .workout-logging-dashboard {
          min-height: 100vh;
          background: var(--bg-primary);
          width: 100vw;
          margin: 0;
          padding: 0;
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
        }

        .dashboard-header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
          padding: 0 0 var(--space-6) 0;
          width: 100%;
          margin: 0 0 var(--space-6) 0;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
          margin: 0;
          padding: var(--space-6) var(--space-6) 0 var(--space-6);
          gap: var(--space-4);
        }

        .header-left {
          flex: 0 0 auto;
        }

        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .header-actions {
          flex: 0 0 auto;
          display: flex;
          gap: var(--space-3);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .header-title {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .header-actions {
          display: flex;
          gap: var(--space-2);
        }

        .btn-secondary-header {
          padding: 12px 16px;
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: var(--shadow-sm);
          font-family: var(--font-primary);
          margin: 4px 0;
        }

        .btn-secondary-header:hover {
          background: var(--bg-hover);
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .btn-primary-header {
          padding: 12px 16px;
          border: 2px solid var(--accent-primary);
          border-radius: var(--radius-md);
          background: var(--accent-primary);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: var(--shadow-sm);
          font-family: var(--font-primary);
          margin: 4px 0;
        }

        .btn-primary-header:hover {
          background: var(--bg-hover);
          border-color: var(--accent-primary);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .controls-section {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          justify-content: flex-start;
        }

        .date-input {
          padding: var(--space-3) var(--space-4);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          font-size: var(--text-base);
          color: var(--text-primary);
          transition: all 0.3s ease;
          font-family: var(--font-primary);
          min-width: 180px;
          height: 48px;
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
        }

        .date-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: var(--bg-tertiary);
        }

        .date-input:hover {
          border-color: var(--accent-primary);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        /* Custom date picker container */
        .custom-date-picker {
          position: relative;
          display: inline-block;
          margin-left: 60px;
        }

        /* Custom calendar popup */
        .custom-calendar-popup {
          position: absolute;
          top: 100%;
          left: 0;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          padding: var(--space-6);
          min-width: 350px;
          max-width: 400px;
          margin-top: var(--space-3);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-5);
          padding-bottom: var(--space-4);
          border-bottom: 2px solid var(--border-primary);
        }

        .calendar-header button {
          background: var(--bg-secondary);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: var(--space-2) var(--space-4);
          cursor: pointer;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          transition: all 0.3s ease;
        }

        .calendar-header button:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          transform: translateY(-1px);
        }

        .calendar-header span {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .calendar-day-header {
          text-align: center;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          color: var(--text-secondary);
          padding: var(--space-3) var(--space-2);
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-2);
        }

        .calendar-day {
          background: var(--bg-secondary);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: var(--space-3) var(--space-2);
          cursor: pointer;
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          transition: all 0.3s ease;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calendar-day:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .calendar-day.selected {
          background: #3b82f6;
          color: white;
          font-weight: var(--font-weight-bold);
          border-color: #3b82f6;
          box-shadow: var(--shadow-sm);
        }

        .calendar-day.other-month {
          color: var(--text-tertiary);
          opacity: 0.6;
          background: var(--bg-tertiary);
        }

        .calendar-day.other-month:hover {
          opacity: 0.8;
          background: var(--bg-hover);
        }

        .calendar-day:disabled {
          cursor: not-allowed;
          opacity: 0.3;
        }

        .calendar-day:disabled:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .dashboard-content {
          width: 100%;
          margin: 0;
          padding: 0 var(--space-4);
        }

        /* PC Layout */
        .dashboard-layout-pc {
          display: grid;
          grid-template-columns: 345px 1fr;
          gap: var(--space-3);
          align-items: start;
          width: 100%;
        }

        .muscle-progress-sidebar {
          width: 345px;
          background: var(--bg-secondary);
          padding: var(--space-6);
          border-radius: var(--radius-lg);
          border: 2px solid var(--border-primary);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: var(--space-4);
          height: fit-content;
        }

        .dashboard-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .workout-logger-panel {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 2px solid var(--border-primary);
          box-shadow: var(--shadow-sm);
          padding: var(--space-6);
          margin-bottom: var(--space-6);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
          padding-bottom: var(--space-3);
          border-bottom: 2px solid var(--border-primary);
        }

        .panel-header h3 {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin: 0;
        }

        /* Mobile Layout */
        .dashboard-layout-mobile {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .mobile-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3);
        }

        .btn-icon-mobile {
          width: 64px;
          height: 64px;
          padding: 0;
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-lg);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: var(--shadow-sm);
        }

        .btn-icon-mobile:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        /* Workout Stats */
        .workout-stats-section {
          background: var(--bg-secondary);
          padding: var(--space-6);
          border-radius: var(--radius-lg);
          border: 2px solid var(--border-primary);
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--space-6);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-5);
        }

        .stat-item {
          text-align: center;
          padding: var(--space-5) var(--space-4);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          border: 2px solid var(--border-primary);
          transition: all 0.3s ease;
        }

        .stat-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent-primary);
        }

        .stat-value {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--accent-primary);
          margin-bottom: var(--space-2);
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-weight-medium);
        }

        /* Workout Log */
        .workout-log-section {
          background: var(--bg-secondary);
          padding: var(--space-6);
          border-radius: var(--radius-lg);
          border: 2px solid var(--border-primary);
          box-shadow: var(--shadow-sm);
        }

        .workout-log-list {
          max-height: 600px;
          overflow-y: auto;
          padding: var(--space-2);
        }

        .empty-state {
          text-align: center;
          padding: var(--space-8);
        }

        .time-separator {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          margin: var(--space-4) 0;
        }

        .separator-line {
          flex: 1;
          height: 1px;
          background: var(--border-primary);
        }

        .separator-text {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-weight-medium);
        }

        .empty-time-separators {
          padding: var(--space-2);
        }

        .workout-log-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-5);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-4);
          border: 2px solid var(--border-primary);
          transition: all 0.3s ease;
        }

        .workout-log-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--accent-primary);
        }

        .workout-log-item.mobile {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-4);
        }

        .workout-set-group {
          margin-bottom: var(--space-6);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
          border: 2px solid var(--border-primary);
          padding: var(--space-4);
        }

        .workout-set-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }

        .workout-set-info {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin-top: var(--space-1);
        }

        .btn-add-set {
          padding: var(--space-2) var(--space-4);
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-add-set:hover {
          background: var(--accent-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .workout-set-totals {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
          padding: var(--space-3);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 2px solid var(--border-primary);
        }

        .workout-set-logs {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .workout-log-line {
          display: flex;
          gap: var(--space-4);
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

  .workout-log-line span {
    font-weight: var(--font-weight-medium);
  }

  .workout-emoji-box {
    font-size: var(--text-4xl);
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    border: 3px solid var(--border-primary);
    margin-right: var(--space-4);
  }

  .workout-log-metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-3);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    border: 2px solid var(--border-primary);
    min-width: 100px;
  }

  .metric-label-small {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    margin-bottom: var(--space-1);
  }

  .metric-value-small {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
  }

  .workout-set-totals {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
    padding: var(--space-4);
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    border: 2px solid var(--border-primary);
    justify-content: center;
  }

  .workout-set-totals .metric-item.full-width {
    flex: 1 1 100%;
    text-align: center;
    margin-top: var(--space-2);
  }

  .workout-log-attributes {
    margin-top: var(--space-3);
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

        .workout-info {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          flex: 1;
        }

        .workout-icon {
          font-size: var(--text-2xl);
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 2px solid var(--border-primary);
        }

        .workout-details {
          flex: 1;
        }

        .workout-name {
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-2);
          font-size: var(--text-lg);
        }

        .workout-time {
          font-size: var(--text-base);
          color: var(--text-tertiary);
          font-weight: var(--font-weight-medium);
        }

        .workout-metrics {
          display: flex;
          gap: var(--space-4);
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          flex: 1;
          padding: 0;
          margin: 0;
        }

        .metric-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
          text-align: center;
          padding: var(--space-3) var(--space-4);
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          border: 2px solid var(--border-primary);
          min-width: 70px;
        }

        .metric-value {
          font-weight: var(--font-weight-bold);
          color: var(--accent-primary);
          font-size: var(--text-lg);
        }

        .metric-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-weight-medium);
        }

        .workout-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-left: var(--space-4);
        }

        .btn-icon-delete {
          width: 40px;
          height: 40px;
          padding: 0;
          border: 2px solid var(--accent-danger);
          border-radius: var(--radius-sm);
          background: var(--accent-danger);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
        }

        .btn-icon-delete:hover {
          background: var(--bg-hover);
          color: var(--accent-danger);
          border-color: var(--accent-danger);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .time-display {
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .time-display:hover {
          background: var(--bg-secondary);
          color: var(--accent-primary);
        }

        .time-edit-container {
          display: inline-block;
        }

        .time-input {
          background: var(--bg-secondary);
          border: 1px solid var(--accent-primary);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: var(--text-sm);
          padding: var(--space-1) var(--space-2);
          font-family: var(--font-primary);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .time-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px var(--accent-primary-alpha);
        }

        @media (max-width: 768px) {
          .dashboard-layout-pc {
            display: none;
          }

          .header-content {
            flex-direction: column;
            gap: var(--space-4);
            align-items: flex-start;
            padding: var(--space-6) 4px 0 4px;
          }

          .dashboard-content {
            padding: 0;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 769px) {
          .dashboard-layout-mobile {
            display: none;
          }
        }

        /* Modal Styles */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--space-6);
        }

        .modal-content {
          background: var(--bg-primary);
          border: 2px solid white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .workout-creator-modal {
          width: 1200px;
        }

        .modal-body {
          padding: 0;
          overflow-y: auto;
          flex: 1;
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
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .modal-close-button {
          background: none;
          border: none;
          font-size: var(--text-2xl);
          color: var(--text-secondary);
          cursor: pointer;
          padding: var(--space-2);
          line-height: 1;
          transition: color 0.2s ease;
        }

        .modal-close-button:hover {
          color: var(--text-primary);
        }

        .modal-header h2 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .close-button {
          width: 36px;
          height: 36px;
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background: var(--accent-danger);
          color: white;
          border-color: var(--accent-danger);
          transform: translateY(-1px);
        }

        @media (min-width: 768px) {
          .modal {
            max-width: 90vw;
            max-height: 90vh;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkoutLoggingDashboard;
