import React, { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * FoodLogViewer Component
 * 
 * Displays user's food logs with filtering and search capabilities.
 * Features:
 * - View recently logged foods
 * - Search by keyword
 * - Filter by macro ranges
 * - Delete log entries
 * - Display consumed macros
 */
const FoodLogViewer = ({ refreshTrigger }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [recentDays, setRecentDays] = useState('7');
  const [minCalories, setMinCalories] = useState('');
  const [maxCalories, setMaxCalories] = useState('');

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        recent_days: recentDays
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.getFoodLogs(params);
      
      if (response.data.data && response.data.data.logs) {
        let filteredLogs = response.data.data.logs;
        
        // Apply client-side macro filtering
        if (minCalories || maxCalories) {
          filteredLogs = filteredLogs.filter(log => {
            const calories = log.consumed_macros?.calories || 0;
            if (minCalories && calories < parseFloat(minCalories)) return false;
            if (maxCalories && calories > parseFloat(maxCalories)) return false;
            return true;
          });
        }
        
        setLogs(filteredLogs);
        setError('');
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
      setError(err.response?.data?.error?.message || 'Failed to load food logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this log entry?')) {
      return;
    }

    try {
      await api.deleteFoodLog(logId);
      setLogs(logs.filter(log => log.macro_log_id !== logId));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete log');
    }
  };

  const handleApplyFilters = () => {
    loadLogs();
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="food-log-viewer">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <svg className="icon icon-lg" viewBox="0 0 20 20" fill="var(--accent-info)">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          <h2 style={{ margin: 0 }}>Food Log</h2>
        </div>

        {/* Filters */}
        <div className="filters-section mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">
                <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Search
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Search foods or meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Recent Days</label>
              <select 
                className="form-input" 
                value={recentDays}
                onChange={(e) => setRecentDays(e.target.value)}
              >
                <option value="1">Today</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="form-group mb-0">
              <label className="form-label">Min Calories</label>
              <input
                type="number"
                className="form-input"
                placeholder="Min"
                value={minCalories}
                onChange={(e) => setMinCalories(e.target.value)}
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Max Calories</label>
              <input
                type="number"
                className="form-input"
                placeholder="Max"
                value={maxCalories}
                onChange={(e) => setMaxCalories(e.target.value)}
              />
            </div>
          </div>

          <button 
            className="btn btn-primary mt-4"
            onClick={handleApplyFilters}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            Apply Filters
          </button>
        </div>

        {error && (
          <div className="error-message mb-4">
            <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Log List */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading food logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center" style={{ padding: 'var(--space-8)' }}>
            <svg className="icon icon-xl" viewBox="0 0 20 20" fill="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }}>
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-tertiary">No food logs found</p>
            <p className="text-sm text-tertiary">Start by logging some food!</p>
          </div>
        ) : (
          <div className="log-list">
            {logs.map(log => (
              <div key={log.macro_log_id} className="log-item card animate-slide-in-left" style={{ background: 'var(--bg-tertiary)', marginBottom: 'var(--space-4)' }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium" style={{ margin: 0 }}>{log.food_name}</h4>
                      {log.meal_name && (
                        <span className="badge badge-primary">{log.meal_name}</span>
                      )}
                    </div>

                    <div className="text-sm text-secondary mb-3">
                      <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {formatDate(log.date_time)} • {log.servings} servings
                    </div>

                    <div className="flex gap-6 text-sm">
                      <span>
                        <strong>{log.consumed_macros?.calories || 0}</strong> cal
                      </span>
                      <span>
                        <strong>{log.consumed_macros?.protein || 0}g</strong> protein
                      </span>
                      <span>
                        <strong>{log.consumed_macros?.carbohydrates || 0}g</strong> carbs
                      </span>
                      <span>
                        <strong>{log.consumed_macros?.fat || 0}g</strong> fat
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(log.macro_log_id)}
                    aria-label="Delete log"
                    title="Delete log"
                  >
                    <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .log-item {
          padding: var(--space-5);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .log-item:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default FoodLogViewer;

