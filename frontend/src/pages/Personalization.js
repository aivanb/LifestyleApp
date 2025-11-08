import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import MusclePriority from '../components/MusclePriority';
import SplitCreator from '../components/SplitCreator';

/**
 * Personalization Component
 * 
 * Comprehensive personalization management with:
 * - Goal management and macro calculations
 * - Body composition goals
 * - Macro goals
 * - Weight calculator with last logged weight
 * - Nutritional metadata generation
 * - Muscle Priority management
 * - Split Creator
 */
const Personalization = () => {
  const [activeTab, setActiveTab] = useState('goals');
  const [goals, setGoals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBodyComposition, setEditingBodyComposition] = useState(false);
  const [editingMacroGoals, setEditingMacroGoals] = useState(false);
  const [lastWeight, setLastWeight] = useState(null);
  const [macroCalculation, setMacroCalculation] = useState({
    weight_goal: '',
    timeframe_weeks: '',
    calculating: false,
    result: null
  });

  const tabs = [
    { id: 'goals', label: 'Goals & Macros', icon: '🎯' },
    { id: 'muscle-priority', label: 'Muscle Priority', icon: '💪' },
    { id: 'split-creator', label: 'Split Creator', icon: '📅' }
  ];

  useEffect(() => {
    loadPersonalizationData();
  }, []);

  const loadPersonalizationData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile/');
      
      if (response.data.data) {
        setGoals(response.data.data.goals);
        // Get last logged weight
        const weightResponse = await api.getWeightLogs();
        if (weightResponse.data && weightResponse.data.length > 0) {
          setLastWeight(weightResponse.data[0].weight);
        }
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
      await api.put('/users/goals/', updatedGoals);
      setGoals(updatedGoals);
      setEditingBodyComposition(false);
      setEditingMacroGoals(false);
    } catch (err) {
      setError('Failed to update goals');
      console.error('Goals update error:', err);
    }
  };

  const calculateMacros = useCallback(async () => {
    if (!macroCalculation.weight_goal || !macroCalculation.timeframe_weeks) {
      return;
    }

    setMacroCalculation(prev => ({ ...prev, calculating: true }));
    
    try {
      // Calculate all nutritional metadata
      const nutritionalData = {
        calories: Math.round(2000 + (parseFloat(macroCalculation.weight_goal) * 10)),
        protein: Math.round(parseFloat(macroCalculation.weight_goal) * 2.2),
        fat: Math.round(parseFloat(macroCalculation.weight_goal) * 0.8),
        carbohydrates: Math.round(parseFloat(macroCalculation.weight_goal) * 3.5),
        fiber: Math.round(parseFloat(macroCalculation.weight_goal) * 0.4),
        sodium: Math.round(parseFloat(macroCalculation.weight_goal) * 0.5),
        sugar: Math.round(parseFloat(macroCalculation.weight_goal) * 0.3),
        saturated_fat: Math.round(parseFloat(macroCalculation.weight_goal) * 0.2),
        trans_fat: Math.round(parseFloat(macroCalculation.weight_goal) * 0.05),
        calcium: Math.round(parseFloat(macroCalculation.weight_goal) * 12),
        iron: Math.round(parseFloat(macroCalculation.weight_goal) * 0.8),
        magnesium: Math.round(parseFloat(macroCalculation.weight_goal) * 4),
        cholesterol: Math.round(parseFloat(macroCalculation.weight_goal) * 0.3),
        vitamin_a: Math.round(parseFloat(macroCalculation.weight_goal) * 300),
        vitamin_c: Math.round(parseFloat(macroCalculation.weight_goal) * 90),
        vitamin_d: Math.round(parseFloat(macroCalculation.weight_goal) * 20),
        caffeine: Math.round(parseFloat(macroCalculation.weight_goal) * 0.4)
      };

      setMacroCalculation(prev => ({ 
        ...prev, 
        calculating: false, 
        result: nutritionalData 
      }));

      // Update goals with calculated values
      const updatedGoals = {
        ...goals,
        ...nutritionalData
      };
      
      await handleGoalsUpdate(updatedGoals);
    } catch (err) {
      setError('Failed to calculate macros');
      console.error('Macro calculation error:', err);
    }
  }, [macroCalculation.weight_goal, macroCalculation.timeframe_weeks, goals]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'goals':
        return (
          <div>
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            {/* Body Composition Goals */}
            <div className="goals-section">
              <div className="section-header">
                <h2>Body Composition Goals</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditingBodyComposition(!editingBodyComposition)}
                >
                  {editingBodyComposition ? 'Cancel' : 'Edit Goals'}
                </button>
              </div>

              {editingBodyComposition ? (
                <BodyCompositionForm 
                  goals={goals}
                  onSave={handleGoalsUpdate}
                  onCancel={() => setEditingBodyComposition(false)}
                />
              ) : (
                <div className="goals-display">
                  <div className="goal-item">
                    <span className="goal-label">Target Weight</span>
                    <span className="goal-value">{goals?.weight_goal ? `${goals.weight_goal} kg` : 'Not set'}</span>
                  </div>
                  <div className="goal-item">
                    <span className="goal-label">Lean Mass Goal</span>
                    <span className="goal-value">{goals?.lean_mass_goal ? `${goals.lean_mass_goal} kg` : 'Not set'}</span>
                  </div>
                  <div className="goal-item">
                    <span className="goal-label">Fat Mass Goal</span>
                    <span className="goal-value">{goals?.fat_mass_goal ? `${goals.fat_mass_goal} kg` : 'Not set'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Macro Goals */}
            <div className="goals-section">
              <div className="section-header">
                <h2>Macro Goals</h2>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditingMacroGoals(!editingMacroGoals)}
                >
                  {editingMacroGoals ? 'Cancel' : 'Edit Goals'}
                </button>
              </div>

              {editingMacroGoals ? (
                <MacroGoalsForm 
                  goals={goals}
                  onSave={handleGoalsUpdate}
                  onCancel={() => setEditingMacroGoals(false)}
                />
              ) : (
                <div className="macro-goals-display">
                  <div className="macro-grid">
                    <div className="macro-item">
                      <span className="macro-label">Calories</span>
                      <span className="macro-value">{goals?.calories_goal || 'Not set'}</span>
                    </div>
                    <div className="macro-item">
                      <span className="macro-label">Protein</span>
                      <span className="macro-value">{goals?.protein_goal ? `${goals.protein_goal}g` : 'Not set'}</span>
                    </div>
                    <div className="macro-item">
                      <span className="macro-label">Fat</span>
                      <span className="macro-value">{goals?.fat_goal ? `${goals.fat_goal}g` : 'Not set'}</span>
                    </div>
                    <div className="macro-item">
                      <span className="macro-label">Carbohydrates</span>
                      <span className="macro-value">{goals?.carbohydrates_goal ? `${goals.carbohydrates_goal}g` : 'Not set'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Weight Calculator */}
            <div className="weight-calculator-section">
              <div className="weight-calculator-card">
                <h3>Weight Calculator</h3>
                {lastWeight && (
                  <p className="last-weight">Last logged weight: {lastWeight} kg</p>
                )}
                
                <div className="calculator-form">
                  <div className="form-group">
                    <label>Target Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={macroCalculation.weight_goal}
                      onChange={(e) => setMacroCalculation(prev => ({ ...prev, weight_goal: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Timeframe (weeks)</label>
                    <input
                      type="number"
                      min="1"
                      value={macroCalculation.timeframe_weeks}
                      onChange={(e) => setMacroCalculation(prev => ({ ...prev, timeframe_weeks: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={calculateMacros}
                    disabled={macroCalculation.calculating}
                  >
                    {macroCalculation.calculating ? 'Calculating...' : 'Calculate Macros'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'muscle-priority':
        return <MusclePriority onPrioritiesUpdated={() => {}} />;
      case 'split-creator':
        return (
          <SplitCreator 
            onSplitCreated={() => {}}
            onSplitUpdated={() => {}}
          />
        );
      default:
        return null;
    }
  };

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
      <div className="page-header">
        <h1>Personalization</h1>
        <p>Customize your fitness and nutrition goals</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-buttons">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderActiveTab()}
      </div>

      <style>{`
        .personalization-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-6);
        }

        .page-header {
          margin-bottom: var(--space-8);
        }

        .page-header h1 {
          font-size: var(--text-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .page-header p {
          color: var(--text-secondary);
          font-size: var(--text-lg);
        }

        .tab-navigation {
          margin-bottom: var(--space-6);
        }

        .tab-buttons {
          display: flex;
          gap: var(--space-2);
          overflow-x: auto;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          white-space: nowrap;
        }

        .tab-button:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .tab-button.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .tab-icon {
          font-size: var(--text-lg);
        }

        .tab-label {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
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
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-6);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
        }

        .section-header h2 {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          margin: 0;
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
        }

        .goal-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .goal-value {
          font-size: var(--text-lg);
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
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
        }

        .macro-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .macro-value {
          font-size: var(--text-lg);
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .weight-calculator-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }

        .weight-calculator-card h3 {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          margin-bottom: var(--space-4);
        }

        .last-weight {
          color: var(--text-secondary);
          margin-bottom: var(--space-4);
        }

        .calculator-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
          align-items: end;
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
            padding: var(--space-4);
          }

          .section-header {
            flex-direction: column;
            gap: var(--space-4);
            align-items: stretch;
          }

          .calculator-form {
            grid-template-columns: 1fr;
          }

          .tab-buttons {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

// Body Composition Form Component
const BodyCompositionForm = ({ goals, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    weight_goal: goals?.weight_goal || '',
    lean_mass_goal: goals?.lean_mass_goal || '',
    fat_mass_goal: goals?.fat_mass_goal || ''
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
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Goals
        </button>
      </div>
    </form>
  );
};

// Macro Goals Form Component
const MacroGoalsForm = ({ goals, onSave, onCancel }) => {
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
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Goals
        </button>
      </div>
    </form>
  );
};

export default Personalization;
