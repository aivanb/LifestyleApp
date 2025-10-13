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

  useEffect(() => {
    loadFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const loadFoods = async () => {
    try {
      setLoadingFoods(true);
      const response = await api.getFoods({ search: searchTerm, page_size: 50 });
      
      if (response.data.data && response.data.data.foods) {
        setAvailableFoods(response.data.data.foods);
      }
    } catch (err) {
      console.error('Failed to load foods:', err);
    } finally {
      setLoadingFoods(false);
    }
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

  return (
    <div className="meal-creator card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="icon icon-lg" viewBox="0 0 20 20" fill="var(--accent-secondary)">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            <h2 className="card-title">Create New Meal</h2>
          </div>
          {onClose && (
            <button className="btn-icon" onClick={onClose} aria-label="Close">
              <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 10 5.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Total Macro Preview */}
      {selectedFoods.length > 0 && (
        <div className="macro-preview card animate-scale-in" style={{ background: 'var(--accent-secondary-alpha)', marginBottom: 'var(--space-6)' }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--accent-secondary)' }}>TOTAL MACROS</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="macro-item">
              <div className="macro-label">Calories</div>
              <div className="macro-value" style={{ color: 'var(--accent-secondary)' }}>{totalMacros.calories}</div>
            </div>
            <div className="macro-item">
              <div className="macro-label">Protein</div>
              <div className="macro-value" style={{ color: 'var(--accent-secondary)' }}>{totalMacros.protein}g</div>
            </div>
            <div className="macro-item">
              <div className="macro-label">Carbs</div>
              <div className="macro-value" style={{ color: 'var(--accent-secondary)' }}>{totalMacros.carbs}g</div>
            </div>
            <div className="macro-item">
              <div className="macro-label">Fat</div>
              <div className="macro-value" style={{ color: 'var(--accent-secondary)' }}>{totalMacros.fat}g</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Meal Name */}
        <div className="form-group">
          <label className="form-label">Meal Name *</label>
          <input
            type="text"
            className="form-input"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="e.g., Post-Workout Shake"
            required
          />
        </div>

        {/* Food Search */}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for foods to add..."
          />
        </div>

        {/* Available Foods */}
        {searchTerm && (
          <div className="food-list card" style={{ background: 'var(--bg-tertiary)', maxHeight: '200px', overflowY: 'auto', marginBottom: 'var(--space-4)' }}>
            {loadingFoods ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : availableFoods.length > 0 ? (
              availableFoods.map(food => (
                <div key={food.food_id} className="food-item" onClick={() => addFood(food)}>
                  <span className="food-name">{food.food_name}</span>
                  <span className="food-macros text-xs text-tertiary">
                    {food.macro_preview?.calories}cal | {food.macro_preview?.protein}g P
                  </span>
                </div>
              ))
            ) : (
              <p className="text-tertiary text-sm text-center">No foods found</p>
            )}
          </div>
        )}

        {/* Selected Foods */}
        {selectedFoods.length > 0 && (
          <div className="selected-foods">
            <h3 className="text-sm font-medium mb-3">FOODS IN MEAL ({selectedFoods.length})</h3>
            {selectedFoods.map(food => (
              <div key={food.food_id} className="selected-food-item card animate-slide-in-right" style={{ background: 'var(--bg-tertiary)', marginBottom: 'var(--space-3)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{food.food_name}</div>
                    <div className="text-xs text-tertiary">
                      {food.macro_preview?.calories}cal per serving
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={food.servings}
                      onChange={(e) => updateServings(food.food_id, e.target.value)}
                      className="form-input"
                      style={{ width: '80px' }}
                      step="0.1"
                      min="0.1"
                    />
                    <span className="text-sm text-secondary">servings</span>
                    
                    <button
                      type="button"
                      className="btn-icon"
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

        {/* Create and Log Option */}
        <div className="form-group">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={createAndLog}
              onChange={(e) => setCreateAndLog(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <span className="text-sm">
              <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Log all foods immediately after creation
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button 
            type="submit" 
            className="btn btn-success" 
            disabled={loading || selectedFoods.length === 0}
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
      </form>

      <style jsx>{`
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
          padding: var(--space-3);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .food-item:hover {
          background: var(--bg-hover);
          transform: translateX(4px);
        }

        .food-name {
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
        }

        .food-macros {
          margin-left: var(--space-4);
        }

        .selected-food-item {
          padding: var(--space-4);
        }
      `}</style>
    </div>
  );
};

export default MealCreator;

