import React, { useState } from 'react';
import api from '../services/api';

/**
 * FoodCreator Component
 * 
 * Allows users to create new food entries with all nutritional data.
 * Features:
 * - Complete nutritional information input
 * - Real-time macro preview
 * - Option to mark as public
 * - Option to log immediately after creation
 */
const FoodCreator = ({ onFoodCreated, onClose }) => {
  const [formData, setFormData] = useState({
    food_name: '',
    serving_size: '',
    unit: 'g',
    calories: '',
    protein: '',
    fat: '',
    carbohydrates: '',
    fiber: '',
    sodium: '',
    sugar: '',
    saturated_fat: '',
    trans_fat: '',
    calcium: '',
    iron: '',
    magnesium: '',
    cholesterol: '',
    vitamin_a: '',
    vitamin_c: '',
    vitamin_d: '',
    caffeine: '',
    food_group: 'other',
    brand: '',
    cost: '',
    make_public: false,
    create_and_log: false,
    servings: '1'
  });

  const [loading, setLoading] = useState(false);
  const [generatingMetadata, setGeneratingMetadata] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // const calculateMacros = () => {
  //   const calories = parseFloat(formData.calories) || 0;
  //   const protein = parseFloat(formData.protein) || 0;
  //   const carbs = parseFloat(formData.carbohydrates) || 0;
  //   const fat = parseFloat(formData.fat) || 0;

  //   return { calories, protein, carbs, fat };
  // };

  const handleGenerateMetadata = async () => {
    if (!formData.food_name) {
      setError('Please enter a food name first');
      return;
    }

    setGeneratingMetadata(true);
    setError('');

    try {
      // Collect existing metadata
      const existingMetadata = {};
      const fields = ['calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sodium', 'sugar', 
                     'saturated_fat', 'trans_fat', 'calcium', 'iron', 'magnesium', 'cholesterol',
                     'vitamin_a', 'vitamin_c', 'vitamin_d', 'caffeine', 'brand', 'serving_size', 'unit', 'food_group', 'cost'];
      
      fields.forEach(field => {
        if (formData[field] && formData[field] !== '') {
          existingMetadata[field] = formData[field];
        }
      });

      const response = await api.post('/openai/generate-metadata/', {
        food_name: formData.food_name,
        existing_metadata: existingMetadata
      });

      if (response.data.data && response.data.data.metadata) {
        const metadata = response.data.data.metadata;
        
        // Update form with generated metadata, but preserve user input
        setFormData(prev => {
          const updated = { ...prev };
          // Only update fields that are empty or missing
          Object.keys(metadata).forEach(key => {
            if (!prev[key] || prev[key] === '' || prev[key] === 0) {
              updated[key] = metadata[key];
            }
          });
          return updated;
        });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to generate metadata');
    } finally {
      setGeneratingMetadata(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    const requiredFields = ['calories', 'protein', 'carbohydrates', 'fat'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field] === '');
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required macros: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      const response = await api.createFood(formData);
      
      if (response.data.data) {
        if (onFoodCreated) {
          onFoodCreated(response.data.data);
        }
        
        // If create_and_log is true, log the food immediately
        if (formData.create_and_log) {
          const logData = {
            food: response.data.data.food_id,
            servings: formData.servings,
            measurement: formData.unit,
            date_time: new Date().toISOString()
          };
          
          await api.createFoodLog(logData);
        }
        
        // Reset form
        setFormData({
          food_name: '',
          serving_size: '',
          unit: 'g',
          calories: '',
          protein: '',
          fat: '',
          carbohydrates: '',
          fiber: '',
          sodium: '',
          sugar: '',
          saturated_fat: '',
          trans_fat: '',
          calcium: '',
          iron: '',
          magnesium: '',
          cholesterol: '',
          vitamin_a: '',
          vitamin_c: '',
          vitamin_d: '',
          caffeine: '',
          food_group: 'other',
          brand: '',
          cost: '',
          make_public: false,
          create_and_log: false,
          servings: '1'
        });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create food');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="food-creator card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="icon icon-lg" viewBox="0 0 20 20" fill="var(--accent-primary)">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <h2 className="card-title">Create New Food</h2>
          </div>
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

      {/* Macro Requirements Message */}

      <form onSubmit={handleSubmit}>
        {/* Top Options */}
        <div className="form-options-top">
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {loading ? 'Creating...' : 'Create Food'}
            </button>
            
            {onClose && (
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
            )}
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                name="make_public"
                checked={formData.make_public}
                onChange={handleChange}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-label">Make Public</span>
            </label>

            <label className="checkbox-container">
              <input
                type="checkbox"
                name="create_and_log"
                checked={formData.create_and_log}
                onChange={handleChange}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-label">Log Immediately</span>
            </label>
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-section">
          <div className="form-grid-2">
            <div className="form-group-small">
              <label className="form-label">Food Name</label>
              <input
                type="text"
                name="food_name"
                className="form-input-small"
                value={formData.food_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Brand</label>
              <input
                type="text"
                name="brand"
                className="form-input-small"
                value={formData.brand}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group-small">
              <label className="form-label">Serving Size</label>
              <input
                type="number"
                name="serving_size"
                className="form-input-small"
                value={formData.serving_size}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Unit</label>
              <select name="unit" className="form-input-small" value={formData.unit} onChange={handleChange}>
                <option value="g">Grams (g)</option>
                <option value="oz">Ounces (oz)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="cup">Cup</option>
                <option value="tbsp">Tablespoon</option>
                <option value="tsp">Teaspoon</option>
                <option value="piece">Piece</option>
                <option value="serving">Serving</option>
              </select>
            </div>

            <div className="form-group-small">
              <label className="form-label">Food Group</label>
              <select name="food_group" className="form-input-small" value={formData.food_group} onChange={handleChange}>
                <option value="protein">Protein</option>
                <option value="fruit">Fruit</option>
                <option value="vegetable">Vegetable</option>
                <option value="grain">Grain</option>
                <option value="dairy">Dairy</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Generate Missing Data Button - Moved to top */}
        <div className="form-section">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleGenerateMetadata}
            disabled={generatingMetadata || !formData.food_name}
          >
            <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            {generatingMetadata ? 'Generating...' : 'AI Generate Missing Data'}
          </button>
        </div>

        {/* Horizontal Form Sections */}
        <div className="form-sections-horizontal">
          {/* Macronutrients */}
          <div className="form-section">
          <div className="form-grid-4">
            <div className="form-group-small">
              <label className="form-label">Calories</label>
              <input
                type="number"
                name="calories"
                className="form-input-small"
                value={formData.calories}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Protein (g)</label>
              <input
                type="number"
                name="protein"
                className="form-input-small"
                value={formData.protein}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Carbohydrates (g)</label>
              <input
                type="number"
                name="carbohydrates"
                className="form-input-small"
                value={formData.carbohydrates}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Fat (g)</label>
              <input
                type="number"
                name="fat"
                className="form-input-small"
                value={formData.fat}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Fiber (g)</label>
              <input
                type="number"
                name="fiber"
                className="form-input-small"
                value={formData.fiber}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Sugar (g)</label>
              <input
                type="number"
                name="sugar"
                className="form-input-small"
                value={formData.sugar}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Saturated Fat (g)</label>
              <input
                type="number"
                name="saturated_fat"
                className="form-input-small"
                value={formData.saturated_fat}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Trans Fat (g)</label>
              <input
                type="number"
                name="trans_fat"
                className="form-input-small"
                value={formData.trans_fat}
                onChange={handleChange}
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Minerals */}
        <div className="form-section">
          <div className="form-grid-horizontal">
            <div className="form-group-small">
              <label className="form-label">Sodium (mg)</label>
              <input
                type="number"
                name="sodium"
                className="form-input-small"
                value={formData.sodium}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Calcium (mg)</label>
              <input
                type="number"
                name="calcium"
                className="form-input-small"
                value={formData.calcium}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Iron (mg)</label>
              <input
                type="number"
                name="iron"
                className="form-input-small"
                value={formData.iron}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Magnesium (mg)</label>
              <input
                type="number"
                name="magnesium"
                className="form-input-small"
                value={formData.magnesium}
                onChange={handleChange}
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Vitamins */}
        <div className="form-section">
          <div className="form-grid-horizontal">
            <div className="form-group-small">
              <label className="form-label">Vitamin A (mcg)</label>
              <input
                type="number"
                name="vitamin_a"
                className="form-input-small"
                value={formData.vitamin_a}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Vitamin C (mg)</label>
              <input
                type="number"
                name="vitamin_c"
                className="form-input-small"
                value={formData.vitamin_c}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Vitamin D (mcg)</label>
              <input
                type="number"
                name="vitamin_d"
                className="form-input-small"
                value={formData.vitamin_d}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Cholesterol (mg)</label>
              <input
                type="number"
                name="cholesterol"
                className="form-input-small"
                value={formData.cholesterol}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Caffeine (mg)</label>
              <input
                type="number"
                name="caffeine"
                className="form-input-small"
                value={formData.caffeine}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="form-group-small">
              <label className="form-label">Cost ($)</label>
              <input
                type="number"
                name="cost"
                className="form-input-small"
                value={formData.cost}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>
        </div>

        {/* Servings for Logging */}
        {formData.create_and_log && (
          <div className="form-section">
            <h3 className="section-title">Logging Options</h3>
            <div className="form-grid-1">
              <div className="form-group-small">
                <label className="form-label">Servings to Log</label>
                <input
                  type="number"
                  name="servings"
                  className="form-input-small"
                  value={formData.servings}
                  onChange={handleChange}
                  step="0.1"
                  min="0.1"
                />
              </div>
            </div>
          </div>
        )}
      </form>

      <style jsx>{`
        .form-options-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-primary);
        }

        .form-actions {
          display: flex;
          gap: var(--space-3);
        }

        .form-options {
          display: flex;
          gap: var(--space-4);
        }

        .form-section {
          margin-bottom: var(--space-4);
          padding: var(--space-4);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
        }

        .form-sections-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .form-sections-horizontal {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-4);
        }

        .form-section:first-child .form-input-small {
          width: 100%;
          min-width: 250px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }

        .section-title {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-grid-1 {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: var(--space-3);
        }

        .form-grid-4 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: var(--space-3);
        }

        .btn-sm {
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-sm);
        }

        .macro-preview {
          border-left: 4px solid var(--accent-primary);
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
          color: var(--accent-primary);
        }

        @media (max-width: 768px) {
          .form-options-top {
            flex-direction: column;
            gap: var(--space-4);
            align-items: flex-start;
          }

          .form-grid-2,
          .form-grid-3,
          .form-grid-4 {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1024px) {
          .form-grid-4 {
            grid-template-columns: 1fr 1fr;
          }
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 18px;
          height: 18px;
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          position: relative;
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
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .form-grid-horizontal {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-4);
        }

        .form-group-small {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .form-input-small {
          width: 120px;
          max-width: 120px;
          padding: var(--space-2) var(--space-3);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          color: var(--text-primary);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .form-input-small:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
        }
      `}</style>
    </div>
  );
};

export default FoodCreator;

