import React, { useState, useEffect, useCallback } from 'react';
import { BeakerIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { ExpandedProgressView, ProgressGrid } from './ProgressBar';
import FoodLogger from './FoodLogger';
import FoodCreator from './FoodCreator';
import MealCreator from './MealCreator';
import FoodChatbot from './FoodChatbot';

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
  const [waterFormData, setWaterFormData] = useState({ amount: '', unit: 'oz' });
  const [submittingWater, setSubmittingWater] = useState(false);
  const [showExpandedProgress, setShowExpandedProgress] = useState(false); // Default to condensed view
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');
  const [logStreak, setLogStreak] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [sortOrder] = useState('descending'); // 'ascending' or 'descending'
  const [editingTime, setEditingTime] = useState(null);

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
      
      await api.createWaterLog(logData);
      setWaterFormData({ amount: '', unit: 'oz' });
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
      // Parse the new time and create a new datetime
      const [hours, minutes] = newTime.split(':');
      const logDate = new Date(selectedDate);
      logDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
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

            {/* Center - Title and Streak */}
            <div className="header-center">
              <div className="header-title">
                <div className="streak-counter">
                  <span className="streak-number">{logStreak}</span>
                  <span className="streak-label">Day Streak</span>
                </div>
              </div>
            </div>
            
            {/* Right side - Action Buttons */}
            <div className="header-actions">
              <button
                className="btn-primary-header"
                onClick={() => setShowFoodCreator(true)}
                title="Create Food"
              >
                <span className="icon icon-lg">🍽️</span>
                <span>Create Food</span>
              </button>
              
              <button
                className="btn-primary-header"
                onClick={() => setShowMealCreator(true)}
                title="Create Meal"
              >
                <span className="icon icon-lg">🍴</span>
                <span>Create Meal</span>
              </button>
              
              <button
                className="btn-primary-header"
                onClick={() => setShowFoodChatbot(true)}
                title="AI Logger"
              >
                <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span>AI Logger</span>
              </button>

              <button
                className="btn-primary-header"
                onClick={() => setShowWaterLogger(true)}
                title="Log Water"
              >
                <BeakerIcon className="icon icon-lg" style={{ width: '20px', height: '20px' }} />
                <span>Water</span>
              </button>
            </div>
          </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* PC Layout */}
        {!isMobile && (
          <div className="dashboard-layout-pc">
            {/* Left Column - Progress & Food List */}
            <div className="dashboard-left">
              {/* Goal Progress */}
              <div className="goal-progress-section card">
                {showExpandedProgress ? (
                  <ExpandedProgressView
                    goals={goals}
                    consumed={consumed}
                    onClose={() => setShowExpandedProgress(false)}
                  />
                ) : (
                  <>
                    <ProgressGrid
                      goals={goals}
                      consumed={consumed}
                    />
                    <div className="view-all-button">
                      <button 
                        className="btn-primary"
                        onClick={() => setShowExpandedProgress(true)}
                      >
                        View All
                      </button>
                    </div>
                  </>
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
                            <div className="food-log-item">
                              <div className="food-info">
                                <div className="food-icon">
                                  {getFoodGroupIcon(log.food_details?.food_group)}
                                </div>
                                <div className="food-details">
                                  <div className="food-name">{log.food_name}</div>
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
                              <div className="food-macros">
                                <div className="macro-item">
                                  <span className="macro-value">{Math.round(log.consumed_macros?.calories || 0)}</span>
                                  <span className="macro-label">CAL</span>
                                </div>
                                <div className="macro-item">
                                  <span className="macro-value">{Math.round(log.consumed_macros?.protein || 0)}</span>
                                  <span className="macro-label">PRO</span>
                                </div>
                                <div className="macro-item">
                                  <span className="macro-value">{Math.round(log.consumed_macros?.carbohydrates || 0)}</span>
                                  <span className="macro-label">CAR</span>
                                </div>
                                <div className="macro-item">
                                  <span className="macro-value">{Math.round(log.consumed_macros?.fat || 0)}</span>
                                  <span className="macro-label">FAT</span>
                                </div>
                                <div className="macro-item">
                                  <span className="macro-value">{log.servings}</span>
                                  <span className="macro-label">SER</span>
                                </div>
                              </div>
                              <div className="food-actions">
                                <button
                                  className="btn-icon-delete"
                                  onClick={() => deleteFoodLog(log.macro_log_id)}
                                  title="Remove from log"
                                >
                                  <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
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
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <div className="dashboard-layout-mobile">
            {/* Goal Progress */}
            <div className="goal-progress-section card">
              {showExpandedProgress ? (
                <ExpandedProgressView
                  goals={goals}
                  consumed={consumed}
                  onClose={() => setShowExpandedProgress(false)}
                />
              ) : (
                <>
                  <ProgressGrid
                    goals={goals}
                    consumed={consumed}
                  />
                  <div className="view-all-button">
                    <button 
                      className="btn-primary"
                      onClick={() => setShowExpandedProgress(true)}
                    >
                      View All
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mobile-actions">
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
                className="btn-icon-mobile"
                onClick={() => setShowFoodCreator(true)}
                title="Create Food"
              >
                <span className="icon icon-lg">🍽️</span>
              </button>
              
              <button
                className="btn-icon-mobile"
                onClick={() => setShowMealCreator(true)}
                title="Create Meal"
              >
                <span className="icon icon-lg">🍴</span>
              </button>
              
              <button
                className="btn-icon-mobile"
                onClick={() => setShowFoodChatbot(true)}
                title="AI Logger"
              >
                <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </button>

              <button
                className="btn-icon-mobile"
                onClick={() => setShowWaterLogger(true)}
                title="Log Water"
              >
                <BeakerIcon style={{ width: '24px', height: '24px' }} />
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
                            <div className="food-info">
                              <div className="food-icon">
                                {getFoodGroupIcon(log.food_details?.food_group)}
                              </div>
                              <div className="food-details">
                                <div className="food-name">{log.food_name}</div>
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
                            <div className="food-macros">
                              <div className="macro-item">
                                <span className="macro-value">{Math.round(log.consumed_macros?.calories || 0)}</span>
                                <span className="macro-label">CAL</span>
                              </div>
                              <div className="macro-item">
                                <span className="macro-value">{Math.round(log.consumed_macros?.protein || 0)}</span>
                                <span className="macro-label">PRO</span>
                              </div>
                              <div className="macro-item">
                                <span className="macro-value">{Math.round(log.consumed_macros?.carbohydrates || 0)}</span>
                                <span className="macro-label">CAR</span>
                              </div>
                              <div className="macro-item">
                                <span className="macro-value">{Math.round(log.consumed_macros?.fat || 0)}</span>
                                <span className="macro-label">FAT</span>
                              </div>
                              <div className="macro-item">
                                <span className="macro-value">{log.servings}</span>
                                <span className="macro-label">SER</span>
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
        )}
      </div>

      {/* Modals for Mobile */}
      {isMobile && (
        <>
          {showFoodLogger && (
            <div className="modal-backdrop" onClick={() => setShowFoodLogger(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
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
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <FoodCreator
                  onFoodCreated={handleFoodCreated}
                  onClose={() => setShowFoodCreator(false)}
                />
              </div>
            </div>
          )}

          {showMealCreator && (
            <div className="modal-backdrop" onClick={() => setShowMealCreator(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <MealCreator
                  onMealCreated={handleMealCreated}
                  onClose={() => setShowMealCreator(false)}
                />
              </div>
            </div>
          )}

          {showFoodChatbot && (
            <div className="modal-backdrop" onClick={() => setShowFoodChatbot(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <FoodChatbot
                  onFoodsLogged={handleFoodsLogged}
                  onClose={() => setShowFoodChatbot(false)}
                />
              </div>
            </div>
          )}

          {showWaterLogger && (
            <div className="modal-backdrop" onClick={() => setShowWaterLogger(false)}>
              <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ padding: 'var(--space-6)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                      Log Water
                    </h2>
                    <button
                      onClick={() => setShowWaterLogger(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', transition: 'background 0.2s ease' }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      <XMarkIcon style={{ width: '24px', height: '24px' }} />
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
                    
                    <div style={{ marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
                        onMouseEnter={(e) => {
                          if (!submittingWater) {
                            e.target.style.filter = 'brightness(1.1)';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = 'var(--shadow-md)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!submittingWater) {
                            e.target.style.filter = 'none';
                            e.target.style.transform = 'none';
                            e.target.style.boxShadow = 'var(--shadow-sm)';
                          }
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
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <FoodCreator
                  onFoodCreated={handleFoodCreated}
                  onClose={() => setShowFoodCreator(false)}
                />
              </div>
            </div>
          )}

          {showMealCreator && (
            <div className="modal-backdrop" onClick={() => setShowMealCreator(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <MealCreator
                  onMealCreated={handleMealCreated}
                  onClose={() => setShowMealCreator(false)}
                />
              </div>
            </div>
          )}

          {showFoodChatbot && (
            <div className="modal-backdrop" onClick={() => setShowFoodChatbot(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <FoodChatbot
                  onFoodsLogged={handleFoodsLogged}
                  onClose={() => setShowFoodChatbot(false)}
                />
              </div>
            </div>
          )}

          {showWaterLogger && (
            <div className="modal-backdrop" onClick={() => setShowWaterLogger(false)}>
              <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ padding: 'var(--space-6)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                    <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                      Log Water
                    </h2>
                    <button
                      onClick={() => setShowWaterLogger(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', transition: 'background 0.2s ease' }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      <XMarkIcon style={{ width: '24px', height: '24px' }} />
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
                    
                    <div style={{ marginBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
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
                        onMouseEnter={(e) => {
                          if (!submittingWater) {
                            e.target.style.filter = 'brightness(1.1)';
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = 'var(--shadow-md)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!submittingWater) {
                            e.target.style.filter = 'none';
                            e.target.style.transform = 'none';
                            e.target.style.boxShadow = 'var(--shadow-sm)';
                          }
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

      <style>{`
        .food-logging-dashboard {
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

        .header-title h1 {
          margin: 0;
          font-size: var(--text-3xl);
          font-weight: var(--font-weight-bold);
        }

        .streak-counter {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--bg-tertiary);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-primary);
        }

        .streak-number {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--accent-primary);
        }

        .streak-label {
          font-size: var(--text-sm);
          color: orange;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .header-actions {
          display: flex;
          gap: var(--space-2);
        }

        .btn-primary-header {
          padding: var(--space-3) var(--space-6);
          border: 1px solid #2C4A73;
          border-radius: var(--radius-md);
          background: #2C4A73;
          color: white;
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: var(--shadow-sm);
          font-family: var(--font-primary);
        }

        .btn-primary-header:hover {
          background: #1A3A5A;
          border-color: #1A3A5A;
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
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          font-size: var(--text-sm);
          color: var(--text-primary);
          transition: all 0.2s var(--ease-out-cubic);
          font-family: var(--font-primary);
          min-width: 182px; /* 30% larger than 140px */
          height: 47px; /* 30% larger than 36px */
          font-weight: 500;
          cursor: pointer;
          text-align: center; /* Center the date text */
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .date-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
          background: var(--bg-secondary);
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
          margin-left: 60px;
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
          background: var(--accent-primary);
          color: white;
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
          background: var(--accent-primary);
          color: white;
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


        .dashboard-content {
          width: 100%;
          margin: 0;
          padding: 0 var(--space-4);
        }

        /* PC Layout */
        .dashboard-layout-pc {
          display: grid;
          grid-template-columns: 60% 40%;
          gap: var(--space-6);
          align-items: start;
          width: 100%;
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
          padding-right: var(--space-8);
        }

        /* Mobile Layout */
        .dashboard-layout-mobile {
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
          width: 60px;
          height: 60px;
          padding: 0;
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .btn-icon-mobile:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-color: var(--accent-primary);
          transform: translateY(-2px);
        }

        /* View All Button */
        .view-all-button {
          display: flex;
          justify-content: flex-end;
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--border-primary);
        }

        .view-all-button .btn-primary {
          background: var(--accent-primary);
          border: 1px solid var(--accent-primary);
          color: white;
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-md);
          transition: all 0.2s var(--ease-out-cubic);
          box-shadow: var(--shadow-sm);
          font-family: var(--font-primary);
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .view-all-button .btn-primary:hover {
          background: var(--accent-primary-dark);
          border-color: var(--accent-primary-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        /* Goal Progress */
        .goal-progress-section {
          background: var(--bg-secondary);
        }

        .progress-summary {
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          transition: background 0.2s var(--ease-out-cubic);
        }

        .progress-summary:hover {
          background: var(--bg-tertiary);
        }

        /* Food Log */
        .food-log-section {
          background: var(--bg-secondary);
          padding: var(--space-2);
        }

        .food-log-list {
          max-height: 500px;
          overflow-y: auto;
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

        .food-log-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin-bottom: 8px;
          transition: all 0.2s var(--ease-out-cubic);
        }

        .food-log-item:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .food-log-item.mobile {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .food-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex: 1;
        }

        .food-icon {
          font-size: var(--text-2xl);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .food-details {
          flex: 1;
        }

        .food-name {
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          margin-bottom: var(--space-1);
          font-size: var(--text-base);
        }

        .food-time {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .food-macros {
          display: flex;
          gap: var(--space-3);
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          flex: 1;
          padding: 0;
          margin: 0;
        }

        .macro-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
          text-align: center;
        }

        .macro-value {
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          font-size: var(--text-base);
        }

        .macro-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-weight-medium);
        }

        .food-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-left: var(--space-4);
        }

        .btn-icon-delete {
          width: 36px;
          height: 36px;
          padding: 0;
          border: 1px solid var(--accent-danger);
          border-radius: var(--radius-sm);
          background: var(--accent-danger);
          color: white;
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon-delete:hover {
          background: #dc2626;
          color: white;
          border-color: #dc2626;
          transform: translateY(-1px);
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

export default FoodLoggingDashboard;
