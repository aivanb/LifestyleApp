import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line } from 'recharts';
import { XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { WORKOUT_TRACKER_CLOSE_BTN_CSS } from '../constants/workoutTrackerCloseButtonCss';

const WorkoutAnalytics = ({ workout, isOpen, onClose }) => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  // eslint-disable-next-line no-unused-vars -- isMobile used in JSX (chart height, margins, tick fontSize, class)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Get all workout logs to determine date range - optimized with workout_id filter
  const getAllWorkoutLogs = useCallback(async () => {
    if (!workout) return { minDate: null, maxDate: null };
    
    try {
      const workoutId = workout.workouts_id || workout.workout_id;
      // Use workout_id filter on backend instead of fetching all logs
      const response = await api.get(`/workouts/logs/?workout_id=${workoutId}&date_from=1970-01-01&date_to=2099-12-31`);
      
      if (response.data.success) {
        const filteredLogs = response.data.data || [];
        
        if (filteredLogs.length === 0) return { minDate: null, maxDate: null };
        
        const dates = filteredLogs.map(log => new Date(log.date_time));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        return { minDate, maxDate };
      }
    } catch (error) {
      console.error('Failed to get date range:', error);
    }
    return { minDate: null, maxDate: null };
  }, [workout]);

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
          } else {
            // If custom but dates not set, use all time range
            startDate = new Date(0);
            endDate = new Date();
          }
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 6);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch logs for this specific workout using workout_id filter on backend
      const response = await api.get(`/workouts/logs/?workout_id=${workoutId}&date_from=${startDateStr}&date_to=${endDateStr}`);
      
      if (response.data.success) {
        const filteredLogs = response.data.data || [];
        
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

  // Set default custom date range when switching to custom
  useEffect(() => {
    if (dateRange === 'custom' && !customStartDate && !customEndDate) {
      getAllWorkoutLogs().then(({ minDate, maxDate }) => {
        if (minDate && maxDate) {
          setCustomStartDate(minDate.toISOString().split('T')[0]);
          setCustomEndDate(maxDate.toISOString().split('T')[0]);
        }
      });
    }
  }, [dateRange, customStartDate, customEndDate, getAllWorkoutLogs]);

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

  // Calculate weight difference (first to last)
  const weightDifference = useMemo(() => {
    if (!workoutLogs.length) return null;
    
    const logsWithWeight = workoutLogs
      .map(log => ({
        weight: parseFloat(log.weight || 0),
        date: new Date(log.date_time)
      }))
      .filter(log => log.weight > 0)
      .sort((a, b) => a.date - b.date); // Sort by date ascending
    
    if (logsWithWeight.length < 2) return null;
    
    const firstWeight = logsWithWeight[0].weight;
    const lastWeight = logsWithWeight[logsWithWeight.length - 1].weight;
    const difference = lastWeight - firstWeight;
    
    return {
      firstWeight,
      lastWeight,
      difference,
      isPositive: difference >= 0
    };
  }, [workoutLogs]);

  const lastWeightAndReps = useMemo(() => {
    if (!workoutLogs.length) return null;
    const lastLog = workoutLogs[workoutLogs.length - 1];
    const lastWeight = parseFloat(lastLog.weight || 0);
    const lastReps = parseInt(lastLog.reps, 10);

    return {
      lastWeight: Number.isFinite(lastWeight) && lastWeight > 0 ? lastWeight : null,
      lastReps: Number.isFinite(lastReps) && lastReps > 0 ? lastReps : null,
    };
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

  if (!isOpen || typeof document === 'undefined') return null;

  const workoutName = workout?.workout_name || 'Workout';

  const modalTree = (
    <div className="analytics-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="analytics-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-modal-title"
      >
        <div className="analytics-modal-header">
          <div className="analytics-modal-title" id="analytics-modal-title">
            <ChartBarIcon className="analytics-icon" />
            <span>{workoutName} Analytics</span>
          </div>
          <button type="button" className="wk-track-close-btn analytics-close-button--in-content" onClick={onClose} aria-label="Close analytics">
            <XMarkIcon className="wk-track-close-icon" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="analytics-modal-body">
          {loading ? (
            <div className="analytics-loading">Loading analytics...</div>
          ) : (
            <>
              {/* Time Information */}
              <div className={`analytics-info-section${isMobile ? ' analytics-info-section--mobile' : ''}`}>
                {isMobile ? (
                  <>
                    <div className={`analytics-info-row${!weightDifference ? ' analytics-info-row--single' : ''}`}>
                      <div className="analytics-info-item">
                        <span className="analytics-info-label">Last Logged:</span>
                        <span className="analytics-info-value">
                          {timeSinceLastLogged || 'Never'}
                        </span>
                      </div>
                      {weightDifference ? (
                        <div className="analytics-info-item">
                          <span className="analytics-info-label">Weight Change:</span>
                          <span
                            className={`analytics-info-value analytics-weight-difference ${weightDifference.isPositive ? 'positive' : 'negative'}`}
                          >
                            {weightDifference.isPositive ? '+' : ''}{weightDifference.difference.toFixed(1)} lbs
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <div className="analytics-info-row">
                      <div className="analytics-info-item">
                        <span className="analytics-info-label">Last Weight:</span>
                        <span className="analytics-info-value">
                          {lastWeightAndReps?.lastWeight != null
                            ? `${lastWeightAndReps.lastWeight.toFixed(1)} lbs`
                            : '—'}
                        </span>
                      </div>
                      <div className="analytics-info-item">
                        <span className="analytics-info-label">Last Reps:</span>
                        <span className="analytics-info-value">
                          {lastWeightAndReps?.lastReps != null ? `${lastWeightAndReps.lastReps}` : '—'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="analytics-info-item">
                      <span className="analytics-info-label">Last Logged:</span>
                      <span className="analytics-info-value">
                        {timeSinceLastLogged || 'Never'}
                      </span>
                    </div>
                    <div className="analytics-info-item">
                      <span className="analytics-info-label">Last Weight:</span>
                      <span className="analytics-info-value">
                        {lastWeightAndReps?.lastWeight != null
                          ? `${lastWeightAndReps.lastWeight.toFixed(1)} lbs`
                          : '—'}
                      </span>
                    </div>
                    <div className="analytics-info-item">
                      <span className="analytics-info-label">Last Reps:</span>
                      <span className="analytics-info-value">
                        {lastWeightAndReps?.lastReps != null ? `${lastWeightAndReps.lastReps}` : '—'}
                      </span>
                    </div>
                    {weightDifference && (
                      <div className="analytics-info-item">
                        <span className="analytics-info-label">Weight Change:</span>
                        <span
                          className={`analytics-info-value analytics-weight-difference ${weightDifference.isPositive ? 'positive' : 'negative'}`}
                        >
                          {weightDifference.isPositive ? '+' : ''}{weightDifference.difference.toFixed(1)} lbs
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Date Range Selector */}
              <div className="analytics-date-range-section">
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
                <div className={`analytics-graph-section ${isMobile ? 'analytics-graph-section--mobile' : ''}`}>
                  <div
                    className="analytics-graph-chart-host"
                    tabIndex={-1}
                    style={
                      isMobile
                        ? { width: '100%', height: 300, minHeight: 300, flexShrink: 0 }
                        : { width: '100%', height: 420, minHeight: 420, flexShrink: 0 }
                    }
                  >
                    <ResponsiveContainer width="100%" height={isMobile ? '100%' : 420} debounce={80}>
                    <ComposedChart
                      data={graphData}
                      margin={
                        isMobile
                          ? { top: 8, right: 2, left: 2, bottom: 48 }
                          : { top: 16, right: 24, left: 16, bottom: 96 }
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        angle={-55}
                        textAnchor="end"
                        interval="preserveStartEnd"
                        tick={{
                          fontSize: isMobile ? 9 : 11,
                          fill: 'var(--text-tertiary)',
                        }}
                        height={isMobile ? 44 : 48}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis
                        yAxisId="weight"
                        width={isMobile ? 30 : 52}
                        tick={{
                          fontSize: isMobile ? 9 : 11,
                          fill: 'var(--text-tertiary)',
                          angle: -90,
                          textAnchor: 'middle',
                          dx: isMobile ? -2 : -6,
                        }}
                        tickMargin={isMobile ? 4 : 8}
                        label={!isMobile ? { value: 'Weight (lbs)', angle: -90, position: 'insideLeft', offset: 8, style: { fill: 'var(--text-secondary)', fontSize: 12 } } : undefined}
                      />
                      <YAxis
                        yAxisId="count"
                        orientation="right"
                        width={isMobile ? 28 : 52}
                        tick={{
                          fontSize: isMobile ? 9 : 11,
                          fill: 'var(--text-tertiary)',
                          angle: 90,
                          textAnchor: 'middle',
                          dx: isMobile ? 2 : 6,
                        }}
                        tickMargin={isMobile ? 4 : 8}
                        label={!isMobile ? { value: 'Times Logged', angle: 90, position: 'insideRight', offset: 8, style: { fill: 'var(--text-secondary)', fontSize: 12 } } : undefined}
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
                      <Legend
                        verticalAlign={isMobile ? 'bottom' : 'bottom'}
                        align="center"
                        wrapperStyle={{
                          fontSize: isMobile ? '14px' : '13px',
                          paddingTop: isMobile ? 6 : 10,
                          paddingBottom: isMobile ? 0 : 4,
                          lineHeight: 1.35,
                          width: '100%',
                        }}
                        iconSize={isMobile ? 12 : 12}
                      />
                      <Line 
                        yAxisId="weight"
                        type="monotone" 
                        dataKey="avgWeight" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        name="Avg Weight"
                        dot={{ r: 4 }}
                      />
                      <Line 
                        yAxisId="weight"
                        type="monotone" 
                        dataKey="maxWeight" 
                        stroke="#dc2626" 
                        strokeWidth={3}
                        name="Max Weight"
                        dot={{ r: 4 }}
                      />
                      <Bar 
                        yAxisId="count"
                        dataKey="count" 
                        fill="#166534"
                        name="Times Logged"
                        opacity={0.4}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  </div>
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
    </div>
  );

  return createPortal(
    <>
      {modalTree}
      <style>{`${WORKOUT_TRACKER_CLOSE_BTN_CSS}
        .analytics-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.82);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: var(--space-4);
          box-sizing: border-box;
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
          min-height: 0;
          position: relative;
          z-index: 1;
        }

        .analytics-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-6);
          border-bottom: 1px solid var(--border-primary);
          background: transparent;
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

        .analytics-close-button--in-content {
          flex-shrink: 0;
        }

        .analytics-close-button--in-content:hover {
          transform: none;
        }

        .analytics-modal-body {
          padding: var(--space-6);
          overflow-y: auto;
          flex: 1 1 auto;
          min-height: 0;
        }

        .analytics-graph-chart-host {
          width: 100%;
          height: 420px;
          min-height: 420px;
          box-sizing: border-box;
          user-select: none;
          -webkit-user-select: none;
          outline: none !important;
        }

        .analytics-graph-chart-host * {
          user-select: none;
          -webkit-user-select: none;
        }

        .analytics-graph-chart-host:focus,
        .analytics-graph-chart-host:focus-visible,
        .analytics-graph-chart-host .recharts-wrapper,
        .analytics-graph-chart-host .recharts-wrapper:focus,
        .analytics-graph-chart-host .recharts-surface,
        .analytics-graph-chart-host .recharts-surface:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        .analytics-loading {
          text-align: center;
          padding: var(--space-8);
          color: var(--text-secondary);
        }

        .analytics-info-section {
          display: flex;
          gap: 0;
          margin-bottom: var(--space-6);
          padding: 0;
          align-items: stretch;
        }

        .analytics-info-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .analytics-info-item:not(:last-child) {
          border-right: 3px solid rgba(255, 255, 255, 0.38);
          padding-right: var(--space-6);
          margin-right: var(--space-6);
        }

        [data-theme='light'] .analytics-info-item:not(:last-child) {
          border-right: 3px solid #e2e8f0;
        }

        .analytics-info-section.analytics-info-section--mobile {
          flex-direction: column;
          align-items: stretch;
          gap: var(--space-4);
        }

        .analytics-info-section--mobile .analytics-info-row {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          gap: 0;
          width: 100%;
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }

        .analytics-info-section--mobile .analytics-info-row .analytics-info-item {
          flex: 1;
          min-width: 0;
          border-right: none;
          padding-right: var(--space-3);
          margin-right: var(--space-3);
        }

        .analytics-info-section--mobile .analytics-info-row .analytics-info-item:last-child {
          border-right: none;
          padding-right: 0;
          margin-right: 0;
        }

        .analytics-info-row--single .analytics-info-item {
          flex: 1 1 100%;
          max-width: 100%;
          border-right: none;
          padding-right: 0;
          margin-right: 0;
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

        .analytics-weight-difference.positive {
          color: #22c55e;
        }

        .analytics-weight-difference.negative {
          color: #ef4444;
        }

        .analytics-date-range-section {
          margin-bottom: var(--space-6);
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }

        .analytics-date-range-controls {
          display: flex;
          gap: var(--space-4);
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
          width: 100%;
        }

        .analytics-date-range-select {
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          line-height: 1.4;
        }

        .analytics-date-range-select option {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        [data-theme='dark'] .analytics-date-range-select {
          color-scheme: dark;
        }

        [data-theme='light'] .analytics-date-range-select {
          color-scheme: light;
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

        .analytics-graph-section--mobile {
          margin: var(--space-2) 0;
          padding: 0;
          width: 100%;
          margin-left: 0;
          margin-right: 0;
        }

        @media (max-width: 768px) {
          .analytics-modal-overlay {
            padding: max(var(--space-4), env(safe-area-inset-top, 0px)) var(--space-4) max(var(--space-4), env(safe-area-inset-bottom, 0px));
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.82);
            min-height: 100vh;
            min-height: 100dvh;
            box-sizing: border-box;
          }

          .analytics-modal-content {
            width: 100%;
            max-width: 100%;
            max-height: min(92dvh, calc(100dvh - 2 * var(--space-4) - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)));
            height: auto;
            flex: 0 1 auto;
            min-height: 0;
            border-radius: var(--radius-lg);
            border: 2px solid rgba(255, 255, 255, 0.14);
            box-shadow: var(--shadow-xl);
            overflow-x: hidden;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
          }

          [data-theme='light'] .analytics-modal-content {
            border-color: rgba(15, 23, 42, 0.14);
          }

          .analytics-modal-header {
            padding: var(--space-4) var(--space-3);
            flex-shrink: 0;
          }

          .analytics-modal-body {
            padding: var(--space-4) var(--space-3);
            flex: 1 1 auto;
            min-height: 0;
            display: flex;
            flex-direction: column;
            overflow: visible;
            -webkit-overflow-scrolling: touch;
          }

          .analytics-info-section,
          .analytics-date-range-section {
            padding-left: 0;
            padding-right: 0;
            flex-shrink: 0;
          }

          .analytics-info-section:not(.analytics-info-section--mobile) {
            flex-direction: column;
            gap: 0;
          }

          .analytics-info-section:not(.analytics-info-section--mobile) .analytics-info-item:not(:last-child) {
            border-right: none;
            padding-right: 0;
            margin-right: 0;
            border-bottom: 1px solid var(--border-primary);
            padding-bottom: var(--space-3);
            margin-bottom: var(--space-3);
          }

          .analytics-graph-section--mobile {
            margin: var(--space-3) calc(-1 * var(--space-3)) 0;
            width: calc(100% + 2 * var(--space-3));
            max-width: none;
            flex: 0 0 auto;
            overflow: visible;
            min-height: 300px;
          }

          .analytics-graph-section--mobile .analytics-graph-chart-host {
            height: 300px;
            min-height: 300px;
            width: 100%;
            flex-shrink: 0;
            position: relative;
            overflow: hidden;
          }

          .analytics-graph-section--mobile .recharts-responsive-container {
            width: 100% !important;
            height: 100% !important;
            min-height: 300px !important;
          }

          .analytics-no-data,
          .analytics-loading {
            padding-left: 0;
            padding-right: 0;
          }
        }

        .analytics-no-data {
          text-align: center;
          padding: var(--space-8);
          color: var(--text-secondary);
          font-style: italic;
        }
      `}</style>
    </>,
    document.body
  );
};

export default WorkoutAnalytics;

