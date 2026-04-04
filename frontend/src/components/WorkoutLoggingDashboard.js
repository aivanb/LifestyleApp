import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import WorkoutLogger from './WorkoutLogger';
import WorkoutAdder from './WorkoutAdder';
import { LinearProgressBar } from './ProgressBar';
import WorkoutAnalytics from './WorkoutAnalytics';
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { WORKOUT_TRACKER_CLOSE_BTN_CSS } from '../constants/workoutTrackerCloseButtonCss';
import {
  canonicalWorkoutLogAttributesForDisplay,
  labelForWorkoutLogAttributeKey,
} from '../constants/workoutLoggingAttributes';

/**
 * WorkoutLoggingDashboard — `/workout-tracker` shell (aligned with `/home` + `/food-log` header UX).
 *
 * Logged-set “attributes” shown per group are limited to the canonical list in
 * `src/constants/workoutLoggingAttributes.js` (same as `WorkoutLogger` modal).
 */
const WorkoutLoggingDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [analyticsWorkout, setAnalyticsWorkout] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [collapsedWorkouts, setCollapsedWorkouts] = useState({});
  const [mobileMuscleSidebarOpen, setMobileMuscleSidebarOpen] = useState(false);
  const [initialMuscleFilter, setInitialMuscleFilter] = useState('');
  const MOBILE_WORKOUT_DELETE_SWIPE_THRESHOLD = 96;
  const MOBILE_WORKOUT_SWIPE_MAX = 132;
  const [mobileWorkoutSwipeState, setMobileWorkoutSwipeState] = useState({});
  const [mobileWorkoutDeletingLogId, setMobileWorkoutDeletingLogId] = useState(null);
  const mobileWorkoutSwipeStartXRef = useRef({});
  const mobileWorkoutSwipeActiveIdRef = useRef(null);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );

  const PC_HEADER_ACTIONS_ANIM_MS = 220;
  const PC_HEADER_ACTIONS_START_CLOSE_DELAY_MS = 650;
  const MOBILE_QUICK_ACTIONS_ANIM_MS = 220;
  const headerRegionRef = useRef(null);
  const [showPcHeaderActions, setShowPcHeaderActions] = useState(false);
  const [pcHeaderActionsMounted, setPcHeaderActionsMounted] = useState(false);
  const [pcHeaderActionsClosing, setPcHeaderActionsClosing] = useState(false);
  const pcHeaderActionsStartCloseTimeoutRef = useRef(null);
  const pcHeaderActionsUnmountTimeoutRef = useRef(null);
  const [showMobileQuickActions, setShowMobileQuickActions] = useState(false);
  const [mobileQuickActionsMounted, setMobileQuickActionsMounted] = useState(false);
  const [mobileQuickActionsClosing, setMobileQuickActionsClosing] = useState(false);
  const mobileQuickActionsUnmountTimeoutRef = useRef(null);

  const toggleWorkoutCollapse = useCallback((workoutId) => {
    setCollapsedWorkouts((prev) => ({
      ...prev,
      [workoutId]: !prev[workoutId],
    }));
  }, []);

  useEffect(() => {
    document.body.classList.add('route-workout-tracker');
    return () => document.body.classList.remove('route-workout-tracker');
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const showPcHeaderActionsFromKeyboard = useCallback(() => {
    if (typeof window === 'undefined' || window.innerWidth <= 768) return;
    if (pcHeaderActionsStartCloseTimeoutRef.current) {
      clearTimeout(pcHeaderActionsStartCloseTimeoutRef.current);
    }
    if (pcHeaderActionsUnmountTimeoutRef.current) {
      clearTimeout(pcHeaderActionsUnmountTimeoutRef.current);
    }
    setPcHeaderActionsMounted(true);
    setShowPcHeaderActions(true);
  }, []);

  const openPcHeaderActions = useCallback(() => {
    if (typeof window === 'undefined' || window.innerWidth <= 768) return;
    if (pcHeaderActionsStartCloseTimeoutRef.current) {
      clearTimeout(pcHeaderActionsStartCloseTimeoutRef.current);
    }
    if (pcHeaderActionsUnmountTimeoutRef.current) {
      clearTimeout(pcHeaderActionsUnmountTimeoutRef.current);
    }
    setPcHeaderActionsClosing(false);
    setPcHeaderActionsMounted(true);
    setShowPcHeaderActions(true);
  }, []);

  const closePcHeaderActionsAnimated = useCallback(() => {
    if (!pcHeaderActionsMounted) return;
    if (pcHeaderActionsUnmountTimeoutRef.current) {
      clearTimeout(pcHeaderActionsUnmountTimeoutRef.current);
    }
    setPcHeaderActionsClosing(true);
    setShowPcHeaderActions(false);
    pcHeaderActionsUnmountTimeoutRef.current = window.setTimeout(() => {
      setPcHeaderActionsMounted(false);
      setPcHeaderActionsClosing(false);
    }, PC_HEADER_ACTIONS_ANIM_MS);
  }, [pcHeaderActionsMounted, PC_HEADER_ACTIONS_ANIM_MS]);

  const openMobileQuickActions = useCallback(() => {
    if (typeof window === 'undefined' || window.innerWidth > 768) return;
    if (mobileQuickActionsUnmountTimeoutRef.current) {
      clearTimeout(mobileQuickActionsUnmountTimeoutRef.current);
    }
    setMobileQuickActionsClosing(false);
    setMobileQuickActionsMounted(true);
    setShowMobileQuickActions(true);
  }, []);

  const closeMobileQuickActionsAnimated = useCallback(() => {
    if (!mobileQuickActionsMounted) return;
    if (mobileQuickActionsUnmountTimeoutRef.current) {
      clearTimeout(mobileQuickActionsUnmountTimeoutRef.current);
    }
    setShowMobileQuickActions(false);
    setMobileQuickActionsClosing(true);
    mobileQuickActionsUnmountTimeoutRef.current = window.setTimeout(() => {
      setMobileQuickActionsClosing(false);
      setMobileQuickActionsMounted(false);
    }, MOBILE_QUICK_ACTIONS_ANIM_MS);
  }, [mobileQuickActionsMounted, MOBILE_QUICK_ACTIONS_ANIM_MS]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('workout-dashboard-show-quick-add', showQuickAdd ? 'true' : 'false');
    }
  }, [showQuickAdd]);

  useEffect(() => {
    const openWorkoutSelection = Boolean(location.state?.openWorkoutSelection);
    const muscleFilter = location.state?.muscleFilter || '';
    if (!openWorkoutSelection) return;

    setPreSelectedWorkout(null);
    setInitialMuscleFilter(typeof muscleFilter === 'string' ? muscleFilter : '');
    setShowWorkoutSelectionModal(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

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

  /** Per-set rows for canonical attributes only (see `workoutLoggingAttributes.js`). */
  const renderCanonicalAttributeDetails = (log) =>
    canonicalWorkoutLogAttributesForDisplay(log.attributes).map((attrKey, idx) => {
      const attrInputs = log.attribute_inputs
        ? Object.entries(log.attribute_inputs)
            .filter(([key]) => key.startsWith(`${attrKey}_`))
            .map(([, value]) => value)
        : [];
      return (
        <div key={`${attrKey}-${idx}`} className="workout-log-detail">
          <span className="metric-label-small">{labelForWorkoutLogAttributeKey(attrKey)}</span>
          <span className="metric-colon">:</span>
          {attrInputs.length > 0 ? (
            <span className="metric-value-small">{attrInputs.join(' / ')}</span>
          ) : (
            <span className="metric-value-small">-</span>
          )}
        </div>
      );
    });

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
                    <button
                      type="button"
                      className="workout-analytics-button-dashboard workout-analytics-button-dashboard--group-corner"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnalyticsWorkout(workout);
                        setShowAnalytics(true);
                      }}
                      title="View Analytics"
                    >
                      <ChartBarIcon className="w-6 h-6" />
                    </button>
                    <div className="workout-set-header">
                      <div className="workout-emoji-box">{workoutEmoji}</div>
                      <div className="workout-name-row workout-name-row--stacked">
                        <div className="workout-name">{nameWithoutEmoji}</div>
                        {muscles && muscles.length > 0 && (
                          <div className="workout-muscles-inline">{muscles.join(', ')}</div>
                        )}
                      </div>
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

  const deleteWorkoutLog = useCallback(async (logId) => {
    try {
      await api.deleteWorkoutLog(logId);
      loadWorkoutLogs();
      loadWorkoutStats();
    } catch (err) {
      console.error('Failed to delete workout log:', err);
    }
  }, [loadWorkoutLogs, loadWorkoutStats]);

  const setWorkoutLogSwipeOffset = useCallback((logId, offsetX, isDragging = false) => {
    const clamped = Math.max(-MOBILE_WORKOUT_SWIPE_MAX, Math.min(0, offsetX));
    setMobileWorkoutSwipeState((prev) => ({
      ...prev,
      [logId]: { offsetX: clamped, isDragging },
    }));
  }, []);

  const handleWorkoutLogSwipeStart = useCallback(
    (logId, event) => {
      if (typeof window !== 'undefined' && window.innerWidth > 768) return;
      if (!event.touches || event.touches.length === 0) return;
      mobileWorkoutSwipeActiveIdRef.current = logId;
      mobileWorkoutSwipeStartXRef.current[logId] = event.touches[0].clientX;
      setWorkoutLogSwipeOffset(logId, mobileWorkoutSwipeState[logId]?.offsetX || 0, true);
    },
    [mobileWorkoutSwipeState, setWorkoutLogSwipeOffset]
  );

  const handleWorkoutLogSwipeMove = useCallback(
    (logId, event) => {
      const startX = mobileWorkoutSwipeStartXRef.current[logId];
      if (startX === undefined || mobileWorkoutSwipeActiveIdRef.current !== logId) return;
      if (!event.touches || event.touches.length === 0) return;
      const deltaX = event.touches[0].clientX - startX;
      if (deltaX < 0) {
        event.preventDefault();
        setWorkoutLogSwipeOffset(logId, deltaX, true);
      }
    },
    [setWorkoutLogSwipeOffset]
  );

  const handleWorkoutLogSwipeEnd = useCallback(
    async (logId) => {
      const currentOffset = mobileWorkoutSwipeState[logId]?.offsetX || 0;
      mobileWorkoutSwipeActiveIdRef.current = null;
      delete mobileWorkoutSwipeStartXRef.current[logId];

      if (
        currentOffset <= -MOBILE_WORKOUT_DELETE_SWIPE_THRESHOLD &&
        mobileWorkoutDeletingLogId !== logId
      ) {
        setMobileWorkoutDeletingLogId(logId);
        setWorkoutLogSwipeOffset(logId, -MOBILE_WORKOUT_SWIPE_MAX, false);
        await deleteWorkoutLog(logId);
        setMobileWorkoutDeletingLogId(null);
        setMobileWorkoutSwipeState((prev) => {
          const next = { ...prev };
          delete next[logId];
          return next;
        });
        return;
      }

      setWorkoutLogSwipeOffset(logId, 0, false);
    },
    [
      MOBILE_WORKOUT_DELETE_SWIPE_THRESHOLD,
      mobileWorkoutDeletingLogId,
      mobileWorkoutSwipeState,
      setWorkoutLogSwipeOffset,
      deleteWorkoutLog,
    ]
  );

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

  if (loading) {
    return (
      <div className="workout-logging-dashboard workout-logging-dashboard--loading">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading workout logging dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-logging-dashboard">
      <div
        className="dashboard-header"
        ref={headerRegionRef}
        onMouseEnter={() => {
          if (typeof window === 'undefined' || window.innerWidth <= 768) return;
          if (pcHeaderActionsStartCloseTimeoutRef.current) {
            clearTimeout(pcHeaderActionsStartCloseTimeoutRef.current);
          }
          if (pcHeaderActionsUnmountTimeoutRef.current) {
            clearTimeout(pcHeaderActionsUnmountTimeoutRef.current);
          }
        }}
        onMouseLeave={() => {
          if (typeof window === 'undefined' || window.innerWidth <= 768) return;
          if (!showPcHeaderActions) return;
          if (pcHeaderActionsStartCloseTimeoutRef.current) {
            clearTimeout(pcHeaderActionsStartCloseTimeoutRef.current);
          }
          pcHeaderActionsStartCloseTimeoutRef.current = window.setTimeout(() => {
            closePcHeaderActionsAnimated();
          }, PC_HEADER_ACTIONS_START_CLOSE_DELAY_MS);
        }}
      >
        <div className="header-content header-content--food-log workout-tracker-header--cols-2">
          <div className="header-date-wrap">
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
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      >
                        ←
                      </button>
                      <span>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      <button
                        type="button"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      >
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
                          type="button"
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

          <div className="header-actions-center">
            {isMobileViewport && (
              <button
                type="button"
                className="mobile-header-reveal"
                onClick={() => {
                  if (showMobileQuickActions) closeMobileQuickActionsAnimated();
                  else openMobileQuickActions();
                }}
                aria-expanded={showMobileQuickActions}
                aria-label={showMobileQuickActions ? 'Hide quick actions' : 'Show quick actions'}
                title={showMobileQuickActions ? 'Hide quick actions' : 'Show quick actions'}
              >
                {showMobileQuickActions ? (
                  <svg className="mobile-header-reveal__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M6 19l6-6 6 6M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="mobile-header-reveal__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M6 5l6 6 6-6M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )}
            {!isMobileViewport && !showPcHeaderActions && (
              <button
                type="button"
                className="header-actions-reveal"
                aria-label="Show header actions"
                onClick={openPcHeaderActions}
              >
                <span className="header-actions-reveal__glyph" aria-hidden>
                  <svg className="header-actions-reveal__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 5l6 6 6-6M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </div>

        {!isMobileViewport && pcHeaderActionsMounted && (
          <div
            className={`header-actions${showPcHeaderActions ? ' header-actions--open' : ''}${pcHeaderActionsClosing ? ' header-actions--closing' : ''}`}
          >
            <button
              type="button"
              className="btn-primary-header"
              onFocus={showPcHeaderActionsFromKeyboard}
              onClick={() => setShowWorkoutSelectionModal(true)}
              title="Select Workout"
            >
              <span className="header-action-label">Select Workout</span>
            </button>
            <button
              type="button"
              className="btn-primary-header"
              onFocus={showPcHeaderActionsFromKeyboard}
              onClick={() => setShowWorkoutCreator(true)}
              title="Create Workout"
            >
              <span className="header-action-label">Create Workout</span>
            </button>
          </div>
        )}
      </div>

      {isMobileViewport && mobileQuickActionsMounted && (
        <>
          <button
            type="button"
            className={`mobile-quick-actions-backdrop${showMobileQuickActions ? ' is-open' : ''}${mobileQuickActionsClosing ? ' is-closing' : ''}`}
            aria-label="Close quick actions"
            onClick={closeMobileQuickActionsAnimated}
          />
          <div
            className={`mobile-quick-actions-flyout${showMobileQuickActions ? ' is-open' : ''}${mobileQuickActionsClosing ? ' is-closing' : ''}`}
            role="dialog"
            aria-label="Quick actions"
          >
            <div className="mobile-actions mobile-actions--flyout">
              <button
                type="button"
                className="btn-icon-mobile btn-icon-mobile--primary-header"
                onClick={() => {
                  setShowWorkoutSelectionModal(true);
                  closeMobileQuickActionsAnimated();
                }}
                title="Select Workout"
              >
                <ClipboardDocumentListIcon className="btn-icon-mobile__hero" aria-hidden />
              </button>
              <button
                type="button"
                className="btn-icon-mobile btn-icon-mobile--primary-header"
                onClick={() => {
                  setShowWorkoutCreator(true);
                  closeMobileQuickActionsAnimated();
                }}
                title="Create Workout"
              >
                <PlusCircleIcon className="btn-icon-mobile__hero" aria-hidden />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {/* PC Layout - hidden on mobile via CSS */}
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
                          outOfSplit
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
                          <div key={workoutId} className="workout-set-block">
                            <div className="workout-set-group">
                              <button
                                type="button"
                                className="workout-analytics-button-dashboard workout-analytics-button-dashboard--group-corner"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAnalyticsWorkout(workout);
                                  setShowAnalytics(true);
                                }}
                                title="View Analytics"
                              >
                                <ChartBarIcon className="w-6 h-6" />
                              </button>
                              <div className="workout-set-header">
                                <div className="workout-emoji-box">{workoutEmoji}</div>
                                <div className="workout-name-row workout-name-row--stacked">
                                  <div className="workout-name">{nameWithoutEmoji}</div>
                                  {musclesList.length > 0 && (
                                    <div className="workout-muscles-inline">{musclesList.join(', ')}</div>
                                  )}
                                </div>
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
                                  <svg className="workout-collapse-icon" viewBox="0 0 24 24" aria-hidden="true">
                                    {isCollapsed ? (
                                      <circle cx="12" cy="12" r="8" fill="currentColor" />
                                    ) : (
                                      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
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
                            </div>
                            <div
                              className={`workout-set-logs workout-set-logs--detached ${isCollapsed ? 'collapsed' : 'expanded'}`}
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
                                          {renderCanonicalAttributeDetails(log)}
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

        {/* Mobile Layout - hidden on desktop via CSS */}
        <div className="dashboard-layout-mobile">
            {/* Muscle targets - collapsible on mobile */}
            {currentSplitDay && Object.keys(muscleProgress).length > 0 && (
              <>
                <button
                  type="button"
                  className="workout-mobile-muscle-toggle"
                  onClick={() => setMobileMuscleSidebarOpen(true)}
                  aria-label="Open muscle targets"
                >
                  Muscles
                </button>
                <div
                  className={`workout-muscle-sidebar-overlay${mobileMuscleSidebarOpen ? ' workout-muscle-sidebar-overlay--open' : ''}`}
                  onClick={() => setMobileMuscleSidebarOpen(false)}
                  aria-hidden={!mobileMuscleSidebarOpen}
                />
                <div
                  className={`muscle-progress-sidebar muscle-progress-sidebar--mobile ${mobileMuscleSidebarOpen ? 'muscle-progress-sidebar--mobile-open' : ''}`}
                >
                  <button
                    type="button"
                    className="workout-muscle-sidebar-close wk-track-close-btn"
                    onClick={() => setMobileMuscleSidebarOpen(false)}
                    aria-label="Close muscle targets"
                  >
                    <XMarkIcon className="wk-track-close-icon" strokeWidth={2} aria-hidden />
                  </button>
                  <h3 className="section-title">Today&apos;s Muscle Targets</h3>
                  <div className="muscle-progress-stack muscle-progress-stack--mobile">
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
                          layout="stacked"
                          showPercentage={false}
                          showLabelSeparatorDot={false}
                          height={10}
                          showValues
                          showRemaining={false}
                        />
                      ))}
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
                          outOfSplit
                          layout="stacked"
                          showPercentage={false}
                          showLabelSeparatorDot={false}
                          height={10}
                          showValues
                          showRemaining={false}
                        />
                      ))}
                  </div>
                </div>
              </>
            )}

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
                        <div key={workoutId} className="workout-set-block">
                          <div className="workout-set-group">
                            <button
                              type="button"
                              className="workout-analytics-button-dashboard workout-analytics-button-dashboard--group-corner"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAnalyticsWorkout(workout);
                                setShowAnalytics(true);
                              }}
                              title="View Analytics"
                            >
                              <ChartBarIcon className="w-6 h-6" />
                            </button>
                            <div className="workout-set-header">
                              <div className="workout-emoji-box">{workoutEmoji}</div>
                              <div className="workout-name-row workout-name-row--stacked">
                                <div className="workout-name">{nameWithoutEmoji}</div>
                                {musclesList.length > 0 && (
                                  <div className="workout-muscles-inline">{musclesList.join(', ')}</div>
                                )}
                              </div>
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
                                <svg className="workout-collapse-icon" viewBox="0 0 24 24" aria-hidden="true">
                                  {collapsedWorkouts[workoutId] ? (
                                    <circle cx="12" cy="12" r="8" fill="currentColor" />
                                  ) : (
                                    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
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
                          </div>
                          <div
                            className={`workout-set-logs workout-set-logs--detached ${collapsedWorkouts[workoutId] ? 'collapsed' : 'expanded'}`}
                            id={`workout-set-mobile-${workoutId}`}
                            aria-hidden={collapsedWorkouts[workoutId]}
                          >
                            <div className="workout-set-logs-content">
                              {logs.map((log) => (
                                <div key={log.workout_log_id} className="workout-log-item-mobile-wrap">
                                  <div className="workout-log-item-delete-bg" aria-hidden>
                                    <TrashIcon className="workout-log-item-delete-bg__icon" />
                                  </div>
                                  <div
                                    className={`workout-log-item mobile${mobileWorkoutDeletingLogId === log.workout_log_id ? ' is-deleting' : ''}`}
                                    style={{
                                      transform: `translateX(${mobileWorkoutSwipeState[log.workout_log_id]?.offsetX || 0}px)`,
                                    }}
                                    onTouchStart={(e) => handleWorkoutLogSwipeStart(log.workout_log_id, e)}
                                    onTouchMove={(e) => handleWorkoutLogSwipeMove(log.workout_log_id, e)}
                                    onTouchEnd={() => handleWorkoutLogSwipeEnd(log.workout_log_id)}
                                    onTouchCancel={() => handleWorkoutLogSwipeEnd(log.workout_log_id)}
                                  >
                                    <div className="workout-info">
                                      <div className="workout-details">
                                        <div className="workout-log-line workout-log-line--mobile-one-line">
                                          <div className="workout-log-detail">
                                            <span className="metric-label-small">Wt</span>
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
                                          {renderCanonicalAttributeDetails(log)}
                                        </div>
                                      </div>
                                    </div>
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
      </div>

      {/* Modals for Mobile */}
      {isMobileViewport && (
        <>
          {showWorkoutCreator && (
            <div className="modal-backdrop modal-backdrop--workout-creator-mobile" onClick={() => setShowWorkoutCreator(false)}>
              <div className="modal-content workout-creator-modal workout-creator-modal--mobile" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header workout-creator-modal-header">
                  <h2 className="modal-title">Create Workout</h2>
                  <button 
                    type="button"
                    className="close-button workout-creator-modal-close wk-track-close-btn"
                    onClick={() => setShowWorkoutCreator(false)}
                    aria-label="Close"
                  >
                    <XMarkIcon className="wk-track-close-icon" strokeWidth={2} aria-hidden />
                  </button>
                </div>
                <div className="modal-body workout-creator-modal-body">
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
                setInitialMuscleFilter('');
              }}
              preSelectedWorkout={preSelectedWorkout}
              initialMuscleFilter={initialMuscleFilter}
            />
          )}

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

      {/* PC Modals */}
      {!isMobileViewport && (
        <>
          {showWorkoutCreator && (
            <div className="modal-backdrop" onClick={() => setShowWorkoutCreator(false)}>
              <div className="modal-content workout-creator-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header workout-creator-modal-header">
                  <h2 className="modal-title">Create Workout</h2>
                  <button 
                    type="button"
                    className="modal-close-button wk-track-close-btn"
                    onClick={() => setShowWorkoutCreator(false)}
                    aria-label="Close"
                  >
                    <XMarkIcon className="wk-track-close-icon" strokeWidth={2} aria-hidden />
                  </button>
                </div>
                <div className="modal-body workout-creator-modal-body">
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
                setInitialMuscleFilter('');
              }}
              preSelectedWorkout={preSelectedWorkout}
              initialMuscleFilter={initialMuscleFilter}
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

      <style>{`${WORKOUT_TRACKER_CLOSE_BTN_CSS}
        .route-workout-tracker .main-content {
          justify-content: flex-start;
          align-items: stretch;
          max-width: 100%;
          overflow-x: clip;
          box-sizing: border-box;
        }

        .workout-logging-dashboard {
          --workoutlog-card-bg: #171c24;
          --workoutlog-shell-bg: #040508;
          min-height: 100vh;
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 0 0 var(--space-4);
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          font-size: var(--text-lg);
          font-family: var(--font-primary);
          box-sizing: border-box;
        }

        .workout-logging-dashboard--loading {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        [data-theme="dark"] .workout-logging-dashboard {
          --workoutlog-shell-tint: rgba(255, 255, 255, 0.045);
          --workoutlog-shell-strong: rgba(255, 255, 255, 0.11);
          background-color: #040508;
          background-image:
            linear-gradient(var(--workoutlog-shell-tint) 1px, transparent 1px),
            linear-gradient(90deg, var(--workoutlog-shell-tint) 1px, transparent 1px),
            linear-gradient(var(--workoutlog-shell-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--workoutlog-shell-strong) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 80px 80px, 80px 80px;
          background-attachment: fixed;
        }

        [data-theme="light"] .workout-logging-dashboard {
          --workoutlog-card-bg: #ffffff;
          --workoutlog-shell-bg: #e8eaf2;
          --workoutlog-shell-tint: rgba(0, 0, 0, 0.04);
          --workoutlog-shell-strong: rgba(0, 0, 0, 0.1);
          background-color: #e8eaf2;
          background-image:
            linear-gradient(var(--workoutlog-shell-tint) 1px, transparent 1px),
            linear-gradient(90deg, var(--workoutlog-shell-tint) 1px, transparent 1px),
            linear-gradient(var(--workoutlog-shell-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--workoutlog-shell-strong) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 80px 80px, 80px 80px;
          background-attachment: fixed;
        }

        .workout-logging-dashboard .dashboard-header {
          position: relative;
          z-index: 30;
          overflow: visible;
          background: transparent;
          border: none;
          padding: 0;
          width: 100%;
          margin: 0;
        }

        .workout-logging-dashboard .header-content--food-log {
          display: grid;
          grid-template-columns: max-content 1fr max-content;
          align-items: center;
          width: 100%;
          margin: 0;
          padding: var(--space-2) var(--space-4);
          gap: var(--space-2);
          box-sizing: border-box;
        }

        .workout-logging-dashboard .header-content--food-log.workout-tracker-header--cols-2 {
          grid-template-columns: max-content 1fr;
        }

        .workout-logging-dashboard .header-date-wrap {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          min-width: 0;
        }

        .workout-logging-dashboard .header-actions-center {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          min-width: 0;
          align-self: center;
          min-height: 52px;
        }

        .workout-logging-dashboard .header-actions-reveal {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 380px;
          height: 52px;
          padding: 0 var(--space-4);
          border: none;
          border-radius: var(--radius-md);
          background: transparent;
          color: rgba(255, 255, 255, 0.95);
          font-family: var(--font-primary);
          cursor: pointer;
          box-shadow: none;
          -webkit-tap-highlight-color: transparent;
        }

        [data-theme="light"] .workout-logging-dashboard .header-actions-reveal {
          color: var(--text-primary);
        }

        .workout-logging-dashboard .header-actions-reveal:focus,
        .workout-logging-dashboard .header-actions-reveal:focus-visible,
        .workout-logging-dashboard .header-actions-reveal:active {
          outline: none !important;
          box-shadow: none !important;
        }

        .workout-logging-dashboard .header-actions-reveal__glyph {
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
        }

        .workout-logging-dashboard .header-actions-reveal__icon {
          width: 120px;
          height: 44px;
        }

        .workout-logging-dashboard .mobile-header-reveal {
          display: none;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 40px;
          padding: var(--space-1);
          border: none;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .workout-logging-dashboard .mobile-header-reveal:focus,
        .workout-logging-dashboard .mobile-header-reveal:focus-visible,
        .workout-logging-dashboard .mobile-header-reveal:active {
          outline: none !important;
          box-shadow: none !important;
        }

        .workout-logging-dashboard .mobile-header-reveal__icon {
          width: 36px;
          height: 36px;
        }

        .workout-logging-dashboard .header-streak-wrap {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          min-width: 0;
          transform: translateX(-10px);
        }

        .workout-logging-dashboard .header-actions {
          position: absolute;
          top: calc(100% - 50px);
          left: 50%;
          transform: translateX(-50%) translateY(-10px) scale(0.98);
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          white-space: nowrap;
          z-index: 1200;
          pointer-events: none;
          opacity: 0;
          transition:
            opacity 220ms ease,
            transform 220ms ease;
          will-change: opacity, transform;
        }

        .workout-logging-dashboard .header-actions--open {
          pointer-events: auto;
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
          animation: workoutHeaderActionsIn 220ms ease both;
        }

        .workout-logging-dashboard .header-actions--closing {
          pointer-events: none;
          transition: none;
          animation: workoutHeaderActionsOut 220ms ease both;
        }

        @keyframes workoutHeaderActionsIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        @keyframes workoutHeaderActionsOut {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px) scale(0.98);
          }
        }

        .workout-logging-dashboard .streak-counter {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          background: transparent;
          padding: 0;
          border-radius: 0;
          border: none;
          box-shadow: none;
          backdrop-filter: none;
          opacity: 1;
        }

        .workout-logging-dashboard .workout-header-sets-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #79b5fb;
        }

        .workout-logging-dashboard .workout-header-sets-icon svg {
          display: block;
          position: relative;
          top: 1px;
        }

        .workout-logging-dashboard .streak-number {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-regular);
          color: #79b5fb;
          line-height: 1;
          position: relative;
          top: 5px;
        }

        .workout-logging-dashboard .btn-primary-header {
          padding: 0 var(--space-6);
          border: none;
          border-radius: var(--radius-md);
          opacity: 1;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--workoutlog-shell-bg);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          min-width: 268px;
          height: 80px;
          box-shadow: none;
          font-family: var(--font-primary);
          z-index: calc(var(--z-fixed) + 5);
          background: #79b5fb;
        }

        .workout-logging-dashboard .btn-primary-header:focus {
          outline: 2px solid #a78bfa;
          outline-offset: 2px;
        }

        .workout-logging-dashboard .btn-primary-header .header-action-label {
          color: var(--workoutlog-shell-bg);
          font-weight: var(--font-weight-bold);
        }

        .workout-logging-dashboard .controls-section {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          justify-content: flex-start;
        }

        .workout-logging-dashboard .date-input {
          padding: var(--space-2) var(--space-3);
          min-height: 48px;
          height: 48px;
          border: none;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          font-size: var(--text-base);
          color: var(--text-primary);
          font-family: var(--font-primary);
          min-width: 182px;
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .workout-logging-dashboard .date-input:focus {
          outline: none;
          border-color: transparent;
          box-shadow: none;
        }

        @media (min-width: 769px) {
          .workout-logging-dashboard .header-content--food-log {
            padding: var(--space-4) var(--space-4);
            gap: var(--space-3);
          }

          .workout-logging-dashboard .streak-number {
            font-size: var(--text-4xl);
            top: 6px;
          }

          .workout-logging-dashboard .workout-header-sets-icon svg {
            width: 32px;
            height: 32px;
          }

          .workout-logging-dashboard .header-date-wrap .date-input {
            font-size: var(--text-xl);
            font-weight: var(--font-weight-bold);
            min-height: 52px;
            height: 52px;
          }
        }

        .workout-logging-dashboard .custom-date-picker {
          position: relative;
          display: inline-block;
          z-index: 50;
        }

        /* Custom calendar popup */
        .workout-logging-dashboard .custom-calendar-popup {
          position: absolute;
          top: 100%;
          left: 0;
          right: auto;
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

        .workout-logging-dashboard .dashboard-content {
          width: 100%;
          margin: 0;
          padding: var(--space-2) var(--space-1) var(--space-5);
          box-sizing: border-box;
        }

        @media (min-width: 769px) {
          .workout-logging-dashboard .dashboard-content {
            padding: var(--space-3) var(--space-2) var(--space-8);
          }
        }

        .workout-logging-dashboard .dashboard-layout-pc {
          display: grid;
          grid-template-columns: minmax(360px, 480px) 1fr;
          column-gap: var(--space-5);
          row-gap: 0;
          align-items: start;
          width: 100%;
          padding-left: var(--space-2);
          box-sizing: border-box;
        }

        @media (min-width: 769px) {
          .workout-logging-dashboard .dashboard-layout-pc {
            padding-left: var(--space-3);
          }
        }

        .workout-logging-dashboard .muscle-progress-sidebar {
          width: 100%;
          background: var(--workoutlog-card-bg);
          padding: var(--space-5);
          border-radius: var(--radius-lg);
          border: 1px solid transparent;
          box-shadow: var(--shadow-md);
          position: sticky;
          top: var(--space-6);
          height: 100%;
          align-self: stretch;
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(8px);
          box-sizing: border-box;
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

        .workout-logging-dashboard .dashboard-layout-mobile {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .workout-logging-dashboard .mobile-actions--flyout {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4);
          width: 100%;
          max-width: 360px;
          margin: 0 auto;
        }

        .workout-logging-dashboard .btn-icon-mobile {
          width: 72px;
          height: 72px;
          padding: 0;
          border: none;
          border-radius: var(--radius-md);
          background: #79b5fb;
          color: var(--workoutlog-shell-bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: none;
        }

        .workout-logging-dashboard .btn-icon-mobile--primary-header {
          background: #79b5fb;
          color: var(--workoutlog-shell-bg);
        }

        .workout-logging-dashboard .btn-icon-mobile__hero {
          width: 2rem;
          height: 2rem;
        }

        .workout-logging-dashboard .btn-icon-mobile:focus {
          outline: 2px solid #a78bfa;
          outline-offset: 2px;
        }

        .workout-logging-dashboard .mobile-quick-actions-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1023;
          border: none;
          margin: 0;
          padding: 0;
          background: rgba(0, 0, 0, 0.42);
          cursor: pointer;
          opacity: 0;
          pointer-events: none;
          transition: opacity 220ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .workout-logging-dashboard .mobile-quick-actions-backdrop.is-open {
          opacity: 1;
          pointer-events: auto;
        }

        .workout-logging-dashboard .mobile-quick-actions-backdrop.is-closing {
          pointer-events: none;
          opacity: 1;
          transition: none;
          animation: workoutMobileQuickBackdropOut 220ms ease both;
        }

        .workout-logging-dashboard .mobile-quick-actions-flyout {
          position: fixed;
          left: 0;
          right: 0;
          top: calc(max(var(--space-2), env(safe-area-inset-top, 0px)) + 64px);
          z-index: 1024;
          padding: 0 var(--space-3) var(--space-3);
          pointer-events: none;
          opacity: 0;
          transform: translateY(-10px) scale(0.98);
          transition:
            opacity 220ms ease,
            transform 220ms ease;
        }

        .workout-logging-dashboard .mobile-quick-actions-flyout.is-open {
          pointer-events: auto;
          opacity: 1;
          transform: translateY(0) scale(1);
          animation: workoutMobileQuickActionsIn 220ms ease both;
        }

        .workout-logging-dashboard .mobile-quick-actions-flyout.is-closing {
          pointer-events: none;
          transition: none;
          animation: workoutMobileQuickActionsOut 220ms ease both;
        }

        @keyframes workoutMobileQuickActionsIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes workoutMobileQuickActionsOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
        }

        @keyframes workoutMobileQuickBackdropOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        /* Workout Stats */
        .workout-logging-dashboard .workout-stats-section {
          background: var(--workoutlog-card-bg);
          padding: var(--space-4) var(--space-5);
          border-radius: var(--radius-lg);
          border: 1px solid transparent;
          box-shadow: var(--shadow-md);
          margin: var(--space-3) 0 0;
          backdrop-filter: blur(8px);
          box-sizing: border-box;
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

        .workout-logging-dashboard .workout-stats-section.card:hover {
          transform: none;
          box-shadow: var(--shadow-md);
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
          padding: var(--space-3) var(--space-2);
          border-radius: var(--radius-lg);
          border: none;
          box-shadow: none;
          backdrop-filter: none;
          cursor: default;
        }

        .workout-log-list {
          padding: var(--space-1);
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .workout-log-items {
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
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
          padding: var(--space-3) var(--space-3);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin: 0 0 var(--space-3);
          border: 2px solid rgba(255, 255, 255, 0.11);
          position: relative;
          transition: none;
          box-shadow: none;
          box-sizing: border-box;
        }

        [data-theme='light'] .workout-logging-dashboard .workout-log-item {
          border-color: rgba(15, 23, 42, 0.12);
        }

        .workout-log-item:hover {
          transform: none;
          box-shadow: none;
        }

        .workout-set-logs--detached .workout-set-logs-content {
          position: relative;
          margin-top: 0;
          margin-left: var(--space-2);
          padding-left: var(--space-4);
          border-left: 2px solid rgba(255, 255, 255, 0.72);
        }

        [data-theme='light'] .workout-logging-dashboard .workout-set-logs--detached .workout-set-logs-content {
          border-left-color: rgba(148, 163, 184, 0.55);
        }

        .workout-set-logs-content > .workout-log-item:last-child {
          margin-bottom: 0;
        }

        .workout-log-item.mobile {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-4);
          margin-bottom: 0;
        }

        .workout-set-block {
          margin-bottom: var(--space-4);
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .workout-logging-dashboard .workout-set-group {
          position: relative;
          margin-bottom: 0;
          background: var(--workoutlog-card-bg);
          border-radius: var(--radius-lg);
          border: 1px solid transparent;
          padding: var(--space-4) var(--space-5) var(--space-1);
          box-shadow: var(--shadow-md);
          box-sizing: border-box;
        }

        .workout-set-logs.workout-set-logs--detached {
          margin-top: var(--space-3);
        }

        .workout-set-logs.workout-set-logs--detached.collapsed {
          margin-top: 0;
        }
        .workout-logging-dashboard .quick-workout-set-group {
          position: relative;
          margin-bottom: var(--space-4);
          background: var(--workoutlog-card-bg);
          border-radius: var(--radius-lg);
          border: 1px solid transparent;
          padding: var(--space-3) var(--space-4);
          box-shadow: var(--shadow-md);
          opacity: 0.85;
          filter: grayscale(80%);
          box-sizing: border-box;
        }
        .quick-add-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-3);
        }

        .workout-logging-dashboard .workout-set-header {
          display: flex;
          justify-content: flex-start;
          align-items: flex-start;
          margin-bottom: var(--space-2);
          gap: var(--space-3);
          position: relative;
        }

        .workout-analytics-button-dashboard {
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
          margin-left: var(--space-2);
        }

        .workout-analytics-button-dashboard--group-corner {
          position: absolute;
          top: var(--space-3);
          right: var(--space-3);
          z-index: 2;
          margin-left: 0;
        }

        .workout-logging-dashboard .quick-workout-set-group .workout-analytics-button-dashboard--group-corner {
          top: var(--space-2);
          right: var(--space-2);
        }

        .workout-analytics-button-dashboard svg {
          width: 24px;
          height: 24px;
          display: block;
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
          gap: var(--space-2);
          margin-top: var(--space-2);
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

        .workout-logging-dashboard .workout-name-row {
          display: flex;
          flex-wrap: wrap;
          flex-direction: row;
          align-items: flex-start;
          gap: var(--space-2);
          flex: 1;
          min-width: 0;
        }

        .workout-logging-dashboard .workout-name-row--stacked {
          flex-direction: column;
          align-items: flex-start;
          align-self: stretch;
          gap: var(--space-1);
          padding-right: 3.25rem;
          box-sizing: border-box;
        }

        .workout-logging-dashboard .workout-name {
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          font-size: clamp(1.25rem, 2vw, 1.75rem);
          line-height: 1.2;
          margin: 0;
          margin-bottom: 0;
          min-width: 0;
          flex: 1 1 auto;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .workout-logging-dashboard .workout-muscles-inline {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          display: inline;
          width: auto;
          max-width: min(100%, 52vw);
          font-weight: var(--font-weight-medium);
          margin-top: 0;
          line-height: 1.35;
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .workout-logging-dashboard .workout-name-row--stacked .workout-muscles-inline {
          display: block;
          width: 100%;
          max-width: 100%;
          white-space: normal;
          overflow: visible;
          text-overflow: unset;
          margin-top: var(--space-1);
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

        @media (max-width: 768px) {
          .workout-logging-dashboard {
            overflow-x: clip;
          }

          .workout-logging-dashboard .btn-icon-mobile {
            width: 88px;
            height: 88px;
          }

          .workout-logging-dashboard .btn-icon-mobile__hero {
            width: 2.5rem;
            height: 2.5rem;
          }

          .workout-logging-dashboard .dashboard-layout-pc {
            display: none;
          }

          .workout-logging-dashboard .mobile-header-reveal {
            display: inline-flex;
          }

          .workout-logging-dashboard .header-actions-reveal {
            min-width: 0;
            width: 100%;
            max-width: 100%;
          }

          .workout-logging-dashboard .header-content--food-log {
            padding: var(--space-2) var(--space-2);
            gap: var(--space-2);
          }

          .workout-logging-dashboard .btn-primary-header {
            min-width: min(268px, 88vw);
            height: 64px;
            font-size: var(--text-lg);
            padding: 0 var(--space-4);
          }

          .workout-logging-dashboard .dashboard-content {
            padding: var(--space-2) var(--space-1) var(--space-5);
          }

          .workout-logging-dashboard .dashboard-layout-mobile {
            padding: 0;
            padding-bottom: calc(3.75rem + env(safe-area-inset-bottom, 0px));
            gap: var(--space-3);
            box-sizing: border-box;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            overflow-x: clip;
          }

          .dashboard-layout-mobile .workout-log-section {
            margin-top: 0;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .workout-logging-dashboard .workout-mobile-muscle-toggle {
            position: fixed;
            bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0px) + 40px);
            right: var(--space-3);
            left: auto;
            z-index: 90;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: var(--space-2) var(--space-3);
            max-width: 6.25rem;
            min-height: 42px;
            font-size: var(--text-base);
            font-weight: var(--font-weight-semibold);
            letter-spacing: 0.02em;
            background: var(--workoutlog-card-bg);
            border: 1px solid rgba(128, 128, 128, 0.55);
            border-radius: var(--radius-lg);
            color: var(--text-primary);
            cursor: pointer;
            margin: 0;
            box-shadow: var(--shadow-md);
            -webkit-tap-highlight-color: transparent;
          }

          .workout-muscle-sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            z-index: 998;
            opacity: 0;
            pointer-events: none;
            transition: opacity 280ms ease;
          }

          .workout-muscle-sidebar-overlay.workout-muscle-sidebar-overlay--open {
            opacity: 1;
            pointer-events: auto;
          }

          .workout-logging-dashboard .muscle-progress-sidebar--mobile {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            right: 0;
            width: min(300px, 88vw);
            height: 100vh;
            height: 100dvh;
            z-index: 999;
            transform: translateX(100%);
            transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
            will-change: transform;
            border-radius: 0;
            border-top-left-radius: var(--radius-lg);
            border-bottom-left-radius: var(--radius-lg);
            border-left: 1px solid var(--border-primary);
            background: var(--workoutlog-card-bg);
            box-sizing: border-box;
            padding: var(--space-4);
            padding-top: calc(var(--space-4) + env(safe-area-inset-top, 0px));
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .workout-logging-dashboard .muscle-progress-sidebar--mobile-open {
            transform: translateX(0);
          }

          .workout-logging-dashboard .muscle-progress-stack--mobile {
            gap: var(--space-4);
          }

          .workout-muscle-sidebar-close {
            position: absolute;
            top: calc(var(--space-2) + env(safe-area-inset-top, 0px));
            right: var(--space-2);
            z-index: 2;
          }

          .workout-muscle-sidebar-close.wk-track-close-btn {
            font-size: 0;
          }

          .workout-logging-dashboard .workout-log-item-mobile-wrap {
            position: relative;
            overflow: hidden;
            border-radius: var(--radius-md);
            margin-bottom: var(--space-3);
            border: 2px solid rgba(255, 255, 255, 0.11);
            box-sizing: border-box;
          }

          [data-theme='light'] .workout-logging-dashboard .workout-log-item-mobile-wrap {
            border-color: rgba(15, 23, 42, 0.12);
          }

          .workout-logging-dashboard .workout-set-logs-content > .workout-log-item-mobile-wrap:last-child {
            margin-bottom: 0;
          }

          .workout-logging-dashboard .workout-log-item-delete-bg {
            position: absolute;
            inset: 2px;
            background: var(--accent-danger);
            color: white;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: var(--space-4);
            pointer-events: none;
            border-radius: inherit;
          }

          .workout-logging-dashboard .workout-log-item-delete-bg__icon {
            width: 1.5rem;
            height: 1.5rem;
            flex-shrink: 0;
          }

          .workout-logging-dashboard .workout-log-item.mobile {
            touch-action: pan-y;
            transition: transform 160ms var(--ease-out-cubic), opacity 160ms var(--ease-out-cubic);
            margin-bottom: 0;
            background: var(--bg-tertiary);
            border-radius: var(--radius-md);
            padding: var(--space-4) var(--space-3);
          }

          .workout-logging-dashboard .workout-log-item.mobile.is-deleting {
            opacity: 0.55;
            filter: grayscale(0.25);
          }

          .workout-logging-dashboard .workout-log-line--mobile-one-line {
            display: flex;
            flex-wrap: nowrap;
            gap: var(--space-2);
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            width: 100%;
            padding-bottom: var(--space-1);
            scrollbar-width: none;
          }

          .workout-logging-dashboard .workout-log-line--mobile-one-line::-webkit-scrollbar {
            display: none;
          }

          .workout-logging-dashboard .workout-log-line--mobile-one-line .workout-log-detail {
            flex: 0 0 auto;
            min-width: 0;
          }

          .workout-logging-dashboard .workout-set-totals {
            flex-wrap: nowrap !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            gap: var(--space-2) !important;
            font-size: 0.7rem;
            padding-bottom: var(--space-1);
          }

          .workout-logging-dashboard .workout-set-totals .metric-item {
            flex: 0 0 auto;
            min-width: 0;
          }

          .workout-logging-dashboard .workout-set-totals .metric-value {
            font-size: 0.85rem;
          }

          .workout-modal-mobile,
          .workout-logging-dashboard .modal-backdrop .modal {
            max-width: 100%;
            width: 100%;
            max-height: 88vh;
            padding: var(--space-3);
            font-size: var(--text-sm);
          }

          .workout-logging-dashboard .modal-backdrop {
            padding: var(--space-2);
            align-items: flex-start;
          }

          /* Match WorkoutLogger workout-selection-modal mobile panel + overlay */
          .workout-logging-dashboard .modal-content.workout-creator-modal {
            width: 100%;
            max-width: 100%;
            height: 90vh;
            max-height: 90vh;
            margin: 0;
            border-radius: var(--radius-lg);
            border: 2px solid var(--border-primary);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            min-height: 0;
            overflow: hidden;
          }

          .workout-logging-dashboard .modal-backdrop.modal-backdrop--workout-creator-mobile {
            padding: var(--space-4);
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
          }

          .workout-creator-modal--mobile .modal-header.workout-creator-modal-header {
            padding: var(--space-4);
            flex-shrink: 0;
          }

          .workout-creator-modal--mobile .modal-body.workout-creator-modal-body {
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .workout-creator-modal--mobile .workout-creator-modal-close.wk-track-close-btn {
            width: 2.25rem;
            height: 2.25rem;
            border-radius: var(--radius-md);
            font-size: 0;
          }

          .btn-icon-delete {
            background: var(--bg-tertiary);
            color: var(--text-secondary);
            border: 1px solid var(--border-primary);
          }

          .btn-icon-delete:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
            border-color: var(--accent-primary);
          }

          .workout-logging-dashboard .workout-set-block {
            margin-bottom: var(--space-3);
          }

          .workout-logging-dashboard .workout-set-group,
          .workout-logging-dashboard .quick-workout-set-group {
            padding: var(--space-3) var(--space-3) 0;
            margin-bottom: 0;
          }

          .workout-logging-dashboard .quick-workout-set-group {
            margin-bottom: var(--space-3);
          }

          .workout-logging-dashboard .workout-set-header {
            gap: var(--space-2);
            flex-wrap: nowrap;
            align-items: flex-start;
          }

          .workout-logging-dashboard .workout-name-row {
            flex: 1;
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-2);
            flex-wrap: nowrap;
            min-width: 0;
          }

          .workout-logging-dashboard .workout-name,
          .workout-logging-dashboard .workout-name-button {
            margin-bottom: 0;
            white-space: normal;
            word-break: break-word;
            font-size: var(--text-2xl);
            line-height: 1.25;
          }

          .workout-logging-dashboard .workout-muscles-inline {
            margin-top: 0;
            order: 0;
            width: 100%;
            font-size: var(--text-xs);
            line-height: 1.35;
          }

          .workout-logging-dashboard .workout-set-summary {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            grid-template-rows: auto auto;
            align-items: center;
            column-gap: var(--space-2);
            row-gap: var(--space-2);
            padding: var(--space-2) 0;
          }

          .workout-logging-dashboard .workout-set-summary .workout-collapse-toggle {
            grid-column: 1;
            grid-row: 1;
            align-self: center;
          }

          .workout-logging-dashboard .workout-set-summary .workout-collapse-toggle:hover,
          .workout-logging-dashboard .workout-set-summary .workout-collapse-toggle:focus,
          .workout-logging-dashboard .workout-set-summary .workout-collapse-toggle:focus-visible {
            color: var(--text-secondary);
            background: transparent;
            outline: none;
            box-shadow: none;
          }

          .workout-logging-dashboard .workout-set-summary .workout-collapse-icon {
            width: 30px;
            height: 30px;
          }

          .workout-logging-dashboard .workout-set-summary .workout-set-totals {
            grid-column: 2;
            grid-row: 1;
            width: 100%;
            min-width: 0;
            flex: none;
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            gap: var(--space-1);
            justify-content: space-between;
            font-size: 0.65rem;
          }

          .workout-logging-dashboard .workout-set-summary .workout-set-totals .metric-item {
            min-width: 0;
            flex: 1 1 0;
          }

          .workout-logging-dashboard .workout-set-summary .btn-add-set {
            grid-column: 1 / -1;
            grid-row: 2;
            width: 100%;
            margin-left: 0;
            margin-top: 0;
            box-sizing: border-box;
          }

          .workout-logging-dashboard .workout-log-item.mobile {
            gap: var(--space-2);
            width: 100%;
            box-sizing: border-box;
          }

          .workout-logging-dashboard .workout-log-line {
            display: flex;
            flex-wrap: wrap;
            gap: var(--space-2);
            padding-left: 0;
            width: 100%;
          }

          .workout-logging-dashboard .workout-log-detail {
            flex-shrink: 0;
            min-width: 0;
          }

          .workout-logging-dashboard .workout-log-detail .metric-label-small,
          .workout-logging-dashboard .workout-log-detail .metric-value-small {
            font-size: var(--text-xs);
          }

          .workout-logging-dashboard .custom-calendar-popup {
            min-width: min(320px, calc(100vw - var(--space-4)));
            max-width: calc(100vw - var(--space-4));
          }
        }

        @media (min-width: 769px) {
          .workout-logging-dashboard .dashboard-layout-mobile {
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
          border: 2px solid var(--border-primary);
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

        .modal-header.workout-creator-modal-header {
          background: transparent;
          padding: var(--space-3) var(--space-5);
          border-bottom: 1px solid var(--border-primary);
        }

        .workout-creator-modal-body {
          padding: 0;
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

        .modal-close-button.wk-track-close-btn {
          font-size: 0;
          padding: 0;
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
          width: 44px;
          height: 44px;
          border: none;
          border-radius: var(--radius-full);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          transition: transform 0.2s ease, color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: none;
        }

        .close-button.wk-track-close-btn {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--radius-md);
          font-size: 0;
          font-weight: normal;
        }

        .close-button:hover {
          color: var(--text-primary);
          transform: translateY(-2px);
          box-shadow: none;
        }

        .close-button.wk-track-close-btn:hover {
          transform: none;
        }

        @media (min-width: 768px) {
          .modal {
            max-width: 90vw;
            max-height: 90vh;
          }
        }

        .workout-logging-dashboard .workout-name-button {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font: inherit;
          color: inherit;
          text-align: left;
        }

  .main-content-sections {
           display: flex;
           flex-direction: column;
           gap: var(--space-3);
           margin-bottom: var(--space-6);
           margin-top: var(--space-4);
           width: 100%;
           min-width: 0;
           box-sizing: border-box;
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
          padding: var(--space-3);
          border: none;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
        }

        .workout-collapse-toggle:hover,
        .workout-collapse-toggle:focus,
        .workout-collapse-toggle:focus-visible {
          color: var(--text-secondary);
          background: transparent;
          outline: none;
          box-shadow: none;
        }

        .workout-collapse-icon {
          width: 28px;
          height: 28px;
          display: block;
          flex-shrink: 0;
        }

        @media (min-width: 769px) {
          .workout-logging-dashboard .workout-set-summary .workout-collapse-toggle {
            margin-left: 10px;
            padding: var(--space-4);
          }

          .workout-logging-dashboard .workout-set-summary .workout-collapse-icon {
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkoutLoggingDashboard;
