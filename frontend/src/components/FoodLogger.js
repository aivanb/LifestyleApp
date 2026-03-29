import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import api from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import FoodMetadataModal from './FoodMetadataModal';

// FoodEditForm Component
const FoodEditForm = ({ food, onSave, onCancel, showHeader = true }) => {
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
    <div className={`food-edit-form${showHeader ? '' : ' food-logger-overlay-pane'}`}>
      {showHeader && (
        <div className="modal-header food-edit-modal-header modal-app-header modal-app-header--compact">
          <h2 className="modal-app-header__title">Edit Food: {foodData.food_name}</h2>
          <button type="button" className="btn-close modal-app-header__close" onClick={onCancel} aria-label="Close">
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
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
const CHART_HEIGHT = 280;

const FoodAnalyticsView = ({ foodId, foodName, analyticsData, loading, onClose, onTimeRangeChange, hideHeader = false }) => {
  const [timeRange, setTimeRange] = useState(analyticsData?.timeRange || '1week');
  const chartsWrapRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(320);

  useEffect(() => {
    if (analyticsData?.timeRange) {
      setTimeRange(analyticsData.timeRange);
    }
  }, [analyticsData]);

  useLayoutEffect(() => {
    const el = chartsWrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const measure = () => {
      const w = el.getBoundingClientRect().width || el.offsetWidth;
      setChartWidth(Math.max(200, Math.floor(w)) || 320);
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [foodId, loading, analyticsData]);

  const embeddedRootClass = `food-analytics-view food-analytics-view--embedded${hideHeader ? ' food-logger-overlay-pane' : ''}`;

  if (loading) {
    return (
      <div className={embeddedRootClass}>
        <div className="loading-small">Loading analytics...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={embeddedRootClass}>
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

  // Format frequency data for chart: include all dates with count 0 when no data; zeros charted but no dot
  const rawFreq = frequencyData || [];
  const countByDate = rawFreq.reduce((acc, item) => {
    if (item.date != null) acc[item.date] = Number(item.count) || 0;
    return acc;
  }, {});
  const sortedDates = Object.keys(countByDate).sort();
  const chartData = sortedDates.length
    ? sortedDates.map((d) => ({
        date: new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: countByDate[d]
      }))
    : rawFreq.map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: Number(item.count) || 0
      }));

  // Format time of day data for bar chart (24 hours)
  const barData = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourData = timeOfDayData?.find(d => d.hour === hour);
    barData.push({
      hour: hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`,
      count: hourData?.count || 0
    });
  }

  return (
    <div className={embeddedRootClass} style={{ height: '100%', minHeight: 0 }}>
      {!hideHeader && onClose && (
        <div className="modal-header modal-app-header modal-app-header--compact">
          <h2 className="modal-app-header__title">{foodName} Analytics</h2>
          <button type="button" className="btn-close modal-app-header__close meal-creator-close" onClick={onClose} aria-label="Close">
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

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

      <div
        ref={chartsWrapRef}
        className="analytics-charts"
        style={{ flex: '1 1 auto', minHeight: 0, width: '100%' }}
      >
        <div className="chart-section">
          <div className="chart-header">
            <h4>Frequency Over Time</h4>
            <select
              className="time-range-dropdown"
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              aria-label="Time range"
            >
              <option value="1week">1 Week</option>
              <option value="1month">1 Month</option>
              <option value="6months">6 Months</option>
              <option value="1year">1 Year</option>
            </select>
          </div>
          <div
            className="chart-container analytics-chart-container"
            style={{ width: '100%', height: CHART_HEIGHT, minHeight: CHART_HEIGHT }}
          >
            {chartWidth > 0 && (
              <LineChart width={chartWidth} height={CHART_HEIGHT} data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  tick={{ angle: -90, textAnchor: 'middle', fontSize: 10 }}
                  width={28}
                  domain={[0, (dataMax) => (dataMax === 0 ? 1 : dataMax)]}
                />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} name="Times Logged" dot={(props) => (props.payload?.count ?? 0) > 0 ? <circle cx={props.cx} cy={props.cy} r={4} fill={props.stroke} /> : null} connectNulls />
              </LineChart>
            )}
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-header">
            <h4>Time of Day Distribution</h4>
          </div>
          <div
            className="chart-container analytics-chart-container"
            style={{ width: '100%', height: CHART_HEIGHT, minHeight: CHART_HEIGHT }}
          >
            {chartWidth > 0 && (
              <BarChart width={chartWidth} height={CHART_HEIGHT} data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis
                  tick={{ angle: -90, textAnchor: 'middle', fontSize: 10 }}
                  width={28}
                  domain={[0, (dataMax) => (dataMax === 0 ? 1 : dataMax)]}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Count" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
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
 * - Search via GET /api/foods/?search= (matches food name and brand)
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
  /** Single in-logger layer: metadata | edit | analytics (no nested modal backdrop) */
  const [loggerOverlay, setLoggerOverlay] = useState(null);
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

  const clearLoggerOverlay = () => setLoggerOverlay(null);

  const loggerOverlayTitle =
    loggerOverlay?.type === 'metadata'
      ? (loggerOverlay.food?.food_details || loggerOverlay.food)?.food_name || 'Metadata'
      : loggerOverlay?.type === 'edit'
        ? 'Edit food'
        : loggerOverlay?.type === 'analytics'
          ? `${loggerOverlay.food?.food_name || 'Food'} · Analytics`
          : '';

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
      
      setLoggerOverlay(null);
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
      {(onClose || loggerOverlay) && (
        <div
          className={`food-logger-header ${loggerOverlay ? 'food-logger-header--overlay' : 'food-logger-header--main'}`}
        >
          <div className="header-content modal-app-header modal-app-header--compact">
            {loggerOverlay ? (
              <>
                <button
                  type="button"
                  className="food-logger-back-btn"
                  onClick={clearLoggerOverlay}
                  aria-label="Back to food list"
                >
                  <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <h2 className="modal-app-header__title">{loggerOverlayTitle}</h2>
                {onClose ? (
                  <button type="button" className="btn-close modal-app-header__close meal-creator-close" onClick={onClose} aria-label="Close">
                    <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <span className="modal-app-header__close food-logger-header-spacer" aria-hidden="true" />
                )}
              </>
            ) : (
              <>
                <div className="header-title">
                  <svg className="icon icon-md" viewBox="0 0 20 20" fill="var(--accent-primary)">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <h2 className="modal-app-header__title">Log Food</h2>
                </div>
                <button type="button" className="btn-close modal-app-header__close meal-creator-close" onClick={onClose} aria-label="Close">
                  <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            )}
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

      {!loggerOverlay ? (
        <>
      {/* Search Section */}
      <div className="search-section food-logger-search-section">
        <div className="search-bar-container">
          <div className="food-logger-search-toolbar">
            <div className="search-sort-row">
              <div className="sorting-controls-inline">
                <div className="form-group">
                  <label htmlFor="food-logger-sort-by" className="sr-only">
                    Sort foods by
                  </label>
                  <select
                    id="food-logger-sort-by"
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
                  type="button"
                  className="sort-order-btn-inline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={sortOrder === 'asc' ? 'Switch to Descending' : 'Switch to Ascending'}
                >
                  <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                    {sortOrder === 'desc' ? (
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            {onClose && !loggerOverlay && (
              <button
                type="button"
                className="food-logger-close-mobile btn-close modal-app-header__close meal-creator-close"
                onClick={onClose}
                aria-label="Close food logger"
              >
                <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          <input
            type="text"
            className="form-input search-input-wide"
            placeholder="Search by food name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search foods by name or brand"
          />
        </div>
      </div>

      {/* Food List */}
      <div className="food-list-section food-logger-food-list-section">
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
                  <div className="food-card-title-row">
                    <div className="food-icon">
                      {getFoodGroupIcon(food.food_group)}
                    </div>
                    <div className="food-title-line">
                      <span className="food-name">{food.food_name}</span>
                      <span className="food-title-sep" aria-hidden="true">·</span>
                      <span className="food-serving-inline">{food.serving_size} {food.unit}</span>
                    </div>
                  </div>

                  <div className="food-macros food-macros--logger">
                    <span className="macro-inline">Cal: {macros.calories}</span>
                    <span className="macro-inline">Pro: {macros.protein}</span>
                    <span className="macro-inline">Fat: {macros.fat}</span>
                    <span className="macro-inline">Car: {macros.carbohydrates}</span>
                  </div>

                  <div className="food-card-actions-block">
                    <div className="food-card-buttons-rail">
                      <button
                        type="button"
                        className="btn-icon-small"
                        onClick={() => {
                          setLoggerOverlay({ type: 'analytics', food });
                          loadFoodAnalytics(food.food_id);
                        }}
                        title="View analytics"
                      >
                        <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="btn-icon-small"
                        onClick={() => setLoggerOverlay({ type: 'metadata', food })}
                        title="View metadata"
                      >
                        <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="btn-icon-small"
                        onClick={() => setLoggerOverlay({ type: 'edit', food })}
                        title="Edit food"
                      >
                        <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </div>
                    <div className="servings-row">
                      <div className="servings-control servings-control--plain">
                        <button
                          type="button"
                          className="btn-icon btn-servings"
                          onClick={() => decrementServings(food.food_id)}
                          disabled={servings <= 0.1}
                        >
                          <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
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
                          aria-label="Servings"
                        />
                        <button
                          type="button"
                          className="btn-icon btn-servings"
                          onClick={() => incrementServings(food.food_id)}
                        >
                          <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="food-card-time-add-group">
                      <div className="food-card-time-row food-card-time-row--slot">
                        <input
                          type="time"
                          className="time-input"
                          value={getDefaultTime(food.food_id)}
                          onChange={(e) => updateTime(food.food_id, e.target.value)}
                          aria-label="Time"
                        />
                      </div>
                      <div className="food-add-row">
                        <button
                          type="button"
                          className="btn btn-primary btn-log btn-log-food-header"
                          onClick={() => logFood(food)}
                          disabled={loading}
                          aria-label="Add food to log"
                        >
                          <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="btn-log-label">Add</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      ) : (
        <>
          {loggerOverlay.type === 'metadata' && (
            <FoodMetadataModal
              food={loggerOverlay.food}
              onClose={clearLoggerOverlay}
              embedded
              hideHeader
            />
          )}
          {loggerOverlay.type === 'edit' && (
            <FoodEditForm
              showHeader={false}
              food={loggerOverlay.food}
              onSave={(foodId, data) => {
                handleFoodUpdate(foodId, data);
              }}
              onCancel={clearLoggerOverlay}
            />
          )}
          {loggerOverlay.type === 'analytics' && (
            <FoodAnalyticsView
              foodId={loggerOverlay.food.food_id}
              foodName={loggerOverlay.food.food_name}
              analyticsData={analyticsData[loggerOverlay.food.food_id]}
              loading={loadingAnalytics[loggerOverlay.food.food_id]}
              hideHeader
              onClose={clearLoggerOverlay}
              onTimeRangeChange={handleTimeRangeChange}
            />
          )}
        </>
      )}

      <style>{`
        .food-logger {
          --fl-outline: #79b5fb;
          --fl-border-width: 1px;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: none;
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          overflow: hidden;
        }

        .food-logger.panel {
          padding: var(--space-5) var(--space-3);
          padding-left: var(--space-7);
          min-height: 0;
          max-height: calc(
            100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) -
              var(--foodlog-panel-pc-top-reserve, 7rem)
          );
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .food-logger.modal {
          padding: 0;
          display: flex;
          flex-direction: column;
          min-height: 0;
          flex: 1;
        }

        .food-logger .food-logger-overlay-pane {
          flex: 1;
          min-height: 0;
          box-sizing: border-box;
        }

        .food-logger .food-logger-overlay-pane:not(.food-metadata-modal--embedded) {
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: var(--space-2) var(--space-3);
        }

        .food-logger .food-metadata-modal--embedded.food-logger-overlay-pane {
          background: transparent;
        }

        .food-analytics-view--embedded {
          max-width: 100%;
          box-sizing: border-box;
        }

        .food-logger-back-btn {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          padding: 0;
          margin-right: var(--space-1);
          border: none;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .food-logger-back-btn:hover {
          background: transparent;
          color: var(--text-secondary);
        }

        .food-logger-header-spacer {
          display: inline-block;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
        }

        .food-logger-header {
          padding: 0;
          border-bottom: 1px solid var(--border-primary);
        }

        .food-logger-header .header-content.modal-app-header {
          border-bottom: none;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-3);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex: 1;
          min-width: 0;
          text-align: left;
        }

        .header-title .modal-app-header__title {
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
        }

        .food-logger-header .header-content > .btn-close {
          flex-shrink: 0;
          margin-left: auto;
          align-self: center;
        }

        .search-section {
          padding: var(--space-3);
          border-bottom: 1px solid var(--border-primary);
          width: 100%;
        }

        .food-list-section {
          max-height: 500px;
          overflow-y: auto;
        }
        .food-logger.panel .food-list-section {
          flex: 1;
          min-height: 0;
          max-height: none;
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
          padding: var(--space-3);
          margin-bottom: var(--space-3);
          border: 1px solid var(--border-primary);
          box-sizing: border-box;
        }

        .food-card-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
        }

        .food-icon {
          font-size: var(--text-2xl);
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .food-title-line {
          flex: 1;
          min-width: 0;
          min-height: 40px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-xl);
          line-height: 1.15;
        }

        .food-title-line .food-name {
          margin-right: var(--space-3);
        }

        .food-name {
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
        }

        .food-title-sep {
          color: var(--text-tertiary);
          opacity: 0.85;
        }

        .food-serving-inline {
          color: var(--text-tertiary);
          font-weight: var(--font-weight-medium);
          word-break: break-word;
        }

        .food-macros--logger {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-start;
          gap: var(--space-1);
          column-gap: var(--space-2);
          row-gap: 0;
          width: 100%;
          margin-bottom: var(--space-4);
          box-sizing: border-box;
        }

        .macro-inline {
          font-size: var(--text-lg);
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
          background: none;
          border: none;
          padding: 0;
        }

        .food-macros--logger .macro-inline:not(:last-child) {
          border-right: 1px solid rgba(255, 255, 255, 0.5);
          padding-right: var(--space-2);
          margin-right: var(--space-2);
        }

        [data-theme="light"] .food-macros--logger .macro-inline:not(:last-child) {
          border-right-color: rgba(0, 0, 0, 0.14);
        }

        .food-card-time-row {
          width: 100%;
          display: flex;
          justify-content: flex-start;
          margin-top: 0;
          min-width: 0;
        }

        .food-card-time-row--slot {
          flex: 1 1 auto;
          min-width: 0;
        }

        .food-time-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          margin-top: 0;
          margin-bottom: 0;
        }

        .time-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .food-logger .time-input,
        .food-logger .servings-input {
          border: var(--fl-border-width) solid var(--fl-outline) !important;
        }

        .time-input {
          padding: var(--space-2) var(--space-3);
          border: var(--fl-border-width) solid var(--fl-outline);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          font-variant-numeric: tabular-nums;
          min-height: 44px;
          width: 100%;
          max-width: 11rem;
          text-align: center;
          box-sizing: border-box;
          transition: all 0.2s var(--ease-out-cubic);
          -webkit-appearance: none;
          appearance: none;
        }

        .time-input::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }

        .time-input::-moz-calendar-picker-indicator {
          display: none;
        }

        .time-input:focus {
          outline: none;
          border-color: var(--fl-outline);
          box-shadow: 0 0 0 1px rgba(121, 181, 251, 0.45);
        }

        .food-card-actions-block {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          grid-template-rows: auto auto;
          row-gap: var(--space-2);
          column-gap: 20px;
          align-items: start;
          margin-top: 0;
        }

        .food-card-buttons-rail {
          grid-column: 1;
          grid-row: 1 / 3;
          display: flex;
          flex-direction: column;
          flex-wrap: nowrap;
          align-items: flex-start;
          justify-content: flex-start;
          gap: var(--space-2);
          width: 100%;
          min-width: 0;
        }

        .food-card-time-add-group {
          grid-column: 2;
          grid-row: 2;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: var(--space-2);
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .servings-row {
          grid-column: 2;
          grid-row: 1;
          display: flex;
          justify-content: flex-start;
          width: 100%;
          min-width: 0;
        }

        .food-add-row {
          display: flex;
          justify-content: flex-start;
          width: auto;
          min-width: 0;
        }

        .servings-control {
          display: flex;
          align-items: center;
          gap: 0;
        }

        .servings-control--plain {
          background: transparent;
          border: none;
          padding: 0;
          border-radius: 0;
        }

        .btn-servings {
          width: 48px;
          height: 48px;
          padding: 0;
          border-radius: var(--radius-md);
          border: none !important;
          background: transparent;
          box-sizing: border-box;
          color: var(--text-primary);
        }
        .btn-servings:focus {
          outline: none;
          box-shadow: none;
        }

        .servings-input {
          width: 72px;
          text-align: center;
          border: var(--fl-border-width) solid var(--fl-outline);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
          font-size: var(--text-base);
          border-radius: var(--radius-md);
          padding: var(--space-2);
          box-sizing: border-box;
        }

        .servings-input:focus {
          outline: none;
          box-shadow: 0 0 0 1px rgba(121, 181, 251, 0.45);
        }

        .btn-log {
          padding: var(--space-2) var(--space-4);
          font-size: var(--text-base);
        }

        .btn-log-food-header {
          background: #79b5fb !important;
          border: var(--fl-border-width) solid var(--fl-outline) !important;
          color: var(--foodlog-shell-bg, var(--bg-secondary)) !important;
          min-width: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          font-weight: var(--font-weight-bold);
          box-shadow: none;
        }

        .btn-log-food-header:hover:not(:disabled) {
          filter: brightness(0.96);
        }

        .btn-log-food-header svg,
        .btn-log-food-header .btn-log-label {
          color: var(--foodlog-shell-bg, var(--bg-secondary)) !important;
        }

        .btn-log-food-header:disabled {
          opacity: 0.65;
        }

        .btn-icon-small {
          width: 44px;
          height: 44px;
          padding: 0;
          border: var(--fl-border-width) solid var(--fl-outline);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }

        .btn-icon-small:focus {
          outline: none;
          box-shadow: 0 0 0 1px rgba(121, 181, 251, 0.45);
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
          padding: var(--space-4);
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-primary);
        }

        .food-edit-form .modal-header {
          margin-bottom: var(--space-3);
          padding-bottom: var(--space-2);
        }

        .food-edit-form .food-edit-modal-header {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
        }

        .food-edit-form .food-edit-modal-header h2 {
          flex: 1;
          margin: 0;
          text-align: left;
          min-width: 0;
          font-size: var(--text-base);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .food-edit-form .food-edit-modal-header .btn-close {
          flex-shrink: 0;
          margin-left: auto;
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

        .food-edit-form .edit-form-table th {
          padding: var(--space-2) var(--space-3);
          text-align: left;
          font-size: var(--text-xs);
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
          background: inherit;
        }

        .food-edit-form .edit-form-table td {
          padding: var(--space-2) var(--space-3);
          border-bottom: 1px solid var(--border-primary);
          font-size: var(--text-xs);
        }

        .food-edit-form .edit-label-cell {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          width: 26%;
          font-size: var(--text-xs);
        }

        .edit-value-cell {
          width: 40%;
        }

        .food-edit-form .edit-value-cell input,
        .food-edit-form .edit-value-cell select {
          width: 100%;
          padding: var(--space-1) var(--space-2);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: var(--text-xs);
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
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          flex: 1;
          height: 100%;
          min-height: 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .modal--food-analytics {
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 90vh;
          max-height: 90vh;
        }

        .modal--food-analytics .food-analytics-view {
          overflow-y: auto;
          overflow-x: hidden;
          height: 100%;
          min-height: 0;
        }

        .food-analytics-view .modal-header.modal-app-header {
          flex-shrink: 0;
          border-bottom: 1px solid var(--border-primary);
        }

        .food-logger-header .meal-creator-close,
        .food-analytics-view .modal-header .meal-creator-close {
          color: var(--text-tertiary);
        }

        .food-logger-header .meal-creator-close:hover,
        .food-analytics-view .modal-header .meal-creator-close:hover {
          color: var(--text-tertiary);
        }

        .modal--food-analytics {
          padding-top: 0;
        }

        .modal-backdrop--analytics {
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .modal--food-analytics .food-analytics-view {
          padding-top: 0;
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
          flex: 1;
          min-height: 0;
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

        .time-range-selector button:hover {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border-color: var(--border-primary);
        }

        .time-range-selector button.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .time-range-dropdown {
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          min-width: 100px;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right var(--space-2) center;
          background-size: 16px;
          padding-right: 28px;
        }

        .time-range-dropdown:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .chart-container {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          height: 300px;
          margin-left: 0;
          padding-left: 0;
        }

        .analytics-chart-container {
          max-width: 100%;
          min-width: 0;
          overflow: visible;
        }

        .food-analytics-view .recharts-wrapper {
          max-width: 100% !important;
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
          gap: var(--space-2);
          width: 100%;
        }

        .food-logger-search-toolbar {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-2);
          width: 100%;
        }

        .food-logger-close-mobile {
          display: none;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 0;
          box-sizing: border-box;
          background: transparent;
        }

        .food-logger-close-mobile:focus {
          outline: none;
        }

        .food-logger-close-mobile:focus-visible {
          outline: 2px solid var(--accent-primary);
          outline-offset: 2px;
        }

        .food-logger-close-mobile:hover {
          background: transparent;
        }

        .search-input-wide {
          width: 100%;
          height: 50px;
          font-size: var(--text-xl);
          padding: var(--space-2) var(--space-3);
          box-sizing: border-box;
        }

        .search-sort-row {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          flex: 1;
          min-width: 0;
          width: 100%;
        }

        .sorting-controls-inline {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          border: none;
          border-radius: 0;
          background: transparent;
          padding: 0;
          box-sizing: border-box;
          flex-shrink: 0;
        }

        .sort-order-btn-inline {
          width: 42px;
          height: 42px;
          padding: 0;
          margin: 0;
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-sm);
          box-sizing: border-box;
          flex-shrink: 0;
          line-height: 0;
          align-self: center;
          transition: all 0.2s var(--ease-out-cubic);
        }

        .sort-order-btn-inline:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
          background: var(--bg-tertiary);
        }

        .sorting-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }

        .food-logger .form-select {
          width: 100%;
          min-width: 0;
          height: 42px;
          padding: var(--space-2) var(--space-4);
          margin: 0;
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          box-sizing: border-box;
          line-height: 1.5;
          display: inline-block;
          vertical-align: middle;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: none;
          transition: all 0.2s var(--ease-out-cubic);
        }
        
        .sorting-controls-inline .form-group {
          flex: 0 1 auto;
          min-width: 0;
          max-width: min(280px, 74vw);
          display: flex;
          align-items: center;
          height: 42px;
          margin: 0;
        }

        .sorting-controls-inline .form-select {
          height: 42px;
          min-width: 180px;
          max-width: 280px;
        }

        .food-logger .form-select:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
          background: var(--bg-tertiary);
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
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border-color: var(--border-primary);
        }

        .empty-state {
          text-align: center;
          padding: var(--space-8);
        }

        /* PC: food card actions — slightly reduced sizing */
        @media (min-width: 769px) {
          .food-logger.panel {
            padding-left: var(--space-8);
            padding-right: var(--space-8);
          }

          .food-list {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .food-card {
            width: 100%;
            max-width: 100%;
            margin-left: 0;
            margin-right: 0;
            align-self: stretch;
            box-sizing: border-box;
          }

          .food-logger.panel .food-macros--logger {
            margin-left: 10px;
          }

          .food-logger.panel .search-section {
            padding-bottom: var(--space-2);
          }

          .food-logger.panel .food-list {
            padding-top: var(--space-2);
          }

          /* Col1: buttons + time (centered under buttons); col2: servings + Add (right edges aligned); col3: absorbs width */
          .food-logger.panel .food-card-actions-block {
            margin-top: 20px;
            margin-left: 5px;
            transform: none;
            display: grid;
            grid-template-columns: max-content max-content minmax(0, 1fr);
            grid-template-rows: auto auto;
            column-gap: 10px;
            row-gap: var(--space-2);
            align-items: start;
            justify-items: start;
            width: 100%;
          }

          .food-logger.panel .food-card-buttons-rail {
            grid-column: 1;
            grid-row: 1;
            flex-direction: row;
            flex-wrap: nowrap;
            align-items: center;
            justify-content: flex-start;
            gap: var(--space-1);
            width: max-content;
            max-width: 100%;
            min-width: 0;
          }

          .food-logger.panel .food-card-buttons-rail .btn-icon-small {
            width: 46px;
            height: 46px;
          }

          .food-logger.panel .food-card-buttons-rail .btn-icon-small svg {
            width: 1.2rem;
            height: 1.2rem;
          }

          .food-logger.panel .servings-row {
            grid-column: 2;
            grid-row: 1;
            justify-self: end;
            justify-content: flex-end;
            width: max-content;
            max-width: 100%;
          }

          .food-logger.panel .food-card-time-add-group {
            display: contents;
          }

          .food-logger.panel .food-card-time-row--slot {
            grid-column: 1;
            grid-row: 2;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            min-width: 0;
            max-width: 100%;
            margin-top: 0;
            margin-bottom: 0;
            box-sizing: border-box;
          }

          .food-logger.panel .food-card-time-row--slot .time-input {
            min-height: 44px;
            font-size: var(--text-base);
            font-weight: var(--font-weight-semibold);
            padding: var(--space-2) var(--space-2);
            max-width: 6.25rem;
            width: auto;
            text-align: center;
          }

          .food-logger.panel .food-add-row {
            grid-column: 2;
            grid-row: 2;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            justify-self: end;
            width: max-content;
          }

          .servings-row .btn-servings {
            width: 46px;
            height: 46px;
          }

          .servings-row .btn-servings svg {
            width: 1.35rem;
            height: 1.35rem;
          }

          .servings-row .servings-input {
            width: 72px;
            min-height: 44px;
            font-size: var(--text-base);
            padding: var(--space-1) var(--space-2);
          }

          .food-add-row .btn-log-food-header {
            min-height: 46px;
            padding: var(--space-2) var(--space-4);
          }

          .food-add-row .btn-log-food-header .btn-log-label {
            font-size: var(--text-sm);
          }
        }

        @media (max-width: 768px) {
          .food-logger.modal .food-logger-header--main {
            display: none !important;
          }

          .food-logger.modal .food-logger-close-mobile {
            display: inline-flex;
          }

          .food-logger .modal {
            max-width: 100% !important;
            width: 100%;
          }

          .food-logger.modal {
            max-width: 100%;
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;
            min-height: 0;
            height: 100%;
            overflow: hidden;
          }

          .food-logger.modal .food-logger-header {
            flex-shrink: 0;
          }

          .food-logger.modal .search-section {
            flex-shrink: 0;
          }

          .food-logger.modal .food-list-section {
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .food-logger-header--overlay {
            padding: var(--space-3);
          }

          .search-section {
            padding: var(--space-2) var(--space-3);
            width: 100%;
            box-sizing: border-box;
          }

          .search-bar-container {
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
            width: 100%;
          }

          .search-bar-container .form-input.search-input-wide {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .section-title {
            padding: var(--space-2) var(--space-3);
          }

          .section-title h3 {
            font-size: var(--text-xs);
          }

          .food-list-section {
            width: 100%;
            box-sizing: border-box;
          }

          .food-logger-search-section {
            order: 1;
          }

          .food-logger-food-list-section {
            order: 2;
          }

          .food-list {
            padding: var(--space-2);
            width: 100%;
          }

          .food-card {
            padding: var(--space-2) var(--space-3);
            margin-bottom: var(--space-2);
            width: 100%;
            box-sizing: border-box;
          }

          .food-card-title-row {
            margin-bottom: var(--space-2);
            gap: var(--space-2);
          }

          .food-macros--logger {
            gap: var(--space-2);
          }

          .servings-control {
            justify-content: center;
          }

          .food-analytics-view {
            padding: var(--space-3);
            max-width: 100%;
            box-sizing: border-box;
            max-height: none;
          }

          .food-analytics-view .modal-header {
            padding: var(--space-2) var(--space-3);
          }

          .analytics-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--space-2);
            padding: var(--space-2);
            margin-bottom: var(--space-2);
          }

          .analytics-charts {
            gap: var(--space-2);
          }

          .chart-section {
            padding: var(--space-2);
            margin-left: 0;
          }

          .chart-container {
            margin-left: 0;
            padding-left: 0;
            width: 100%;
            min-height: 240px;
          }

          .food-analytics-view .recharts-wrapper {
            margin-left: 0 !important;
          }

          .modal--food-analytics .chart-container.analytics-chart-container,
          .modal--food-analytics .recharts-responsive-container {
            min-height: 240px !important;
          }

          /* Mobile food logger modal: match PC panel food card (same card shell + actions grid) */
          .modal--food-logger .food-card {
            padding: var(--space-3);
            margin-bottom: var(--space-3);
            margin-left: 0;
            margin-right: 0;
            width: 100%;
            max-width: 100%;
            align-self: stretch;
            box-sizing: border-box;
          }

          .modal--food-logger .food-card-title-row {
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            margin-bottom: var(--space-2);
            gap: var(--space-2);
            padding-left: 0;
            margin-left: 0;
          }

          .modal--food-logger .food-icon {
            margin-left: 0;
            margin-right: 0;
          }

          .modal--food-logger .food-title-line {
            justify-content: flex-start;
            text-align: left;
          }

          .modal--food-logger .food-macros--logger {
            margin-bottom: var(--space-4);
            margin-top: 0;
            margin-left: 10px;
            margin-right: 0;
            padding-left: 0;
            padding-right: 0;
            align-self: stretch;
            justify-content: flex-start;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            gap: var(--space-1);
            column-gap: var(--space-2);
          }

          .modal--food-logger .food-card-actions-block {
            margin-top: 20px;
            margin-left: 5px;
            transform: none;
            display: grid;
            grid-template-columns: max-content max-content minmax(0, 1fr);
            grid-template-rows: auto auto;
            column-gap: 10px;
            row-gap: var(--space-2);
            align-items: start;
            justify-items: start;
            width: 100%;
            padding-top: 0;
            padding-left: 0;
            padding-right: 0;
          }

          .modal--food-logger .food-card-time-add-group {
            display: contents;
          }

          .modal--food-logger .food-card-buttons-rail {
            grid-column: 1;
            grid-row: 1;
            flex-direction: row;
            flex-wrap: nowrap;
            align-items: center;
            justify-content: flex-start;
            gap: var(--space-1);
            width: max-content;
            max-width: 100%;
            min-width: 0;
            margin-left: 0;
            margin-top: 0;
            height: auto;
            box-sizing: border-box;
          }

          .modal--food-logger .food-card-buttons-rail .btn-icon-small {
            width: 46px;
            height: 46px;
          }

          .modal--food-logger .food-card-buttons-rail .btn-icon-small svg {
            width: 1.2rem;
            height: 1.2rem;
          }

          .modal--food-logger .servings-row {
            grid-column: 2;
            grid-row: 1;
            justify-self: end;
            justify-content: flex-end;
            width: max-content;
            max-width: 100%;
            margin-top: 0;
            display: flex;
            align-items: center;
            min-height: 0;
            box-sizing: border-box;
          }

          .modal--food-logger .food-card-time-row--slot {
            grid-column: 1;
            grid-row: 2;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            min-width: 0;
            max-width: 100%;
            margin-top: 0;
            margin-bottom: 0;
            box-sizing: border-box;
          }

          .modal--food-logger .food-card-time-row--slot .time-input {
            min-height: 44px;
            font-size: var(--text-base);
            font-weight: var(--font-weight-semibold);
            padding: var(--space-2) var(--space-2);
            max-width: 6.25rem;
            width: auto;
            text-align: center;
            flex: none;
            min-width: 0;
            box-sizing: border-box;
            border: var(--fl-border-width) solid var(--fl-outline) !important;
          }

          .modal--food-logger .food-add-row {
            grid-column: 2;
            grid-row: 2;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            justify-self: end;
            width: max-content;
            flex-shrink: 0;
            min-height: 0;
            box-sizing: border-box;
          }

          .modal--food-logger .servings-row .btn-servings {
            width: 46px;
            height: 46px;
          }

          .modal--food-logger .servings-row .btn-servings svg {
            width: 1.35rem;
            height: 1.35rem;
          }

          .modal--food-logger .servings-row .servings-input {
            width: 72px;
            min-height: 44px;
            font-size: var(--text-base);
            padding: var(--space-1) var(--space-2);
          }

          .modal--food-logger .food-add-row .btn-log-food-header {
            min-height: 46px;
            min-width: 0;
            width: auto;
            height: auto;
            padding: var(--space-2) var(--space-4);
            box-sizing: border-box;
          }

          .modal--food-logger .food-add-row .btn-log-food-header .btn-log-label {
            position: static;
            width: auto;
            height: auto;
            padding: 0;
            margin: 0;
            overflow: visible;
            clip: auto;
            white-space: normal;
            border: 0;
          }

          /*
           * Cascade guard: DOM is .modal.modal--food-logger > .food-logger.modal > …
           * Dashboard + generic @media (max-width: 768px) rules used to win after FoodLogger’s <style>.
           * One padding budget on .food-card; layout wrappers get padding 0; controls keep explicit padding below.
           */
          .modal.modal--food-logger .food-logger.modal .food-list-section {
            padding: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }

          .modal.modal--food-logger .food-logger.modal .food-list {
            padding: 0 !important;
            margin: 0 !important;
          }

          .modal.modal--food-logger .food-logger.modal .food-card {
            padding: var(--space-3) !important;
            margin-bottom: var(--space-3) !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .modal.modal--food-logger .food-logger.modal .food-card .food-card-title-row,
          .modal.modal--food-logger .food-logger.modal .food-card .food-card-actions-block,
          .modal.modal--food-logger .food-logger.modal .food-card .food-card-buttons-rail,
          .modal.modal--food-logger .food-logger.modal .food-card .servings-row,
          .modal.modal--food-logger .food-logger.modal .food-card .food-card-time-add-group,
          .modal.modal--food-logger .food-logger.modal .food-card .food-card-time-row--slot,
          .modal.modal--food-logger .food-logger.modal .food-card .food-add-row,
          .modal.modal--food-logger .food-logger.modal .food-card .servings-control,
          .modal.modal--food-logger .food-logger.modal .food-card .food-icon {
            padding: 0 !important;
          }

          .modal.modal--food-logger .food-logger.modal .food-card .food-macros--logger {
            padding: 0 !important;
          }

          .modal.modal--food-logger .food-logger.modal .food-card .food-card-buttons-rail .btn-icon-small {
            padding: 0 !important;
            margin: 0 !important;
            -webkit-appearance: none !important;
            appearance: none !important;
            box-sizing: border-box !important;
          }

          .modal.modal--food-logger .food-logger.modal .food-card .btn-servings {
            padding: 0 !important;
            margin: 0 !important;
            -webkit-appearance: none !important;
            appearance: none !important;
            box-sizing: border-box !important;
          }

          .modal.modal--food-logger .food-logger.modal .food-card .time-input::-webkit-datetime-edit,
          .modal.modal--food-logger .food-logger.modal .food-card .time-input::-webkit-datetime-edit-fields-wrapper,
          .modal.modal--food-logger .food-logger.modal .food-card .time-input::-webkit-datetime-edit-text,
          .modal.modal--food-logger .food-logger.modal .food-card .time-input::-webkit-datetime-edit-hour-field,
          .modal.modal--food-logger .food-logger.modal .food-card .time-input::-webkit-datetime-edit-minute-field,
          .modal.modal--food-logger .food-logger.modal .food-card .time-input::-webkit-datetime-edit-ampm-field {
            padding: 0 !important;
            margin: 0 !important;
          }

          .modal.modal--food-logger .food-logger.modal .food-card .food-add-row .btn-log-food-header {
            min-height: 46px !important;
            min-width: 0 !important;
            width: auto !important;
            height: auto !important;
            padding: var(--space-2) var(--space-4) !important;
            box-sizing: border-box !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }

          .modal.modal--food-logger .food-logger.modal .food-card .food-add-row .btn-log-food-header .btn-log-label {
            position: static !important;
            width: auto !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            clip: auto !important;
            white-space: normal !important;
            border: 0 !important;
          }
        }

        /* Force analytics charts to render reliably */
        .modal--food-analytics .food-analytics-view {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          min-height: 0 !important;
          overflow-y: auto !important;
        }

        .modal--food-analytics .analytics-charts {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow: visible !important;
        }

        .modal--food-analytics .chart-container.analytics-chart-container {
          overflow: visible !important;
        }

        /* Mobile: Recharts needs non-collapsing chart height (flex min-height:0 hides charts) */
        @media (max-width: 768px) {
          .modal-backdrop--analytics {
            overflow-y: auto !important;
            align-items: flex-start !important;
            padding: max(var(--space-2), env(safe-area-inset-top, 0px)) var(--space-2) var(--space-2) !important;
            -webkit-overflow-scrolling: touch;
          }

          .modal.modal--food-analytics {
            max-height: none !important;
            min-height: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          .modal--food-analytics .food-analytics-view {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .modal--food-analytics .analytics-charts {
            flex: none !important;
            min-height: unset !important;
            overflow: visible !important;
          }

          .modal--food-analytics .chart-container.analytics-chart-container,
          .modal--food-analytics .recharts-responsive-container {
            height: 260px !important;
            min-height: 260px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FoodLogger;
