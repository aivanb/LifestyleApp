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

  const calculateMacros = () => {
    const calories = parseFloat(formData.calories) || 0;
    const protein = parseFloat(formData.protein) || 0;
    const carbs = parseFloat(formData.carbohydrates) || 0;
    const fat = parseFloat(formData.fat) || 0;

    return { calories, protein, carbs, fat };
  };

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
                     'vitamin_a', 'vitamin_c', 'vitamin_d', 'caffeine'];
      
      fields.forEach(field => {
        if (formData[field]) {
          existingMetadata[field] = formData[field];
        }
      });

      const response = await api.post('/openai/generate-metadata/', {
        food_name: formData.food_name,
        existing_metadata: existingMetadata
      });

      if (response.data.data && response.data.data.metadata) {
        const metadata = response.data.data.metadata;
        
        // Update form with generated metadata
        setFormData(prev => ({
          ...prev,
          ...metadata
        }));
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

    try {
      const response = await api.createFood(formData);
      
      if (response.data.data) {
        if (onFoodCreated) {
          onFoodCreated(response.data.data);
        }
        
        // Reset form
        setFormData({
          ...formData,
          food_name: '',
          serving_size: '',
          calories: '',
          protein: '',
          fat: '',
          carbohydrates: '',
          brand: '',
          cost: '',
        });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create food');
    } finally {
      setLoading(false);
    }
  };

  const macros = calculateMacros();

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

      {/* Macro Preview */}
      <div className="macro-preview card" style={{ background: 'var(--accent-primary-alpha)', marginBottom: 'var(--space-6)' }}>
        <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--accent-primary)' }}>MACRO PREVIEW</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="macro-item">
            <div className="macro-label">Calories</div>
            <div className="macro-value">{macros.calories}</div>
          </div>
          <div className="macro-item">
            <div className="macro-label">Protein</div>
            <div className="macro-value">{macros.protein}g</div>
          </div>
          <div className="macro-item">
            <div className="macro-label">Carbs</div>
            <div className="macro-value">{macros.carbs}g</div>
          </div>
          <div className="macro-item">
            <div className="macro-label">Fat</div>
            <div className="macro-value">{macros.fat}g</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Food Name *</label>
            <input
              type="text"
              name="food_name"
              className="form-input"
              value={formData.food_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Brand</label>
            <input
              type="text"
              name="brand"
              className="form-input"
              value={formData.brand}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Serving Size *</label>
            <input
              type="number"
              name="serving_size"
              className="form-input"
              value={formData.serving_size}
              onChange={handleChange}
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unit *</label>
            <select name="unit" className="form-input" value={formData.unit} onChange={handleChange}>
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

          <div className="form-group">
            <label className="form-label">Food Group *</label>
            <select name="food_group" className="form-input" value={formData.food_group} onChange={handleChange}>
              <option value="protein">Protein</option>
              <option value="fruit">Fruit</option>
              <option value="vegetable">Vegetable</option>
              <option value="grain">Grain</option>
              <option value="dairy">Dairy</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Macronutrients */}
        <div className="card" style={{ background: 'var(--bg-tertiary)', marginBottom: 'var(--space-4)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ margin: 0 }}>MACRONUTRIENTS *</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGenerateMetadata}
              disabled={generatingMetadata || !formData.food_name}
              style={{ fontSize: 'var(--text-sm)' }}
            >
              <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              {generatingMetadata ? 'Generating...' : 'AI Generate Missing Data'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-4">
              <label className="form-label">Calories</label>
              <input
                type="number"
                name="calories"
                className="form-input"
                value={formData.calories}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Protein (g)</label>
              <input
                type="number"
                name="protein"
                className="form-input"
                value={formData.protein}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Carbohydrates (g)</label>
              <input
                type="number"
                name="carbohydrates"
                className="form-input"
                value={formData.carbohydrates}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Fat (g)</label>
              <input
                type="number"
                name="fat"
                className="form-input"
                value={formData.fat}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="form-group">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="make_public"
                checked={formData.make_public}
                onChange={handleChange}
                style={{ width: '20px', height: '20px' }}
              />
              <span className="text-sm">
                <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                </svg>
                Make Public (visible to all users)
              </span>
            </label>
          </div>

          <div className="form-group">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="create_and_log"
                checked={formData.create_and_log}
                onChange={handleChange}
                style={{ width: '20px', height: '20px' }}
              />
              <span className="text-sm">
                <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Log immediately after creation
              </span>
            </label>
          </div>
        </div>

        {formData.create_and_log && (
          <div className="form-group">
            <label className="form-label">Servings to Log</label>
            <input
              type="number"
              name="servings"
              className="form-input"
              value={formData.servings}
              onChange={handleChange}
              step="0.1"
              min="0.1"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
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
      </form>

      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default FoodCreator;

