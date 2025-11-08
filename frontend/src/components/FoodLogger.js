import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import FoodMetadataModal from './FoodMetadataModal';

// FoodEditForm Component
const FoodEditForm = ({ food, onSave, onCancel }) => {
  const getFoodData = () => {
    return food.food_details || food;
  };

  const foodData = getFoodData();

  const [formData, setFormData] = useState({
    food_name: foodData.food_name || '',
    brand: foodData.brand || '',
    serving_size: foodData.serving_size || '',
    unit: foodData.unit || '',
    calories: foodData.calories || '',
    protein: foodData.protein || '',
    fat: foodData.fat || '',
    carbohydrates: foodData.carbohydrates || '',
    fiber: foodData.fiber || '',
    sodium: foodData.sodium || '',
    sugar: foodData.sugar || '',
    saturated_fat: foodData.saturated_fat || '',
    trans_fat: foodData.trans_fat || '',
    calcium: foodData.calcium || '',
    iron: foodData.iron || '',
    magnesium: foodData.magnesium || '',
    cholesterol: foodData.cholesterol || '',
    vitamin_a: foodData.vitamin_a || '',
    vitamin_c: foodData.vitamin_c || '',
    vitamin_d: foodData.vitamin_d || '',
    caffeine: foodData.caffeine || '',
    food_group: foodData.food_group || '',
    cost: foodData.cost || '',
    make_public: foodData.make_public || false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === '' ? '' : parseFloat(value) || value)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const foodId = foodData.food_id || food.food_id;
    onSave(foodId, formData);
  };

  return (
    <div className="food-edit-form">
      <div className="modal-header">
        <h2>Edit Food: {foodData.food_name}</h2>
        <button className="btn-close" onClick={onCancel} aria-label="Close">
          <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <table className="edit-form-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Value</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            <tr className="even-row">
              <td className="edit-label-cell">Food Name</td>
              <td className="edit-value-cell">
                <input type="text" name="food_name" value={formData.food_name} onChange={handleChange} required />
              </td>
              <td className="edit-unit-cell"></td>
            </tr>
            <tr className="odd-row">
              <td className="edit-label-cell">Brand</td>
              <td className="edit-value-cell">
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell"></td>
            </tr>
            <tr className="even-row">
              <td className="edit-label-cell">Serving Size</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="serving_size" value={formData.serving_size} onChange={handleChange} required />
              </td>
              <td className="edit-unit-cell">
                <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="Unit" required />
              </td>
            </tr>
            <tr className="odd-row">
              <td className="edit-label-cell">Calories</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="calories" value={formData.calories} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">kcal</td>
            </tr>
            <tr className="even-row">
              <td className="edit-label-cell">Protein</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="protein" value={formData.protein} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">g</td>
            </tr>
            <tr className="odd-row">
              <td className="edit-label-cell">Fat</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="fat" value={formData.fat} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">g</td>
            </tr>
            <tr className="even-row">
              <td className="edit-label-cell">Carbohydrates</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="carbohydrates" value={formData.carbohydrates} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">g</td>
            </tr>
            <tr className="odd-row">
              <td className="edit-label-cell">Fiber</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="fiber" value={formData.fiber} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">g</td>
            </tr>
            <tr className="even-row">
              <td className="edit-label-cell">Sodium</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="sodium" value={formData.sodium} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">mg</td>
            </tr>
            <tr className="odd-row">
              <td className="edit-label-cell">Sugar</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="sugar" value={formData.sugar} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">g</td>
            </tr>
            <tr className="even-row">
              <td className="edit-label-cell">Saturated Fat</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="saturated_fat" value={formData.saturated_fat} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">g</td>
            </tr>
            <tr className="odd-row">
              <td className="edit-label-cell">Trans Fat</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="trans_fat" value={formData.trans_fat} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">g</td>
            </tr>
            <tr className="even-row">
              <td className="edit-label-cell">Calcium</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="calcium" value={formData.calcium} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">mg</td>
            </tr>
            <tr className="odd-row">
              <td className="edit-label-cell">Iron</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="iron" value={formData.iron} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">mg</td>
            </tr>
            <tr className="even-row">
              <td className="edit-label-cell">Magnesium</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="magnesium" value={formData.magnesium} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">mg</td>
            </tr>
            <tr className="odd-row">
              <td className="edit-label-cell">Cholesterol</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="cholesterol" value={formData.cholesterol} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">mg</td>
            </tr>
            <tr className="even-row">
              <td className="edit-label-cell">Vitamin A</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="vitamin_a" value={formData.vitamin_a} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">IU</td>
            </tr>
            <tr className="odd-row">
              <td className="edit-label-cell">Vitamin C</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="vitamin_c" value={formData.vitamin_c} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">mg</td>
            </tr>
            <tr className="even-row">
              <td className="edit-label-cell">Vitamin D</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="vitamin_d" value={formData.vitamin_d} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">IU</td>
            </tr>
            <tr className="odd-row">
              <td className="edit-label-cell">Caffeine</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="caffeine" value={formData.caffeine} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">mg</td>
            </tr>
            <tr className="even-row">
              <td className="edit-label-cell">Food Group</td>
              <td className="edit-value-cell">
                <select name="food_group" value={formData.food_group} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="protein">Protein</option>
                  <option value="fruit">Fruit</option>
                  <option value="vegetable">Vegetable</option>
                  <option value="grain">Grain</option>
                  <option value="dairy">Dairy</option>
                  <option value="other">Other</option>
                </select>
              </td>
              <td className="edit-unit-cell"></td>
            </tr>
            <tr className="odd-row">
              <td className="edit-label-cell">Cost</td>
              <td className="edit-value-cell">
                <input type="number" step="0.01" name="cost" value={formData.cost} onChange={handleChange} />
              </td>
              <td className="edit-unit-cell">$</td>
            </tr>
            <tr className="even-row">
              <td className="edit-label-cell">Public Food</td>
              <td className="edit-value-cell">
                <label className="checkbox-inline">
                  <input type="checkbox" name="make_public" checked={formData.make_public} onChange={handleChange} />
                  <span>Make Public</span>
                </label>
              </td>
              <td className="edit-unit-cell"></td>
            </tr>
          </tbody>
        </table>
        <div className="edit-form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

// FoodAnalyticsView Component
const FoodAnalyticsView = ({ foodId, foodName, analyticsData, loading, onClose, onTimeRangeChange }) => {
  const [timeRange, setTimeRange] = useState(analyticsData?.timeRange || '1week');

  useEffect(() => {
    if (analyticsData?.timeRange) {
      setTimeRange(analyticsData.timeRange);
    }
  }, [analyticsData]);
  
  // Don't render close button in modal - it's already in the modal backdrop
  if (!onClose) {
    return null;
  }

  if (loading) {
    return (
      <div className="food-analytics-view">
        <div className="loading-small">Loading analytics...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="food-analytics-view">
        <div className="loading-small">No analytics data available</div>
      </div>
    );
  }

  const { stats, frequencyData, timeOfDayData } = analyticsData;

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    if (onTimeRangeChange) {
      onTimeRangeChange(foodId, newRange);
    }
  };

  // Format frequency data for chart
  const chartData = frequencyData?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: item.count
  })) || [];

  // Format time of day data for radar chart (24 hours)
  const radarData = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourData = timeOfDayData?.find(d => d.hour === hour);
    radarData.push({
      hour: hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`,
      count: hourData?.count || 0
    });
  }

  return (
    <div className="food-analytics-view">
      <div className="modal-header">
        <h2>{foodName} Analytics</h2>
        <button className="btn-icon" onClick={onClose} aria-label="Close">
          <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="analytics-stats">
        <div className="stat-item">
          <span className="stat-label">Times Logged:</span>
          <span className="stat-value">{stats?.times_logged || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Time Since Last Logged:</span>
          <span className="stat-value">{stats?.time_since_last_logged || 'N/A'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Last Updated:</span>
          <span className="stat-value">{stats?.last_updated ? new Date(stats.last_updated).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Public:</span>
          <span className="stat-value">{stats?.is_public ? 'Yes' : 'No'}</span>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-section">
          <div className="chart-header">
            <h4>Frequency Over Time</h4>
            <div className="time-range-selector">
              <button className={timeRange === '1week' ? 'active' : ''} onClick={() => handleTimeRangeChange('1week')}>1 Week</button>
              <button className={timeRange === '1month' ? 'active' : ''} onClick={() => handleTimeRangeChange('1month')}>1 Month</button>
              <button className={timeRange === '6months' ? 'active' : ''} onClick={() => handleTimeRangeChange('6months')}>6 Months</button>
              <button className={timeRange === '1year' ? 'active' : ''} onClick={() => handleTimeRangeChange('1year')}>1 Year</button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" name="Times Logged" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-header">
            <h4>Time of Day Distribution</h4>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="hour" />
                <PolarRadiusAxis />
                <Radar name="Count" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [foods, setFoods] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foodServings, setFoodServings] = useState({});
  const [foodTimes, setFoodTimes] = useState({});
  const [sortBy, setSortBy] = useState('frequency');
  const [sortOrder, setSortOrder] = useState('desc');
  const [metadataModalFood, setMetadataModalFood] = useState(null);
  const [editingFood, setEditingFood] = useState(null);
  const [analyticsModalFood, setAnalyticsModalFood] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({});
  const [loadingAnalytics, setLoadingAnalytics] = useState({});

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
  }, [searchTerm, loadRecentFoods]);

  useEffect(() => {
    if (!searchTerm) {
      loadRecentFoods();
    } else {
      searchFoods();
    }
  }, [searchTerm, loadRecentFoods, searchFoods]);

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
      
      // Format servings to ensure proper decimal precision (max 2 decimal places)
      // This prevents floating point precision errors like '1.4000000000000004'
      const formattedServings = parseFloat(servings).toFixed(2);
      
      const logData = {
        food: food.food_id,
        servings: formattedServings,
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

  const loadFoodAnalytics = async (foodId, timeRange = '1week') => {
    setLoadingAnalytics(prev => ({ ...prev, [foodId]: true }));
    try {
      const response = await api.getFoodAnalytics(foodId, timeRange);
      setAnalyticsData(prev => ({
        ...prev,
        [foodId]: {
          ...response.data.data,
          timeRange: timeRange
        }
      }));
    } catch (err) {
      console.error('Failed to load food analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoadingAnalytics(prev => ({ ...prev, [foodId]: false }));
    }
  };

  const handleTimeRangeChange = (foodId, timeRange) => {
    loadFoodAnalytics(foodId, timeRange);
  };

  const handleFoodUpdate = async (foodId, updatedData) => {
    try {
      setLoading(true);
      await api.updateFood(foodId, {
        ...updatedData,
        updated_at: new Date().toISOString()
      });
      
      // Refresh the foods list
      if (searchTerm) {
        await searchFoods();
      } else {
        await loadRecentFoods();
      }
      
      setEditingFood(null);
      setError('');
    } catch (err) {
      console.error('Failed to update food:', err);
      setError(err.response?.data?.error?.message || 'Failed to update food');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="search-bar-container">
          <div className="form-group search-input-group">
            <label className="form-label">
              <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              Search Foods
            </label>
            <input
              type="text"
              className="form-input search-input-wide"
              placeholder="Search for foods or meals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sorting Controls */}
          <div className="sorting-controls-inline">
            <div className="form-group">
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
            
            <button
              className="sort-order-btn-inline"
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

                  <div className="food-card-actions-row">
                    <div className="food-card-buttons">
                      <button
                        className="btn-icon-small"
                        onClick={() => setMetadataModalFood(food)}
                        title="View metadata"
                      >
                        <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon-small"
                        onClick={() => setEditingFood(food)}
                        title="Edit food"
                      >
                        <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon-small"
                        onClick={() => {
                          setAnalyticsModalFood(food);
                          loadFoodAnalytics(food.food_id);
                        }}
                        title="View analytics"
                      >
                        <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                      </button>
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

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Metadata Modal */}
      {metadataModalFood && (
        <FoodMetadataModal 
          food={metadataModalFood}
          onClose={() => setMetadataModalFood(null)}
        />
      )}

      {/* Edit Food Modal */}
      {editingFood && (
        <div className="modal-backdrop" onClick={() => setEditingFood(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto', margin: '0 auto' }}>
            <FoodEditForm 
              food={editingFood} 
              onSave={(foodId, data) => {
                handleFoodUpdate(foodId, data);
                setEditingFood(null);
              }}
              onCancel={() => setEditingFood(null)}
            />
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {analyticsModalFood && (
        <div className="modal-backdrop" onClick={() => setAnalyticsModalFood(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <FoodAnalyticsView 
              foodId={analyticsModalFood.food_id}
              foodName={analyticsModalFood.food_name}
              analyticsData={analyticsData[analyticsModalFood.food_id]}
              loading={loadingAnalytics[analyticsModalFood.food_id]}
              onClose={() => setAnalyticsModalFood(null)}
              onTimeRangeChange={handleTimeRangeChange}
            />
          </div>
        </div>
      )}

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

        .food-card-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-3);
          gap: var(--space-3);
        }

        .food-card-buttons {
          display: flex;
          gap: var(--space-2);
        }

        .btn-icon-small {
          width: 32px;
          height: 32px;
          padding: 0;
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon-small:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .btn-icon-small:focus {
          outline: 2px solid var(--accent-primary);
          outline-offset: 2px;
        }

        .food-metadata-expanded {
          margin-top: var(--space-3);
          padding: var(--space-3);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
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

        .loading-small {
          text-align: center;
          padding: var(--space-2);
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }

        .food-edit-form {
          padding: var(--space-6);
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-primary);
        }

        .modal-header h2 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .food-metadata-modal {
          padding: var(--space-6);
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
        }

        .edit-form-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: var(--space-4);
        }

        .edit-form-table thead {
          background: var(--bg-tertiary);
        }

        .edit-form-table th {
          padding: var(--space-3) var(--space-4);
          text-align: left;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          border-bottom: 2px solid var(--border-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .edit-form-table tbody tr {
          transition: background 0.2s var(--ease-out-cubic);
        }

        .edit-form-table tbody tr.even-row {
          background: var(--bg-secondary);
        }

        .edit-form-table tbody tr.odd-row {
          background: var(--bg-tertiary);
        }

        .edit-form-table tbody tr:hover {
          background: var(--bg-hover);
        }

        .edit-form-table td {
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--border-primary);
        }

        .edit-label-cell {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          font-size: var(--text-sm);
          width: 35%;
        }

        .edit-value-cell {
          width: 40%;
        }

        .edit-value-cell input,
        .edit-value-cell select {
          width: 100%;
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-family: var(--font-primary);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .edit-value-cell input:focus,
        .edit-value-cell select:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
        }

        .edit-unit-cell {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          font-size: var(--text-base);
          width: 25%;
        }

        .edit-unit-cell input {
          width: 100%;
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-family: var(--font-primary);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .edit-unit-cell input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
        }

        .checkbox-inline {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
        }

        .checkbox-inline input[type="checkbox"] {
          width: auto;
          cursor: pointer;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
        }

        .edit-form-actions {
          display: flex;
          gap: var(--space-2);
          justify-content: flex-end;
        }

        .food-analytics-view {
          padding: var(--space-6);
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
        }

        .analytics-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-3);
          margin-bottom: var(--space-4);
          padding: var(--space-3);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          font-weight: var(--font-weight-medium);
        }

        .stat-value {
          font-size: var(--text-base);
          color: var(--text-primary);
          font-weight: var(--font-weight-bold);
        }

        .analytics-charts {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .chart-section {
          background: var(--bg-tertiary);
          padding: var(--space-3);
          border-radius: var(--radius-md);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
        }

        .chart-header h4 {
          margin: 0;
          font-size: var(--text-base);
          color: var(--text-primary);
        }

        .time-range-selector {
          display: flex;
          gap: var(--space-1);
        }

        .time-range-selector button {
          padding: var(--space-1) var(--space-2);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-size: var(--text-xs);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
        }

        .time-range-selector button:hover,
        .time-range-selector button.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .chart-container {
          width: 100%;
          height: 300px;
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

        .search-bar-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .search-input-group {
          width: 100%;
        }

        .search-input-wide {
          width: 100%;
        }

        .sorting-controls-inline {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .sort-order-btn-inline {
          width: 40px;
          height: 40px;
          padding: 0;
          margin: 0;
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-sm);
          box-sizing: border-box;
          flex-shrink: 0;
          line-height: 0;
        }

        .sort-order-btn-inline:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }

        .sort-order-btn-inline:focus {
          outline: 2px solid var(--accent-primary);
          outline-offset: 2px;
        }

        .sorting-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .form-select {
          width: 100%;
          min-width: 200px;
          height: 40px;
          padding: var(--space-2) var(--space-3);
          margin: 0;
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--text-sm);
          transition: all 0.2s var(--ease-out-cubic);
          box-sizing: border-box;
          line-height: 1.5;
          display: inline-block;
          vertical-align: middle;
        }
        
        .sorting-controls-inline .form-group {
          flex: 1;
          min-width: 200px;
          display: flex;
          align-items: center;
          height: 40px;
        }
        
        .sorting-controls-inline {
          display: flex;
          align-items: center;
          gap: var(--space-2);
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
