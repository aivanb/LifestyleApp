import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme } = useTheme();
  const [goals, setGoals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBodyComposition, setEditingBodyComposition] = useState(false);
  const [editingMacroGoals, setEditingMacroGoals] = useState(false);
  const bodyCompositionGoalKeys = [
    'weight_goal',
    'lean_mass_goal',
    'fat_mass_goal',
    'cost_goal',
    'tokens_goal',
  ];
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
      tokens_goal: 'tokens',

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
      <div className={`personalization-page personalization-page--shell${theme === 'light' ? ' personalization-page--shell-light' : ''}`}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading personalization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`personalization-page personalization-page--shell${theme === 'light' ? ' personalization-page--shell-light' : ''}`}>
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
            formatGoalLabel={formatGoalLabel}
            bodyCompositionGoalKeys={bodyCompositionGoalKeys}
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
            formatGoalLabel={formatGoalLabel}
            primaryMacroGoalKeys={primaryMacroGoalKeys}
            macroGoalKeys={macroGoalKeys}
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
          flex: 1;
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0 var(--space-4) var(--space-4);
          font-size: var(--text-lg);
          font-family: var(--font-primary);
          box-sizing: border-box;
          min-height: 100dvh;
          min-height: 100svh;
          overflow-x: hidden;
          padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
        }

        .personalization-page--shell {
          --profile-shell-tint: rgba(255, 255, 255, 0.045);
          --profile-shell-strong: rgba(255, 255, 255, 0.11);
          --profile-card-bg: #171c24;
          --profile-card-border: #2a3140;
          background-color: #040508;
          background-image:
            linear-gradient(var(--profile-shell-tint) 1px, transparent 1px),
            linear-gradient(90deg, var(--profile-shell-tint) 1px, transparent 1px),
            linear-gradient(var(--profile-shell-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--profile-shell-strong) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 80px 80px, 80px 80px;
          background-position: 0 0, 0 0, 0 0, 0 0;
        }

        .personalization-page--shell-light {
          --profile-shell-tint: rgba(0, 0, 0, 0.04);
          --profile-shell-strong: rgba(0, 0, 0, 0.1);
          --profile-card-bg: #ffffff;
          --profile-card-border: #d8dce8;
          background-color: #e8eaf2;
        }

        .personalization-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-8);
          margin-bottom: var(--space-6);
          padding-top: var(--space-4);
        }

        .personalization-action-btn,
        .personalization-splits-btn {
          padding: var(--space-3) var(--space-6);
          min-height: 62px;
          border-radius: var(--radius-md);
          border: 1px solid var(--input-border);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
          transition: background 0.2s var(--ease-out-cubic), border-color 0.2s;
        }

        .btn.personalization-action-btn,
        .btn.personalization-splits-btn {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          letter-spacing: 0.08em;
        }

        .personalization-action-btn {
          background: #79b5fb;
          border-color: #79b5fb;
          color: #040508;
        }

        .personalization-splits-btn {
          background: #79b5fb;
          border-color: #79b5fb;
          color: #040508;
        }

        .personalization-action-btn:hover,
        .personalization-action-btn:focus,
        .personalization-splits-btn:hover,
        .personalization-splits-btn:focus {
          background: #79b5fb;
          color: #040508;
          border-color: #79b5fb;
          filter: brightness(0.95);
          outline: none;
        }

        .personalization-page .btn.btn-primary.personalization-action-btn,
        .personalization-page .btn.btn-primary.personalization-splits-btn {
          background: #79b5fb !important;
          border-color: #79b5fb !important;
          color: #040508 !important;
          opacity: 1;
        }

        .personalization-page .btn.btn-primary.personalization-action-btn:hover,
        .personalization-page .btn.btn-primary.personalization-action-btn:focus,
        .personalization-page .btn.btn-primary.personalization-splits-btn:hover,
        .personalization-page .btn.btn-primary.personalization-splits-btn:focus {
          background: #79b5fb !important;
          border-color: #79b5fb !important;
          color: #040508 !important;
          filter: brightness(0.95);
        }

        .personalization-page .profile-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin: 0;
          min-width: 0;
        }

        .personalization-page .profile-field-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .personalization-page .profile-field-input.personalization-goals-field-input {
          width: 100%;
          box-sizing: border-box;
          min-height: 52px;
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.07);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-lg);
          text-align: center;
          transition: border-color 0.2s var(--ease-out-cubic), box-shadow 0.2s;
        }

        .personalization-page--shell-light .profile-field-input.personalization-goals-field-input {
          background: #f0f3f8;
        }

        .personalization-page .profile-field-input.personalization-goals-field-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.12);
        }

        .body-composition-form .goals-display--edit,
        .macro-goals-form .macro-goals-display--edit {
          width: 100%;
        }

        .macro-goals-form .macro-primary-row--edit .profile-field.macro-item--primary .profile-field-label {
          font-size: var(--text-xs);
        }

        .macro-goals-form .macro-primary-row--edit .profile-field.macro-item--primary .personalization-goals-field-input {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-semibold);
          min-height: 56px;
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
          background: var(--profile-card-bg, var(--bg-secondary));
          border: 1px solid var(--profile-card-border, var(--border-primary));
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-6);
          box-shadow: var(--shadow-md);
          transition: border-color 0.2s var(--ease-out-cubic);
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

        .body-composition-form .goals-display--edit {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .body-composition-form .goals-display--edit .profile-field {
          align-items: center;
          text-align: center;
        }

        .macro-goals-form .macro-goals-display--edit {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .macro-goals-form .macro-primary-row--edit {
          display: grid;
          grid-template-columns: repeat(5, minmax(140px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-5);
          padding-top: var(--space-4);
        }

        .macro-goals-form .macro-primary-row--edit .profile-field {
          align-items: center;
          text-align: center;
        }

        .macro-goals-form .macro-grid--edit {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-4);
        }

        .macro-goals-form .macro-grid--edit .profile-field {
          align-items: center;
          text-align: center;
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
          color: var(--text-secondary);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .goal-value {
          font-size: var(--text-2xl);
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .goals-text-btn {
          background: transparent;
          border: none;
          padding: var(--space-2) 0;
          color: var(--text-secondary);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          cursor: pointer;
        }

        .goals-text-btn:hover {
          text-decoration: underline;
          color: var(--text-primary);
        }

        .body-composition-form .form-actions,
        .macro-goals-form .form-actions {
          justify-content: flex-end;
          margin-top: var(--space-5);
        }

        .body-composition-form .goals-text-btn,
        .macro-goals-form .goals-text-btn {
          padding: var(--space-2) 0;
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
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .macro-value {
          font-size: var(--text-xl);
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
        }

        .macro-item--primary .macro-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.1em;
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
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .form-input {
          width: 100%;
          min-height: 52px;
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-lg);
          transition: border-color 0.2s var(--ease-out-cubic), box-shadow 0.2s;
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
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          border: 1px solid transparent;
        }

        .btn-primary {
          background: var(--accent-primary-alpha);
          color: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        .btn-primary:hover {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: #fff;
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
            padding: var(--space-3) var(--space-3) var(--space-4);
            box-sizing: border-box;
            padding-top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
            padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px));
          }

          .personalization-actions {
            justify-content: stretch;
            flex-direction: column;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
            padding: 0;
            margin-bottom: var(--space-4);
            gap: var(--space-2);
          }

          .personalization-actions .btn {
            width: 100%;
          }

          .personalization-splits-btn,
          .personalization-action-btn {
            width: 100%;
            transform: none;
            min-height: 56px;
          }

          .goals-section {
            width: 100%;
            box-sizing: border-box;
            padding: var(--space-4);
            margin-bottom: var(--space-3);
          }

          .goals-display {
            gap: var(--space-1);
          }

          .goal-item {
            gap: 2px;
          }

          .goal-label {
            font-size: var(--text-sm);
          }

          .goal-value {
            font-size: var(--text-xl);
          }

          .goals-section--body-comp {
            padding-top: var(--space-4);
          }

          .macro-goals-display {
            gap: var(--space-1);
          }

          .macro-primary-row {
            display: flex;
            flex-direction: column;
            gap: var(--space-1);
          }

          .macro-primary-row .macro-item--primary {
            display: block;
            width: 100%;
          }

          .macro-grid {
            gap: var(--space-1);
          }

          .macro-goals-form .macro-grid--edit {
            grid-template-columns: 1fr;
            gap: var(--space-2);
          }

          .macro-goals-form .macro-primary-row--edit {
            grid-template-columns: 1fr;
            gap: var(--space-2);
            margin-bottom: var(--space-3);
            padding-top: var(--space-2);
          }

          .body-composition-form .goals-display--edit {
            grid-template-columns: 1fr;
            gap: var(--space-2);
          }

          .macro-item,
          .macro-item.macro-item--primary {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }

          .macro-item .macro-label,
          .macro-item--primary .macro-label {
            display: block;
          }

          .macro-item .macro-value,
          .macro-item--primary .macro-value {
            display: block;
            margin-top: var(--space-1);
          }
        }
      `}</style>
    </div>
  );
};

// Body Composition Form Component
const BodyCompositionForm = ({ goals, onSave, formatGoalLabel, bodyCompositionGoalKeys }) => {
  const [formData, setFormData] = useState({
    weight_goal: goals?.weight_goal || '',
    lean_mass_goal: goals?.lean_mass_goal || '',
    fat_mass_goal: goals?.fat_mass_goal || '',
    cost_goal: goals?.cost_goal || '',
    tokens_goal: goals?.tokens_goal ?? '',
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
      <div className="goals-display goals-display--edit">
        {bodyCompositionGoalKeys.map((key) => (
          <label key={key} className="profile-field">
            <span className="profile-field-label">{formatGoalLabel(key)}</span>
            <input
              type="number"
              step={key === 'cost_goal' ? '0.01' : key === 'tokens_goal' ? '1' : '0.1'}
              name={key}
              value={formData[key]}
              onChange={handleChange}
              className="profile-field-input personalization-goals-field-input"
            />
          </label>
        ))}
      </div>
      <div className="form-actions">
        <button type="submit" className="goals-text-btn">
          Save Goals
        </button>
      </div>
    </form>
  );
};

// Macro Goals Form Component
const MacroGoalsForm = ({
  goals,
  onSave,
  formatGoalLabel,
  primaryMacroGoalKeys,
  macroGoalKeys,
}) => {
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

  const secondaryMacroKeys = macroGoalKeys.filter(
    (k) => !primaryMacroGoalKeys.includes(k)
  );

  return (
    <form onSubmit={handleSubmit} className="macro-goals-form">
      <div className="macro-goals-display macro-goals-display--edit">
        <div className="macro-primary-row macro-primary-row--edit">
          {primaryMacroGoalKeys.map((key) => (
            <label
              key={key}
              className="profile-field macro-item macro-item--primary"
            >
              <span className="profile-field-label macro-label">
                {formatGoalLabel(key)}
              </span>
              <input
                type="number"
                step="0.1"
                name={key}
                value={formData[key]}
                onChange={handleChange}
                className="profile-field-input personalization-goals-field-input"
              />
            </label>
          ))}
        </div>
        <div className="macro-grid macro-grid--edit">
          {secondaryMacroKeys.map((key) => (
            <label key={key} className="profile-field macro-item">
              <span className="profile-field-label macro-label">
                {formatGoalLabel(key)}
              </span>
              <input
                type="number"
                step="0.1"
                name={key}
                value={formData[key]}
                onChange={handleChange}
                className="profile-field-input personalization-goals-field-input"
              />
            </label>
          ))}
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="goals-text-btn">
          Save Goals
        </button>
      </div>
    </form>
  );
};

export default Personalization;
