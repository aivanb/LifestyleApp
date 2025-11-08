import React, { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * MealCreator Component
 * 
 * Allows users to create meals consisting of multiple foods.
 * Features:
 * - Search and select foods
 * - Customize servings for each food
 * - Real-time total macro preview
 * - Option to log immediately after creation
 */
const MealCreator = ({ onMealCreated, onClose }) => {
  const [mealName, setMealName] = useState('');
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [availableFoods, setAvailableFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [createAndLog, setCreateAndLog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('frequency');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, sortBy, sortOrder]);

  const loadFoods = async () => {
    try {
      setLoadingFoods(true);
      const response = await api.getFoods({ search: searchTerm, page_size: 50 });
      
      if (response.data.data && response.data.data.foods) {
        const sortedFoods = sortFoods(response.data.data.foods);
        setAvailableFoods(sortedFoods);
      }
    } catch (err) {
      console.error('Failed to load foods:', err);
    } finally {
      setLoadingFoods(false);
    }
  };

  const sortFoods = (foods) => {
    return [...foods].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'frequency':
          aValue = a.frequency || 0;
          bValue = b.frequency || 0;
          break;
        case 'calories':
          aValue = a.macro_preview?.calories || 0;
          bValue = b.macro_preview?.calories || 0;
          break;
        case 'protein':
          aValue = a.macro_preview?.protein || 0;
          bValue = b.macro_preview?.protein || 0;
          break;
        case 'carbohydrates':
          aValue = a.macro_preview?.carbohydrates || 0;
          bValue = b.macro_preview?.carbohydrates || 0;
          break;
        case 'fat':
          aValue = a.macro_preview?.fat || 0;
          bValue = b.macro_preview?.fat || 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  const addFood = (food) => {
    // Check if food already added
    if (selectedFoods.find(f => f.food_id === food.food_id)) {
      return;
    }

    setSelectedFoods([
      ...selectedFoods,
      {
        ...food,
        servings: 1
      }
    ]);
  };

  const removeFood = (foodId) => {
    setSelectedFoods(selectedFoods.filter(f => f.food_id !== foodId));
  };

  const updateServings = (foodId, servings) => {
    setSelectedFoods(selectedFoods.map(f => 
      f.food_id === foodId ? { ...f, servings: parseFloat(servings) || 0 } : f
    ));
  };

  const calculateTotalMacros = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    selectedFoods.forEach(food => {
      const servings = food.servings || 1;
      totalCalories += (food.macro_preview?.calories || 0) * servings;
      totalProtein += (food.macro_preview?.protein || 0) * servings;
      totalCarbs += (food.macro_preview?.carbohydrates || 0) * servings;
      totalFat += (food.macro_preview?.fat || 0) * servings;
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFoods.length === 0) {
      setError('Please add at least one food to the meal');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const mealData = {
        meal_name: mealName,
        foods: selectedFoods.map(f => ({
          food_id: f.food_id,
          servings: f.servings.toString()
        })),
        create_and_log: createAndLog
      };

      const response = await api.createMeal(mealData);
      
      if (response.data.data) {
        if (onMealCreated) {
          onMealCreated(response.data.data);
        }
        
        // Reset form
        setMealName('');
        setSelectedFoods([]);
        setCreateAndLog(false);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create meal');
    } finally {
      setLoading(false);
    }
  };

  const totalMacros = calculateTotalMacros();

  const handleStepServings = (foodId, direction) => {
    const food = selectedFoods.find(f => f.food_id === foodId);
    if (!food) return;
    
    const currentServings = food.servings || 1;
    const step = 0.1;
    const newServings = direction === 'up' 
      ? currentServings + step 
      : Math.max(0.1, currentServings - step);
    
    updateServings(foodId, newServings);
  };

  return (
    <div className="meal-creator card">
      {error && (
        <div className="error-message">
          <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form id="meal-creator-form" onSubmit={handleSubmit}>
        {/* Layout with form groups on left and food lists on right */}
        <div className="meal-creator-layout">
          <div className="meal-creator-left">
            {/* Meal Name */}
            <div className="form-group">
              <label className="form-label">Meal Name</label>
              <input
                type="text"
                className="form-input form-input-large"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                required
              />
            </div>

            {/* Food Search */}
            <div className="form-group">
              <label className="form-label">
                Search Foods
              </label>
              <input
                type="text"
                className="form-input form-input-large"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Sorting Controls */}
            <div className="form-group sorting-controls-group">
                  <label className="form-label">Sort by</label>
              <div className="sort-by-container">
                  <select
                  className="form-input form-input-dropdown"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="frequency">Frequency</option>
                    <option value="calories">Calories</option>
                    <option value="protein">Protein</option>
                    <option value="carbohydrates">Carbs</option>
                    <option value="fat">Fat</option>
                  </select>
                  <div className="sort-order-container">
                    <button
                      type="button"
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
          
          <div className="meal-creator-right">
            <div className="food-list card" style={{ background: 'var(--bg-secondary)', maxHeight: '400px', overflowY: 'auto', marginBottom: 'var(--space-2)' }}>
              <h3 className="text-sm font-medium mb-3">AVAILABLE FOODS</h3>
              {loadingFoods ? (
                <div className="loading">
                  <div className="spinner"></div>
                </div>
              ) : availableFoods.length > 0 ? (
                availableFoods.map(food => (
                  <div key={food.food_id} className="food-item food-card" onClick={() => addFood(food)}>
                    <div className="food-item-content">
                      <div className="food-main-info">
                        <div className="food-name">{food.food_name}</div>
                        <div className="food-details">
                          {food.brand && `${food.brand} • `}
                          {food.serving_size}{food.unit} • {food.food_group}
                        </div>
                      </div>
                      
                      <div className="food-metadata">
                        <div className="metadata-grid">
                          <div className="metadata-item">
                            <span className="metadata-label">Calories</span>
                            <span className="metadata-value">{food.macro_preview?.calories || 0}</span>
                          </div>
                          <div className="metadata-item">
                            <span className="metadata-label macro-label-protein">Protein</span>
                            <span className="metadata-value">{food.macro_preview?.protein || 0}g</span>
                          </div>
                          <div className="metadata-item">
                            <span className="metadata-label macro-label-carbohydrates">Carbohydrates</span>
                            <span className="metadata-value">{food.macro_preview?.carbohydrates || 0}g</span>
                          </div>
                          <div className="metadata-item">
                            <span className="metadata-label macro-label-fats">Fats</span>
                            <span className="metadata-value">{food.macro_preview?.fat || 0}g</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-tertiary text-sm text-center">No foods found</p>
              )}
            </div>
            
          </div>
        </div>

        {/* Selected Foods - Span across entire meal-creator-card */}
        {selectedFoods.length > 0 && (
          <div className="selected-foods">
            <h3 className="text-sm font-medium mb-3">FOODS IN MEAL ({selectedFoods.length})</h3>
            {selectedFoods.map(food => (
              <div key={food.food_id} className="selected-food-item card animate-slide-in-right" style={{ background: 'var(--bg-tertiary)', marginBottom: 'var(--space-4)' }}>
                <div className="food-content">
                  <div className="food-main-info">
                    <div className="food-name">{food.food_name}</div>
                    <div className="food-details">
                      {food.brand && `${food.brand} • `}
                      {food.serving_size}{food.unit} • {food.food_group}
                    </div>
                  </div>
                  
                  <div className="food-metadata">
                    <div className="metadata-grid">
                      <div className="metadata-item">
                        <span className="metadata-label">Calories</span>
                        <span className="metadata-value">{(food.macro_preview?.calories * food.servings).toFixed(0)}</span>
                      </div>
                      <div className="metadata-item">
                        <span className="metadata-label macro-label-protein">Protein</span>
                        <span className="metadata-value">{(food.macro_preview?.protein * food.servings).toFixed(1)}g</span>
                      </div>
                      <div className="metadata-item">
                        <span className="metadata-label macro-label-carbohydrates">Carbohydrates</span>
                        <span className="metadata-value">{(food.macro_preview?.carbohydrates * food.servings).toFixed(1)}g</span>
                      </div>
                      <div className="metadata-item">
                        <span className="metadata-label macro-label-fats">Fats</span>
                        <span className="metadata-value">{(food.macro_preview?.fat * food.servings).toFixed(1)}g</span>
                      </div>
                    </div>
                  </div>

                  <div className="food-controls">
                    <div className="servings-control">
                      <label className="servings-label">Servings</label>
                      <div className="servings-input-with-steppers">
                        <button 
                          type="button" 
                          className="stepper-btn" 
                          onClick={() => handleStepServings(food.food_id, 'down')}
                        >−</button>
                      <input
                        type="number"
                        value={food.servings}
                        onChange={(e) => updateServings(food.food_id, e.target.value)}
                        className="servings-input"
                        step="0.1"
                        min="0.1"
                      />
                        <button 
                          type="button" 
                          className="stepper-btn" 
                          onClick={() => handleStepServings(food.food_id, 'up')}
                        >+</button>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      className="btn-remove-food"
                      onClick={() => removeFood(food.food_id)}
                      aria-label="Remove food"
                    >
                      <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 10 5.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </form>

      {/* Total Macro Preview - Moved to bottom */}
      {selectedFoods.length > 0 && (
        <div className="macro-preview card animate-scale-in" style={{ background: 'var(--accent-secondary-alpha)', marginTop: 'var(--space-6)' }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--accent-secondary)' }}>TOTAL MACROS</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="macro-item">
              <div className="macro-label">Calories</div>
              <div className="macro-value" style={{ color: 'var(--accent-secondary)' }}>{totalMacros.calories}</div>
            </div>
            <div className="macro-item">
              <div className="macro-label macro-label-protein">Protein</div>
              <div className="macro-value" style={{ color: 'var(--accent-secondary)' }}>{totalMacros.protein}g</div>
            </div>
            <div className="macro-item">
              <div className="macro-label macro-label-carbohydrates">Carbohydrates</div>
              <div className="macro-value" style={{ color: 'var(--accent-secondary)' }}>{totalMacros.carbs}g</div>
            </div>
            <div className="macro-item">
              <div className="macro-label macro-label-fats">Fats</div>
              <div className="macro-value" style={{ color: 'var(--accent-secondary)' }}>{totalMacros.fat}g</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions - Moved to bottom */}
      <div className="meal-creator-actions">
        <div className="form-group">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={createAndLog}
              onChange={(e) => setCreateAndLog(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-label">Log</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button 
            type="button"
            className="btn btn-success" 
            disabled={loading || selectedFoods.length === 0}
            onClick={handleSubmit}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {loading ? 'Creating...' : 'Create Meal'}
          </button>
          
          {onClose && (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .meal-creator-layout {
          display: grid;
          grid-template-columns: 40% 60%;
          gap: var(--space-6);
          margin-bottom: var(--space-6);
        }

        .meal-creator-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .meal-creator-right {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .macro-preview {
          border-left: 4px solid var(--accent-secondary);
        }

        .macro-item {
          text-align: center;
        }

        .macro-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-1);
        }

        .macro-value {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
        }

        .food-item {
          padding: var(--space-4);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          margin-bottom: var(--space-3);
        }

        .food-card {
          background: var(--bg-tertiary);
        }

        .food-item:hover {
          background: var(--bg-hover);
          transform: translateX(4px);
        }

        .food-item-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .food-main-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .food-name {
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
        }

        .food-details {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .food-metadata {
          background: var(--bg-secondary);
          padding: var(--space-3);
          border-radius: var(--radius-md);
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-3);
        }

        .metadata-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
        }

        .metadata-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-weight-medium);
        }

        .metadata-value {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .food-macros {
          margin-left: var(--space-4);
        }

        .selected-food-item {
          padding: var(--space-4);
        }

        .food-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .food-main-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .food-name {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
        }

        .food-details {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .food-metadata {
          background: var(--bg-secondary);
          padding: var(--space-3);
          border-radius: var(--radius-md);
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-3);
        }

        .metadata-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
        }

        .metadata-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-weight-medium);
        }

        .metadata-value {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .food-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .servings-control {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .servings-label {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
        }

        .servings-input-with-steppers {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .servings-input-with-steppers .servings-input {
          width: 80px;
          padding: var(--space-2);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--text-primary);
          text-align: center;
          font-family: var(--font-primary);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .servings-input-with-steppers .stepper-btn {
          width: 32px;
          height: 32px;
          padding: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          opacity: 0.8;
        }

        .servings-input-with-steppers .stepper-btn:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          opacity: 1;
        }

        .servings-input-with-steppers .stepper-btn:active {
          transform: scale(0.95);
        }

        .servings-input {
          width: 80px;
          padding: var(--space-2);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
          color: var(--text-primary);
          text-align: center;
          font-family: var(--font-primary);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .btn-remove-food {
          width: 40px;
          height: 40px;
          padding: 0;
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-remove-food:hover {
          background: var(--accent-danger-alpha);
          color: var(--accent-danger);
          border-color: var(--accent-danger);
        }

        @media (max-width: 768px) {
          .metadata-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .food-controls {
            flex-direction: column;
            gap: var(--space-4);
            align-items: flex-start;
          }
          
          .servings-control {
            width: 100%;
            justify-content: space-between;
          }
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          cursor: pointer;
          user-select: none;
          padding: var(--space-2);
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

        .form-input-large {
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-base);
          width: 100%;
        }

        .sorting-controls-group {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }

        .sort-by-container {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          width: 100%;
          max-width: 250px;
        }

        .sort-order-container {
          display: flex;
          gap: var(--space-1);
          flex-shrink: 0;
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

        .form-input-dropdown {
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-sm);
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
          min-height: 40px;
        }

        .meal-creator-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: var(--space-4);
          margin-top: var(--space-6);
          padding-top: var(--space-4);
          border-top: 1px solid var(--border-primary);
        }

        .meal-creator-actions .form-group {
          margin: 0;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default MealCreator;

