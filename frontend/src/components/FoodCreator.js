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

  const handleStepValue = (name, direction) => {
    const currentValue = parseFloat(formData[name]) || 0;
    // Determine step based on field type
    let step = 1; // Default step of 1 for all fields
    if (name === 'serving_size' || name === 'servings') {
      step = 0.1; // Only serving size and servings step by 0.1
    }
    
    const newValue = direction === 'up' 
      ? currentValue + step 
      : Math.max(0, currentValue - step);
    
    // Round to appropriate decimal places based on step
    let roundedValue;
    if (step >= 1) {
      roundedValue = Math.round(newValue); // Whole numbers
    } else if (step >= 0.1) {
      roundedValue = Math.round(newValue * 10) / 10; // 1 decimal place
    } else {
      roundedValue = Math.round(newValue * 100) / 100; // 2 decimal places
    }
    
    setFormData({
      ...formData,
      [name]: roundedValue.toString()
    });
  };

  return (
    <div className="food-creator card">
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
        {/* AI Generate Button */}
        <div className="ai-generate-container">
          <button
            type="button"
            className="btn btn-ai-generate"
            onClick={handleGenerateMetadata}
            disabled={generatingMetadata || !formData.food_name}
          >
            <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            {generatingMetadata ? 'Generating...' : 'AI Generate Missing Data'}
            </button>
          </div>

        {/* Table Format */}
        <table className="create-form-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Value</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            <tr className="even-row">
              <td className="create-label-cell">Food Name</td>
              <td className="create-value-cell">
                <input type="text" name="food_name" value={formData.food_name} onChange={handleChange} required />
              </td>
              <td className="create-unit-cell"></td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Brand</td>
              <td className="create-value-cell">
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} />
              </td>
              <td className="create-unit-cell"></td>
            </tr>
            <tr className="even-row">
              <td className="create-label-cell">Serving Size</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('serving_size', 'down')}>−</button>
                  <input type="number" name="serving_size" value={formData.serving_size} onChange={handleChange} step="0.01" required />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('serving_size', 'up')}>+</button>
          </div>
              </td>
              <td className="create-unit-cell">
                <select name="unit" value={formData.unit} onChange={handleChange}>
                  <option value="g">g</option>
                  <option value="oz">oz</option>
                  <option value="ml">ml</option>
                  <option value="cup">cup</option>
                  <option value="tbsp">tbsp</option>
                  <option value="tsp">tsp</option>
                  <option value="piece">piece</option>
                  <option value="serving">serving</option>
              </select>
              </td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Food Group</td>
              <td className="create-value-cell">
                <select name="food_group" value={formData.food_group} onChange={handleChange}>
                <option value="protein">Protein</option>
                <option value="fruit">Fruit</option>
                <option value="vegetable">Vegetable</option>
                <option value="grain">Grain</option>
                <option value="dairy">Dairy</option>
                <option value="other">Other</option>
              </select>
              </td>
              <td className="create-unit-cell"></td>
            </tr>
            <tr className="even-row">
              <td className="create-label-cell">Calories</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('calories', 'down')}>−</button>
                  <input type="number" name="calories" value={formData.calories} onChange={handleChange} step="0.01" required />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('calories', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">kcal</td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Protein</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('protein', 'down')}>−</button>
                  <input type="number" name="protein" value={formData.protein} onChange={handleChange} step="0.01" required />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('protein', 'up')}>+</button>
          </div>
              </td>
              <td className="create-unit-cell">g</td>
            </tr>
            <tr className="even-row">
              <td className="create-label-cell">Fat</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('fat', 'down')}>−</button>
                  <input type="number" name="fat" value={formData.fat} onChange={handleChange} step="0.01" required />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('fat', 'up')}>+</button>
        </div>
              </td>
              <td className="create-unit-cell">g</td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Carbohydrates</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('carbohydrates', 'down')}>−</button>
                  <input type="number" name="carbohydrates" value={formData.carbohydrates} onChange={handleChange} step="0.01" required />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('carbohydrates', 'up')}>+</button>
        </div>
              </td>
              <td className="create-unit-cell">g</td>
            </tr>
            <tr className="even-row">
              <td className="create-label-cell">Fiber</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('fiber', 'down')}>−</button>
                  <input type="number" name="fiber" value={formData.fiber} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('fiber', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">g</td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Sodium</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('sodium', 'down')}>−</button>
                  <input type="number" name="sodium" value={formData.sodium} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('sodium', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">mg</td>
            </tr>
            <tr className="even-row">
              <td className="create-label-cell">Sugar</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('sugar', 'down')}>−</button>
                  <input type="number" name="sugar" value={formData.sugar} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('sugar', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">g</td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Saturated Fat</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('saturated_fat', 'down')}>−</button>
                  <input type="number" name="saturated_fat" value={formData.saturated_fat} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('saturated_fat', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">g</td>
            </tr>
            <tr className="even-row">
              <td className="create-label-cell">Trans Fat</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('trans_fat', 'down')}>−</button>
                  <input type="number" name="trans_fat" value={formData.trans_fat} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('trans_fat', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">g</td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Calcium</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('calcium', 'down')}>−</button>
                  <input type="number" name="calcium" value={formData.calcium} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('calcium', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">mg</td>
            </tr>
            <tr className="even-row">
              <td className="create-label-cell">Iron</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('iron', 'down')}>−</button>
                  <input type="number" name="iron" value={formData.iron} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('iron', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">mg</td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Magnesium</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('magnesium', 'down')}>−</button>
                  <input type="number" name="magnesium" value={formData.magnesium} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('magnesium', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">mg</td>
            </tr>
            <tr className="even-row">
              <td className="create-label-cell">Cholesterol</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('cholesterol', 'down')}>−</button>
                  <input type="number" name="cholesterol" value={formData.cholesterol} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('cholesterol', 'up')}>+</button>
          </div>
              </td>
              <td className="create-unit-cell">mg</td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Vitamin A</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('vitamin_a', 'down')}>−</button>
                  <input type="number" name="vitamin_a" value={formData.vitamin_a} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('vitamin_a', 'up')}>+</button>
        </div>
              </td>
              <td className="create-unit-cell">IU</td>
            </tr>
            <tr className="even-row">
              <td className="create-label-cell">Vitamin C</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('vitamin_c', 'down')}>−</button>
                  <input type="number" name="vitamin_c" value={formData.vitamin_c} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('vitamin_c', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">mg</td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Vitamin D</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('vitamin_d', 'down')}>−</button>
                  <input type="number" name="vitamin_d" value={formData.vitamin_d} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('vitamin_d', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">IU</td>
            </tr>
            <tr className="even-row">
              <td className="create-label-cell">Caffeine</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('caffeine', 'down')}>−</button>
                  <input type="number" name="caffeine" value={formData.caffeine} onChange={handleChange} step="0.01" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('caffeine', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">mg</td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Cost</td>
              <td className="create-value-cell">
                <div className="input-with-external-steppers">
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('cost', 'down')}>−</button>
                  <input type="number" name="cost" value={formData.cost} onChange={handleChange} step="0.01" min="0" />
                  <button type="button" className="stepper-btn" onClick={() => handleStepValue('cost', 'up')}>+</button>
            </div>
              </td>
              <td className="create-unit-cell">$</td>
            </tr>
            <tr className="even-row">
              <td className="create-label-cell">Public Food</td>
              <td className="create-value-cell">
                <label className="checkbox-inline">
                  <input type="checkbox" name="make_public" checked={formData.make_public} onChange={handleChange} />
                  <span>Make Public</span>
                </label>
              </td>
              <td className="create-unit-cell"></td>
            </tr>
            <tr className="odd-row">
              <td className="create-label-cell">Log</td>
              <td className="create-value-cell">
                <label className="checkbox-inline">
                  <input type="checkbox" name="create_and_log" checked={formData.create_and_log} onChange={handleChange} />
                  <span>Log immediately</span>
                </label>
              </td>
              <td className="create-unit-cell"></td>
            </tr>
            {formData.create_and_log && (
              <tr className="even-row">
                <td className="create-label-cell">Servings to Log</td>
                <td className="create-value-cell">
                  <div className="input-with-external-steppers">
                    <button type="button" className="stepper-btn" onClick={() => handleStepValue('servings', 'down')}>−</button>
                    <input type="number" name="servings" value={formData.servings} onChange={handleChange} step="0.1" min="0.1" />
                    <button type="button" className="stepper-btn" onClick={() => handleStepValue('servings', 'up')}>+</button>
          </div>
                </td>
                <td className="create-unit-cell"></td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Bottom Options */}
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
            </div>
      </form>

      <style>{`
        .form-options-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-6);
          padding-top: var(--space-4);
          border-top: 1px solid var(--border-primary);
        }

        .form-actions {
          display: flex;
          gap: var(--space-3);
        }

        .form-options {
          display: flex;
          gap: var(--space-4);
        }

        .ai-generate-container {
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          margin-bottom: var(--space-4);
        }

        .create-form-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: var(--space-4);
        }

        .create-form-table thead {
          background: var(--bg-tertiary);
        }

        .create-form-table th {
          padding: var(--space-3) var(--space-4);
          text-align: left;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          border-bottom: 2px solid var(--border-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .create-form-table tbody tr {
          transition: background 0.2s var(--ease-out-cubic);
        }

        .create-form-table tbody tr.even-row {
          background: var(--bg-secondary);
        }

        .create-form-table tbody tr.odd-row {
          background: var(--bg-tertiary);
        }

        .create-form-table tbody tr:hover {
          background: var(--bg-hover);
        }

        .create-form-table td {
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--border-primary);
        }

        .create-label-cell {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          font-size: var(--text-sm);
          width: 35%;
        }

        .create-value-cell {
          width: 40%;
        }

        .create-value-cell input,
        .create-value-cell select {
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

        .create-value-cell input:focus,
        .create-value-cell select:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
        }

        .create-unit-cell {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          font-size: var(--text-base);
          width: 25%;
        }

        .create-unit-cell select {
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

        .create-unit-cell select:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
        }

        .btn-ai-generate {
          padding: var(--space-3) var(--space-6);
          background: linear-gradient(135deg, var(--accent-primary) 0%, #4F9CF9 100%);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          white-space: nowrap;
        }

        .btn-ai-generate:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .btn-ai-generate:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .macros-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: var(--space-6);
        }

        .form-group-serving-unit {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          align-items: center;
        }

        .serving-unit-row {
          display: flex;
          align-items: flex-end;
          gap: var(--space-3);
        }

        .input-with-external-steppers {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          width: 100%;
          justify-content: center;
        }

        .create-value-cell .input-with-external-steppers input {
          width: auto;
          flex: 1;
          max-width: 150px;
        }

        .stepper-btn {
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

        .stepper-btn:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          opacity: 1;
        }

        .stepper-btn:active {
          transform: scale(0.95);
        }

        .input-with-external-steppers .form-input-small,
        .input-with-external-steppers .form-input-uniform,
        .input-with-external-steppers .form-input-serving-size {
          border: 1px solid var(--border-primary);
          background: var(--bg-secondary);
          text-align: center;
          min-width: 0;
        }

        .input-with-external-steppers .form-input-uniform {
          width: 100px;
          max-width: 100px;
        }

        .input-with-external-steppers .form-input-serving-size {
          width: 80px;
          max-width: 80px;
        }

        .input-with-external-steppers .form-input-small {
          width: 100px;
          max-width: 100px;
        }

        .input-with-external-steppers .form-input-small:focus,
        .input-with-external-steppers .form-input-uniform:focus,
        .input-with-external-steppers .form-input-serving-size:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
        }

        .form-input-unit {
          width: 140px;
          max-width: 140px;
          padding: var(--space-2) var(--space-3);
          font-family: var(--font-primary);
          font-size: var(--text-base);
          color: var(--text-primary);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .form-input-unit:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
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

        .form-grid-horizontal {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-4);
        }

        .form-group-small {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          align-items: center;
        }

        .form-group-large {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          align-items: center;
        }

        .form-label {
          text-align: center;
          width: 100%;
        }

        .form-input-small {
          width: 100px;
          max-width: 100px;
          padding: var(--space-2) var(--space-3);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          color: var(--text-primary);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .form-input-serving-size {
          width: 80px;
          max-width: 80px;
          padding: var(--space-2) var(--space-3);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          color: var(--text-primary);
          background: transparent;
          border: none;
          text-align: center;
        }

        .form-input-large {
          width: 100%;
          padding: var(--space-2) var(--space-3);
          font-family: var(--font-primary);
          font-size: var(--text-base);
          color: var(--text-primary);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .form-input-uniform {
          width: 100px;
          max-width: 100px;
          padding: var(--space-2) var(--space-3);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          color: var(--text-primary);
          background: transparent;
          border: none;
          text-align: center;
          transition: all 0.2s var(--ease-out-cubic);
        }

        .form-input-small:focus,
        .form-input-large:focus,
        .form-input-uniform:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-alpha);
        }

        @media (max-width: 768px) {
          .basic-info-grid {
            grid-template-columns: 1fr;
          }

          .ai-generate-container {
            padding-top: 0;
            justify-content: center;
          }

          .macros-grid {
            grid-template-columns: 1fr 1fr;
          }

          .metadata-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default FoodCreator;

