import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../services/api';
import WorkoutLogger from './WorkoutLogger';
import WorkoutAdder from './WorkoutAdder';
import { LinearProgressBar } from './ProgressBar';
import WorkoutAnalytics from './WorkoutAnalytics';
import { ChartBarIcon } from '@heroicons/react/24/outline';

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
  const [showQuickAdd, setShowQuickAdd] = useState(() => {
    try {
      const saved = localStorage.getItem('showQuickAdd');
      return saved ? JSON.parse(saved) : true;
    } catch (error) {
      console.error('Failed to parse showQuickAdd from localStorage', error);
      return true;
    }
  });
  const [isDatePickerActive, setIsDatePickerActive] = useState(true);
  const datePickerTimeoutRef = useRef(null);
  const [areFloatingActionsActive, setAreFloatingActionsActive] = useState(true);
  const [analyticsWorkout, setAnalyticsWorkout] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const floatingActionsTimeoutRef = useRef(null);
  const [collapsedWorkouts, setCollapsedWorkouts] = useState({});

  const toggleWorkoutCollapse = useCallback((workoutId) => {
    setCollapsedWorkouts((prev) => ({
      ...prev,
      [workoutId]: !prev[workoutId],
    }));
  }, []);

  const clearDatePickerFadeTimeout = useCallback(() => {
    if (datePickerTimeoutRef.current) {
      clearTimeout(datePickerTimeoutRef.current);
      datePickerTimeoutRef.current = null;
    }
  }, []);

  const startDatePickerFade = useCallback(() => {
    clearDatePickerFadeTimeout();
    datePickerTimeoutRef.current = setTimeout(() => {
      setIsDatePickerActive(false);
    }, 3000);
  }, [clearDatePickerFadeTimeout]);

  const handleDatePickerInteraction = useCallback(() => {
    setIsDatePickerActive(true);
    if (!showCustomCalendar) {
      startDatePickerFade();
    }
  }, [startDatePickerFade, showCustomCalendar]);

  const clearFloatingActionsFadeTimeout = useCallback(() => {
    if (floatingActionsTimeoutRef.current) {
      clearTimeout(floatingActionsTimeoutRef.current);
      floatingActionsTimeoutRef.current = null;
    }
  }, []);

  const startFloatingActionsFade = useCallback(() => {
    clearFloatingActionsFadeTimeout();
    floatingActionsTimeoutRef.current = setTimeout(() => {
      setAreFloatingActionsActive(false);
    }, 3000);
  }, [clearFloatingActionsFadeTimeout]);

  const handleFloatingActionsInteraction = useCallback(() => {
    setAreFloatingActionsActive(true);
    startFloatingActionsFade();
  }, [startFloatingActionsFade]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('workout-dashboard-show-quick-add', showQuickAdd ? 'true' : 'false');
    }
  }, [showQuickAdd]);

  useEffect(() => {
    startFloatingActionsFade();
    return () => clearFloatingActionsFadeTimeout();
  }, [startFloatingActionsFade, clearFloatingActionsFadeTimeout]);

  useEffect(() => {
    if (showWorkoutCreator || showWorkoutSelectionModal) {
      handleFloatingActionsInteraction();
    }
  }, [showWorkoutCreator, showWorkoutSelectionModal, handleFloatingActionsInteraction]);

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
      // Determine previous split day:
      // 1) Get the most recently activated split (first from API for now)
      // 2) Compute its length (number of split days)
      // 3) Go back that many days from the current selected date to get the last split day date
      const base = targetDate ? new Date(targetDate) : new Date();
      const splitsResp = await api.get('/workouts/splits/');
      if (!splitsResp.data.success || !splitsResp.data.data?.length) {
        setPreviousDayWorkouts([]);
        return;
      }
      const activeSplit = splitsResp.data.data[0];
      const splitLength = Array.isArray(activeSplit.split_days) ? activeSplit.split_days.length : 0;
      if (!splitLength) {
        setPreviousDayWorkouts([]);
        return;
      }
      const previousSplitDate = new Date(base);
      previousSplitDate.setDate(base.getDate() - splitLength);
      const previousDateStr = previousSplitDate.toISOString().split('T')[0];

      console.log('Loading quick workouts from previous split day:', previousDateStr, 'splitLength:', splitLength);
      const logsResponse = await api.get(`/workouts/logs/?date_from=${previousDateStr}&date_to=${previousDateStr}`);
      if (!logsResponse.data.success) return;

      const previousDayLogs = Array.isArray(logsResponse.data.data) ? logsResponse.data.data : [];

      // Group logs by workout id to compute per-workout stats for quick cards
      const groups = {};
      previousDayLogs.forEach((log) => {
        const workoutId = log.workout?.workouts_id || log.workout?.workout_id || log.workout_id;
        if (!workoutId || !log.workout) return;
        if (!groups[workoutId]) {
          groups[workoutId] = { workout: log.workout, logs: [] };
        }
        groups[workoutId].logs.push(log);
      });

      const summaries = Object.values(groups).map(({ workout, logs }) => {
        const total = logs.length || 0;
        const totalWeight = logs.reduce((s, l) => s + (parseFloat(l.weight || 0) || 0), 0);
        const totalReps = logs.reduce((s, l) => s + (parseInt(l.reps || 0, 10) || 0), 0);
        const totalRir = logs.reduce((s, l) => s + (parseInt(l.rir || 0, 10) || 0), 0);
        const totalRest = logs.reduce((s, l) => s + (parseInt(l.rest_time || 0, 10) || 0), 0);
        const avgWeight = total ? Math.round(totalWeight / total) : 0;
        const avgReps = total ? Number((totalReps / total).toFixed(1)) : 0;
        const avgRir = total ? Number((totalRir / total).toFixed(1)) : 0;
        const avgRest = total ? Math.round(totalRest / total) : 0;
        const uniqueMuscles = [];
        if (workout?.muscles) {
          const seen = new Set();
          workout.muscles.forEach((m) => {
            if (!seen.has(m.muscle_name)) {
              seen.add(m.muscle_name);
              uniqueMuscles.push(m.muscle_name);
            }
          });
        }
        return {
          workout,
          stats: { avgWeight, avgReps, avgRir, avgRest },
          muscles: uniqueMuscles,
        };
      });

      setPreviousDayWorkouts(summaries);
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

  useEffect(() => {
    if (showCustomCalendar) {
      setIsDatePickerActive(true);
      clearDatePickerFadeTimeout();
      return;
    }
    startDatePickerFade();
    return () => {
      clearDatePickerFadeTimeout();
    };
  }, [showCustomCalendar, startDatePickerFade, clearDatePickerFadeTimeout]);

  useEffect(() => {
    return () => clearDatePickerFadeTimeout();
  }, [clearDatePickerFadeTimeout]);


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

  const dailyStats = useMemo(() => {
    const totals = {
      totalSets: workoutLogs.length || 0,
      totalWeight: 0,
      totalReps: 0,
      totalRir: 0,
      totalRestSeconds: 0
    };
    const volumesByWorkout = {};

    workoutLogs.forEach((log) => {
      const weight = parseFloat(log.weight ?? 0);
      const reps = parseInt(log.reps ?? 0, 10);
      const rir = parseInt(log.rir ?? 0, 10);
      const restTime = parseInt(log.rest_time ?? 0, 10);

      const safeWeight = Number.isNaN(weight) ? 0 : weight;
      const safeReps = Number.isNaN(reps) ? 0 : reps;
      const safeRir = Number.isNaN(rir) ? 0 : rir;
      const safeRestTime = Number.isNaN(restTime) ? 0 : restTime;

      totals.totalWeight += safeWeight;
      totals.totalReps += safeReps;
      totals.totalRir += safeRir;
      totals.totalRestSeconds += safeRestTime;

      const workoutId = log.workout?.workouts_id || log.workout?.workout_id || log.workout_id;
      if (workoutId) {
        if (!volumesByWorkout[workoutId]) {
          volumesByWorkout[workoutId] = [];
        }
        volumesByWorkout[workoutId].push(safeWeight * safeReps);
      }
    });

    const volumeDiffs = Object.values(volumesByWorkout).map((volumes) => {
      if (!volumes.length) return 0;
      const maxVolume = Math.max(...volumes);
      const minVolume = Math.min(...volumes);
      return maxVolume - minVolume;
    }).filter((diff) => !Number.isNaN(diff));

    const averageVolumeDiff = volumeDiffs.length
      ? Number((volumeDiffs.reduce((sum, diff) => sum + diff, 0) / volumeDiffs.length).toFixed(1))
      : 0;

    const totalRestMinutes = totals.totalRestSeconds
      ? Number((totals.totalRestSeconds / 60).toFixed(1))
      : 0;

    return {
      totalSets: totals.totalSets,
      totalWeight: Math.round(totals.totalWeight),
      totalReps: totals.totalReps,
      totalRir: totals.totalRir,
      totalRestMinutes,
      averageVolumeDiff
    };
  }, [workoutLogs]);

  const statsDisplay = useMemo(() => ({
    totalSets: dailyStats.totalSets || workoutStats.total_sets || 0,
    totalWeight: dailyStats.totalWeight || workoutStats.total_weight_lifted || 0,
    totalReps: dailyStats.totalReps || workoutStats.total_reps || 0,
    totalRir: dailyStats.totalRir || workoutStats.total_rir || 0,
    totalRestMinutes: dailyStats.totalRestMinutes || (workoutStats.total_rest_time ? Number((workoutStats.total_rest_time / 60).toFixed(1)) : 0),
    averageVolumeDiff: dailyStats.averageVolumeDiff
  }), [dailyStats, workoutStats]);

  // Filter quick workouts to exclude ones already logged today
  const filteredQuickWorkouts = useMemo(() => {
    if (!previousDayWorkouts.length || !workoutLogs.length) {
      return previousDayWorkouts;
    }
    
    // Get workout IDs that are already logged today
    const selectedDateStr = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const loggedTodayWorkoutIds = new Set();
    
    workoutLogs.forEach(log => {
      const logDate = log.date_time ? new Date(log.date_time).toISOString().split('T')[0] : null;
      if (logDate === selectedDateStr) {
        const workoutId = log.workout?.workouts_id || log.workout?.workout_id || log.workout_id;
        if (workoutId) {
          loggedTodayWorkoutIds.add(workoutId);
        }
      }
    });
    
    // Filter out workouts that are already logged today
    return previousDayWorkouts.filter(({ workout }) => {
      const workoutId = workout?.workouts_id || workout?.workout_id;
      return !loggedTodayWorkoutIds.has(workoutId);
    });
  }, [previousDayWorkouts, workoutLogs, selectedDate]);

  const renderQuickAddSection = () => (
    <div className="quick-add-wrapper">
      <div className="quick-add-toggle-row">
        <label className="quick-add-toggle">
          <input
            type="checkbox"
            checked={showQuickAdd}
            onChange={(e) => setShowQuickAdd(e.target.checked)}
            aria-label="Toggle quick workouts"
          />
          <span className="quick-add-toggle-slider" />
          <span className="quick-add-toggle-label">Quick Workouts</span>
        </label>
      </div>
      {showQuickAdd && (
        filteredQuickWorkouts.length > 0 ? (
          <div className="quick-add-section">
            <div className="quick-add-list">
              {filteredQuickWorkouts.slice(0, 6).map(({ workout, stats, muscles }) => {
                const workoutName = workout?.workout_name || 'Workout';
                const emojiMatch = workoutName.match(/^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
                const workoutEmoji = emojiMatch ? emojiMatch[0] : '🏋️';
                let nameWithoutEmoji = workoutName.replace(/^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u, '').trim();
                if (!nameWithoutEmoji) nameWithoutEmoji = workoutName;
                return (
                  <div key={workout.workouts_id || workout.workout_id} className="quick-workout-set-group" data-testid="quick-workout-card">
                    <div className="workout-set-header">
                      <div className="workout-emoji-box">{workoutEmoji}</div>
                      <div className="workout-name-row">
                        <div className="workout-name">{nameWithoutEmoji}</div>
                        {muscles && muscles.length > 0 && (
                          <div className="workout-muscles-inline">{muscles.join(', ')}</div>
                        )}
                      </div>
                      <button
                        className="workout-analytics-button-dashboard"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAnalyticsWorkout(workout);
                          setShowAnalytics(true);
                        }}
                        title="View Analytics"
                      >
                        <ChartBarIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="workout-set-summary">
                      <div className="workout-set-totals">
                        <div className="metric-item">
                          <span className="metric-value">{stats.avgWeight}</span>
                          <span className="metric-label">Weight</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-value">{stats.avgReps}</span>
                          <span className="metric-label">Reps</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-value">{stats.avgRir}</span>
                          <span className="metric-label">RIR</span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-value">{stats.avgRest}</span>
                          <span className="metric-label">Rest</span>
                        </div>
                      </div>
                      <button
                        className="btn-add-set"
                        data-testid="quick-workout-add-set"
                        onClick={() => handleAddSetForWorkout(workout, [])}
                        title="Add a set for this workout"
                      >
                        + Add Set
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="quick-add-empty">
            <p>No quick workouts available from the previous day.</p>
          </div>
        )
      )}
    </div>
  );


  const handleWorkoutLogged = async () => {
    // Refresh data immediately with a small delay to ensure API call completes
    await loadWorkoutLogs();
    await loadWorkoutStats();
    await loadSplitData(selectedDate);
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleAddSetForWorkout = (workout, logsForWorkout = []) => {
    let latestLog = null;

    if (logsForWorkout.length > 0) {
      latestLog = [...logsForWorkout]
        .sort((a, b) => new Date(b.date_time) - new Date(a.date_time))[0];
    }

    const workoutWithRecentLog = latestLog
      ? {
          ...workout,
          recent_log: {
            ...(workout.recent_log || {}),
            last_weight: latestLog.weight ?? '',
            last_reps: latestLog.reps ?? '',
            last_rir: latestLog.rir ?? '',
            last_rest_time: latestLog.rest_time ?? '',
            last_attributes: Array.isArray(latestLog.attributes) ? latestLog.attributes : [],
            last_attribute_inputs: latestLog.attribute_inputs
              ? { ...latestLog.attribute_inputs }
              : {}
          }
        }
      : workout;

    setPreSelectedWorkout(workoutWithRecentLog);
    setShowWorkoutSelectionModal(true);
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
            <div className="header-control-bar" onMouseEnter={handleFloatingActionsInteraction}>
              <div
                className="custom-date-picker"
                style={{ opacity: (isDatePickerActive || showCustomCalendar || areFloatingActionsActive) ? 1 : 0.1 }}
                onMouseEnter={() => {
                  handleDatePickerInteraction();
                  handleFloatingActionsInteraction();
                }}
                onMouseLeave={() => {
                  if (!showCustomCalendar) {
                    startDatePickerFade();
                  }
                }}
              >
                <input
                  type="text"
                  value={selectedDate}
                  readOnly
                  className="form-input date-input"
                  onClick={() => {
                    handleDatePickerInteraction();
                    handleFloatingActionsInteraction();
                    setShowCustomCalendar(!showCustomCalendar);
                  }}
                  onFocus={() => {
                    handleDatePickerInteraction();
                    handleFloatingActionsInteraction();
                  }}
                  onBlur={() => {
                    if (!showCustomCalendar) {
                      startDatePickerFade();
                    }
                  }}
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
              <div className="header-actions" style={{ opacity: areFloatingActionsActive ? 1 : 0.1 }}>
                <button
                  className="btn-secondary-header"
                  onMouseEnter={handleFloatingActionsInteraction}
                  onFocus={handleFloatingActionsInteraction}
                  onClick={() => {
                    handleFloatingActionsInteraction();
                    setShowWorkoutSelectionModal(true);
                  }}
                  title="Select Workout"
                >
                  <span>Select Workout</span>
                </button>
                <button
                  className="btn-primary-header"
                  onMouseEnter={handleFloatingActionsInteraction}
                  onFocus={handleFloatingActionsInteraction}
                  onClick={() => {
                    handleFloatingActionsInteraction();
                    setShowWorkoutCreator(true);
                  }}
                  title="Create Workout"
                >
                  <span>Create Workout</span>
                </button>
              </div>
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
              {/* Workout Log List */}
              <div
                className="workout-log-section card"
                onClick={(e) => {
                  if (e.currentTarget === e.target) {
                    setShowWorkoutSelectionModal(true);
                  }
                }}
              >
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

                        // Sort workout groups by most recent log (most recent first)
                        const sortedWorkoutEntries = Object.entries(groupedByWorkout).sort(([, logsA], [, logsB]) => {
                          const mostRecentA = Math.max(...logsA.map(log => new Date(log.date_time || 0).getTime()));
                          const mostRecentB = Math.max(...logsB.map(log => new Date(log.date_time || 0).getTime()));
                          return mostRecentB - mostRecentA; // Descending order (most recent first)
                        });

                        // Render each set (grouped by workout)
                        return sortedWorkoutEntries.map(([workoutId, logs]) => {
                          // Calculate set totals
                          const totalLogs = logs.length;
                          const totalWeight = logs.reduce((sum, log) => sum + parseFloat(log.weight || 0), 0);
                          const averageWeight = totalLogs > 0 ? (totalWeight / totalLogs).toFixed(0) : 0;
                          const totalReps = logs.reduce((sum, log) => sum + parseInt(log.reps || 0), 0);
                          const averageReps = totalLogs > 0 ? (totalReps / totalLogs).toFixed(1) : 0;
                          const totalRir = logs.reduce((sum, log) => sum + parseInt(log.rir || 0), 0);
                          const averageRir = totalLogs > 0 ? (totalRir / totalLogs).toFixed(1) : 0;
                          const totalRestTime = logs.reduce((sum, log) => sum + parseInt(log.rest_time || 0), 0);
                          const averageRestTime = totalLogs > 0 ? Math.round(totalRestTime / totalLogs) : 0;
                          
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

                      const musclesList = Array.from(uniqueMuscles);

                        const isCollapsed = !!collapsedWorkouts[workoutId];

                        return (
                          <div key={workoutId} className="workout-set-group">
                            <div className="workout-set-header">
                              <div className="workout-emoji-box">{workoutEmoji}</div>
                              <div className="workout-name-row">
                                <div className="workout-name">{nameWithoutEmoji}</div>
                                {musclesList.length > 0 && (
                                  <div className="workout-muscles-inline">{musclesList.join(', ')}</div>
                                )}
                              </div>
                              <button
                                className="workout-analytics-button-dashboard"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAnalyticsWorkout(workout);
                                  setShowAnalytics(true);
                                }}
                                title="View Analytics"
                              >
                                <ChartBarIcon className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="workout-set-summary">
                              <button
                                className="workout-collapse-toggle"
                                type="button"
                                onClick={() => toggleWorkoutCollapse(workoutId)}
                                aria-expanded={!isCollapsed}
                                aria-controls={`workout-set-${workoutId}`}
                                aria-label={isCollapsed ? 'Expand workout sets' : 'Collapse workout sets'}
                              >
                                <svg className="collapse-triangle-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                  {isCollapsed ? (
                                    <path d="M2 4 L6 8 L10 4" />
                                  ) : (
                                    <path d="M2 8 L6 4 L10 8" />
                                  )}
                                </svg>
                              </button>
                              <div className="workout-set-totals">
                                <div className="metric-item">
                                  <span className="metric-value">{averageWeight}</span>
                                  <span className="metric-label">Weight</span>
                                </div>
                                <div className="metric-item">
                                  <span className="metric-value">{averageReps}</span>
                                  <span className="metric-label">Reps</span>
                                </div>
                                <div className="metric-item">
                                  <span className="metric-value">{averageRir}</span>
                                  <span className="metric-label">RIR</span>
                                </div>
                                <div className="metric-item">
                                  <span className="metric-value">{averageRestTime}</span>
                                  <span className="metric-label">Rest</span>
                                </div>
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
                            <div
                              className={`workout-set-logs ${isCollapsed ? 'collapsed' : 'expanded'}`}
                              id={`workout-set-${workoutId}`}
                              aria-hidden={isCollapsed}
                            >
                              <div className="workout-set-logs-content">
                                {logs.map((log) => (
                                  <div key={log.workout_log_id} className="workout-log-item">
                                  <div className="workout-info">
                                    <div className="workout-details">
                                      <div className="workout-log-line">
                                        <div className="workout-log-detail">
                                          <span className="metric-label-small">Weight (lbs)</span>
                                          <span className="metric-colon">:</span>
                                          <span className="metric-value-small">{Math.round(log.weight) || 0}</span>
                                        </div>
                                        <div className="workout-log-detail workout-log-detail-compact">
                                          <span className="metric-label-small">Reps</span>
                                          <span className="metric-colon">:</span>
                                          <span className="metric-value-small">{log.reps || 0}</span>
                                        </div>
                                        <div className="workout-log-detail workout-log-detail-rir">
                                          <span className="metric-label-small">RIR</span>
                                          <span className="metric-colon">:</span>
                                          <span className="metric-value-small">{log.rir || 0}</span>
                                        </div>
                                        <div className="workout-log-detail workout-log-detail-compact">
                                          <span className="metric-label-small">Rest</span>
                                          <span className="metric-colon">:</span>
                                          <span className="metric-value-small">{log.rest_time || 0}</span>
                                        </div>
                                        {log.attributes && log.attributes.length > 0 && log.attributes.map((attr, idx) => {
                                          const attrInputs = log.attribute_inputs 
                                            ? Object.entries(log.attribute_inputs)
                                                .filter(([key]) => key.startsWith(`${attr}_`))
                                                .map(([key, value]) => value)
                                            : [];
                                          return (
                                            <div key={idx} className="workout-log-detail">
                                              <span className="metric-label-small">{attr.replace('_', ' ')}</span>
                                              <span className="metric-colon">:</span>
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
                          </div>
                        );
                        });
                      })()}
                    </div>
                  )}
                </div>
                {renderQuickAddSection()}
              </div>

              {/* Workout Stats */}
              <div className="workout-stats-section card">
                <h3 className="stats-section-title">Daily Workout Stats</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{statsDisplay.totalSets}</div>
                    <div className="stat-label">Sets</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{statsDisplay.totalWeight}</div>
                    <div className="stat-label">Weight</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{statsDisplay.totalReps}</div>
                    <div className="stat-label">Reps</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{statsDisplay.totalRir}</div>
                    <div className="stat-label">RIR</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{statsDisplay.totalRestMinutes}</div>
                    <div className="stat-label">Rest</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{statsDisplay.averageVolumeDiff}</div>
                    <div className="stat-label">Avg Volume</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <div className="dashboard-layout-mobile">
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
            <div
              className="workout-log-section card"
              onClick={(e) => {
                if (e.currentTarget === e.target) {
                  setShowWorkoutSelectionModal(true);
                }
              }}
            >
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

                      // Sort workout groups by most recent log (most recent first)
                      const sortedWorkoutEntries = Object.entries(groupedByWorkout).sort(([, logsA], [, logsB]) => {
                        const mostRecentA = Math.max(...logsA.map(log => new Date(log.date_time || 0).getTime()));
                        const mostRecentB = Math.max(...logsB.map(log => new Date(log.date_time || 0).getTime()));
                        return mostRecentB - mostRecentA; // Descending order (most recent first)
                      });

                      // Render each set (grouped by workout)
                      return sortedWorkoutEntries.map(([workoutId, logs]) => {
                        // Calculate set totals
                        const totalLogs = logs.length;
                        const totalWeight = logs.reduce((sum, log) => sum + parseFloat(log.weight || 0), 0);
                        const averageWeight = totalLogs > 0 ? (totalWeight / totalLogs).toFixed(0) : 0;
                        const totalReps = logs.reduce((sum, log) => sum + parseInt(log.reps || 0), 0);
                        const averageReps = totalLogs > 0 ? (totalReps / totalLogs).toFixed(1) : 0;
                        const totalRir = logs.reduce((sum, log) => sum + parseInt(log.rir || 0), 0);
                        const averageRir = totalLogs > 0 ? (totalRir / totalLogs).toFixed(1) : 0;
                        const totalRestTime = logs.reduce((sum, log) => sum + parseInt(log.rest_time || 0), 0);
                        const averageRestTime = totalLogs > 0 ? Math.round(totalRestTime / totalLogs) : 0;
                        
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

                        const musclesList = Array.from(uniqueMuscles);

                      return (
                        <div key={workoutId} className="workout-set-group">
                          <div className="workout-set-header">
                            <div className="workout-emoji-box">{workoutEmoji}</div>
                            <div className="workout-name-row">
                              <div className="workout-name">{nameWithoutEmoji}</div>
                              {musclesList.length > 0 && (
                                <div className="workout-muscles-inline">{musclesList.join(', ')}</div>
                              )}
                            </div>
                            <button
                              className="workout-analytics-button-dashboard"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAnalyticsWorkout(workout);
                                setShowAnalytics(true);
                              }}
                              title="View Analytics"
                            >
                              <ChartBarIcon className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="workout-set-summary">
                            <button
                              className="workout-collapse-toggle"
                              type="button"
                              onClick={() => toggleWorkoutCollapse(workoutId)}
                              aria-expanded={!collapsedWorkouts[workoutId]}
                              aria-controls={`workout-set-mobile-${workoutId}`}
                              aria-label={collapsedWorkouts[workoutId] ? 'Expand workout sets' : 'Collapse workout sets'}
                            >
                              <svg className="collapse-triangle-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                {collapsedWorkouts[workoutId] ? (
                                  <path d="M2 4 L6 8 L10 4" />
                                ) : (
                                  <path d="M2 8 L6 4 L10 8" />
                                )}
                              </svg>
                            </button>
                            <div className="workout-set-totals">
                              <div className="metric-item">
                                <span className="metric-value">{averageWeight}</span>
                                <span className="metric-label">Weight</span>
                              </div>
                              <div className="metric-item">
                                <span className="metric-value">{averageReps}</span>
                                <span className="metric-label">Reps</span>
                              </div>
                              <div className="metric-item">
                                <span className="metric-value">{averageRir}</span>
                                <span className="metric-label">RIR</span>
                              </div>
                              <div className="metric-item">
                                <span className="metric-value">{averageRestTime}</span>
                                <span className="metric-label">Rest</span>
                              </div>
                            </div>
                            <button
                              className="btn-add-set"
                              onClick={() => handleAddSetForWorkout(workout, logs)}
                              title="Add another set"
                            >
                              + Add Set
                            </button>
                          </div>
                          <div
                            className={`workout-set-logs ${collapsedWorkouts[workoutId] ? 'collapsed' : 'expanded'}`}
                            id={`workout-set-mobile-${workoutId}`}
                            aria-hidden={collapsedWorkouts[workoutId]}
                          >
                            <div className="workout-set-logs-content">
                              {logs.map((log) => (
                                <div key={log.workout_log_id} className="workout-log-item mobile">
                                  <div className="workout-info">
                                    <div className="workout-details">
                                      <div className="workout-log-line">
                                        <div className="workout-log-detail">
                                          <span className="metric-label-small">Weight (lbs)</span>
                                          <span className="metric-colon">:</span>
                                          <span className="metric-value-small">{Math.round(log.weight) || 0}</span>
                                        </div>
                                        <div className="workout-log-detail workout-log-detail-compact">
                                          <span className="metric-label-small">Reps</span>
                                          <span className="metric-colon">:</span>
                                          <span className="metric-value-small">{log.reps || 0}</span>
                                        </div>
                                        <div className="workout-log-detail workout-log-detail-rir">
                                          <span className="metric-label-small">RIR</span>
                                          <span className="metric-colon">:</span>
                                          <span className="metric-value-small">{log.rir || 0}</span>
                                        </div>
                                        <div className="workout-log-detail workout-log-detail-compact">
                                          <span className="metric-label-small">Rest</span>
                                          <span className="metric-colon">:</span>
                                          <span className="metric-value-small">{log.rest_time || 0}</span>
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
                                            <div key={idx} className="workout-log-detail">
                                              <span className="metric-label-small">{attr.replace('_', ' ')}</span>
                                              <span className="metric-colon">:</span>
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
                        </div>
                      );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Workout Stats */}
            <div className="workout-stats-section card">
              <h3 className="stats-section-title">Daily Workout Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{statsDisplay.totalSets}</div>
                  <div className="stat-label">Sets</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{statsDisplay.totalWeight}</div>
                  <div className="stat-label">Weight</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{statsDisplay.totalReps}</div>
                  <div className="stat-label">Reps</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{statsDisplay.totalRir}</div>
                  <div className="stat-label">RIR</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{statsDisplay.totalRestMinutes}</div>
                  <div className="stat-label">Rest</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{statsDisplay.averageVolumeDiff}</div>
                  <div className="stat-label">Avg Volume</div>
                </div>
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
        </>
      )}

      <style>{`
        .workout-logging-dashboard {
          min-height: 100vh;
          background: #25282d;
          width: 100vw;
          margin: 0;
          padding: var(--space-2) 0 0;
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
        }

        .dashboard-header {
          width: 100%;
          height: 0;
          margin: 0;
          padding: 0;
          pointer-events: none;
          background: transparent;
          border: none;
        }

        .header-content {
          display: contents;
        }

        .header-control-bar {
          position: fixed;
          top: var(--space-4);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          pointer-events: auto;
          z-index: calc(var(--z-fixed) + 10);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          pointer-events: auto;
          transition: opacity 0.4s var(--ease-out-cubic);
        }

        .header-title {
          display: none;
        }

        .btn-secondary-header,
        .btn-primary-header {
          padding: 0 var(--space-6);
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #ffffff;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          min-width: 220px;
          height: 56px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
          transition: transform 0.25s var(--ease-out-cubic), box-shadow 0.25s var(--ease-out-cubic);
          backdrop-filter: blur(6px);
          font-family: var(--font-primary);
          z-index: calc(var(--z-fixed) + 10);
        }

        .btn-secondary-header {
          background: var(--accent-info);
        }

        .btn-primary-header {
          background: var(--accent-purple);
        }

        .btn-secondary-header:hover,
        .btn-primary-header:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 45px rgba(0, 0, 0, 0.4);
        }

        .btn-secondary-header:focus,
        .btn-primary-header:focus {
          outline: none;
          box-shadow: 0 0 0 3px var(--accent-primary-alpha), 0 24px 50px rgba(0, 0, 0, 0.45);
        }

        .date-input {
          padding: var(--space-4) var(--space-5);
          border: 1px solid var(--surface-overlay);
          border-radius: var(--radius-md);
          background: transparent;
          font-size: var(--text-base);
          color: var(--text-primary);
          transition: border-color 0.3s ease, background 0.3s ease, color 0.3s ease;
          font-family: var(--font-primary);
          min-width: 220px;
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          text-align: center;
          letter-spacing: 0.08em;
          box-shadow: none;
          height: 56px;
        }

        .date-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          background: rgba(90, 166, 255, 0.12);
        }

        .date-input:hover {
          border-color: var(--accent-primary);
          background: rgba(90, 166, 255, 0.08);
        }

        .custom-date-picker {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 220px;
          pointer-events: auto;
          transition: opacity 0.4s var(--ease-out-cubic);
          z-index: calc(var(--z-fixed) + 20);
        }

        /* Custom calendar popup */
        .custom-calendar-popup {
          position: absolute;
          top: 100%;
          right: 0;
          left: auto;
          background: var(--bg-tertiary);
          border-radius: var(--radius-xl);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
          z-index: 2000;
          padding: var(--space-6);
          min-width: 350px;
          max-width: 400px;
          margin-top: var(--space-3);
          border: none;
          animation: menuFloatIn 0.25s var(--ease-out-cubic);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-5);
          padding-bottom: var(--space-4);
        }

        .calendar-header button {
          background: transparent;
          border: none;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          padding: var(--space-2) var(--space-3);
          cursor: pointer;
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          transition: transform 0.3s ease, color 0.3s ease;
        }

        .calendar-header button:hover {
          color: var(--accent-primary);
          transform: translateY(-2px);
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
          background: rgba(255, 255, 255, 0.04);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-2);
        }

        .calendar-day {
          background: var(--bg-secondary);
          border: none;
          border-radius: var(--radius-lg);
          color: var(--text-primary);
          padding: var(--space-3) var(--space-2);
          cursor: pointer;
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease, color 0.3s ease;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25);
        }

        .calendar-day:hover {
          background: var(--accent-primary);
          color: white;
          transform: translateY(-3px);
          box-shadow: 0 18px 32px rgba(90, 166, 255, 0.35);
        }

        .calendar-day.selected {
          background: var(--accent-primary);
          color: white;
          font-weight: var(--font-weight-bold);
          box-shadow: 0 18px 32px rgba(90, 166, 255, 0.4);
        }

        .calendar-day.other-month {
          color: var(--text-tertiary);
          opacity: 0.6;
          background: var(--bg-tertiary);
          box-shadow: none;
        }

        .calendar-day.other-month:hover {
          opacity: 0.8;
          background: var(--bg-hover);
          box-shadow: 0 14px 26px rgba(0, 0, 0, 0.3);
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
          padding: var(--space-28) var(--space-6) var(--space-6);
          padding-top: calc(var(--space-4) + 56px + var(--space-3));
        }

        /* PC Layout */
        .dashboard-layout-pc {
          display: grid;
          grid-template-columns: minmax(340px, 360px) 1fr;
          column-gap: var(--space-5);
          row-gap: 0;
          align-items: start;
          width: 100%;
        }

        .muscle-progress-sidebar {
          width: 100%;
          background: var(--bg-secondary);
          padding: var(--space-6);
          border-radius: var(--radius-lg);
          border: none;
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.42);
          position: sticky;
          top: var(--space-10);
          height: 100%;
          align-self: stretch;
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(10px);
        }

        .dashboard-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .workout-logger-panel {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: none;
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.4);
          padding: var(--space-6);
          margin-bottom: var(--space-6);
          backdrop-filter: blur(8px);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
          padding-bottom: var(--space-3);
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
          border: none;
          border-radius: var(--radius-md);
          background: var(--accent-primary);
          color: #ffffff;
          cursor: pointer;
          transition: none;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: none;
        }

        .btn-icon-mobile:hover {
          transform: none;
          box-shadow: none;
        }

        /* Workout Stats */
        .workout-stats-section {
          background: var(--bg-secondary);
          padding: var(--space-4) var(--space-6);
          border-radius: var(--radius-lg); /* Reduced roundness */
          border: none;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
          margin: var(--space-3) 0;
          margin-left: var(--space-2);
          backdrop-filter: blur(6px);
        }

        .workout-log-section.card {
          transition: none;
          transform: none;
          box-shadow: none;
          background: transparent;
        }

        .workout-log-section.card:hover {
          transform: none;
          box-shadow: none;
          background: transparent;
        }

        .workout-stats-section.card:hover {
          transform: none;
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.42);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--space-4);
          padding-left: var(--space-2);
        }

        .stat-item {
          text-align: center;
          padding: var(--space-3) var(--space-3);
          background: transparent;
          border-radius: var(--radius-md);
          border: none;
          box-shadow: none;
          transition: none;
        }

        .stats-section-title {
          margin: 0 0 var(--space-3);
          font-size: var(--text-sm);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-secondary);
          padding-left: var(--space-2);
        }

        .stat-value {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--accent-primary);
          margin-bottom: var(--space-2);
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-weight-medium);
        }

        .quick-add-wrapper {
          margin-top: var(--space-4);
        }

        .quick-add-toggle-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: var(--space-3);
        }

        .quick-add-toggle {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          user-select: none;
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-secondary);
        }

        .quick-add-toggle input {
          display: none;
        }

        .quick-add-toggle-slider {
          position: relative;
          width: 42px;
          height: 22px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          transition: background 0.2s ease;
        }

        .quick-add-toggle-slider::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: var(--text-tertiary);
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .quick-add-toggle input:checked + .quick-add-toggle-slider {
          background: var(--accent-primary);
        }

        .quick-add-toggle input:checked + .quick-add-toggle-slider::after {
          transform: translateX(20px);
          background: var(--bg-primary);
        }

        .quick-add-toggle-label {
          color: var(--text-secondary);
        }

        .quick-add-section {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--surface-overlay);
          border-radius: var(--radius-2xl);
          padding: var(--space-4);
          box-shadow: none;
        }

        .quick-add-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: var(--space-3);
        }

        .quick-add-workout-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-2);
          background: transparent;
          border: 1px solid var(--surface-overlay);
          border-radius: var(--radius-lg);
          padding: var(--space-3);
          cursor: pointer;
          opacity: 0.7;
          color: var(--text-secondary);
          transition: none;
        }

        .quick-add-workout-card:hover,
        .quick-add-workout-card:focus {
          opacity: 0.7;
          outline: none;
        }

        .quick-add-workout-icon {
          font-size: var(--text-2xl);
          filter: grayscale(1);
          opacity: 0.6;
        }

        .quick-add-workout-name {
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .quick-add-empty {
          text-align: center;
          color: var(--text-tertiary);
          font-size: var(--text-sm);
          padding: var(--space-3);
        }

        /* Workout Log */
        .workout-log-section {
          background: transparent;
          padding: var(--space-6);
          border-radius: var(--radius-lg);
          border: none;
          box-shadow: none;
          backdrop-filter: none;
          cursor: default;
        }

        .workout-log-list {
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
          padding: var(--space-2) 0;
          background: transparent;
          border-radius: 0;
          margin: 0;
          border-top: 1px solid var(--surface-overlay);
          border-bottom: 1px solid var(--surface-overlay);
          transition: none;
          box-shadow: none;
        }

        .workout-log-item:hover {
          transform: none;
          box-shadow: none;
        }

        .workout-log-item.mobile {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-4);
        }

        .workout-set-group {
          margin-bottom: var(--space-5);
          background: #181b22;
          border-radius: var(--radius-lg); /* Reduced roundness */
          border: none;
          padding: var(--space-4) var(--space-5);
          box-shadow: none;
        }
        .quick-workout-set-group {
          margin-bottom: var(--space-4);
          background: #181b22;
          border-radius: var(--radius-lg);
          border: none;
          padding: var(--space-3) var(--space-4);
          box-shadow: none;
          opacity: 0.75;
          filter: grayscale(100%);
        }
        .quick-add-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3);
        }

        .workout-set-header {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 0;
          gap: var(--space-4);
          position: relative;
        }

        .workout-analytics-button-dashboard {
          margin-left: auto;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          padding: var(--space-2);
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .workout-analytics-button-dashboard:hover {
          background: var(--bg-hover);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          transform: scale(1.1);
        }

        .workout-emoji-box {
          font-size: clamp(2.6rem, 4vw, 4rem);
          width: clamp(3.6rem, 4.6vw, 4.8rem);
          height: clamp(3.6rem, 4.6vw, 4.8rem);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .workout-set-info {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin-top: var(--space-1);
        }

        .btn-add-set {
          padding: var(--space-3) var(--space-6);
          background: var(--accent-primary);
          color: var(--bg-primary);
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: none;
          box-shadow: none;
          margin-left: auto;
        }

        .btn-add-set:hover,
        .btn-add-set:focus {
          transform: none;
          box-shadow: none;
          outline: none;
        }

        .workout-set-totals {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-4);
          margin: 0;
          padding: 0;
          background: transparent;
          border-radius: 0;
          border: none;
          box-shadow: none;
          justify-content: center;
          align-items: center;
          flex: 1;
        }

        .workout-set-logs {
          display: grid;
          grid-template-rows: 1fr;
          overflow: hidden;
          opacity: 1;
          transition: grid-template-rows 0.2s linear, opacity 0.2s linear;
        }

        .workout-set-logs.collapsed {
          grid-template-rows: 0fr;
          opacity: 0;
          pointer-events: none;
        }

        .workout-set-logs.expanded {
          grid-template-rows: 1fr;
          opacity: 1;
        }

        .workout-set-logs-content {
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .workout-log-line {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-5);
          font-size: var(--text-sm);
          color: var(--text-secondary);
          justify-content: flex-start;
          align-items: flex-start;
          width: 100%;
          padding-left: var(--space-4);
        }

        .workout-log-detail {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          min-width: 90px;
          flex: 0 0 auto;
          justify-content: flex-start;
        }

        .workout-log-detail-compact {
          min-width: 60px;
        }

        .workout-log-detail-rir {
          min-width: 45px;
        }

        .metric-label-small {
          font-size: 0.65rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .metric-colon {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .metric-value-small {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          text-align: left;
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
          background: transparent;
          border-radius: var(--radius-md);
          border: 1px solid var(--surface-overlay);
          box-shadow: none;
        }

        .workout-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          text-align: left;
        }

        .workout-name-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          flex: 1;
        }

        .workout-name {
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          font-size: clamp(1.4rem, 1.9vw, 2rem);
          line-height: 1.1;
          margin: 0;
          white-space: nowrap;
        }

        .workout-muscles-inline {
          font-size: var(--text-base);
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          font-weight: var(--font-weight-medium);
          margin-left: auto;
          text-align: right;
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
          justify-content: flex-start;
          flex-wrap: wrap;
          flex: 1;
          padding: 0;
          margin: 0;
          margin-left: var(--space-5);
        }

        .metric-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
          text-align: center;
          padding: 0;
          background: transparent;
          border-radius: 0;
          border: none;
          min-width: 90px;
          box-shadow: none;
        }

        .metric-item.metric-text {
          align-items: flex-start;
          text-align: left;
          max-width: 240px;
        }

        .metric-value {
          font-weight: var(--font-weight-bold);
          color: var(--accent-primary);
          font-size: var(--text-lg);
        }

        .metric-value-text {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          line-height: 1.4;
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
          border: none;
          border-radius: var(--radius-sm);
          background: var(--accent-danger);
          color: #0b0d12;
          cursor: pointer;
          transition: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: none;
        }

        .btn-icon-delete:hover {
          color: #fff;
          transform: none;
          box-shadow: none;
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

        @keyframes panelLift {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 1024px) {
          .header-control-bar {
            top: var(--space-4);
            left: 50%;
            transform: translateX(-50%);
            flex-wrap: wrap;
            justify-content: center;
            gap: var(--space-3);
          }

          .header-actions {
            gap: var(--space-3);
          }

          .dashboard-content {
            padding: var(--space-16) var(--space-4) var(--space-6);
          }
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
            padding: var(--space-16) var(--space-3) var(--space-6);
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
          animation: panelLift 0.25s var(--ease-out-cubic);
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
          border: none;
          border-radius: var(--radius-full);
          background: linear-gradient(145deg, var(--accent-danger), #FF8A8A);
          color: #0B0D12;
          cursor: pointer;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
        }

        .close-button:hover {
          color: #ffffff;
          transform: translateY(-4px);
          box-shadow: 0 24px 50px rgba(255, 107, 107, 0.35);
        }

        @media (min-width: 768px) {
          .modal {
            max-width: 90vw;
            max-height: 90vh;
          }
        }

        .workout-name-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .workout-muscles-inline {
          font-size: var(--text-xs);
          color: var(--text-secondary);
        }

        .workout-set-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0;
        }

        .workout-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .workout-name-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          flex: 1;
        }

  .workout-name {
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    font-size: clamp(1.4rem, 1.9vw, 2rem);
    line-height: 1.1;
    margin: 0;
    white-space: nowrap;
  }

  .workout-muscles-inline {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  .main-content-sections {
           display: flex;
           flex-direction: column;
           gap: var(--space-3);
           margin-bottom: var(--space-6);
           margin-top: var(--space-4);
         }

        .workout-set-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          padding: var(--space-3) 0;
          border-top: none;
          border-bottom: none;
          flex-wrap: wrap;
        }

        .workout-collapse-toggle {
          padding: var(--space-2);
          border: none;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .workout-collapse-toggle:hover,
        .workout-collapse-toggle:focus {
          color: var(--accent-primary);
          outline: none;
        }

        .collapse-triangle-icon {
          width: 20px;
          height: 20px;
          display: block;
        }
      `}</style>
    </div>
  );
};

export default WorkoutLoggingDashboard;
