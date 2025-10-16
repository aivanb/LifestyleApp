import React, { useState, useEffect, useCallback } from 'react';
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showFoodLogger, setShowFoodLogger] = useState(false);
  const [showFoodCreator, setShowFoodCreator] = useState(false);
  const [showMealCreator, setShowMealCreator] = useState(false);
  const [showFoodChatbot, setShowFoodChatbot] = useState(false);
  const [showExpandedProgress, setShowExpandedProgress] = useState(true);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');

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

  useEffect(() => {
    loadUserGoals();
    loadDailyProgress();
    loadFoodLogs();
  }, [selectedDate, loadUserGoals, loadDailyProgress, loadFoodLogs]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleFoodLogged = () => {
    loadDailyProgress();
    setShowFoodLogger(false);
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

  const deleteFoodLog = async (logId) => {
    try {
      await api.deleteFoodLog(logId);
      loadFoodLogs();
      loadDailyProgress();
    } catch (err) {
      console.error('Failed to delete food log:', err);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    return icons[foodGroup] || icons.other;
  };

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
            <div className="header-title">
            </div>
            
            {/* Action Buttons */}
            <div className="header-actions">
              <button
                className="btn-icon-header"
                onClick={() => setShowFoodCreator(true)}
                title="Create Food"
              >
                <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Create Food</span>
              </button>
              
              <button
                className="btn-icon-header"
                onClick={() => setShowMealCreator(true)}
                title="Create Meal"
              >
                <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                <span>Create Meal</span>
              </button>
              
              <button
                className="btn-icon-header"
                onClick={() => setShowFoodChatbot(true)}
                title="AI Logger"
              >
                <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span>AI Logger</span>
              </button>
            </div>
            
            {/* Date Selector */}
            <div className="date-selector">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="form-input"
                style={{ width: 'auto' }}
              />
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
                {!showExpandedProgress && (
                  <div className="view-all-button">
                    <button 
                      className="btn-text"
                      onClick={() => setShowExpandedProgress(true)}
                    >
                      View All
                    </button>
                  </div>
                )}

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
                  {foodLogs.length === 0 ? (
                    <div className="empty-state">
                      <svg className="icon icon-xl" viewBox="0 0 20 20" fill="var(--text-tertiary)">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-tertiary">No food logged today</p>
                      <p className="text-sm text-tertiary">Start logging your meals!</p>
                    </div>
                  ) : (
                    <div className="food-log-items">
                      {foodLogs.map((log, index) => {
                        const time = formatTime(log.date_time);
                        const separator = getTimeSeparator(time);
                        const prevLog = index > 0 ? foodLogs[index - 1] : null;
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
                                  {getFoodGroupIcon(log.food_group)}
                                </div>
                                <div className="food-details">
                                  <div className="food-name">{log.food_name}</div>
                                  <div className="food-time">{time}</div>
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
                      })}
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
              />
              
            </div>
          </div>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <div className="dashboard-layout-mobile">
            {/* Goal Progress */}
            <div className="goal-progress-section card">
              {!showExpandedProgress && (
                <div className="view-all-button">
                  <button 
                    className="btn-text"
                    onClick={() => setShowExpandedProgress(true)}
                  >
                    View All
                  </button>
                </div>
              )}
              
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
                <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                className="btn-icon-mobile"
                onClick={() => setShowMealCreator(true)}
                title="Create Meal"
              >
                <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
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
            </div>

            {/* Food Log List */}
            <div className="food-log-section card">

              <div className="food-log-list">
                {foodLogs.length === 0 ? (
                  <div className="empty-state">
                    <svg className="icon icon-xl" viewBox="0 0 20 20" fill="var(--text-tertiary)">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-tertiary">No food logged today</p>
                  </div>
                ) : (
                  <div className="food-log-items">
                    {foodLogs.map((log, index) => {
                      const time = formatTime(log.date_time);
                      const separator = getTimeSeparator(time);
                      const prevLog = index > 0 ? foodLogs[index - 1] : null;
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
                                {getFoodGroupIcon(log.food_group)}
                              </div>
                              <div className="food-details">
                                <div className="food-name">{log.food_name}</div>
                                <div className="food-time">{time}</div>
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
                    })}
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
        </>
      )}

      <style jsx>{`
        .food-logging-dashboard {
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .dashboard-header {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
          padding: var(--space-6) 0;
          width: 100vw;
          margin-left: calc(-50vw + 50%);
          margin-right: calc(-50vw + 50%);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin: 0;
          padding: 0 var(--space-4);
          gap: var(--space-4);
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

        .header-actions {
          display: flex;
          gap: var(--space-2);
        }

        .btn-icon-header {
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-1);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .btn-icon-header:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-color: var(--accent-primary);
        }

        .dashboard-content {
          width: 100vw;
          max-width: none;
          margin: 0;
          padding: var(--space-6) var(--space-6);
          margin-left: calc(-50vw + 50%);
          margin-right: calc(-50vw + 50%);
        }

        /* PC Layout */
        .dashboard-layout-pc {
          display: grid;
          grid-template-columns: 65% 35%;
          gap: var(--space-6);
          align-items: start;
          width: 100%;
        }

        .dashboard-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .dashboard-right {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          position: sticky;
          top: var(--space-6);
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
          margin-bottom: var(--space-2);
        }

        .view-all-button .btn-text {
          background: none;
          border: none;
          color: var(--accent-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .view-all-button .btn-text:hover {
          background: var(--bg-secondary);
          color: var(--accent-primary-dark);
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

        .food-log-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-3);
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
          font-size: var(--text-xl);
          width: 32px;
          height: 32px;
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
        }

        .food-time {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .food-macros {
          display: flex;
          gap: var(--space-2);
          align-items: center;
          flex-wrap: wrap;
        }

        .macro-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
        }

        .macro-value {
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          font-size: var(--text-sm);
        }

        .macro-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .food-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .btn-icon-delete {
          width: 32px;
          height: 32px;
          padding: 0;
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon-delete:hover {
          background: var(--accent-danger-alpha);
          color: var(--accent-danger);
          border-color: var(--accent-danger);
        }

        .food-servings {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          background: var(--bg-secondary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
        }


        @media (max-width: 768px) {
          .dashboard-layout-pc {
            display: none;
          }

          .header-content {
            flex-direction: column;
            gap: var(--space-4);
            align-items: flex-start;
            padding: 0 4px;
          }

          .dashboard-content {
            padding: var(--space-4) 4px;
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
