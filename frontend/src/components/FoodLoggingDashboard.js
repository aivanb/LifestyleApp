import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { ExpandedProgressView, ProgressGrid } from './ProgressBar';
import FoodLogger from './FoodLogger';
import FoodCreator from './FoodCreator';
import MealCreator from './MealCreator';
import FoodChatbot from './FoodChatbot';
import FoodMetadataModal from './FoodMetadataModal';

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
  const [foodLogs, setFoodLogs] = useState([]);
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
  const [showFoodLogger, setShowFoodLogger] = useState(false);
  const [showFoodCreator, setShowFoodCreator] = useState(false);
  const [showMealCreator, setShowMealCreator] = useState(false);
  const [showFoodChatbot, setShowFoodChatbot] = useState(false);
  const [showWaterLogger, setShowWaterLogger] = useState(false);
  const [waterFormData, setWaterFormData] = useState({ amount: '', unit: 'oz', date_time: '' });
  const [submittingWater, setSubmittingWater] = useState(false);
  const [showExpandedProgress, setShowExpandedProgress] = useState(false); // Default to condensed view
  /** PC only: full header action buttons visible; false shows chevron to expand */
  const [showPcHeaderActions, setShowPcHeaderActions] = useState(true);
  const headerActionsTimeoutRef = useRef(null);
  const headerRegionRef = useRef(null);
  const [showMobileQuickActions, setShowMobileQuickActions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [logStreak, setLogStreak] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [sortOrder] = useState('descending'); // 'ascending' or 'descending'
  const [editingTime, setEditingTime] = useState(null);
  const [metadataModalLog, setMetadataModalLog] = useState(null);

  const clearHeaderActionsFadeTimeout = useCallback(() => {
    if (headerActionsTimeoutRef.current) {
      clearTimeout(headerActionsTimeoutRef.current);
      headerActionsTimeoutRef.current = null;
    }
  }, []);

  const startPcHeaderActionsHideTimer = useCallback(() => {
    clearHeaderActionsFadeTimeout();
    if (typeof window === 'undefined' || window.innerWidth <= 768) return;
    headerActionsTimeoutRef.current = setTimeout(() => {
      setShowPcHeaderActions(false);
    }, 3000);
  }, [clearHeaderActionsFadeTimeout]);

  const handlePcHeaderActionsInteraction = useCallback(() => {
    if (typeof window === 'undefined' || window.innerWidth <= 768) return;
    setShowPcHeaderActions(true);
    startPcHeaderActionsHideTimer();
  }, [startPcHeaderActionsHideTimer]);

  useEffect(() => {
    startPcHeaderActionsHideTimer();
    return () => clearHeaderActionsFadeTimeout();
  }, [startPcHeaderActionsHideTimer, clearHeaderActionsFadeTimeout]);

  useEffect(() => {
    const onMove = (e) => {
      if (typeof window === 'undefined' || window.innerWidth <= 768) return;
      const el = headerRegionRef.current;
      if (!el || !showPcHeaderActions) return;
      const pad = 72;
      const r = el.getBoundingClientRect();
      const inside =
        e.clientX >= r.left - pad &&
        e.clientX <= r.right + pad &&
        e.clientY >= r.top - pad &&
        e.clientY <= r.bottom + pad;
      if (!inside) {
        setShowPcHeaderActions(false);
        clearHeaderActionsFadeTimeout();
      }
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [showPcHeaderActions, clearHeaderActionsFadeTimeout]);

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
      // Calculate consumed macros from food logs for the selected date
      const startDate = `${selectedDate}T00:00:00Z`;
      const endDate = `${selectedDate}T23:59:59Z`;
      
      const response = await api.getFoodLogs({
        start_date: startDate,
        end_date: endDate,
        page_size: 100
      });

      if (response.data.data && response.data.data.logs) {
        const logs = response.data.data.logs;
        
        // Sum up consumed macros
        const consumedMacros = logs.reduce((acc, log) => {
          const macros = log.consumed_macros || {};
          Object.keys(macros).forEach(key => {
            acc[key] = (acc[key] || 0) + (macros[key] || 0);
          });
          return acc;
        }, {});

        setConsumed(consumedMacros);
        setFoodLogs(logs);
      }
    } catch (err) {
      console.error('Failed to load daily progress:', err);
      setError('Failed to load daily progress');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadFoodLogs = useCallback(async () => {
    try {
      const startDate = `${selectedDate}T00:00:00Z`;
      const endDate = `${selectedDate}T23:59:59Z`;
      
      const response = await api.getFoodLogs({
        start_date: startDate,
        end_date: endDate,
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

  const handleFoodLogged = async () => {
    setShowFoodLogger(false);
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

  const updateFoodLogTime = async (logId, newTime) => {
    try {
      // Parse the new time and create a new datetime in UTC
      const [hours, minutes] = newTime.split(':');
      
      // Parse the selected date
      const [year, month, day] = selectedDate.split('-').map(Number);
      
      // Create new date with UTC time to avoid timezone issues
      const logDate = new Date(Date.UTC(year, month - 1, day, parseInt(hours), parseInt(minutes), 0, 0));
      
      // Update the food log with new time
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
    // Use UTC methods to avoid timezone conversion
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTimeForInput = (dateString) => {
    const date = new Date(dateString);
    // Use UTC methods to avoid timezone conversion
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
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
        <p>Loading food logging dashboard...</p>
      </div>
    );
  }

  return (
    <div className="food-logging-dashboard">
      {/* Header */}
      <div className="dashboard-header" ref={headerRegionRef}>
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
              {!isMobile && !showPcHeaderActions && (
                <button
                  type="button"
                  className="header-actions-reveal"
                  aria-label="Show header actions"
                  onClick={() => {
                    setShowPcHeaderActions(true);
                    startPcHeaderActionsHideTimer();
                  }}
                >
                  <span className="header-actions-reveal__glyph" aria-hidden>⌄</span>
                </button>
              )}
              {(!isMobile && showPcHeaderActions) && (
                <div
                  className="header-actions"
                  onMouseEnter={handlePcHeaderActionsInteraction}
                >
                  <button
                    type="button"
                    className="btn-primary-header"
                    onFocus={handlePcHeaderActionsInteraction}
                    onClick={() => {
                      handlePcHeaderActionsInteraction();
                      setShowFoodCreator(true);
                    }}
                    title="Create Food"
                  >
                    <span className="header-action-label">Create Food</span>
                  </button>
                  <button
                    type="button"
                    className="btn-primary-header"
                    onFocus={handlePcHeaderActionsInteraction}
                    onClick={() => {
                      handlePcHeaderActionsInteraction();
                      setShowMealCreator(true);
                    }}
                    title="Create Meal"
                  >
                    <span className="header-action-label">Create Meal</span>
                  </button>
                  <button
                    type="button"
                    className="btn-primary-header"
                    onFocus={handlePcHeaderActionsInteraction}
                    onClick={() => {
                      handlePcHeaderActionsInteraction();
                      setShowFoodChatbot(true);
                    }}
                    title="Voice Logger"
                  >
                    <span className="header-action-label">Voice Logger</span>
                  </button>
                  <button
                    type="button"
                    className="btn-primary-header"
                    onFocus={handlePcHeaderActionsInteraction}
                    onClick={() => {
                      handlePcHeaderActionsInteraction();
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
      </div>

      <>
      {/* Main Content */}
        {/* PC Layout - hidden on mobile via CSS */}
        <div className="dashboard-layout-pc">
            {/* Left Column - Progress & Food List */}
            <div className="dashboard-left">
              {/* Goal Progress */}
              <div 
                className={`goal-progress-section card${showExpandedProgress ? ' goal-progress-section--expanded' : ''}`}
                onClick={(e) => {
                  if (!showExpandedProgress && !e.target.closest('button')) {
                    setShowExpandedProgress(true);
                  }
                }}
                style={{ cursor: showExpandedProgress ? 'default' : 'pointer' }}
              >
                {showExpandedProgress ? (
                  <ExpandedProgressView
                    goals={goals}
                    consumed={consumed}
                    onClose={() => setShowExpandedProgress(false)}
                  />
                ) : (
                  <ProgressGrid
                    goals={goals}
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
                                <span className="macro-pill macro-pill--plain">Cal: {Math.round(log.consumed_macros?.calories || 0)}</span>
                                <span className="macro-pill macro-pill--plain">Pro: {Math.round(log.consumed_macros?.protein || 0)}</span>
                                <span className="macro-pill macro-pill--plain">Car: {Math.round(log.consumed_macros?.carbohydrates || 0)}</span>
                                <span className="macro-pill macro-pill--plain">Fat: {Math.round(log.consumed_macros?.fat || 0)}</span>
                                <span className="macro-pill macro-pill--plain">Ser: {log.servings}</span>
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
              className={`goal-progress-section card${showExpandedProgress ? ' goal-progress-section--expanded' : ''}`}
              onClick={(e) => {
                if (!showExpandedProgress && !e.target.closest('button')) {
                  setShowExpandedProgress(true);
                }
              }}
              style={{ cursor: showExpandedProgress ? 'default' : 'pointer' }}
            >
              {showExpandedProgress ? (
                <ExpandedProgressView
                  goals={goals}
                  consumed={consumed}
                  onClose={(e) => {
                    if (e) e.stopPropagation();
                    setShowExpandedProgress(false);
                  }}
                />
              ) : (
                <ProgressGrid
                  goals={goals}
                  consumed={consumed}
                />
              )}
            </div>

            {/* Action Buttons */}
            {(
              <div className="mobile-actions-reveal-wrap">
                <button
                  type="button"
                  className="mobile-quick-actions-reveal"
                  onClick={() => setShowMobileQuickActions((v) => !v)}
                  aria-label="Show quick actions"
                  title={showMobileQuickActions ? 'Hide quick actions' : 'Show quick actions'}
                >
                  {showMobileQuickActions ? '⌃' : '⌄'}
                </button>
              </div>
            )}
            <div className="mobile-actions">
              {/* Hidden quick actions: toggled by arrow (mobile-only) */}
              <button
                className="btn-icon-mobile"
                onClick={() => setShowFoodLogger(true)}
                title="Log Food"
              >
                <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                className="btn-icon-mobile btn-icon-mobile--quick-secondary"
                style={{ display: showMobileQuickActions ? 'flex' : 'none' }}
                onClick={() => setShowFoodCreator(true)}
                title="Create Food"
              >
                <svg className="icon icon-lg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4 4a2 2 0 012-2h2a2 2 0 012 2v6h2V4a2 2 0 012-2h2a2 2 0 012 2v18h-2v-6H8v6H6V4a2 2 0 01-2-2z" />
                </svg>
              </button>
              
              <button
                className="btn-icon-mobile btn-icon-mobile--quick-secondary"
                style={{ display: showMobileQuickActions ? 'flex' : 'none' }}
                onClick={() => setShowMealCreator(true)}
                title="Create Meal"
              >
                <svg className="icon icon-lg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 2v10a4 4 0 004 4v6h2v-6a4 4 0 004-4V2h-2v10a2 2 0 01-2 2V2h-2v12a2 2 0 01-2-2V2H7z" />
                </svg>
              </button>
              
              <button
                className="btn-icon-mobile btn-icon-mobile--quick-secondary"
                style={{ display: showMobileQuickActions ? 'flex' : 'none' }}
                onClick={() => setShowFoodChatbot(true)}
                title="AI Logger"
              >
                <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </button>

              <button
                className="btn-icon-mobile btn-icon-mobile--water"
                onClick={() => {
                  // Initialize date_time with current date/time
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
                <span className="btn-icon-mobile-label">Water</span>
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
                          <div className="food-log-item mobile">
                            <div className="food-mobile-stack">
                              <span className="food-serving-inline">
                                {log.servings}
                              </span>
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
                              <span className="food-icon food-icon-inline">
                                {getFoodGroupIcon(log.food_details?.food_group)}
                              </span>
                            </div>
                            <div className="food-macros food-macros--mobile-plain">
                              <span className="macro-pill macro-pill--plain">Cal: {Math.round(log.consumed_macros?.calories || 0)}</span>
                              <span className="macro-pill macro-pill--plain">Pro: {Math.round(log.consumed_macros?.protein || 0)}</span>
                              <span className="macro-pill macro-pill--plain">Car: {Math.round(log.consumed_macros?.carbohydrates || 0)}</span>
                              <span className="macro-pill macro-pill--plain">Fat: {Math.round(log.consumed_macros?.fat || 0)}</span>
                              <span className="macro-pill macro-pill--plain">Ser: {log.servings}</span>
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
            <div className="modal-backdrop" onClick={() => setShowFoodLogger(false)}>
              <div className="modal modal--food-logger" onClick={(e) => e.stopPropagation()}>
                <FoodLogger
                  onFoodLogged={handleFoodLogged}
                  onClose={() => setShowFoodLogger(false)}
                  showAsPanel={false}
                />
              </div>
            </div>
          )}

          {showFoodCreator && (
            <div className="modal-backdrop" onClick={() => setShowFoodCreator(false)}>
              <div className="modal modal--food-creator" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <FoodCreator
                  onFoodCreated={handleFoodCreated}
                  onClose={() => setShowFoodCreator(false)}
                />
              </div>
            </div>
          )}

          {showMealCreator && (
            <div className="modal-backdrop modal-backdrop--meal-creator" onClick={() => setShowMealCreator(false)}>
              <div className="modal modal--meal-creator" onClick={(e) => e.stopPropagation()}>
                <MealCreator
                  onMealCreated={handleMealCreated}
                  onClose={() => setShowMealCreator(false)}
                />
              </div>
            </div>
          )}

          {showFoodChatbot && (
            <div className="modal-backdrop" onClick={() => setShowFoodChatbot(false)}>
              <div className="modal modal--food-chatbot" onClick={(e) => e.stopPropagation()}>
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
            <div className="modal-backdrop" onClick={() => setShowFoodCreator(false)}>
              <div className="modal modal--food-creator" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <FoodCreator
                  onFoodCreated={handleFoodCreated}
                  onClose={() => setShowFoodCreator(false)}
                />
              </div>
            </div>
          )}

          {showMealCreator && (
            <div className="modal-backdrop modal-backdrop--meal-creator" onClick={() => setShowMealCreator(false)}>
              <div className="modal modal--meal-creator" onClick={(e) => e.stopPropagation()}>
                <MealCreator
                  onMealCreated={handleMealCreated}
                  onClose={() => setShowMealCreator(false)}
                />
              </div>
            </div>
          )}

          {showFoodChatbot && (
            <div className="modal-backdrop" onClick={() => setShowFoodChatbot(false)}>
              <div className="modal modal--food-chatbot" onClick={(e) => e.stopPropagation()}>
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

      <style>{`
        .route-food-log .main-content {
          justify-content: flex-start;
          align-items: stretch;
        }

        .food-logging-dashboard {
          min-height: 100vh;
          background-color: var(--bg-primary);
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
          background-image:
            linear-gradient(var(--foodlog-shell-tint) 1px, transparent 1px),
            linear-gradient(90deg, var(--foodlog-shell-tint) 1px, transparent 1px),
            linear-gradient(var(--foodlog-shell-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--foodlog-shell-strong) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 80px 80px, 80px 80px;
          background-attachment: fixed;
        }

        [data-theme="light"] .food-logging-dashboard {
          --foodlog-shell-tint: rgba(0, 0, 0, 0.04);
          --foodlog-shell-strong: rgba(0, 0, 0, 0.1);
          background-image:
            linear-gradient(var(--foodlog-shell-tint) 1px, transparent 1px),
            linear-gradient(90deg, var(--foodlog-shell-tint) 1px, transparent 1px),
            linear-gradient(var(--foodlog-shell-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--foodlog-shell-strong) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 80px 80px, 80px 80px;
          background-attachment: fixed;
        }

        .dashboard-header {
          background: transparent;
          border: none;
          padding: 0;
          width: 100%;
          margin: 0;
        }

        .header-content--food-log {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 2.2fr) minmax(0, 1fr);
          align-items: center;
          width: 100%;
          margin: 0;
          padding: var(--space-2) var(--space-4) var(--space-2);
          gap: var(--space-3);
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
          height: 56px;
        }

        .header-actions-reveal {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 180px;
          height: 72px;
          padding: 0;
          border: none;
          border-radius: var(--radius-md);
          background: transparent;
          color: #ffffff;
          font-family: var(--font-primary);
          font-size: var(--text-4xl);
          font-weight: var(--font-weight-bold);
          cursor: pointer;
          box-shadow: none;
        }

        .header-actions-reveal:focus {
          outline: 2px solid var(--accent-primary);
          outline-offset: 2px;
        }

        .header-actions-reveal__glyph {
          letter-spacing: 0.02em;
          line-height: 1;
        }

        .header-streak-wrap {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          min-width: 0;
        }

        .header-actions {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          white-space: nowrap;
        }

        .streak-counter {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
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
          color: #b8860b; /* dark yellow */
        }

        .streak-icon svg {
          display: block;
          position: relative;
          top: 1px;
          line-height: 1;
        }

        .streak-number {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: #b8860b; /* dark yellow */
          line-height: 1;
        }

        .btn-primary-header {
          padding: 0 var(--space-6);
          border: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: var(--radius-md);
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--bg-primary);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          min-width: 210px;
          height: 60px;
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.35);
          font-family: var(--font-primary);
          z-index: calc(var(--z-fixed) + 5);
          background: rgba(255, 255, 255, 0.92);
        }

        .btn-primary-header:focus {
          outline: 2px solid rgba(255, 255, 255, 0.35);
          outline-offset: 2px;
        }

        .btn-primary-header .header-action-label {
          color: var(--bg-primary);
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
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.35);
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


        /* Goal progress + food log cards — align with personalization goals-section */
        .goal-progress-section.card {
          background: var(--bg-secondary);
          border: none;
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-top: 0;
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          box-sizing: border-box;
          min-height: 288px;
        }

        .goal-progress-section.card:hover {
          transform: none !important;
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.4) !important;
        }

        .goal-progress-section--expanded .expanded-progress.card {
          padding: 0;
          margin: 0;
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
          transition: none;
        }

        .goal-progress-section--expanded .expanded-progress.card:hover {
          transform: none !important;
          box-shadow: none !important;
        }

        .goal-progress-section--expanded .expanded-progress .expanded-progress-grid {
          max-height: 240px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding-right: var(--space-2);
          scrollbar-gutter: stable;
        }

        .goal-progress-section .progress-grid {
          height: 100%;
          align-content: center;
          padding-top: var(--space-2);
          padding-bottom: var(--space-2);
        }

        .food-log-section.card {
          background: var(--bg-secondary);
          border: none;
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-top: var(--space-4);
          margin-bottom: var(--space-4);
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          outline: none;
          box-sizing: border-box;
        }

        .food-log-section.card:hover {
          transform: none !important;
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.4) !important;
        }

        .food-log-section.card:focus,
        .food-log-section.card:focus-within {
          outline: none;
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

        .food-log-item--desktop {
          display: grid;
          grid-template-columns: 3fr 1fr 6fr 1fr;
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
        }

        .macro-pill--plain {
          font-size: var(--text-base);
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
          background: none;
          border: none;
          padding: 0 var(--space-3);
          line-height: 1.2;
          white-space: nowrap;
        }

        .macro-pill--plain:not(:first-child) {
          border-left: 1px solid var(--input-border);
        }

        .food-log-cell--actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-3);
          min-width: 0;
        }

        .food-log-item.mobile {
          flex-direction: column;
          align-items: stretch;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-3);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-2);
        }

        .food-mobile-stack {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: var(--space-2);
          width: 100%;
        }

        .food-serving-inline {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .food-log-item.mobile .food-icon-inline {
          font-size: var(--text-3xl);
        }

        .food-log-item.mobile .food-name {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          text-align: left;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .food-log-item.mobile .food-time {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          flex-shrink: 0;
          white-space: nowrap;
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
          padding: 0 var(--space-2);
        }

        .food-icon {
          font-size: var(--text-2xl);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border-radius: var(--radius-md);
        }

        .food-icon-inline {
          width: auto;
          height: auto;
          font-size: var(--text-xl);
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
          width: 64px;
          height: 56px;
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
          width: 64px;
          height: 56px;
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

        @media (max-width: 768px) {
          .dashboard-layout-pc {
            display: none;
          }

          .food-logging-dashboard {
            padding-left: var(--space-2);
            padding-right: var(--space-2);
          }

          .header-content--food-log {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            padding: var(--space-2);
            gap: var(--space-2);
          }

          .header-actions-center {
            display: none;
          }

          .header-date-wrap .date-input {
            max-width: 100%;
            min-width: 0;
          }

          .header-streak-wrap .streak-unit {
            display: none;
          }

          .mobile-actions-reveal-wrap {
            width: 100%;
            display: flex;
            justify-content: center;
            padding: 0;
            margin: 0 0 var(--space-2);
          }

          .mobile-quick-actions-reveal {
            background: transparent;
            border: none;
            color: #ffffff;
            cursor: pointer;
            font-size: var(--text-4xl);
            font-weight: var(--font-weight-bold);
            padding: 0;
            line-height: 1;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .btn-icon-mobile--water .btn-icon-mobile-label {
            display: none;
          }

          .mobile-actions {
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            column-gap: var(--space-2);
            row-gap: var(--space-4);
            align-items: center;
          }

          .mobile-actions .btn-icon-mobile:first-child {
            order: 1;
            grid-column: 1 / 8; /* ~70% */
            grid-row: 1;
            width: 100%;
            min-height: 58px;
            border-radius: var(--radius-md);
            background: rgba(255, 255, 255, 0.95);
            color: var(--bg-primary);
            border: 2px solid rgba(255, 255, 255, 0.95);
            margin: 0;
          }

          .mobile-actions .btn-icon-mobile:nth-child(5) {
            order: 1;
            grid-column: 8 / 11; /* ~30% */
            grid-row: 1;
            width: 100%;
            min-height: 58px;
            border-radius: var(--radius-md);
            background: rgba(255, 255, 255, 0.95);
            color: var(--bg-primary);
            border: 2px solid rgba(255, 255, 255, 0.95);
            margin: 0;
          }

          .mobile-actions .btn-icon-mobile:nth-child(2),
          .mobile-actions .btn-icon-mobile:nth-child(3),
          .mobile-actions .btn-icon-mobile:nth-child(4) {
            order: 2;
            width: 84px;
            height: 84px;
            min-width: 84px;
            border-radius: 50%;
            margin: 0 auto;
          }

          .mobile-actions .btn-icon-mobile:nth-child(2) {
            grid-column: 1 / 4;
            grid-row: 2;
          }

          .mobile-actions .btn-icon-mobile:nth-child(3) {
            grid-column: 4 / 7;
            grid-row: 2;
          }

          .mobile-actions .btn-icon-mobile:nth-child(4) {
            grid-column: 7 / 10;
            grid-row: 2;
          }

          .mobile-actions .btn-icon-mobile:nth-child(2) svg.icon,
          .mobile-actions .btn-icon-mobile:nth-child(3) .icon,
          .mobile-actions .btn-icon-mobile:nth-child(4) svg.icon {
            width: 1.75rem;
            height: 1.75rem;
          }

          .mobile-actions .btn-icon-mobile:nth-child(3) span.icon {
            font-size: 1.5rem;
          }

          .mobile-actions .btn-icon-mobile--water {
            font-size: var(--text-xs);
            padding: 0;
            flex-direction: column;
            gap: 2px;
          }

          .mobile-actions .btn-icon-mobile-label {
            font-size: 10px;
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
          }

          .dashboard-layout-mobile .mobile-actions {
            margin-top: var(--space-1);
          }

          .dashboard-layout-mobile .food-log-section {
            margin-top: var(--space-1);
          }

          .modal--food-logger {
            min-height: 75vh;
            max-height: 92vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
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
            align-self: flex-start;
            margin-top: 0;
            padding-top: 0;
            padding-bottom: var(--space-2);
            max-height: calc(100vh - var(--space-3));
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .modal-backdrop:has(.modal--food-logger) {
            padding-top: max(var(--space-2), env(safe-area-inset-top, 0px));
            align-items: flex-start;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
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
            padding: max(var(--space-2), env(safe-area-inset-top, 0px)) var(--space-3) var(--space-3);
            align-items: flex-start;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
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

          .modal-backdrop:has(.modal--food-chatbot) {
            padding-top: max(var(--space-2), env(safe-area-inset-top, 0px));
            align-items: flex-start;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .modal--food-chatbot {
            margin-top: var(--space-1);
            max-height: min(90vh, 100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) !important;
          }

          .modal--food-creator {
            max-width: 100% !important;
          }

          .modal-backdrop--meal-creator {
            padding: max(var(--space-2), env(safe-area-inset-top, 0px)) var(--space-2) var(--space-2);
            align-items: flex-start;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .modal--meal-creator {
            max-width: 100%;
            width: 100%;
            max-height: min(92vh, 100dvh);
            overflow-y: auto;
            margin-top: 0;
            box-sizing: border-box;
          }

          .modal .card,
          .food-logging-dashboard .modal [class*="card"] {
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

        .modal--food-chatbot {
          max-width: min(380px, 92vw);
          width: 100%;
          height: 100%;
          max-height: 90vh;
          box-sizing: border-box;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal--food-chatbot .food-chatbot {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          width: 100%;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-primary);
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .modal--food-chatbot .chatbot-layout {
          grid-template-columns: 1fr;
          max-width: 100%;
          width: 100%;
          flex: 1;
          min-width: 0;
          box-sizing: border-box;
          background: var(--bg-secondary);
        }

        .modal--food-chatbot .form-input,
        .modal--food-chatbot .chatbot-textarea,
        .modal--food-chatbot .input-with-voice {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .modal--food-chatbot .btn-voice-logger,
        .modal--food-chatbot .btn-primary,
        .modal--food-chatbot .btn-secondary {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .modal--food-chatbot .chatbot-layout,
        .modal--food-chatbot .preview-section,
        .modal--food-chatbot .preview-foods-list {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 768px) {
          .modal {
            max-width: 90vw;
            max-height: 90vh;
          }
          .modal--food-chatbot {
            max-width: min(380px, 92vw);
          }
        }
      `}</style>
    </div>
  );
};

export default FoodLoggingDashboard;
