import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line } from 'recharts';
import { XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

const WorkoutAnalytics = ({ workout, isOpen, onClose }) => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const loadWorkoutLogs = useCallback(async () => {
    if (!workout) return;
    
    try {
      setLoading(true);
      const workoutId = workout.workouts_id || workout.workout_id;
      
      // Calculate date range
      let endDate = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case '1month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '6months':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case 'alltime':
          startDate = new Date(0); // Beginning of time
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
          }
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 6);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch all logs for this workout
      const response = await api.get(`/workouts/logs/?date_from=${startDateStr}&date_to=${endDateStr}`);
      
      if (response.data.success) {
        const allLogs = response.data.data || [];
        // Filter logs for this specific workout
        const filteredLogs = allLogs.filter(log => {
          const logWorkoutId = log.workout?.workouts_id || log.workout?.workout_id || log.workout_id;
          return logWorkoutId === workoutId;
        });
        
        // Sort by date
        filteredLogs.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
        setWorkoutLogs(filteredLogs);
      }
    } catch (error) {
      console.error('Failed to load workout logs:', error);
    } finally {
      setLoading(false);
    }
  }, [workout, dateRange, customStartDate, customEndDate]);

  useEffect(() => {
    if (isOpen && workout) {
      loadWorkoutLogs();
    }
  }, [isOpen, workout, loadWorkoutLogs]);

  // Calculate time since last logged
  const timeSinceLastLogged = useMemo(() => {
    if (!workoutLogs.length) return null;
    
    const lastLog = workoutLogs[workoutLogs.length - 1];
    const lastDate = new Date(lastLog.date_time);
    const now = new Date();
    const diffMs = now - lastDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
  }, [workoutLogs]);

  // Calculate difference between first and most recent
  const timeDifference = useMemo(() => {
    if (workoutLogs.length < 2) return null;
    
    const firstDate = new Date(workoutLogs[0].date_time);
    const lastDate = new Date(workoutLogs[workoutLogs.length - 1].date_time);
    const diffMs = lastDate - firstDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffYears > 0) {
      return `${diffYears} year${diffYears !== 1 ? 's' : ''}, ${diffMonths % 12} month${(diffMonths % 12) !== 1 ? 's' : ''}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}, ${diffDays % 30} day${(diffDays % 30) !== 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
  }, [workoutLogs]);

  // Prepare graph data - group by date
  const graphData = useMemo(() => {
    if (!workoutLogs.length) return [];
    
    const groupedByDate = {};
    
    workoutLogs.forEach(log => {
      const date = new Date(log.date_time).toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          date,
          weights: [],
          count: 0
        };
      }
      const weight = parseFloat(log.weight || 0);
      if (weight > 0) {
        groupedByDate[date].weights.push(weight);
      }
      groupedByDate[date].count += 1;
    });
    
    // Convert to array and calculate averages and maxes
    return Object.values(groupedByDate)
      .map(day => ({
        date: day.date,
        avgWeight: day.weights.length > 0 
          ? Number((day.weights.reduce((a, b) => a + b, 0) / day.weights.length).toFixed(1))
          : 0,
        maxWeight: day.weights.length > 0 ? Math.max(...day.weights) : 0,
        count: day.count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [workoutLogs]);

  if (!isOpen) return null;

  const workoutName = workout?.workout_name || 'Workout';

  return (
    <div className="analytics-modal-overlay" onClick={onClose}>
      <div className="analytics-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="analytics-modal-header">
          <div className="analytics-modal-title">
            <ChartBarIcon className="analytics-icon" />
            <span>{workoutName} Analytics</span>
          </div>
          <button className="analytics-close-button" onClick={onClose}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="analytics-modal-body">
          {loading ? (
            <div className="analytics-loading">Loading analytics...</div>
          ) : (
            <>
              {/* Time Information */}
              <div className="analytics-info-section">
                <div className="analytics-info-item">
                  <span className="analytics-info-label">Last Logged:</span>
                  <span className="analytics-info-value">
                    {timeSinceLastLogged || 'Never'}
                  </span>
                </div>
                {timeDifference && (
                  <div className="analytics-info-item">
                    <span className="analytics-info-label">Time Span:</span>
                    <span className="analytics-info-value">{timeDifference}</span>
                  </div>
                )}
              </div>

              {/* Date Range Selector */}
              <div className="analytics-date-range-section">
                <label className="analytics-date-range-label">Date Range:</label>
                <div className="analytics-date-range-controls">
                  <select
                    className="analytics-date-range-select"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="1month">1 Month</option>
                    <option value="6months">6 Months</option>
                    <option value="1year">1 Year</option>
                    <option value="alltime">All Time</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  
                  {dateRange === 'custom' && (
                    <div className="analytics-custom-date-inputs">
                      <input
                        type="date"
                        className="analytics-date-input"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        placeholder="Start Date"
                      />
                      <span className="analytics-date-separator">to</span>
                      <input
                        type="date"
                        className="analytics-date-input"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        placeholder="End Date"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Graph */}
              {graphData.length > 0 ? (
                <div className="analytics-graph-section">
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis 
                        yAxisId="weight"
                        label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="count"
                        orientation="right"
                        label={{ value: 'Times Logged', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'count') return [value, 'Times Logged'];
                          if (name === 'avgWeight') return [`${value} lbs`, 'Avg Weight'];
                          if (name === 'maxWeight') return [`${value} lbs`, 'Max Weight'];
                          return value;
                        }}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return date.toLocaleDateString();
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="weight"
                        type="monotone" 
                        dataKey="avgWeight" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Avg Weight"
                        dot={{ r: 4 }}
                      />
                      <Line 
                        yAxisId="weight"
                        type="monotone" 
                        dataKey="maxWeight" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Max Weight"
                        dot={{ r: 4 }}
                      />
                      <Bar 
                        yAxisId="count"
                        dataKey="count" 
                        fill="#22c55e"
                        name="Times Logged"
                        opacity={0.6}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="analytics-no-data">
                  No workout data available for the selected date range.
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <style>{`
        .analytics-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: var(--space-4);
        }

        .analytics-modal-content {
          background: var(--bg-primary);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          max-width: 1200px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .analytics-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-6);
          border-bottom: 2px solid var(--border-primary);
          background: var(--bg-secondary);
        }

        .analytics-modal-title {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .analytics-icon {
          width: 28px;
          height: 28px;
          color: var(--accent-primary);
        }

        .analytics-close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          transition: color 0.3s ease;
          padding: var(--space-2);
          border-radius: var(--radius-md);
        }

        .analytics-close-button:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .analytics-modal-body {
          padding: var(--space-6);
          overflow-y: auto;
          flex: 1;
        }

        .analytics-loading {
          text-align: center;
          padding: var(--space-8);
          color: var(--text-secondary);
        }

        .analytics-info-section {
          display: flex;
          gap: var(--space-6);
          margin-bottom: var(--space-6);
          padding: var(--space-4);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .analytics-info-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .analytics-info-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .analytics-info-value {
          font-size: var(--text-lg);
          color: var(--text-primary);
          font-weight: var(--font-weight-bold);
        }

        .analytics-date-range-section {
          margin-bottom: var(--space-6);
        }

        .analytics-date-range-label {
          display: block;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .analytics-date-range-controls {
          display: flex;
          gap: var(--space-4);
          align-items: center;
          flex-wrap: wrap;
        }

        .analytics-date-range-select {
          padding: var(--space-3) var(--space-4);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
        }

        .analytics-custom-date-inputs {
          display: flex;
          gap: var(--space-2);
          align-items: center;
        }

        .analytics-date-input {
          padding: var(--space-3) var(--space-4);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--text-sm);
        }

        .analytics-date-separator {
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }

        .analytics-graph-section {
          margin-top: var(--space-6);
        }

        .analytics-no-data {
          text-align: center;
          padding: var(--space-8);
          color: var(--text-secondary);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default WorkoutAnalytics;

