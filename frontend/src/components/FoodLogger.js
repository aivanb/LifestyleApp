import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * FoodLogger Component
 * 
 * Handles food logging with search and serving selection.
 * Features:
 * - Search for foods and meals
 * - Toggle public foods visibility
 * - Sort by most frequently logged
 * - Adjustable servings with up/down arrows
 * - Real-time macro calculation
 * - Add button for each food
 */
const FoodLogger = ({ onFoodLogged, onClose, showAsPanel = false, selectedDate = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPublicFoods, setShowPublicFoods] = useState(false);
  const [foods, setFoods] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foodServings, setFoodServings] = useState({});
  const [foodTimes, setFoodTimes] = useState({});
  const [sortBy, setSortBy] = useState('frequency');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadRecentFoods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getRecentlyLoggedFoods(30);
      if (response.data.data && response.data.data.foods) {
        setRecentFoods(response.data.data.foods);
        setFoods([]);
      }
    } catch (err) {
      console.error('Failed to load recent foods:', err);
      setError('Failed to load recent foods');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchFoods = useCallback(async () => {
    if (!searchTerm.trim()) {
      loadRecentFoods();
      return;
    }

    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        page_size: 50
      };

      if (showPublicFoods) {
        params.include_public = true;
      }

      const response = await api.getFoods(params);
      if (response.data.data && response.data.data.foods) {
        setFoods(response.data.data.foods);
        setRecentFoods([]);
      }
    } catch (err) {
      console.error('Failed to search foods:', err);
      setError('Failed to search foods');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showPublicFoods, loadRecentFoods]);

  useEffect(() => {
    if (!searchTerm) {
      loadRecentFoods();
    } else {
      searchFoods();
    }
  }, [searchTerm, showPublicFoods, loadRecentFoods, searchFoods]);

  const updateServings = (foodId, servings) => {
    setFoodServings(prev => ({
      ...prev,
      [foodId]: Math.max(0.1, parseFloat(servings) || 0.1)
    }));
  };

  const updateTime = (foodId, time) => {
    setFoodTimes(prev => ({
      ...prev,
      [foodId]: time
    }));
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getDefaultTime = (foodId) => {
    return foodTimes[foodId] || getCurrentTime();
  };

  const incrementServings = (foodId) => {
    const current = foodServings[foodId] || 1;
    updateServings(foodId, current + 0.1);
  };

  const decrementServings = (foodId) => {
    const current = foodServings[foodId] || 1;
    updateServings(foodId, Math.max(0.1, current - 0.1));
  };

  const logFood = async (food) => {
    const servings = foodServings[food.food_id] || 1;
    const timeToUse = getDefaultTime(food.food_id);
    
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      let dateTime;
      
      const [hours, minutes] = timeToUse.split(':');
      
      // Always use the current day (today) regardless of calendar selection
      const baseDate = new Date();
      
      // Create a new date with today's date and the specified time in UTC
      const year = baseDate.getUTCFullYear();
      const month = baseDate.getUTCMonth();
      const day = baseDate.getUTCDate();
      
      // Create new date with UTC time to avoid timezone issues
      const logDate = new Date(Date.UTC(year, month, day, parseInt(hours), parseInt(minutes), 0, 0));
      
      // Convert to ISO string for backend (UTC)
      dateTime = logDate.toISOString();
      
      const logData = {
        food: food.food_id,
        servings: servings.toString(),
        measurement: food.unit,
        date_time: dateTime
      };

      console.log('Logging food with data:', logData);
      const response = await api.createFoodLog(logData);
      console.log('Food log response:', response);
      
      // Reset servings for this food
      setFoodServings(prev => ({
        ...prev,
        [food.food_id]: 1
      }));

      // Update the food log immediately
      if (onFoodLogged) {
        onFoodLogged();
      }
    } catch (err) {
      console.error('Failed to log food:', err);
      setError(err.response?.data?.error?.message || 'Failed to log food');
    } finally {
      setLoading(false);
    }
  };

  const calculateMacros = (food, servings) => {
    const multiplier = servings || 1;
    return {
      calories: Math.round((food.calories || 0) * multiplier),
      protein: Math.round(((food.protein || 0) * multiplier) * 10) / 10,
      fat: Math.round(((food.fat || 0) * multiplier) * 10) / 10,
      carbohydrates: Math.round(((food.carbohydrates || 0) * multiplier) * 10) / 10
    };
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

  const sortFoods = (foodsList) => {
    const sorted = [...foodsList].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'calories':
          aValue = a.calories || 0;
          bValue = b.calories || 0;
          break;
        case 'protein':
          aValue = a.protein || 0;
          bValue = b.protein || 0;
          break;
        case 'carbohydrates':
          aValue = a.carbohydrates || 0;
          bValue = b.carbohydrates || 0;
          break;
        case 'fat':
          aValue = a.fat || 0;
          bValue = b.fat || 0;
          break;
        case 'frequency':
        default:
          aValue = a.log_count || a.frequency || a.count || 0;
          bValue = b.log_count || b.frequency || b.count || 0;
          break;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return sorted;
  };

  const displayFoods = sortFoods(searchTerm ? foods : recentFoods);

  return (
    <div className={`food-logger ${showAsPanel ? 'panel' : 'modal'}`}>
      {onClose && (
        <div className="food-logger-header">
          <div className="header-content">
            <div className="header-title">
              <svg className="icon icon-lg" viewBox="0 0 20 20" fill="var(--accent-primary)">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <h2>Log Food</h2>
            </div>
            <button className="btn-icon" onClick={onClose} aria-label="Close">
              <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 10 5.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Search Section */}
      <div className="search-section">
        <div className="form-group">
          <label className="form-label">
            <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            Search Foods
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Search for foods or meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={showPublicFoods}
              onChange={(e) => setShowPublicFoods(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-label">
              <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
              </svg>
              Include public foods
            </span>
          </label>
        </div>

        {/* Sorting Controls */}
        <div className="sorting-controls">
          <div className="form-group">
            <label className="form-label">Sort by</label>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="frequency">Frequency</option>
              <option value="calories">Calories</option>
              <option value="protein">Protein</option>
              <option value="carbohydrates">Carbs</option>
              <option value="fat">Fat</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Order</label>
            <div className="sort-order-container">
              <button
                className="sort-order-btn"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={sortOrder === 'asc' ? 'Switch to Descending' : 'Switch to Ascending'}
              >
                <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                  {sortOrder === 'desc' ? (
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Food List */}
      <div className="food-list-section">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading foods...</p>
          </div>
        ) : displayFoods.length === 0 ? (
          <div className="empty-state">
            <svg className="icon icon-xl" viewBox="0 0 20 20" fill="var(--text-tertiary)">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-tertiary">
              {searchTerm ? 'No foods found' : 'No recent foods'}
            </p>
          </div>
        ) : (
          <div className="food-list">
            
            {displayFoods.map(food => {
              const servings = foodServings[food.food_id] || 1;
              const macros = calculateMacros(food, servings);
              
              return (
                <div key={food.food_id} className="food-card">
                  <div className="food-header">
                    <div className="food-icon">
                      {getFoodGroupIcon(food.food_group)}
                    </div>
                    <div className="food-info">
                      <div className="food-name">{food.food_name}</div>
                      <div className="food-details">
                        {food.brand && <span className="food-brand">{food.brand}</span>}
                        <span className="food-serving">{food.serving_size} {food.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="food-macros">
                    <div className="macro-grid">
                      <div className="macro-item">
                        <span className="macro-value">{macros.calories}</span>
                        <span className="macro-label">CAL</span>
                      </div>
                      <div className="macro-item">
                        <span className="macro-value">{macros.protein}</span>
                        <span className="macro-label">PRO</span>
                      </div>
                      <div className="macro-item">
                        <span className="macro-value">{macros.fat}</span>
                        <span className="macro-label">FAT</span>
                      </div>
                      <div className="macro-item">
                        <span className="macro-value">{macros.carbohydrates}</span>
                        <span className="macro-label">CAR</span>
                      </div>
                    </div>
                  </div>

                  <div className="food-time-section">
                    <label className="time-label">Time:</label>
                    <input
                      type="time"
                      className="time-input"
                      value={getDefaultTime(food.food_id)}
                      onChange={(e) => updateTime(food.food_id, e.target.value)}
                    />
                  </div>

                  <div className="food-actions">
                    <div className="servings-control">
                      <button
                        className="btn-icon btn-servings"
                        onClick={() => decrementServings(food.food_id)}
                        disabled={servings <= 0.1}
                      >
                        <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <input
                        type="number"
                        className="servings-input"
                        value={Math.round(servings * 10) / 10}
                        onChange={(e) => updateServings(food.food_id, e.target.value)}
                        step="0.1"
                        min="0.1"
                      />
                      
                      <button
                        className="btn-icon btn-servings"
                        onClick={() => incrementServings(food.food_id)}
                      >
                        <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    <button
                      className="btn btn-primary btn-log"
                      onClick={() => logFood(food)}
                      disabled={loading}
                    >
                      <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .food-logger {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-secondary);
          overflow: hidden;
        }

        .food-logger.panel {
          padding: var(--space-6);
          padding-right: calc(var(--space-6) + var(--space-4));
        }

        .food-logger.modal {
          padding: 0;
        }

        .food-logger-header {
          padding: var(--space-6);
          border-bottom: 1px solid var(--border-primary);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .header-title h2 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-medium);
        }

        .search-section {
          padding: var(--space-6);
          border-bottom: 1px solid var(--border-primary);
          width: 100%;
        }

        .food-list-section {
          max-height: 500px;
          overflow-y: auto;
        }

        .section-title {
          padding: var(--space-4) var(--space-6);
          border-bottom: 1px solid var(--border-primary);
          background: var(--bg-tertiary);
        }

        .section-title h3 {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-weight-medium);
        }

        .food-list {
          padding: var(--space-4);
          width: 100%;
        }

        .food-card {
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          margin-bottom: var(--space-4);
          border: 1px solid var(--border-primary);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .food-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .food-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
        }

        .food-icon {
          font-size: var(--text-xl);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .food-info {
          flex: 1;
        }

        .food-name {
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .food-details {
          display: flex;
          gap: var(--space-2);
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .food-brand {
          font-weight: var(--font-weight-medium);
        }

        .food-macros {
          margin-bottom: var(--space-4);
        }

        .food-time-section {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .time-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .time-input {
          padding: var(--space-1) var(--space-2);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--text-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .time-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
        }

        .macro-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-3);
        }

        .macro-item {
          text-align: center;
          padding: var(--space-2);
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
        }

        .macro-value {
          display: block;
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
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-2);
        }

        .servings-control {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: var(--space-1);
        }

        .btn-servings {
          width: 32px;
          height: 32px;
          padding: 0;
          border-radius: var(--radius-sm);
        }

        .servings-input {
          width: 60px;
          text-align: center;
          border: 1px solid var(--border-primary);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
          font-size: var(--text-sm);
          border-radius: var(--radius-sm);
          padding: var(--space-1);
        }

        .servings-input:focus {
          outline: none;
        }

        .btn-log {
          padding: var(--space-2) var(--space-4);
          font-size: var(--text-sm);
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          cursor: pointer;
          user-select: none;
        }

        .checkbox-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkbox-custom {
          position: relative;
          width: 20px;
          height: 20px;
          background: var(--bg-secondary);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .checkbox-input:checked + .checkbox-custom {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 1px;
          width: 6px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .sorting-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .form-select {
          width: 100%;
          min-height: 40px;
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--text-sm);
          transition: all 0.2s var(--ease-out-cubic);
          box-sizing: border-box;
        }

        .form-select:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
        }

        .sort-order-container {
          display: flex;
          gap: var(--space-1);
        }

        .sort-order-btn {
          width: auto;
          min-height: 40px;
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-sm);
          box-sizing: border-box;
        }

        .sort-order-btn:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          transform: translateY(-1px);
        }

        .empty-state {
          text-align: center;
          padding: var(--space-8);
        }

        @media (max-width: 768px) {
          .macro-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .food-actions {
            flex-direction: column;
            gap: var(--space-3);
            align-items: stretch;
          }

          .servings-control {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default FoodLogger;
