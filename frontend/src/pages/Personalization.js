import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * Personalization Component
 * 
 * Comprehensive personalization management with:
 * - Goal management
 * - Body composition goals
 * - Macro goals
 */
const Personalization = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBodyComposition, setEditingBodyComposition] = useState(false);
  const [editingMacroGoals, setEditingMacroGoals] = useState(false);
  const bodyCompositionGoalKeys = ['weight_goal', 'lean_mass_goal', 'fat_mass_goal', 'cost_goal'];
  const primaryMacroGoalKeys = ['calories_goal', 'carbohydrates_goal', 'protein_goal', 'fat_goal', 'sodium_goal'];
  const knownMacroGoalKeys = [
    'calories_goal',
    'protein_goal',
    'fat_goal',
    'carbohydrates_goal',
    'fiber_goal',
    'sodium_goal',
    'sugar_goal',
    'saturated_fat_goal',
    'trans_fat_goal',
    'calcium_goal',
    'iron_goal',
    'magnesium_goal',
    'cholesterol_goal',
    'vitamin_a_goal',
    'vitamin_c_goal',
    'vitamin_d_goal',
    'caffeine_goal',
  ];

  useEffect(() => {
    // Override global .main-content centering only while on /personalization.
    if (typeof document !== 'undefined') {
      document.body.classList.add('route-personalization');
    }
    loadPersonalizationData();

    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('route-personalization');
      }
    };
  }, []);

  const loadPersonalizationData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile/');
      
      if (response.data.data) {
        setGoals(response.data.data.goals);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 
                          err.message || 
                          'Failed to load personalization data';
      setError(errorMessage);
      console.error('Personalization load error:', err);
      
      // Log detailed error in development
      if (process.env.NODE_ENV === 'development' && err.response?.data?.error?.details) {
        console.error('Error details:', err.response.data.error.details);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoalsUpdate = async (updatedGoals) => {
    try {
      const sanitizedGoals = Object.fromEntries(
        Object.entries(updatedGoals || {}).map(([k, v]) => [k, v === '' ? null : v])
      );
      await api.put('/users/goals/', sanitizedGoals);
      await loadPersonalizationData();
      setEditingBodyComposition(false);
      setEditingMacroGoals(false);
    } catch (err) {
      setError('Failed to update goals');
      console.error('Goals update error:', err);
    }
  };

  const formatGoalLabel = (key) => {
    const base = `${key}`.replace(/_goal$/i, '').replace(/_/g, ' ');
    return base.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getUnitForGoalKey = (key) => {
    const units = {
      // Body composition
      weight_goal: 'kg',
      lean_mass_goal: 'kg',
      fat_mass_goal: 'kg',
      cost_goal: '$',

      // Macros + nutrition
      calories_goal: 'kcal',
      protein_goal: 'g',
      fat_goal: 'g',
      carbohydrates_goal: 'g',
      fiber_goal: 'g',
      sodium_goal: 'mg',
      sugar_goal: 'g',
      saturated_fat_goal: 'g',
      trans_fat_goal: 'g',
      calcium_goal: 'mg',
      iron_goal: 'mg',
      magnesium_goal: 'mg',
      cholesterol_goal: 'mg',
      vitamin_a_goal: 'IU',
      vitamin_c_goal: 'mg',
      vitamin_d_goal: 'IU',
      caffeine_goal: 'mg',
    };

    return units[key] || '';
  };

  const formatGoalValue = (key, value) => {
    if (value === null || value === undefined || value === '') return 'Not set';

    const unit = getUnitForGoalKey(key);
    if (unit === '$') return `$${value}`;
    if (!unit) return `${value}`;
    return `${value} ${unit}`;
  };

  const macroGoalKeysRaw = Array.from(
    new Set([
      ...knownMacroGoalKeys,
      ...Object.keys(goals || {}).filter(
        (key) => `${key}`.endsWith('_goal') && !bodyCompositionGoalKeys.includes(key)
      ),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const macroGoalKeys = [
    ...primaryMacroGoalKeys,
    ...macroGoalKeysRaw.filter((k) => !primaryMacroGoalKeys.includes(k)),
  ];

  if (loading) {
    return (
      <div className="personalization-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading personalization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="personalization-page">
      <div className="personalization-actions">
        <button
          type="button"
          className="btn btn-primary personalization-action-btn"
          onClick={() => navigate('/personalization/muscle-priority')}
        >
          Muscle Priority
        </button>
        <button
          type="button"
          className="btn btn-primary personalization-splits-btn"
          onClick={() => navigate('/personalization/splits')}
        >
          Splits
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Body Composition Goals */}
      <div className="goals-section goals-section--body-comp">
        {editingBodyComposition ? (
          <BodyCompositionForm 
            goals={goals}
            onSave={handleGoalsUpdate}
          />
        ) : (
          <div className="goals-display">
            {bodyCompositionGoalKeys.map((key) => (
              <div key={key} className="goal-item">
                <span className="goal-label">{formatGoalLabel(key)}</span>
                <span className="goal-value">{formatGoalValue(key, goals?.[key])}</span>
              </div>
            ))}
          </div>
        )}

        <div className="goals-card-footer">
          <button
            type="button"
            className="goals-text-btn"
            onClick={() => setEditingBodyComposition(!editingBodyComposition)}
          >
            {editingBodyComposition ? 'Cancel' : 'Edit Goals'}
          </button>
        </div>
      </div>

      {/* Macro Goals */}
      <div className="goals-section goals-section--macro-goals">
        {editingMacroGoals ? (
          <MacroGoalsForm 
            goals={goals}
            onSave={handleGoalsUpdate}
          />
        ) : (
          <div className="macro-goals-display">
            <div className="macro-primary-row">
              {primaryMacroGoalKeys.map((key) => (
                <div key={key} className="macro-item macro-item--primary">
                  <span className="macro-label">{formatGoalLabel(key)}</span>
                  <span className="macro-value">{formatGoalValue(key, goals?.[key])}</span>
                </div>
              ))}
            </div>

            <div className="macro-grid">
              {macroGoalKeys
                .filter((k) => !primaryMacroGoalKeys.includes(k))
                .map((key) => (
                  <div key={key} className="macro-item">
                    <span className="macro-label">{formatGoalLabel(key)}</span>
                    <span className="macro-value">{formatGoalValue(key, goals?.[key])}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="goals-card-footer">
          <button
            type="button"
            className="goals-text-btn"
            onClick={() => setEditingMacroGoals(!editingMacroGoals)}
          >
            {editingMacroGoals ? 'Cancel' : 'Edit Goals'}
          </button>
        </div>
      </div>

      <style>{`
        .route-personalization .main-content {
          justify-content: flex-start;
          align-items: stretch;
        }

        .personalization-page {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0 var(--space-4) var(--space-4);
          font-size: var(--text-lg);
          font-family: var(--font-primary);
        }

        .personalization-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-8);
          margin-bottom: var(--space-6);
          padding-right: var(--space-10);
        }

        .personalization-action-btn,
        .personalization-splits-btn {
          padding: 0 var(--space-6);
          min-height: 56px;
          border-radius: var(--radius-md);
          transition: transform 0.25s var(--ease-out-cubic), box-shadow 0.25s var(--ease-out-cubic), background 0.25s var(--ease-out-cubic);
        }

        .btn.personalization-action-btn,
        .btn.personalization-splits-btn {
          font-size: var(--text-base);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .personalization-action-btn {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: #ffffff;
        }

        .personalization-splits-btn {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: #ffffff;
        }

        .personalization-action-btn:hover,
        .personalization-action-btn:focus,
        .personalization-splits-btn:hover,
        .personalization-splits-btn:focus {
          transform: translateY(-3px);
          box-shadow: 0 24px 45px rgba(0, 0, 0, 0.4);
          outline: none;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-primary);
          border-top: 4px solid var(--accent-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background: var(--accent-danger-alpha);
          border: 1px solid var(--accent-danger);
          color: var(--accent-danger);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-6);
        }

        .goals-section {
          background: var(--bg-secondary);
          border: none;
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-6);
          box-shadow: 0 24px 55px rgba(0, 0, 0, 0.4);
          transition: transform 0.25s var(--ease-out-cubic), box-shadow 0.25s var(--ease-out-cubic);
          backdrop-filter: blur(8px);
        }

        .goals-section:hover {
          /* No hover animation on goal sections */
        }

        .goals-section--body-comp {
          padding-top: var(--space-10);
        }

        .goals-card-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: var(--space-5);
        }

        .goals-display {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .goal-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          align-items: center;
          text-align: center;
          border-radius: var(--radius-md);
          transition: transform 0.2s var(--ease-out-cubic), background 0.2s var(--ease-out-cubic);
          padding: var(--space-3);
        }

        .goal-item:hover {
          /* No hover animation on individual goal items */
        }

        .goal-label {
          font-size: var(--text-base);
          color: var(--text-tertiary);
          font-weight: var(--font-weight-medium);
        }

        .goal-value {
          font-size: var(--text-xl);
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .goals-text-btn {
          background: transparent;
          border: none;
          padding: 0;
          color: var(--text-secondary);
          font-family: var(--font-primary);
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
        }

        .goals-text-btn:hover {
          text-decoration: underline;
          color: var(--text-primary);
        }

        .macro-primary-row {
          display: grid;
          grid-template-columns: repeat(5, minmax(140px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-5);
          padding-top: var(--space-4);
        }

        .macro-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-4);
        }

        .macro-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          align-items: center;
          text-align: center;
          border-radius: var(--radius-md);
          padding: var(--space-3);
        }

        .macro-label {
          font-size: var(--text-base);
          color: var(--text-tertiary);
          font-weight: var(--font-weight-medium);
        }

        .macro-value {
          font-size: var(--text-xl);
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .macro-item--primary .macro-label {
          font-size: var(--text-xl);
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .macro-item--primary .macro-value {
          font-size: var(--text-4xl);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .form-group label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .form-input {
          width: 100%;
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
        }

        .btn {
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          border: 1px solid transparent;
        }

        .btn-primary {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .btn-primary:hover {
          background: var(--accent-primary-dark);
          border-color: var(--accent-primary-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--border-primary);
        }

        .btn-secondary:hover {
          background: var(--bg-hover);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .personalization-page {
            padding: var(--space-3);
          }

          .personalization-actions {
            justify-content: stretch;
            flex-direction: column;
          }

          .personalization-splits-btn,
          .personalization-action-btn {
            width: 100%;
            transform: none;
          }

          .macro-primary-row {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Body Composition Form Component
const BodyCompositionForm = ({ goals, onSave }) => {
  const [formData, setFormData] = useState({
    weight_goal: goals?.weight_goal || '',
    lean_mass_goal: goals?.lean_mass_goal || '',
    fat_mass_goal: goals?.fat_mass_goal || '',
    cost_goal: goals?.cost_goal || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...goals, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="body-composition-form">
      <div className="form-grid">
        <div className="form-group">
          <label>Target Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            name="weight_goal"
            value={formData.weight_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Lean Mass Goal (kg)</label>
          <input
            type="number"
            step="0.1"
            name="lean_mass_goal"
            value={formData.lean_mass_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Fat Mass Goal (kg)</label>
          <input
            type="number"
            step="0.1"
            name="fat_mass_goal"
            value={formData.fat_mass_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Cost Goal ($)</label>
          <input
            type="number"
            step="0.01"
            name="cost_goal"
            value={formData.cost_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Save Goals
        </button>
      </div>
    </form>
  );
};

// Macro Goals Form Component
const MacroGoalsForm = ({ goals, onSave }) => {
  const [formData, setFormData] = useState({
    calories_goal: goals?.calories_goal || '',
    protein_goal: goals?.protein_goal || '',
    fat_goal: goals?.fat_goal || '',
    carbohydrates_goal: goals?.carbohydrates_goal || '',
    fiber_goal: goals?.fiber_goal || '',
    sodium_goal: goals?.sodium_goal || '',
    sugar_goal: goals?.sugar_goal || '',
    saturated_fat_goal: goals?.saturated_fat_goal || '',
    trans_fat_goal: goals?.trans_fat_goal || '',
    calcium_goal: goals?.calcium_goal || '',
    iron_goal: goals?.iron_goal || '',
    magnesium_goal: goals?.magnesium_goal || '',
    cholesterol_goal: goals?.cholesterol_goal || '',
    vitamin_a_goal: goals?.vitamin_a_goal || '',
    vitamin_c_goal: goals?.vitamin_c_goal || '',
    vitamin_d_goal: goals?.vitamin_d_goal || '',
    caffeine_goal: goals?.caffeine_goal || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...goals, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="macro-goals-form">
      <div className="macro-form-grid">
        <div className="form-group">
          <label>Calories</label>
          <input
            type="number"
            name="calories_goal"
            value={formData.calories_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Protein (g)</label>
          <input
            type="number"
            step="0.1"
            name="protein_goal"
            value={formData.protein_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Fat (g)</label>
          <input
            type="number"
            step="0.1"
            name="fat_goal"
            value={formData.fat_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Carbohydrates (g)</label>
          <input
            type="number"
            step="0.1"
            name="carbohydrates_goal"
            value={formData.carbohydrates_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Fiber (g)</label>
          <input
            type="number"
            step="0.1"
            name="fiber_goal"
            value={formData.fiber_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Sodium (mg)</label>
          <input
            type="number"
            step="0.1"
            name="sodium_goal"
            value={formData.sodium_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Sugar (g)</label>
          <input
            type="number"
            step="0.1"
            name="sugar_goal"
            value={formData.sugar_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Saturated Fat (g)</label>
          <input
            type="number"
            step="0.1"
            name="saturated_fat_goal"
            value={formData.saturated_fat_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Trans Fat (g)</label>
          <input
            type="number"
            step="0.1"
            name="trans_fat_goal"
            value={formData.trans_fat_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Calcium (mg)</label>
          <input
            type="number"
            step="0.1"
            name="calcium_goal"
            value={formData.calcium_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Iron (mg)</label>
          <input
            type="number"
            step="0.1"
            name="iron_goal"
            value={formData.iron_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Magnesium (mg)</label>
          <input
            type="number"
            step="0.1"
            name="magnesium_goal"
            value={formData.magnesium_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Cholesterol (mg)</label>
          <input
            type="number"
            step="0.1"
            name="cholesterol_goal"
            value={formData.cholesterol_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Vitamin A (IU)</label>
          <input
            type="number"
            step="0.1"
            name="vitamin_a_goal"
            value={formData.vitamin_a_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Vitamin C (mg)</label>
          <input
            type="number"
            step="0.1"
            name="vitamin_c_goal"
            value={formData.vitamin_c_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Vitamin D (IU)</label>
          <input
            type="number"
            step="0.1"
            name="vitamin_d_goal"
            value={formData.vitamin_d_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Caffeine (mg)</label>
          <input
            type="number"
            step="0.1"
            name="caffeine_goal"
            value={formData.caffeine_goal}
            onChange={handleChange}
            className="form-input"
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Save Goals
        </button>
      </div>
    </form>
  );
};

export default Personalization;
