import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../services/api';
import { ExpandedProgressView, ProgressGrid } from './ProgressBar';
import FoodLogger from './FoodLogger';
import FoodCreator from './FoodCreator';
import MealCreator from './MealCreator';
import FoodChatbot from './FoodChatbot';
import FoodMetadataModal from './FoodMetadataModal';

/** YYYY-MM-DD in the user's local calendar (matches custom calendar grid cells; avoids UTC shift from toISOString). */
function formatYmdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local calendar day as ISO datetimes for food logs (backend filters on `date_time` range). */
function localYmdToIsoRange(ymd) {
  const [y, mo, d] = ymd.split('-').map(Number);
  const start = new Date(y, mo - 1, d, 0, 0, 0, 0);
  const end = new Date(y, mo - 1, d, 23, 59, 59, 999);
  return { start_date: start.toISOString(), end_date: end.toISOString() };
}

/**
 * FoodLoggingDashboard Component
 * 
 * Main interface for food logging with PC/mobile responsive design.
 * Features:
 * - Goal progress tracking with circular and linear progress bars
 * - Food log list with time-based separation
 * - Integrated food logging, creation, and AI features
 * - Responsive layout for PC and mobile
 */
const FoodLoggingDashboard = () => {
  const [goals, setGoals] = useState({});
  const [consumed, setConsumed] = useState({});
  const [caloriesBurnedBonus, setCaloriesBurnedBonus] = useState(0);
  const [foodLogs, setFoodLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => formatYmdLocal(new Date()));
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showFoodLogger, setShowFoodLogger] = useState(false);
  const [foodLoggerClosing, setFoodLoggerClosing] = useState(false);
  const foodLoggerCloseTimerRef = useRef(null);
  const FOOD_LOGGER_ANIM_MS = 280;
  const [showFoodCreator, setShowFoodCreator] = useState(false);
  const [showMealCreator, setShowMealCreator] = useState(false);
  const [showFoodChatbot, setShowFoodChatbot] = useState(false);
  const [showWaterLogger, setShowWaterLogger] = useState(false);
  const [waterFormData, setWaterFormData] = useState({ amount: '', unit: 'oz', date_time: '' });
  const [submittingWater, setSubmittingWater] = useState(false);
  const [expandedProgressMounted, setExpandedProgressMounted] = useState(false);
  /** PC only: header action buttons hidden by default (chevron shows) */
  const [showPcHeaderActions, setShowPcHeaderActions] = useState(false);
  // Render guard so we can animate close before unmounting.
  const [pcHeaderActionsMounted, setPcHeaderActionsMounted] = useState(false);
  const [pcHeaderActionsClosing, setPcHeaderActionsClosing] = useState(false);
  const pcHeaderActionsStartCloseTimeoutRef = useRef(null);
  const pcHeaderActionsUnmountTimeoutRef = useRef(null);

  const PC_HEADER_ACTIONS_ANIM_MS = 220;
  const PC_HEADER_ACTIONS_START_CLOSE_DELAY_MS = 650;
  const headerRegionRef = useRef(null);
  const [showMobileQuickActions, setShowMobileQuickActions] = useState(false);
  // Render guard so we can animate close before unmounting.
  const [mobileQuickActionsMounted, setMobileQuickActionsMounted] = useState(false);
  const [mobileQuickActionsClosing, setMobileQuickActionsClosing] = useState(false);
  const mobileQuickActionsUnmountTimeoutRef = useRef(null);
  const MOBILE_QUICK_ACTIONS_ANIM_MS = 220;
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [logStreak, setLogStreak] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [sortOrder] = useState('descending'); // 'ascending' or 'descending'
  const [editingTime, setEditingTime] = useState(null);
  const [metadataModalLog, setMetadataModalLog] = useState(null);

  const goalsWithBurnedCalories = useMemo(() => {
    const baseCaloriesGoal = Number(goals?.calories_goal) || 0;
    const burned = Number(caloriesBurnedBonus) || 0;
    return {
      ...goals,
      calories_goal: Math.max(baseCaloriesGoal + burned, 0),
    };
  }, [goals, caloriesBurnedBonus]);
  const [mobileSwipeState, setMobileSwipeState] = useState({});
  const [mobileDeletingLogId, setMobileDeletingLogId] = useState(null);
  const mobileSwipeStartXRef = useRef({});
  const mobileSwipeActiveIdRef = useRef(null);
  const MOBILE_DELETE_SWIPE_THRESHOLD = 96;
  const MOBILE_SWIPE_MAX_TRANSLATE = 132;

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
  }, [pcHeaderActionsMounted]);

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
  }, [mobileQuickActionsMounted]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.classList.add('route-food-log');
    return () => document.body.classList.remove('route-food-log');
  }, []);

  const loadUserGoals = useCallback(async () => {
    try {
      const response = await api.getUserGoals();
      if (response.data.data) {
        setGoals(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load user goals:', err);
      setError('Failed to load user goals');
    }
  }, []);

  const loadDailyProgress = useCallback(async () => {
    try {
      const { start_date: foodStartIso, end_date: foodEndIso } = localYmdToIsoRange(selectedDate);

      // If user is viewing "today" in the same local calendar as the date picker,
      // prefer the exact /home dashboard numbers for cardio + steps calories.
      const todayYmd = formatYmdLocal(new Date());
      const shouldUseHomeDashboard = selectedDate === todayYmd;

      // Cardio/steps APIs use `date.fromisoformat()` on **date-only** YYYY-MM-DD; datetime
      // strings are ignored server-side, which breaks filtering for non-today views.
      const cardioStepsDateParams = { start_date: selectedDate, end_date: selectedDate, page_size: 200 };

      const [foodResponse, cardioResponse, stepsResponse, homeDashboardResponse] = await Promise.all([
        api.getFoodLogs({
          start_date: foodStartIso,
          end_date: foodEndIso,
          page_size: 100
        }),
        api.getCardioLogs(cardioStepsDateParams).catch(() => ({ data: { results: [] } })),
        api.getStepsLogs(cardioStepsDateParams).catch(() => ({ data: { results: [] } })),
        shouldUseHomeDashboard
          ? api.get('/analytics/home/dashboard/').catch(() => null)
          : Promise.resolve(null),
      ]);

      const logs = foodResponse?.data?.data?.logs || [];

      // Sum up consumed macros from food logs.
      const consumedMacros = logs.reduce((acc, log) => {
        const macros = log.consumed_macros || {};
        Object.keys(macros).forEach(key => {
          acc[key] = (acc[key] || 0) + (macros[key] || 0);
        });
        return acc;
      }, {});

      const cardioLogs = cardioResponse?.data?.results || [];
      const stepsLogs = stepsResponse?.data?.results || [];

      // Calories burned bonus used by the calories progress bar:
      // target = user goal + (cardio burned today + steps estimate today)
      // This mirrors /home: cardio_calories_burned + steps_calories_estimate.
      const homeData = homeDashboardResponse?.data?.data;
      const hasHomeNumbers =
        homeData &&
        (homeData.cardio_calories_burned != null || homeData.steps_calories_estimate != null);

      const cardioBurned = hasHomeNumbers
        ? (Number(homeData?.cardio_calories_burned) || 0)
        : cardioLogs.reduce((sum, log) => sum + (Number(log?.calories_burned) || 0), 0);

      // Steps logs can contain multiple calorie fields depending on backend version.
      // To avoid double-counting, pick ONE estimate per log (prefer server estimate).
      const stepsBurned = hasHomeNumbers
        ? (Number(homeData?.steps_calories_estimate) || 0)
        : stepsLogs.reduce((sum, log) => {
            const perLog =
              Number(log?.steps_calories_estimate) ||
              Number(log?.estimated_calories_burned) ||
              Number(log?.calories_estimate) ||
              Number(log?.calories_burned) ||
              0;
            return sum + (Number.isFinite(perLog) ? perLog : 0);
          }, 0);

      setCaloriesBurnedBonus(Math.max(cardioBurned + stepsBurned, 0));
      setConsumed(consumedMacros);
      setFoodLogs(logs);
    } catch (err) {
      console.error('Failed to load daily progress:', err);
      setError('Failed to load daily progress');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadFoodLogs = useCallback(async () => {
    try {
      const { start_date, end_date } = localYmdToIsoRange(selectedDate);

      const response = await api.getFoodLogs({
        start_date,
        end_date,
        page_size: 100
      });

      if (response.data.data && response.data.data.logs) {
        setFoodLogs(response.data.data.logs);
      }
    } catch (err) {
      console.error('Failed to load food logs:', err);
    }
  }, [selectedDate]);

  const calculateLogStreak = useCallback(async () => {
    try {
      // Calculate streak by checking consecutive days with food logs
      let streak = 0;
      const now = new Date();
      
      for (let i = 0; i < 30; i++) { // Check up to 30 days back
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() - i);
        
        // Convert to EST timezone
        const estDate = new Date(checkDate.toLocaleString("en-US", {timeZone: "America/New_York"}));
        const year = estDate.getFullYear();
        const month = String(estDate.getMonth() + 1).padStart(2, '0');
        const day = String(estDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const startDate = `${dateStr}T00:00:00Z`;
        const endDate = `${dateStr}T23:59:59Z`;
        
        const response = await api.getFoodLogs({
          start_date: startDate,
          end_date: endDate,
          page_size: 1
        });
        
        if (response.data.data && response.data.data.logs && response.data.data.logs.length > 0) {
          streak++;
        } else {
          break;
        }
      }
      
      setLogStreak(streak);
    } catch (err) {
      console.error('Failed to calculate log streak:', err);
    }
  }, []);

  useEffect(() => {
    loadUserGoals();
    loadDailyProgress();
    loadFoodLogs();
  }, [selectedDate, loadUserGoals, loadDailyProgress, loadFoodLogs]);

  useEffect(() => {
    calculateLogStreak();
  }, [calculateLogStreak]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };


  const getSortedFoodLogs = () => {
    const sorted = [...foodLogs].sort((a, b) => {
      const dateA = new Date(a.date_time);
      const dateB = new Date(b.date_time);
      return dateB - dateA; // Sort descending (latest first)
    });
    return sorted;
  };

  const closeFoodLogger = useCallback(() => {
    setFoodLoggerClosing(true);
    if (foodLoggerCloseTimerRef.current) {
      clearTimeout(foodLoggerCloseTimerRef.current);
    }
    foodLoggerCloseTimerRef.current = window.setTimeout(() => {
      setFoodLoggerClosing(false);
      setShowFoodLogger(false);
      foodLoggerCloseTimerRef.current = null;
    }, FOOD_LOGGER_ANIM_MS);
  }, []);

  useEffect(() => {
    if (showFoodLogger) {
      setFoodLoggerClosing(false);
    }
  }, [showFoodLogger]);

  useEffect(() => {
    return () => {
      if (foodLoggerCloseTimerRef.current) {
        clearTimeout(foodLoggerCloseTimerRef.current);
      }
    };
  }, []);

  const handleFoodLogged = async () => {
    closeFoodLogger();
    // Refresh data immediately with a small delay to ensure API call completes
    setTimeout(async () => {
      await loadFoodLogs();
      await loadDailyProgress();
      calculateLogStreak();
    }, 500);
  };

  const handleFoodCreated = (food) => {
    loadFoodLogs();
    setShowFoodCreator(false);
  };

  const handleMealCreated = (meal) => {
    loadFoodLogs();
    setShowMealCreator(false);
  };

  const handleFoodsLogged = () => {
    loadDailyProgress();
    setShowFoodChatbot(false);
  };

  const handleWaterInputChange = (e) => {
    const { name, value } = e.target;
    setWaterFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWaterSubmit = async (e) => {
    e.preventDefault();
    setSubmittingWater(true);
    
    try {
      const logData = {
        amount: parseFloat(waterFormData.amount),
        unit: waterFormData.unit
      };
      
      // Add date_time if provided
      if (waterFormData.date_time) {
        // Convert datetime-local format to ISO string
        const dateTime = new Date(waterFormData.date_time);
        logData.date_time = dateTime.toISOString();
      }
      
      await api.createWaterLog(logData);
      setWaterFormData({ amount: '', unit: 'oz', date_time: '' });
      setShowWaterLogger(false);
    } catch (error) {
      console.error('Error saving water log:', error);
      alert('Error saving water entry. Please try again.');
    } finally {
      setSubmittingWater(false);
    }
  };

  const deleteFoodLog = async (logId) => {
    try {
      await api.deleteFoodLog(logId);
      loadFoodLogs();
      loadDailyProgress();
    } catch (err) {
      console.error('Failed to delete food log:', err);
    }
  };

  const setMobileSwipeOffset = useCallback((logId, offsetX, isDragging = false) => {
    const clampedOffset = Math.max(-MOBILE_SWIPE_MAX_TRANSLATE, Math.min(0, offsetX));
    setMobileSwipeState(prev => ({
      ...prev,
      [logId]: { offsetX: clampedOffset, isDragging }
    }));
  }, []);

  const handleMobileSwipeStart = useCallback((logId, event) => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) return;
    if (!event.touches || event.touches.length === 0) return;
    mobileSwipeActiveIdRef.current = logId;
    mobileSwipeStartXRef.current[logId] = event.touches[0].clientX;
    setMobileSwipeOffset(logId, mobileSwipeState[logId]?.offsetX || 0, true);
  }, [mobileSwipeState, setMobileSwipeOffset]);

  const handleMobileSwipeMove = useCallback((logId, event) => {
    const startX = mobileSwipeStartXRef.current[logId];
    if (startX === undefined || mobileSwipeActiveIdRef.current !== logId) return;
    if (!event.touches || event.touches.length === 0) return;
    const deltaX = event.touches[0].clientX - startX;
    if (deltaX < 0) {
      event.preventDefault();
      setMobileSwipeOffset(logId, deltaX, true);
    }
  }, [setMobileSwipeOffset]);

  const handleMobileSwipeEnd = useCallback(async (logId) => {
    const currentOffset = mobileSwipeState[logId]?.offsetX || 0;
    mobileSwipeActiveIdRef.current = null;
    delete mobileSwipeStartXRef.current[logId];

    if (currentOffset <= -MOBILE_DELETE_SWIPE_THRESHOLD && mobileDeletingLogId !== logId) {
      setMobileDeletingLogId(logId);
      setMobileSwipeOffset(logId, -MOBILE_SWIPE_MAX_TRANSLATE, false);
      await deleteFoodLog(logId);
      setMobileDeletingLogId(null);
      setMobileSwipeState(prev => {
        const next = { ...prev };
        delete next[logId];
        return next;
      });
      return;
    }

    setMobileSwipeOffset(logId, 0, false);
  }, [MOBILE_DELETE_SWIPE_THRESHOLD, mobileDeletingLogId, mobileSwipeState, setMobileSwipeOffset]);

  const updateFoodLogTime = async (logId, newTime) => {
    try {
      const [hours, minutes] = newTime.split(':');
      const [year, month, day] = selectedDate.split('-').map(Number);
      const h = parseInt(hours, 10) || 0;
      const min = parseInt(minutes, 10) || 0;
      const logDate = new Date(year, month - 1, day, h, min, 0, 0);

      await api.updateFoodLog(logId, {
        date_time: logDate.toISOString()
      });
      
      loadFoodLogs();
      loadDailyProgress();
      setEditingTime(null);
    } catch (err) {
      console.error('Failed to update food log time:', err);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTimeForInput = (dateString) => {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTimeSeparator = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 0 && hour < 6) return '12am';
    if (hour >= 6 && hour < 9) return '6am';
    if (hour >= 9 && hour < 12) return '9am';
    if (hour >= 12 && hour < 15) return '12pm';
    if (hour >= 15 && hour < 18) return '3pm';
    if (hour >= 18 && hour < 21) return '6pm';
    if (hour >= 21 && hour < 24) return '9pm';
    return '';
  };

  const getFoodGroupIcon = (foodGroup) => {
    const icons = {
      protein: '🥩',
      fruit: '🍎',
      vegetable: '🥬',
      grain: '🌾',
      dairy: '🥛',
      other: '🍽️'
    };
    
    // Handle case where foodGroup might be undefined or null
    if (!foodGroup) {
      return icons.other;
    }
    
    // Convert to lowercase to handle case variations
    const normalizedGroup = foodGroup.toLowerCase();
    
    return icons[normalizedGroup] || icons.other;
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
      const dateString = formatYmdLocal(currentDate);
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
        <p>Loading food logging dashboard...</p>
      </div>
    );
  }

  return (
    <div className="food-logging-dashboard">
      <style>{`
        .route-food-log .main-content {
          justify-content: flex-start;
          align-items: stretch;
        }

        /* Page shell matches /home (shell darker than raised cards in dark mode) */
        .food-logging-dashboard {
          --foodlog-card-bg: #171c24;
          --foodlog-shell-bg: #040508;
          min-height: 100vh;
          background-color: #040508;
          background-image: none;
          width: 100vw;
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

        [data-theme="dark"] .food-logging-dashboard {
          --foodlog-shell-tint: rgba(255, 255, 255, 0.045);
          --foodlog-shell-strong: rgba(255, 255, 255, 0.11);
          background-color: #040508;
          background-image:
            linear-gradient(var(--foodlog-shell-tint) 1px, transparent 1px),
            linear-gradient(90deg, var(--foodlog-shell-tint) 1px, transparent 1px),
            linear-gradient(var(--foodlog-shell-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--foodlog-shell-strong) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 80px 80px, 80px 80px;
          background-attachment: fixed;
        }

        [data-theme="light"] .food-logging-dashboard {
          --foodlog-card-bg: #ffffff;
          --foodlog-shell-bg: #e8eaf2;
          --foodlog-shell-tint: rgba(0, 0, 0, 0.04);
          --foodlog-shell-strong: rgba(0, 0, 0, 0.1);
          background-color: #e8eaf2;
          background-image:
            linear-gradient(var(--foodlog-shell-tint) 1px, transparent 1px),
            linear-gradient(90deg, var(--foodlog-shell-tint) 1px, transparent 1px),
            linear-gradient(var(--foodlog-shell-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--foodlog-shell-strong) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 80px 80px, 80px 80px;
          background-attachment: fixed;
        }

        .dashboard-header {
          position: relative;
          z-index: 30;
          overflow: visible;
          background: transparent;
          border: none;
          padding: 0;
          width: 100%;
          margin: 0;
        }

        .header-content--food-log {
          display: grid;
          grid-template-columns: max-content 1fr max-content;
          align-items: center;
          width: 100%;
          margin: 0;
          padding: var(--space-2) var(--space-4);
          gap: var(--space-2);
          box-sizing: border-box;
        }

        .header-date-wrap {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          min-width: 0;
        }

        .header-actions-center {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          min-width: 0;
          align-self: center;
          /* Prevent vertical header jitter when reveal button is hidden */
          min-height: 52px;
        }

        .header-actions-reveal {
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

        [data-theme="light"] .header-actions-reveal {
          color: var(--text-primary);
        }

        .header-actions-reveal:focus,
        .header-actions-reveal:focus-visible,
        .header-actions-reveal:active {
          outline: none !important;
          box-shadow: none !important;
        }

        .header-actions-reveal__glyph {
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
        }

        .header-actions-reveal__icon {
          width: 120px;
          height: 44px;
        }

        .mobile-header-reveal {
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

        .mobile-header-reveal:focus,
        .mobile-header-reveal:focus-visible,
        .mobile-header-reveal:active {
          outline: none !important;
          box-shadow: none !important;
        }

        .mobile-header-reveal__icon {
          width: 36px;
          height: 36px;
        }

        .header-streak-wrap {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          min-width: 0;
          transform: translateX(-10px);
        }

        .header-actions {
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
          /* Base state is "closed"; .header-actions--open animates to visible. */
        }

        .header-actions--open {
          pointer-events: auto;
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
          animation: headerActionsIn 220ms ease both;
        }

        .header-actions--closing {
          pointer-events: none;
          transition: none;
          animation: headerActionsOut 220ms ease both;
        }

        @keyframes headerActionsIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        @keyframes headerActionsOut {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px) scale(0.98);
          }
        }

        .streak-counter {
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

        .streak-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #facc15;
        }

        .streak-icon svg {
          display: block;
          position: relative;
          top: 1px;
          line-height: 1;
        }

        .streak-number {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-regular);
          color: #facc15;
          line-height: 1;
          position: relative;
          top: 5px;
        }

        .btn-primary-header {
          padding: 0 var(--space-6);
          border: none;
          border-radius: var(--radius-md);
          opacity: 1;
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--foodlog-shell-bg);
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

        .btn-primary-header:focus {
          outline: 2px solid #a78bfa;
          outline-offset: 2px;
        }

        .btn-primary-header .header-action-label {
          color: var(--foodlog-shell-bg);
          font-weight: var(--font-weight-bold);
        }

        .btn-close {
          background: transparent;
          border: none;
          padding: var(--space-2);
          color: var(--text-tertiary);
          cursor: pointer;
        }

        .btn-close:hover {
          color: var(--text-tertiary);
        }

        .controls-section {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          justify-content: flex-start;
        }

        .date-input {
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

        .date-input:focus {
          outline: none;
          border-color: transparent;
          box-shadow: none;
        }

        /* PC: larger streak + date in header */
        @media (min-width: 769px) {
          .food-logging-dashboard .header-content--food-log {
            padding: var(--space-4) var(--space-6);
            gap: var(--space-3);
          }

          .food-logging-dashboard .streak-number {
            font-size: var(--text-4xl);
            top: 6px;
          }

          .food-logging-dashboard .streak-icon svg {
            width: 32px;
            height: 32px;
          }

          .food-logging-dashboard .header-date-wrap .date-input {
            font-size: var(--text-xl);
            font-weight: var(--font-weight-bold);
            min-height: 52px;
            height: 52px;
          }
        }

        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
          opacity: 0.8;
        }

        .date-input::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }

        /* Calendar popup styling */
        .date-input::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }

        /* Style the calendar popup */
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
          opacity: 0.8;
        }

        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }

        /* Calendar popup content styling */
        input[type="date"]::-webkit-datetime-edit {
          color: var(--text-primary);
        }

        input[type="date"]::-webkit-datetime-edit-fields-wrapper {
          background: var(--bg-tertiary);
        }

        input[type="date"]::-webkit-datetime-edit-text {
          color: var(--text-primary);
        }

        input[type="date"]::-webkit-datetime-edit-month-field,
        input[type="date"]::-webkit-datetime-edit-day-field,
        input[type="date"]::-webkit-datetime-edit-year-field {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        /* Calendar popup dropdown styling */
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          padding: var(--space-1);
        }

        /* Custom date picker container */
        .custom-date-picker {
          position: relative;
          display: inline-block;
        }

        .header-center--grouped .custom-date-picker {
          margin-left: 0;
        }

        /* Custom calendar popup */
        .custom-calendar-popup {
          position: absolute;
          top: 100%;
          left: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          padding: var(--space-5);
          min-width: 350px;
          max-width: 400px;
          margin-top: var(--space-2);
        }

        /* Adjust positioning if calendar would go off screen */
        @media (max-width: 400px) {
          .custom-calendar-popup {
            left: 0;
            transform: none;
            right: 0;
            width: calc(100vw - 2rem);
            margin: var(--space-2) 1rem 0 1rem;
          }
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
          padding-bottom: var(--space-2);
          border-bottom: 1px solid var(--border-primary);
        }

        .calendar-header button {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: var(--space-1) var(--space-2);
          cursor: pointer;
          font-size: var(--text-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .calendar-header button:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .calendar-header span {
          font-size: var(--text-base);
          font-weight: 600;
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
          font-weight: 600;
          color: var(--text-secondary);
          padding: var(--space-2);
        }

        .calendar-day {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: var(--space-3);
          cursor: pointer;
          font-size: var(--text-base);
          transition: all 0.2s var(--ease-out-cubic);
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calendar-day:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .calendar-day.selected {
          background: var(--accent-primary);
          color: white;
          font-weight: 600;
        }

        .calendar-day.other-month {
          color: var(--text-secondary);
          opacity: 0.5;
        }

        .calendar-day.other-month:hover {
          opacity: 0.8;
        }

        .calendar-day:disabled {
          cursor: not-allowed;
          opacity: 0.3;
        }

        .calendar-day:disabled:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        /* Calendar popup styling - match application theme */
        input[type="date"] {
          font-size: 5px !important;
          zoom: 1.5 !important; /* This should make the popup larger */
        }

        /* Make the calendar popup itself larger with dark theme */
        input[type="date"]::-webkit-calendar-picker-indicator {
          font-size: 18px !important;
          width: 20px !important;
          height: 20px !important;
          filter: invert(1) !important; /* Make icon white for dark theme */
        }

        /* Style calendar popup to match dark theme */
        input[type="date"]::-webkit-datetime-edit {
          font-size: 14px !important;
          padding: 4px !important;
          font-weight: 500 !important;
          color: var(--text-primary) !important;
          background: var(--bg-secondary) !important;
        }

        input[type="date"]::-webkit-datetime-edit-fields-wrapper {
          font-size: 14px !important;
          padding: 4px !important;
          background: var(--bg-secondary) !important;
        }

        input[type="date"]::-webkit-datetime-edit-text {
          font-size: 14px !important;
          padding: 2px !important;
          color: var(--text-primary) !important;
        }

        input[type="date"]::-webkit-datetime-edit-month-field,
        input[type="date"]::-webkit-datetime-edit-day-field,
        input[type="date"]::-webkit-datetime-edit-year-field {
          font-size: 14px !important;
          padding: 2px !important;
          min-width: 40px !important;
          font-weight: 500 !important;
          color: var(--text-primary) !important;
          background: var(--bg-secondary) !important;
        }

        /* Calendar popup background and styling */
        input[type="date"]::-webkit-calendar-picker-dropdown {
          background: var(--bg-secondary) !important;
          border: 1px solid var(--border-primary) !important;
          border-radius: var(--radius-md) !important;
        }

        /* Calendar popup month/year header */
        input[type="date"]::-webkit-calendar-picker-dropdown::-webkit-calendar-picker-month-field,
        input[type="date"]::-webkit-calendar-picker-dropdown::-webkit-calendar-picker-year-field {
          color: var(--text-primary) !important;
          background: var(--bg-secondary) !important;
          font-weight: 600 !important;
        }

        /* Calendar popup day cells */
        input[type="date"]::-webkit-calendar-picker-dropdown::-webkit-calendar-picker-day-cell {
          color: var(--text-primary) !important;
          background: var(--bg-secondary) !important;
        }

        /* Calendar popup day cells hover */
        input[type="date"]::-webkit-calendar-picker-dropdown::-webkit-calendar-picker-day-cell:hover {
          background: var(--accent-primary) !important;
          color: white !important;
        }

        /* Calendar popup today highlight */
        input[type="date"]::-webkit-calendar-picker-dropdown::-webkit-calendar-picker-day-cell.today {
          background: var(--accent-primary) !important;
          color: white !important;
          font-weight: bold !important;
        }


        /* PC Layout */
        .dashboard-layout-pc {
          padding: 0 var(--space-4);
          display: grid;
          grid-template-columns: 60% 40%;
          gap: var(--space-6);
          align-items: start;
          width: 100%;
          margin-top: 0;
        }

        .dashboard-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .dashboard-right {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          position: sticky;
          top: var(--space-6);
          padding-right: var(--space-2);
        }

        @media (min-width: 769px) {
          .food-logging-dashboard {
            /* Header row + sticky offset (~top: var(--space-6)); FoodLogger.panel max-height uses this */
            --foodlog-panel-pc-top-reserve: 6.75rem;
          }

          .food-logging-dashboard .dashboard-layout-pc .dashboard-right {
            padding-right: var(--space-8);
          }
        }

        /* Mobile Layout */
        .dashboard-layout-mobile {
          padding: 0 var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .mobile-actions {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-3);
        }

        .btn-icon-mobile {
          width: 72px;
          height: 72px;
          padding: 0;
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-lg);
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          box-shadow: none;
        }

        .btn-icon-mobile--quick-secondary {
          background: #E5E7EB;
          border: 2px solid #D1D5DB;
          color: #000000;
          box-shadow: none;
        }

        .btn-icon-mobile svg.icon,
        .btn-icon-mobile .icon.icon-lg {
          width: 2.125rem;
          height: 2.125rem;
        }

        .btn-icon-mobile span.icon {
          font-size: 2.125rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon-mobile:focus {
          outline: 2px solid var(--accent-primary);
          outline-offset: 2px;
        }


        /* Goal progress + food log cards — same surfaces as /home cards */
        .goal-progress-section.card {
          background: var(--foodlog-card-bg);
          border: none;
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          margin-top: 0;
          box-shadow: none;
          backdrop-filter: blur(8px);
          box-sizing: border-box;
          min-height: 240px;
          height: 240px;
        }

        .goal-progress-section.card:hover {
          transform: none !important;
          box-shadow: none !important;
        }

        @keyframes progressSectionOpen {
          from {
            transform: scale(0.94);
            opacity: 0.85;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes progressSectionClose {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.94);
            opacity: 0.85;
          }
        }

        .goal-progress-section--opening {
          animation: progressSectionOpen 260ms var(--ease-out-cubic) both;
        }

        .goal-progress-section--closing {
          animation: none;
        }

        .goal-progress-section--expanded .expanded-progress.card {
          padding: 0;
          margin: 0;
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
          transition: none;
          height: 100%;
        }

        .goal-progress-section--expanded .expanded-progress.card:hover {
          transform: none !important;
          box-shadow: none !important;
        }

        .goal-progress-section--expanded .expanded-progress .expanded-progress-grid {
          height: 100%;
          max-height: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding-right: var(--space-2);
          scrollbar-gutter: stable;
          box-sizing: border-box;
        }

        .goal-progress-section .progress-grid {
          height: 100%;
          align-content: center;
          justify-content: center;
          padding-top: var(--space-2);
          padding-bottom: var(--space-2);
        }

        /* Desktop: keep circles truly centered */
        @media (min-width: 769px) {
          .goal-progress-section .progress-grid {
            transform: translateY(0);
          }

          /* PC: larger circular progress content */
          .goal-progress-section .circular-progress .progress-percentage {
            font-size: var(--text-2xl);
          }

          .goal-progress-section .circular-progress .progress-current {
            font-size: var(--text-lg);
          }

          .goal-progress-section .circular-progress .progress-target {
            font-size: var(--text-sm);
          }
        }

        .food-log-section.card {
          background: transparent !important;
          border: none;
          border-radius: var(--radius-lg);
          padding: var(--space-5) var(--space-6) var(--space-6);
          margin-top: 0;
          margin-bottom: var(--space-4);
          box-shadow: none;
          backdrop-filter: none;
          outline: none;
          box-sizing: border-box;
        }

        .food-log-section.card:hover {
          transform: none !important;
          box-shadow: none !important;
        }

        .food-log-section.card:focus,
        .food-log-section.card:focus-within {
          outline: none;
        }

        /* Embedded logger panel uses same card surface as /home */
        .food-logging-dashboard .food-logger {
          background: var(--foodlog-card-bg);
        }

        .food-log-list {
          max-height: none;
          overflow: visible;
          position: relative;
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
          background: rgba(255, 255, 255, 0.9);
          opacity: 1;
        }

        .separator-text {
          font-size: var(--text-xs);
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-weight-medium);
        }

        .empty-time-separators {
          padding: var(--space-2);
        }

        .food-log-item--desktop {
          display: grid;
          grid-template-columns: 3fr 1fr 6fr 1.5fr;
          align-items: center;
          column-gap: var(--space-1);
          padding: var(--space-3) var(--space-2);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-2);
          min-height: 52px;
          box-sizing: border-box;
        }

        .food-log-cell--identity {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: var(--space-2);
          min-width: 0;
          max-width: 100%;
        }

        .food-name--truncate {
          flex: 1;
          min-width: 0;
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          font-size: var(--text-lg);
          white-space: nowrap;
          overflow: hidden;
          mask-image: linear-gradient(90deg, #000 75%, transparent 100%);
          -webkit-mask-image: linear-gradient(90deg, #000 75%, transparent 100%);
        }

        .food-log-cell--time {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: flex-start;
          min-width: 0;
        }

        .food-log-cell--macros {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: 0;
          justify-content: flex-start;
          min-width: 0;
          margin-left: calc(var(--space-2) * -1);
        }

        /* Desktop: nudge food macro pills down */
        @media (min-width: 769px) {
          .food-log-cell--macros {
            transform: none;
            height: 52px;
            align-items: center;
          }

          .food-name--truncate {
            height: 52px;
            display: flex;
            align-items: center;
            line-height: 1;
          }

          .food-log-cell--time {
            height: 52px;
            line-height: 1;
          }

          .macro-pill--plain {
            height: 52px;
            display: flex;
            align-items: center;
            line-height: 1;
          }
        }

        .macro-pill--plain {
          font-size: var(--text-base);
          color: var(--text-tertiary);
          font-weight: var(--font-weight-medium);
          background: none;
          border: none;
          padding: 0 var(--space-2);
          line-height: 1;
          white-space: nowrap;
          height: 22px;
          display: inline-flex;
          align-items: center;
        }

        .macro-pill-label {
          color: var(--text-tertiary);
          font-weight: var(--font-weight-medium);
          margin-right: var(--space-1);
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
        }

        .macro-pill-value {
          color: var(--text-primary);
          font-weight: var(--font-weight-bold);
          white-space: nowrap;
        }

        .macro-pill--plain:not(:first-child) {
          border-left: 2px solid rgba(255, 255, 255, 0.9);
        }

        /* Mobile: narrower separators */
        .food-macros--mobile-plain .macro-pill--plain:not(:first-child) {
          border-left-width: 1px;
          border-left-color: rgba(255, 255, 255, 0.9);
        }

        .food-log-cell--actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-3);
          min-width: 0;
        }

        .food-log-item-mobile-wrap {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-2);
        }

        .food-log-item-delete-bg {
          position: absolute;
          inset: 1px;
          background: var(--accent-danger);
          color: white;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: var(--space-4);
          pointer-events: none;
          border-radius: inherit;
        }

        .food-log-item.mobile {
          flex-direction: column;
          align-items: stretch;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-3);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin-bottom: 0;
          transition: transform 160ms var(--ease-out-cubic), opacity 160ms var(--ease-out-cubic), filter 160ms var(--ease-out-cubic);
          touch-action: pan-y;
          position: relative;
        }

        .food-mobile-stack {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: var(--space-2);
          width: 100%;
        }

        .food-mobile-top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-2);
        }

        .food-mobile-identity {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          min-width: 0;
          flex: 1;
        }

        .food-mobile-name-time {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          min-width: 0;
          flex: 1;
        }

        .food-servings-pill {
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: 0;
          padding: 0;
          white-space: nowrap;
          flex-shrink: 0;
          transform: translateY(3px);
        }

        .food-log-item.mobile .food-icon-inline {
          font-size: var(--text-2xl);
        }

        .food-log-item.mobile .food-name {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          text-align: left;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transform: translateY(-5px);
        }

        .food-log-item.mobile .food-time {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          flex-shrink: 0;
          white-space: nowrap;
          transform: translateY(-7px);
          border: 1px solid rgba(167, 139, 250, 0.55);
          border-radius: var(--radius-sm);
          padding: 0 var(--space-2);
        }

        .food-log-item.mobile.is-deleting {
          opacity: 0.72;
          filter: saturate(0.75);
        }

        .food-macros--mobile-plain {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 0;
          flex-wrap: nowrap;
          width: 100%;
          overflow: hidden;
        }

        .food-macros--mobile-plain .macro-pill--plain {
          font-size: var(--text-base);
          padding: 0 var(--space-1);
          line-height: 1;
        }

        .food-icon {
          font-size: var(--text-2xl);
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border-radius: var(--radius-md);
        }

        .food-icon-inline {
          width: auto;
          height: auto;
          font-size: var(--text-2xl);
          flex-shrink: 0;
          background: transparent;
        }

        .food-time {
          font-size: var(--text-base);
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          flex-shrink: 0;
          line-height: 1;
        }

        .btn-icon-info {
          width: 52px;
          height: 42px;
          padding: 0;
          border: 1px solid var(--accent-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--accent-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon-delete {
          width: 52px;
          height: 42px;
          padding: 0;
          border: 1px solid var(--accent-danger);
          border-radius: var(--radius-md);
          background: var(--accent-danger);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (min-width: 769px) {
          /* Desktop: widen the food-log action buttons */
          .food-log-section.card .food-log-cell--actions .btn-icon-info,
          .food-log-section.card .food-log-cell--actions .btn-icon-delete {
            width: 49px;
            flex: 0 0 49px;
          }
        }

        .food-metadata-expanded {
          margin-top: var(--space-3);
          padding: var(--space-3);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
          width: 100%;
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-2);
        }

        .metadata-item {
          display: flex;
          flex-direction: row;
          gap: var(--space-2);
          align-items: center;
        }

        .metadata-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          font-weight: var(--font-weight-medium);
          text-transform: capitalize;
        }

        .metadata-value {
          font-size: var(--text-xs);
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
        }

        .food-servings {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          background: var(--bg-secondary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
        }

        .time-display {
          cursor: pointer;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          transition: all 0.2s var(--ease-out-cubic);
          font-size: var(--text-sm);
          line-height: 1;
          display: inline-flex;
          align-items: center;
          border: none;
        }

        /* Desktop: outline the time display within the food-log section */
        @media (min-width: 769px) {
          .food-log-section.card .food-log-cell--time .time-display {
            border: 1px solid rgba(167, 139, 250, 0.55);
          }
        }

        .time-display:hover {
          color: var(--text-tertiary);
        }

        .time-edit-container {
          display: inline-block;
          max-width: 72px;
        }

        .time-edit-container .time-input {
          width: 100%;
          max-width: 72px;
          min-width: 0;
          box-sizing: border-box;
        }

        .food-logging-dashboard .time-edit-container input[type="time"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          width: 100%;
          height: 100%;
          cursor: pointer;
          margin: 0;
        }

        .food-logging-dashboard .time-edit-container {
          position: relative;
        }

        .time-input {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: var(--text-xs);
          padding: var(--space-1) var(--space-2);
          font-family: var(--font-primary);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .time-input:focus {
          outline: none;
          box-shadow: none;
        }

        .time-input:focus-visible {
          outline: none;
          box-shadow: none;
        }

        /* Time picker popup - match app theme where supported */
        .food-logging-dashboard input[type="time"] {
          color-scheme: dark;
        }

        .food-logging-dashboard input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.8;
          cursor: pointer;
        }

        .modal--water-log {
          padding: 0 !important;
          overflow: hidden;
        }

        .water-log-modal-inner {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .water-log-modal-inner form {
          padding: var(--space-4);
        }

        .mobile-primary-actions {
          display: none;
        }

        @media (max-width: 768px) {
          .dashboard-layout-pc {
            display: none;
          }

          .food-logging-dashboard {
            padding-left: var(--space-2);
            padding-right: var(--space-2);
            padding-top: 0;
          }

          .dashboard-header > .header-actions {
            display: none;
          }

          .mobile-header-reveal {
            display: flex;
          }

          .mobile-quick-actions-backdrop {
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
            outline: none;
            box-shadow: none;
          }

          .mobile-quick-actions-backdrop:focus,
          .mobile-quick-actions-backdrop:focus-visible,
          .mobile-quick-actions-backdrop:active {
            outline: none !important;
            box-shadow: none !important;
          }

          .mobile-quick-actions-backdrop.is-open {
            opacity: 1;
            pointer-events: auto;
          }

          .mobile-quick-actions-backdrop.is-closing {
            pointer-events: none;
            opacity: 1;
            transition: none;
            animation: mobileQuickBackdropOut 220ms ease both;
          }

          .mobile-quick-actions-flyout {
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

          .mobile-quick-actions-flyout.is-open {
            pointer-events: auto;
            opacity: 1;
            transform: translateY(0) scale(1);
            animation: mobileQuickActionsIn 220ms ease both;
          }

          .mobile-quick-actions-flyout.is-closing {
            pointer-events: none;
            transition: none;
            animation: mobileQuickActionsOut 220ms ease both;
          }

          @keyframes mobileQuickActionsIn {
            from {
              opacity: 0;
              transform: translateY(-10px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes mobileQuickActionsOut {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateY(-10px) scale(0.98);
            }
          }

          @keyframes mobileQuickBackdropOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }

          @keyframes foodLoggerBackdropIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes foodLoggerBackdropOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }

          @keyframes foodLoggerModalIn {
            from {
              opacity: 0;
              transform: translate(-50%, calc(-50% + 20px));
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }

          @keyframes foodLoggerModalOut {
            from {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
            to {
              opacity: 0;
              transform: translate(-50%, calc(-50% + 16px));
            }
          }

          .mobile-quick-actions-flyout .mobile-actions--flyout {
            pointer-events: auto;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: var(--space-4);
            width: 100%;
            padding: var(--space-3);
            margin: 0;
            border-radius: var(--radius-lg);
            background: transparent;
            box-shadow: none;
            border: none;
          }

          .mobile-actions--flyout .btn-icon-mobile--lavender {
            width: 88px;
            height: 88px;
            min-width: 88px;
            border-radius: var(--radius-lg);
            margin: 0;
            background: #79b5fb !important;
            border: none !important;
            color: var(--foodlog-shell-bg) !important;
            box-shadow: none !important;
          }

          .mobile-actions--flyout .btn-icon-mobile--lavender svg {
            color: inherit;
            width: 2.25rem;
            height: 2.25rem;
          }

          .mobile-primary-actions {
            display: grid;
            grid-template-columns: 7fr 3fr;
            gap: var(--space-2);
            width: 100%;
            margin-top: var(--space-2);
            box-sizing: border-box;
          }

          .mobile-primary-actions .btn-icon-mobile--primary-wide {
            width: 100%;
            min-height: 72px;
            height: auto;
            border-radius: var(--radius-md);
            margin: 0;
          }

          .mobile-primary-actions .btn-icon-mobile--water-icon-only {
            width: 100%;
            min-height: 72px;
            height: auto;
            border-radius: var(--radius-md);
            margin: 0;
          }

          .btn-icon-mobile--lavender {
            background: #79b5fb !important;
            border: none !important;
            color: var(--foodlog-shell-bg) !important;
            font-weight: var(--font-weight-bold);
          }

          .header-content--food-log {
            display: grid;
            grid-template-columns: max-content 1fr max-content;
            align-items: center;
            padding: var(--space-2);
            gap: var(--space-2);
          }

          .header-actions-center {
            display: flex;
            justify-content: center;
            align-items: center;
            min-width: 44px;
          }

          .header-date-wrap .date-input {
            max-width: 128px;
            min-width: 0;
            width: 100%;
          }

          .header-streak-wrap .streak-unit {
            display: none;
          }

          .header-streak-wrap {
            transform: none;
          }

          .dashboard-layout-pc {
            padding: var(--space-2);
            overflow-y: auto;
            padding-top: 2px;
          }

          .dashboard-layout-mobile {
            padding: 0 var(--space-2);
            min-height: 0;
            padding-top: 2px;
            gap: var(--space-2);
          }

          .dashboard-layout-mobile .goal-progress-section {
            margin-top: var(--space-2);
            margin-bottom: 0;
            padding-top: var(--space-3);
            padding-bottom: var(--space-3);
            min-height: 380px;
            height: 380px;
            -webkit-tap-highlight-color: transparent;
          }

          .dashboard-layout-mobile .goal-progress-section:focus,
          .dashboard-layout-mobile .goal-progress-section:focus-visible,
          .dashboard-layout-mobile .goal-progress-section:active {
            outline: none !important;
            box-shadow: none !important;
          }

          /* Mobile: keep full-size circles; section is taller to fit them */
          .dashboard-layout-mobile .progress-grid .circular-progress {
            transform: scale(1);
            transform-origin: center;
          }

          .dashboard-layout-mobile .food-log-section {
            margin-top: 0;
          }

          .dashboard-layout-mobile .food-log-section.card {
            padding: var(--space-4) var(--space-3) var(--space-3);
          }

          .modal--food-logger > * {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .modal--food-logger .food-logger-header,
          .modal--food-logger .search-section {
            flex-shrink: 0;
          }

          .modal--food-logger .food-list-section {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
          }

          .modal-backdrop {
            padding: var(--space-2);
            align-items: flex-start;
            padding-top: var(--space-2);
            overflow-y: auto;
          }

          .modal {
            max-width: 100%;
            width: 100%;
            max-height: 88vh;
            padding: var(--space-3);
            font-size: var(--text-sm);
            overflow-y: auto;
            margin-top: 0;
          }

          .modal--food-logger {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%);
            margin: 0 !important;
            align-self: auto !important;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            min-height: min(75vh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)));
            max-height: min(92vh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)));
            margin-top: 0;
            padding-top: 0;
            padding-left: 0;
            padding-right: 0;
            padding-bottom: var(--space-2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .modal-backdrop:has(.modal--food-logger) {
            padding-top: max(var(--space-2), env(safe-area-inset-top, 0px));
            padding-left: max(0px, env(safe-area-inset-left, 0px));
            padding-right: max(0px, env(safe-area-inset-right, 0px));
            align-items: center;
            justify-content: center;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .modal-backdrop--food-logger {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding-left: max(0px, env(safe-area-inset-left, 0px));
            padding-right: max(0px, env(safe-area-inset-right, 0px));
          }

          .modal-backdrop--food-logger:not(.modal-backdrop--food-logger-closing) {
            animation: foodLoggerBackdropIn 0.28s ease forwards;
          }

          .modal-backdrop--food-logger-closing {
            animation: foodLoggerBackdropOut 0.28s ease forwards;
          }

          .modal-backdrop--food-logger:not(.modal-backdrop--food-logger-closing)
            .modal--food-logger:not(.modal--food-logger-closing) {
            animation: foodLoggerModalIn 0.28s cubic-bezier(0.2, 0.85, 0.25, 1) forwards;
          }

          .modal-backdrop--food-logger-closing .modal--food-logger {
            animation: foodLoggerModalOut 0.28s ease forwards;
          }

          .modal--food-logger .food-logger-header {
            padding-top: 0;
            padding-bottom: 0;
            flex-shrink: 0;
            position: relative;
            top: 0;
            background: var(--bg-primary);
            z-index: 1;
            box-shadow: 0 1px 0 var(--border-primary);
          }

          .modal-backdrop--water-log {
            padding-top: max(var(--space-2), env(safe-area-inset-top, 0px));
            padding-bottom: var(--space-3);
            padding-left: max(var(--space-5), env(safe-area-inset-left, 0px));
            padding-right: max(var(--space-5), env(safe-area-inset-right, 0px));
            align-items: flex-start;
            justify-content: center;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          /*
           * index.css .modal uses position:fixed + translate(-50%,-50%), so backdrop padding
           * does not inset the sheet. Use flow layout inside the padded backdrop instead.
           */
          .modal-backdrop--water-log .modal.modal--water-log {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
            width: 100% !important;
            max-width: min(400px, 100%) !important;
            margin-left: auto !important;
            margin-right: auto !important;
            margin-top: var(--space-1);
            flex-shrink: 0;
            z-index: auto;
            animation: none;
          }

          .modal--water-log {
            margin-top: var(--space-1);
            padding: 0 !important;
            overflow: hidden;
          }

          .water-log-modal-inner {
            background: var(--bg-secondary);
            border-radius: var(--radius-lg);
            overflow: hidden;
          }

          .water-log-modal-inner form {
            padding: var(--space-4);
          }

          .water-log-modal-header.modal-app-header {
            border-radius: 0;
          }

          .food-log-feature-backdrop:has(.food-log-feature-dialog--chatbot) {
            padding-top: max(var(--space-2), env(safe-area-inset-top, 0px));
            align-items: flex-start;
          }

          .food-log-feature-dialog--chatbot {
            margin-top: var(--space-1);
            max-height: min(90vh, 100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) !important;
          }

          .food-log-feature-dialog--creator {
            max-width: 100% !important;
            width: 100%;
            min-width: 0;
            overflow: hidden;
            border-radius: var(--radius-xl);
          }

          .food-log-feature-backdrop--meal {
            padding: max(var(--space-2), env(safe-area-inset-top, 0px)) var(--space-2) var(--space-2);
            align-items: flex-start;
          }

          .food-log-feature-dialog--meal {
            max-width: 100%;
            width: 100%;
            max-height: min(92vh, 100dvh);
            overflow-y: auto;
            margin-top: 0;
            box-sizing: border-box;
          }

          /* Do not use [class*="card"] here — it matches food-card, food-card-title-row, etc. inside FoodLogger */
          .modal:not(.modal--food-logger) .card,
          .food-logging-dashboard .modal:not(.modal--food-logger) [class*="card"] {
            padding: var(--space-3);
          }

          .custom-calendar-popup {
            max-width: 96vw;
            padding: var(--space-2);
            font-size: var(--text-sm);
          }

          .calendar-header {
            padding: var(--space-2) 0;
          }

          .calendar-grid {
            gap: 2px;
          }

          .food-actions--mobile-hide {
            display: none;
          }

          .food-name--clickable {
            cursor: pointer;
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
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--space-4);
          overflow: hidden;
        }

        .modal {
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          max-width: 95vw;
          max-height: 95vh;
          width: 100%;
          overflow-y: auto;
          border: 1px solid var(--border-primary);
        }

        .food-log-feature-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          box-sizing: border-box;
        }

        .food-log-feature-dialog {
          background: transparent;
          border: none;
          box-shadow: none;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          max-height: 95vh;
          box-sizing: border-box;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }

        .food-log-feature-dialog--creator {
          max-width: min(800px, 96vw);
          width: 100%;
          min-width: 0;
          /* Clip shadow / wide tables so the shell does not extend past the bordered card */
          overflow: hidden;
          border-radius: var(--radius-xl);
          contain: layout;
        }

        .food-log-feature-dialog--creator > .food-creator.card {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          margin-bottom: 0;
          box-sizing: border-box;
        }

        .food-log-feature-dialog--meal {
          max-width: min(960px, 96vw);
        }

        .food-log-feature-dialog--chatbot {
          max-width: min(380px, 92vw);
          width: 100%;
          max-height: 90vh;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Light gray outline: food creator, meal creator, chatbot, water logger */
        .food-log-feature-dialog--creator .food-creator.card,
        .food-log-feature-dialog--meal .meal-creator.card,
        .food-log-feature-dialog--chatbot .food-chatbot,
        .food-logging-dashboard .water-log-modal-inner {
          border: 1px solid rgba(180, 190, 202, 0.55);
          box-sizing: border-box;
        }

        [data-theme="light"] .food-log-feature-dialog--creator .food-creator.card,
        [data-theme="light"] .food-log-feature-dialog--meal .meal-creator.card,
        [data-theme="light"] .food-log-feature-dialog--chatbot .food-chatbot,
        [data-theme="light"] .food-logging-dashboard .water-log-modal-inner {
          border-color: rgba(120, 130, 145, 0.4);
        }

        /* index.css .card:hover — meal creator “Available foods” list shell */
        .food-logging-dashboard .meal-creator .food-list.card {
          transition: none;
        }

        .food-logging-dashboard .meal-creator .food-list.card:hover {
          transform: none !important;
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.35) !important;
        }

        /* Food logger search results: no card lift */
        .food-logging-dashboard .food-logger .food-list .food-card {
          transition: none;
        }

        .food-logging-dashboard .food-logger .food-list .food-card:hover {
          transform: none !important;
        }

        /* Inner wrap: wide form rows stay inside the card border */
        .food-log-feature-dialog--creator .food-creator.card.food-creator-card-wrap {
          max-width: 100%;
          min-width: 0;
          overflow-x: auto;
          overflow-y: visible;
          border-radius: var(--radius-xl);
          box-sizing: border-box;
        }

        .food-log-feature-dialog--chatbot .preview-section {
          min-width: 0;
          max-width: 100%;
          width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        .food-log-feature-dialog--chatbot .preview-foods-list {
          min-width: 0;
          max-width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        .food-log-feature-dialog--chatbot .preview-food-card {
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }

        .food-log-feature-dialog--chatbot .preview-food-metadata {
          max-width: 100%;
          min-width: 0;
          overflow-x: auto;
          box-sizing: border-box;
        }

        .food-log-feature-dialog--chatbot .preview-section .metadata-grid {
          grid-template-columns: repeat(auto-fill, minmax(min(116px, 100%), 1fr));
        }

        .food-log-feature-dialog--chatbot .food-chatbot {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          width: 100%;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          isolation: isolate;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .food-log-feature-dialog--chatbot .chatbot-layout {
          grid-template-columns: 1fr;
          max-width: 100%;
          width: 100%;
          flex: 1;
          min-width: 0;
          box-sizing: border-box;
          background: var(--bg-secondary);
        }

        .food-log-feature-dialog--chatbot .form-input,
        .food-log-feature-dialog--chatbot .chatbot-textarea,
        .food-log-feature-dialog--chatbot .input-with-voice {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .food-log-feature-dialog--chatbot .btn-voice-logger,
        .food-log-feature-dialog--chatbot .btn-primary,
        .food-log-feature-dialog--chatbot .btn-secondary {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .food-log-feature-dialog--chatbot .chatbot-layout,
        .food-log-feature-dialog--chatbot .preview-section,
        .food-log-feature-dialog--chatbot .preview-foods-list {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 769px) {
          .modal {
            max-width: 90vw;
            max-height: 90vh;
          }

          .food-log-feature-dialog--chatbot {
            max-width: min(720px, 94vw);
            width: min(720px, 94vw);
          }

          /* index.css .card:hover — no lift / shadow bump on creator shells */
          .food-log-feature-dialog--creator .food-creator.card,
          .food-log-feature-dialog--meal .meal-creator.card {
            transition: none;
          }

          .food-log-feature-dialog--creator .food-creator.card:hover,
          .food-log-feature-dialog--meal .meal-creator.card:hover {
            transform: none !important;
            box-shadow: 0 24px 55px rgba(0, 0, 0, 0.35) !important;
          }
        }

        @media (max-width: 768px) {
          .food-logging-dashboard .food-log-feature-backdrop {
            align-items: flex-start;
            padding: var(--space-2);
            padding-top: max(var(--space-2), env(safe-area-inset-top, 0px));
          }
        }
      `}</style>
      {/* Header */}
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
          // Do not auto-open on hover; only cancel any pending close.
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
          <div className="header-content header-content--food-log">
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
                        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                          ←
                        </button>
                        <span>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
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
              {isMobile && (
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
              {!isMobile && !showPcHeaderActions && (
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

            <div className="header-streak-wrap">
              <div className="streak-counter">
                <span className="streak-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c4 0 8-2.5 8-7.5 0-3.2-1.8-5.7-4.5-8.2.2 3.3-2 4.2-3.5 6-.9-1.8-.7-3.9.1-6.3-3.1 2.4-6.1 5.2-6.1 9.1C6 19.5 8 22 12 22Z" />
                  </svg>
                </span>
                <span className="streak-number">{logStreak}</span>
              </div>
            </div>
          </div>

          {!isMobile && pcHeaderActionsMounted && (
            <div
              className={`header-actions${showPcHeaderActions ? ' header-actions--open' : ''}${pcHeaderActionsClosing ? ' header-actions--closing' : ''}`}
            >
              <button
                type="button"
                className="btn-primary-header"
                onFocus={showPcHeaderActionsFromKeyboard}
                onClick={() => setShowFoodCreator(true)}
                title="Create Food"
              >
                <span className="header-action-label">Create Food</span>
              </button>
              <button
                type="button"
                className="btn-primary-header"
                onFocus={showPcHeaderActionsFromKeyboard}
                onClick={() => setShowMealCreator(true)}
                title="Create Meal"
              >
                <span className="header-action-label">Create Meal</span>
              </button>
              <button
                type="button"
                className="btn-primary-header"
                onFocus={showPcHeaderActionsFromKeyboard}
                onClick={() => setShowFoodChatbot(true)}
                title="Voice Logger"
              >
                <span className="header-action-label">Voice Logger</span>
              </button>
              <button
                type="button"
                className="btn-primary-header"
                onFocus={showPcHeaderActionsFromKeyboard}
                onClick={() => {
                  const now = new Date();
                  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                  setWaterFormData({ amount: '', unit: 'oz', date_time: localDateTime });
                  setShowWaterLogger(true);
                }}
                title="Log Water"
              >
                <span className="header-action-label">Log Water</span>
              </button>
            </div>
          )}
      </div>

      {isMobile && mobileQuickActionsMounted && (
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
                className="btn-icon-mobile btn-icon-mobile--lavender"
                onClick={() => {
                  setShowFoodCreator(true);
                  closeMobileQuickActionsAnimated();
                }}
                title="Create Food"
              >
                <svg className="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {/* Queue list (items + bullets) */}
                  <path d="M8 6h12" />
                  <path d="M8 12h12" />
                  <path d="M8 18h12" />
                  <circle cx="5" cy="6" r="1" />
                  <circle cx="5" cy="12" r="1" />
                  <circle cx="5" cy="18" r="1" />
                </svg>
              </button>
              <button
                type="button"
                className="btn-icon-mobile btn-icon-mobile--lavender"
                onClick={() => {
                  setShowMealCreator(true);
                  closeMobileQuickActionsAnimated();
                }}
                title="Create Meal"
              >
                <svg className="icon icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {/* Square-to-stack */}
                  <rect x="6.5" y="10.5" width="11" height="11" rx="2.2" ry="2.2" />
                  <rect x="10.5" y="4.5" width="11" height="11" rx="2.2" ry="2.2" />
                </svg>
              </button>
              <button
                type="button"
                className="btn-icon-mobile btn-icon-mobile--lavender"
                onClick={() => {
                  setShowFoodChatbot(true);
                  closeMobileQuickActionsAnimated();
                }}
                title="AI Logger"
              >
                <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      <>
      {/* Main Content */}
        {/* PC Layout - hidden on mobile via CSS */}
        <div className="dashboard-layout-pc">
            {/* Left Column - Progress & Food List */}
            <div className="dashboard-left">
              {/* Goal Progress */}
              <div 
                className={`goal-progress-section card${expandedProgressMounted ? ' goal-progress-section--expanded goal-progress-section--opening' : ''}`}
                onClick={(e) => {
                  if (e.target.closest('button')) return;
                  if (!expandedProgressMounted) {
                    setExpandedProgressMounted(true);
                    return;
                  }

                  setExpandedProgressMounted(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                {expandedProgressMounted ? (
                  <ExpandedProgressView
                    goals={goalsWithBurnedCalories}
                    consumed={consumed}
                  />
                ) : (
                  <ProgressGrid
                    goals={goalsWithBurnedCalories}
                    consumed={consumed}
                  />
                )}
              </div>

              {/* Food Log List */}
              <div className="food-log-section card">

              <div className="food-log-list">
                {getSortedFoodLogs().length === 0 ? (
                  <div className="empty-time-separators">
                    {['12am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'].map((separator, index) => (
                      <div key={separator} className="time-separator">
                        <div className="separator-line"></div>
                        <span className="separator-text">{separator}</span>
                        <div className="separator-line"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                    <div className="food-log-items">
                      {(() => {
                        const sortedLogs = getSortedFoodLogs();
                        return sortedLogs.map((log, index) => {
                        const time = formatTime(log.date_time);
                        const separator = getTimeSeparator(time);
                        const prevLog = index > 0 ? sortedLogs[index - 1] : null;
                        const prevTime = prevLog ? formatTime(prevLog.date_time) : '';
                        const prevSeparator = getTimeSeparator(prevTime);
                        const showSeparator = separator && separator !== prevSeparator;

                        return (
                          <React.Fragment key={log.macro_log_id}>
                            {showSeparator && (
                              <div className="time-separator">
                                <div className="separator-line"></div>
                                <span className="separator-text">{separator}</span>
                                <div className="separator-line"></div>
                              </div>
                            )}
                            <div className="food-log-item food-log-item--desktop">
                              <div className="food-log-cell food-log-cell--identity">
                                <span className="food-icon food-icon-inline">
                                  {getFoodGroupIcon(log.food_details?.food_group)}
                                </span>
                                <span className="food-name food-name--truncate">{log.food_name}</span>
                              </div>
                              <div className="food-log-cell food-log-cell--time">
                                {editingTime === log.macro_log_id ? (
                                  <div className="time-edit-container">
                                    <input
                                      type="time"
                                      defaultValue={getTimeForInput(log.date_time)}
                                      className="time-input"
                                      onBlur={(e) => {
                                        if (e.target.value) {
                                          updateFoodLogTime(log.macro_log_id, e.target.value);
                                        } else {
                                          setEditingTime(null);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          if (e.target.value) {
                                            updateFoodLogTime(log.macro_log_id, e.target.value);
                                          } else {
                                            setEditingTime(null);
                                          }
                                        } else if (e.key === 'Escape') {
                                          setEditingTime(null);
                                        }
                                      }}
                                      autoFocus
                                    />
                                  </div>
                                ) : (
                                  <span
                                    className="time-display"
                                    onClick={() => setEditingTime(log.macro_log_id)}
                                    title="Click to edit time"
                                  >
                                    {time}
                                  </span>
                                )}
                              </div>
                              <div className="food-log-cell food-log-cell--macros">
                                <span className="macro-pill macro-pill--plain">
                                  <span className="macro-pill-label">Ser:</span><span className="macro-pill-value">{log.servings}</span>
                                </span>
                                <span className="macro-pill macro-pill--plain">
                                  <span className="macro-pill-label">Cal:</span><span className="macro-pill-value">{Math.round(log.consumed_macros?.calories || 0)}</span>
                                </span>
                                <span className="macro-pill macro-pill--plain">
                                  <span className="macro-pill-label">Pro:</span><span className="macro-pill-value">{Math.round(log.consumed_macros?.protein || 0)}</span>
                                </span>
                                <span className="macro-pill macro-pill--plain">
                                  <span className="macro-pill-label">Car:</span><span className="macro-pill-value">{Math.round(log.consumed_macros?.carbohydrates || 0)}</span>
                                </span>
                                <span className="macro-pill macro-pill--plain">
                                  <span className="macro-pill-label">Fat:</span><span className="macro-pill-value">{Math.round(log.consumed_macros?.fat || 0)}</span>
                                </span>
                              </div>
                              <div className="food-log-cell food-log-cell--actions">
                                <button
                                  type="button"
                                  className="btn-icon-info"
                                  onClick={() => setMetadataModalLog(log.food_details ? log : null)}
                                  title="View metadata"
                                >
                                  <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-delete"
                                  onClick={() => deleteFoodLog(log.macro_log_id)}
                                  title="Remove from log"
                                >
                                  <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Action Panels */}
            <div className="dashboard-right">
              <FoodLogger
                onFoodLogged={handleFoodLogged}
                showAsPanel={true}
                selectedDate={selectedDate}
              />
              
            </div>
          </div>

        {/* Mobile Layout - hidden on desktop via CSS */}
        <div className="dashboard-layout-mobile">
            {/* Goal Progress */}
            <div 
              className={`goal-progress-section card${expandedProgressMounted ? ' goal-progress-section--expanded goal-progress-section--opening' : ''}`}
              onClick={(e) => {
                if (e.target.closest('button')) return;
                if (!expandedProgressMounted) {
                  setExpandedProgressMounted(true);
                  return;
                }

                setExpandedProgressMounted(false);
              }}
              style={{ cursor: 'pointer' }}
            >
              {expandedProgressMounted ? (
                <ExpandedProgressView
                  goals={goalsWithBurnedCalories}
                  consumed={consumed}
                />
              ) : (
                <ProgressGrid
                  goals={goalsWithBurnedCalories}
                  consumed={consumed}
                />
              )}
            </div>

            <div className="mobile-primary-actions">
              <button
                type="button"
                className="btn-icon-mobile btn-icon-mobile--lavender btn-icon-mobile--primary-wide"
                onClick={() => setShowFoodLogger(true)}
                title="Log Food"
              >
                <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                type="button"
                className="btn-icon-mobile btn-icon-mobile--lavender btn-icon-mobile--water-icon-only"
                onClick={() => {
                  const now = new Date();
                  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                  setWaterFormData({ amount: '', unit: 'oz', date_time: localDateTime });
                  setShowWaterLogger(true);
                }}
                title="Log Water"
              >
                <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 2.5c-.2 0-.4.1-.5.3C8.2 5.5 4 9.5 4 12a6 6 0 1012 0c0-2.5-4.2-6.5-5.5-9.2-.1-.2-.3-.3-.5-.3z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Food Log List */}
            <div className="food-log-section card">

              <div className="food-log-list">
                {foodLogs.length === 0 ? (
                  <div className="empty-time-separators">
                    {['12am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'].map((separator, index) => (
                      <div key={separator} className="time-separator">
                        <div className="separator-line"></div>
                        <span className="separator-text">{separator}</span>
                        <div className="separator-line"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="food-log-items">
                    {(() => {
                      const sortedLogs = getSortedFoodLogs();
                      return sortedLogs.map((log, index) => {
                      const time = formatTime(log.date_time);
                      const separator = getTimeSeparator(time);
                        const prevLog = index > 0 ? sortedLogs[index - 1] : null;
                      const prevTime = prevLog ? formatTime(prevLog.date_time) : '';
                      const prevSeparator = getTimeSeparator(prevTime);
                      const showSeparator = separator && separator !== prevSeparator;

                      return (
                        <React.Fragment key={log.macro_log_id}>
                          {showSeparator && (
                            <div className="time-separator">
                              <div className="separator-line"></div>
                              <span className="separator-text">{separator}</span>
                              <div className="separator-line"></div>
                            </div>
                          )}
                          <div className="food-log-item-mobile-wrap">
                            <div className="food-log-item-delete-bg" aria-hidden>
                              <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div
                              className={`food-log-item mobile${mobileDeletingLogId === log.macro_log_id ? ' is-deleting' : ''}`}
                              data-testid={`mobile-food-log-item-${log.macro_log_id}`}
                              style={{ transform: `translateX(${mobileSwipeState[log.macro_log_id]?.offsetX || 0}px)` }}
                              onTouchStart={(e) => handleMobileSwipeStart(log.macro_log_id, e)}
                              onTouchMove={(e) => handleMobileSwipeMove(log.macro_log_id, e)}
                              onTouchEnd={() => handleMobileSwipeEnd(log.macro_log_id)}
                              onTouchCancel={() => handleMobileSwipeEnd(log.macro_log_id)}
                            >
                              <div className="food-mobile-stack">
                                <div className="food-mobile-top-row">
                                  <div className="food-mobile-identity">
                                    <span className="food-icon food-icon-inline">
                                      {getFoodGroupIcon(log.food_details?.food_group)}
                                    </span>
                                    <div className="food-mobile-name-time">
                                      <span
                                        className="food-name food-name--clickable"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setMetadataModalLog(log.food_details ? log : null)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMetadataModalLog(log.food_details ? log : null); }}
                                      >
                                        {log.food_name}
                                      </span>
                                      <div className="food-time">
                                        {editingTime === log.macro_log_id ? (
                                          <div className="time-edit-container">
                                            <input
                                              type="time"
                                              defaultValue={getTimeForInput(log.date_time)}
                                              className="time-input"
                                              onBlur={(e) => {
                                                if (e.target.value) {
                                                  updateFoodLogTime(log.macro_log_id, e.target.value);
                                                } else {
                                                  setEditingTime(null);
                                                }
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  if (e.target.value) {
                                                    updateFoodLogTime(log.macro_log_id, e.target.value);
                                                  } else {
                                                    setEditingTime(null);
                                                  }
                                                } else if (e.key === 'Escape') {
                                                  setEditingTime(null);
                                                }
                                              }}
                                              autoFocus
                                            />
                                          </div>
                                        ) : (
                                          <span
                                            className="time-display"
                                            onClick={() => setEditingTime(log.macro_log_id)}
                                            title="Click to edit time"
                                          >
                                            {time}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="sr-only">Servings</span>
                                </div>
                              </div>
                              <div className="food-macros food-macros--mobile-plain">
                                <span className="macro-pill macro-pill--plain">
                                  <span className="macro-pill-label">s:</span><span className="macro-pill-value">{log.servings}</span>
                                </span>
                                <span className="macro-pill macro-pill--plain">
                                  <span className="macro-pill-label">Cal:</span><span className="macro-pill-value">{Math.round(log.consumed_macros?.calories || 0)}</span>
                                </span>
                                <span className="macro-pill macro-pill--plain">
                                  <span className="macro-pill-label">Pro:</span><span className="macro-pill-value">{Math.round(log.consumed_macros?.protein || 0)}</span>
                                </span>
                                <span className="macro-pill macro-pill--plain">
                                  <span className="macro-pill-label">Car:</span><span className="macro-pill-value">{Math.round(log.consumed_macros?.carbohydrates || 0)}</span>
                                </span>
                                <span className="macro-pill macro-pill--plain">
                                  <span className="macro-pill-label">Fat:</span><span className="macro-pill-value">{Math.round(log.consumed_macros?.fat || 0)}</span>
                                </span>
                              </div>
                              <div className="food-actions food-actions--mobile-hide">
                                <button
                                  className="btn-icon-info"
                                  onClick={() => setMetadataModalLog(log.food_details ? log : null)}
                                  title="View metadata"
                                >
                                  <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
      </>

      {/* Modals for Mobile */}
      {isMobile && (
        <>
          {showFoodLogger && (
            <div
              className={`modal-backdrop modal-backdrop--food-logger${foodLoggerClosing ? ' modal-backdrop--food-logger-closing' : ''}`}
              onClick={closeFoodLogger}
            >
              <div
                className={`modal modal--food-logger${foodLoggerClosing ? ' modal--food-logger-closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
              >
                <FoodLogger
                  onFoodLogged={handleFoodLogged}
                  onClose={closeFoodLogger}
                  showAsPanel={false}
                  selectedDate={selectedDate}
                />
              </div>
            </div>
          )}

          {showFoodCreator && (
            <div className="food-log-feature-backdrop" onClick={() => setShowFoodCreator(false)} role="presentation">
              <div
                className="food-log-feature-dialog food-log-feature-dialog--creator"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Create food"
              >
                <FoodCreator
                  selectedDate={selectedDate}
                  onFoodCreated={handleFoodCreated}
                  onClose={() => setShowFoodCreator(false)}
                />
              </div>
            </div>
          )}

          {showMealCreator && (
            <div
              className="food-log-feature-backdrop food-log-feature-backdrop--meal"
              onClick={() => setShowMealCreator(false)}
              role="presentation"
            >
              <div
                className="food-log-feature-dialog food-log-feature-dialog--meal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Create meal"
              >
                <MealCreator
                  onMealCreated={handleMealCreated}
                  onClose={() => setShowMealCreator(false)}
                />
              </div>
            </div>
          )}

          {showFoodChatbot && (
            <div className="food-log-feature-backdrop" onClick={() => setShowFoodChatbot(false)} role="presentation">
              <div
                className="food-log-feature-dialog food-log-feature-dialog--chatbot"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Voice food log"
              >
                <FoodChatbot
                  onFoodsLogged={handleFoodsLogged}
                  onClose={() => setShowFoodChatbot(false)}
                />
              </div>
            </div>
          )}

          {showWaterLogger && (
            <div className="modal-backdrop modal-backdrop--water-log" onClick={() => setShowWaterLogger(false)}>
              <div className="modal modal--water-log" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                <div className="water-log-modal-inner">
                  <div className="modal-app-header modal-app-header--compact water-log-modal-header">
                    <h2 className="modal-app-header__title">Log Water</h2>
                    <button
                      type="button"
                      className="btn-close modal-app-header__close"
                      onClick={() => setShowWaterLogger(false)}
                      aria-label="Close"
                    >
                      <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleWaterSubmit}>
                    <div style={{ marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                        Amount
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={waterFormData.amount}
                        onChange={handleWaterInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: 'var(--space-3) var(--space-4)',
                          fontSize: 'var(--text-base)',
                          fontFamily: 'var(--font-primary)',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-md)',
                          transition: 'all 0.2s ease'
                        }}
                        step="0.1"
                        onFocus={(e) => {
                          e.target.style.outline = 'none';
                          e.target.style.borderColor = 'var(--accent-primary)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          e.target.style.background = 'var(--bg-primary)';
                        }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                        Unit
                      </label>
                      <select
                        name="unit"
                        value={waterFormData.unit}
                        onChange={handleWaterInputChange}
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          fontSize: 'var(--text-base)',
                          fontFamily: 'var(--font-primary)',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-md)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <option value="oz">oz</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                    
                    <div style={{ marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                        Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        name="date_time"
                        value={waterFormData.date_time}
                        onChange={handleWaterInputChange}
                        style={{
                          width: '100%',
                          padding: 'var(--space-3) var(--space-4)',
                          fontSize: 'var(--text-base)',
                          fontFamily: 'var(--font-primary)',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-md)',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.outline = 'none';
                          e.target.style.borderColor = 'var(--accent-primary)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          e.target.style.background = 'var(--bg-primary)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-primary)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.background = 'var(--bg-tertiary)';
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setShowWaterLogger(false)}
                        style={{
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-3) var(--space-6)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-medium)',
                          fontFamily: 'var(--font-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingWater}
                        style={{
                          background: 'var(--accent-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-3) var(--space-6)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-medium)',
                          fontFamily: 'var(--font-primary)',
                          cursor: submittingWater ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: 'var(--shadow-sm)',
                          opacity: submittingWater ? '0.5' : '1'
                        }}
                      >
                        {submittingWater ? 'Saving...' : 'Save Entry'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* PC Modals */}
      {!isMobile && (
        <>
          {showFoodCreator && (
            <div className="food-log-feature-backdrop" onClick={() => setShowFoodCreator(false)} role="presentation">
              <div
                className="food-log-feature-dialog food-log-feature-dialog--creator"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Create food"
              >
                <FoodCreator
                  selectedDate={selectedDate}
                  onFoodCreated={handleFoodCreated}
                  onClose={() => setShowFoodCreator(false)}
                />
              </div>
            </div>
          )}

          {showMealCreator && (
            <div
              className="food-log-feature-backdrop food-log-feature-backdrop--meal"
              onClick={() => setShowMealCreator(false)}
              role="presentation"
            >
              <div
                className="food-log-feature-dialog food-log-feature-dialog--meal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Create meal"
              >
                <MealCreator
                  onMealCreated={handleMealCreated}
                  onClose={() => setShowMealCreator(false)}
                />
              </div>
            </div>
          )}

          {showFoodChatbot && (
            <div className="food-log-feature-backdrop" onClick={() => setShowFoodChatbot(false)} role="presentation">
              <div
                className="food-log-feature-dialog food-log-feature-dialog--chatbot"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Voice food log"
              >
                <FoodChatbot
                  onFoodsLogged={handleFoodsLogged}
                  onClose={() => setShowFoodChatbot(false)}
                />
              </div>
            </div>
          )}

          {showWaterLogger && (
            <div className="modal-backdrop modal-backdrop--water-log" onClick={() => setShowWaterLogger(false)}>
              <div className="modal modal--water-log" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                <div className="water-log-modal-inner">
                  <div className="modal-app-header modal-app-header--compact water-log-modal-header">
                    <h2 className="modal-app-header__title">Log Water</h2>
                    <button
                      type="button"
                      className="btn-close modal-app-header__close"
                      onClick={() => setShowWaterLogger(false)}
                      aria-label="Close"
                    >
                      <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <form onSubmit={handleWaterSubmit}>
                    <div style={{ marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                        Amount
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={waterFormData.amount}
                        onChange={handleWaterInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: 'var(--space-3) var(--space-4)',
                          fontSize: 'var(--text-base)',
                          fontFamily: 'var(--font-primary)',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-md)',
                          transition: 'all 0.2s ease'
                        }}
                        step="0.1"
                        onFocus={(e) => {
                          e.target.style.outline = 'none';
                          e.target.style.borderColor = 'var(--accent-primary)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          e.target.style.background = 'var(--bg-primary)';
                        }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                        Unit
                      </label>
                      <select
                        name="unit"
                        value={waterFormData.unit}
                        onChange={handleWaterInputChange}
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          fontSize: 'var(--text-base)',
                          fontFamily: 'var(--font-primary)',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-md)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <option value="oz">oz</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                    
                    <div style={{ marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                        Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        name="date_time"
                        value={waterFormData.date_time}
                        onChange={handleWaterInputChange}
                        style={{
                          width: '100%',
                          padding: 'var(--space-3) var(--space-4)',
                          fontSize: 'var(--text-base)',
                          fontFamily: 'var(--font-primary)',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-md)',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.outline = 'none';
                          e.target.style.borderColor = 'var(--accent-primary)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                          e.target.style.background = 'var(--bg-primary)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-primary)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.background = 'var(--bg-tertiary)';
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setShowWaterLogger(false)}
                        style={{
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-3) var(--space-6)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-medium)',
                          fontFamily: 'var(--font-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingWater}
                        style={{
                          background: 'var(--accent-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-3) var(--space-6)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-medium)',
                          fontFamily: 'var(--font-primary)',
                          cursor: submittingWater ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: 'var(--shadow-sm)',
                          opacity: submittingWater ? '0.5' : '1'
                        }}
                      >
                        {submittingWater ? 'Saving...' : 'Save Entry'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Metadata Modal for Food Log Items */}
      {metadataModalLog && (
        <FoodMetadataModal 
          food={metadataModalLog}
          onClose={() => setMetadataModalLog(null)}
        />
      )}

    </div>
  );
};

export default FoodLoggingDashboard;
