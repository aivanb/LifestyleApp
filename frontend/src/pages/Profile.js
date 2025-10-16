import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/**
 * Profile Component
 * 
 * Comprehensive profile management with:
 * - Personal information editing
 * - Goal management and macro calculations
 * - Body metrics display with fitness ranking
 * - Historical data and trends
 * - Responsive mobile/desktop layouts
 */
const Profile = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [goals, setGoals] = useState({});
  const [metrics, setMetrics] = useState({});
  const [historical, setHistorical] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [editing, setEditing] = useState(false);
  const [macroCalculation, setMacroCalculation] = useState({
    weight_goal: '',
    timeframe_weeks: '',
    calculating: false,
    result: null
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile/');
      
      if (response.data.data) {
        setProfileData(response.data.data.user);
        setGoals(response.data.data.goals);
        setMetrics(response.data.data.metrics);
        setHistorical(response.data.data.historical);
      }
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      await api.put('/users/profile/', updatedData);
      await loadProfileData();
      setEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
    }
  };

  const updateGoals = async (updatedGoals) => {
    try {
      await api.put('/users/goals/', updatedGoals);
      await loadProfileData();
    } catch (err) {
      setError('Failed to update goals');
      console.error('Goals update error:', err);
    }
  };

  const calculateMacros = async () => {
    if (!macroCalculation.weight_goal || !macroCalculation.timeframe_weeks) {
      setError('Please enter both weight goal and timeframe');
      return;
    }

    try {
      setMacroCalculation(prev => ({ ...prev, calculating: true }));
      
      const response = await api.post('/users/calculate-macros/', {
        weight_goal: parseFloat(macroCalculation.weight_goal),
        timeframe_weeks: parseInt(macroCalculation.timeframe_weeks)
      });

      if (response.data.data) {
        setMacroCalculation(prev => ({
          ...prev,
          result: response.data.data,
          calculating: false
        }));
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to calculate macros');
      setMacroCalculation(prev => ({ ...prev, calculating: false }));
    }
  };

  const applyCalculatedMacros = () => {
    if (macroCalculation.result) {
      const calculatedGoals = {
        calories_goal: macroCalculation.result.calories,
        protein_goal: macroCalculation.result.protein,
        fat_goal: macroCalculation.result.fat,
        carbohydrates_goal: macroCalculation.result.carbohydrates,
        fiber_goal: macroCalculation.result.fiber,
        sodium_goal: macroCalculation.result.sodium
      };
      
      updateGoals(calculatedGoals);
      setMacroCalculation({ weight_goal: '', timeframe_weeks: '', calculating: false, result: null });
    }
  };

  const getFitnessRankColor = (rank) => {
    const colors = {
      'dirt': '#8B4513',
      'gravel': '#696969',
      'tin': '#C0C0C0',
      'aluminum': '#D3D3D3',
      'lead': '#708090',
      'bronze': '#CD7F32',
      'copper': '#B87333',
      'iron': '#4B4B4B',
      'quartz': '#E6E6FA',
      'gold': '#FFD700',
      'ruby': '#E0115F',
      'crystal': '#B8E6B8',
      'emerald': '#50C878',
      'diamond': '#B9F2FF',
      'titanium': '#878681',
      'platinum': '#E5E4E2',
      'mithril': '#9C7C38'
    };
    return colors[rank] || '#666';
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="header-content">
          <div className="user-info">
            <div className="avatar">
              <svg className="icon icon-xl" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="user-details">
              <h1 className="username">{profileData?.username}</h1>
              <p className="user-email">{profileData?.email}</p>
            </div>
          </div>
          
          <div className="fitness-rank">
            <div 
              className="rank-badge"
              style={{ backgroundColor: getFitnessRankColor(metrics?.fitness_rank?.current_rank) }}
            >
              {metrics?.fitness_rank?.current_rank?.toUpperCase() || 'UNKNOWN'}
            </div>
            <p className="rank-description">
              BMI: {metrics?.bmi || 'N/A'} | Next: {metrics?.fitness_rank?.next_rank || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          Personal Info
        </button>
        
        <button
          className={`tab ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Goals
        </button>
        
        <button
          className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Body Metrics
        </button>
        
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          History
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === 'personal' && (
          <PersonalInfoTab 
            profileData={profileData}
            editing={editing}
            setEditing={setEditing}
            updateProfile={updateProfile}
          />
        )}
        
        {activeTab === 'goals' && (
          <GoalsTab 
            goals={goals}
            updateGoals={updateGoals}
            macroCalculation={macroCalculation}
            setMacroCalculation={setMacroCalculation}
            calculateMacros={calculateMacros}
            applyCalculatedMacros={applyCalculatedMacros}
          />
        )}
        
        {activeTab === 'metrics' && (
          <MetricsTab metrics={metrics} />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab historical={historical} />
        )}
      </div>

      {/* Logout Button */}
      <div className="profile-footer">
        <button className="btn btn-danger" onClick={logout}>
          <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Logout
        </button>
      </div>

      <style jsx>{`
        .profile-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-4);
        }

        .profile-header {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-6);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-4);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .avatar {
          width: 64px;
          height: 64px;
          background: var(--accent-primary);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .username {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          margin: 0;
          color: var(--text-primary);
        }

        .user-email {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin: 0;
        }

        .fitness-rank {
          text-align: center;
        }

        .rank-badge {
          display: inline-block;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          color: white;
          font-weight: var(--font-weight-bold);
          font-size: var(--text-sm);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rank-description {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          margin: var(--space-1) 0 0 0;
        }

        .profile-tabs {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
          overflow-x: auto;
        }

        .tab {
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

        .tab:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .tab.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .profile-content {
          min-height: 400px;
        }

        .profile-footer {
          margin-top: var(--space-8);
          padding-top: var(--space-6);
          border-top: 1px solid var(--border-primary);
          text-align: center;
        }

        .profile-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: var(--space-4);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-primary);
          border-top: 4px solid var(--accent-primary);
          border-radius: var(--radius-full);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .profile-container {
            padding: var(--space-2);
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .profile-tabs {
            flex-wrap: wrap;
          }

          .tab {
            flex: 1;
            min-width: 120px;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

// Personal Information Tab Component
const PersonalInfoTab = ({ profileData, editing, setEditing, updateProfile }) => {
  const [formData, setFormData] = useState({
    height: profileData?.height || '',
    birthday: profileData?.birthday || '',
    gender: profileData?.gender || '',
    unit_preference: profileData?.unit_preference?.unit_id || '',
    activity_level: profileData?.activity_level?.activity_level_id || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="personal-info-tab">
      <div className="tab-header">
        <h2>Personal Information</h2>
        <button
          className="btn btn-secondary"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Height (cm)</label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              className="form-input"
              disabled={!editing}
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Birthday</label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              className="form-input"
              disabled={!editing}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="form-input"
              disabled={!editing}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Unit Preference</label>
            <select
              name="unit_preference"
              value={formData.unit_preference}
              onChange={handleChange}
              className="form-input"
              disabled={!editing}
            >
              <option value="">Select Unit</option>
              <option value="1">Metric (kg, cm)</option>
              <option value="2">Imperial (lbs, ft)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Activity Level</label>
            <select
              name="activity_level"
              value={formData.activity_level}
              onChange={handleChange}
              className="form-input"
              disabled={!editing}
            >
              <option value="">Select Activity Level</option>
              <option value="1">Sedentary</option>
              <option value="2">Light Activity</option>
              <option value="3">Moderate Activity</option>
              <option value="4">Active</option>
              <option value="5">Very Active</option>
            </select>
          </div>
        </div>

        {editing && (
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        )}
      </form>

      <style jsx>{`
        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .form-actions {
          display: flex;
          gap: var(--space-3);
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Goals Tab Component
const GoalsTab = ({ 
  goals, 
  updateGoals, 
  macroCalculation, 
  setMacroCalculation, 
  calculateMacros, 
  applyCalculatedMacros 
}) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(goals);

  useEffect(() => {
    setFormData(goals);
  }, [goals]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateGoals(formData);
    setEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="goals-tab">
      <div className="tab-header">
        <h2>Goals & Macros</h2>
        <button
          className="btn btn-secondary"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancel' : 'Edit Goals'}
        </button>
      </div>

      {/* Macro Calculator */}
      <div className="macro-calculator card">
        <h3>Calculate Macros from Weight Goal</h3>
        <div className="calculator-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Target Weight (kg)</label>
              <input
                type="number"
                value={macroCalculation.weight_goal}
                onChange={(e) => setMacroCalculation(prev => ({ ...prev, weight_goal: e.target.value }))}
                className="form-input"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Timeframe (weeks)</label>
              <input
                type="number"
                value={macroCalculation.timeframe_weeks}
                onChange={(e) => setMacroCalculation(prev => ({ ...prev, timeframe_weeks: e.target.value }))}
                className="form-input"
                min="1"
              />
            </div>
            <div className="form-group">
              <button
                type="button"
                className="btn btn-primary"
                onClick={calculateMacros}
                disabled={macroCalculation.calculating}
              >
                {macroCalculation.calculating ? 'Calculating...' : 'Calculate'}
              </button>
            </div>
          </div>
        </div>

        {macroCalculation.result && (
          <div className="calculation-result">
            <h4>Calculated Macros</h4>
            <div className="macros-grid">
              <div className="macro-item">
                <span className="macro-label">Calories</span>
                <span className="macro-value">{macroCalculation.result.calories}</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">Protein</span>
                <span className="macro-value">{macroCalculation.result.protein}g</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">Fat</span>
                <span className="macro-value">{macroCalculation.result.fat}g</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">Carbs</span>
                <span className="macro-value">{macroCalculation.result.carbohydrates}g</span>
              </div>
            </div>
            
            {macroCalculation.result.warnings && macroCalculation.result.warnings.length > 0 && (
              <div className="warnings">
                <h5>Warnings:</h5>
                <ul>
                  {macroCalculation.result.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              className="btn btn-success"
              onClick={applyCalculatedMacros}
            >
              Apply to Goals
            </button>
          </div>
        )}
      </div>

      {/* Goals Form */}
      <form onSubmit={handleSubmit}>
        <div className="goals-sections">
          <div className="goals-section">
            <h3>Weight Goals</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Weight Goal (kg)</label>
                <input
                  type="number"
                  name="weight_goal"
                  value={formData.weight_goal || ''}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!editing}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lean Mass Goal (kg)</label>
                <input
                  type="number"
                  name="lean_mass_goal"
                  value={formData.lean_mass_goal || ''}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!editing}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fat Mass Goal (kg)</label>
                <input
                  type="number"
                  name="fat_mass_goal"
                  value={formData.fat_mass_goal || ''}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!editing}
                  step="0.1"
                />
              </div>
            </div>
          </div>

          <div className="goals-section">
            <h3>Macro Goals</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Calories</label>
                <input
                  type="number"
                  name="calories_goal"
                  value={formData.calories_goal || ''}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!editing}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Protein (g)</label>
                <input
                  type="number"
                  name="protein_goal"
                  value={formData.protein_goal || ''}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!editing}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fat (g)</label>
                <input
                  type="number"
                  name="fat_goal"
                  value={formData.fat_goal || ''}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!editing}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Carbs (g)</label>
                <input
                  type="number"
                  name="carbohydrates_goal"
                  value={formData.carbohydrates_goal || ''}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!editing}
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Save Goals
            </button>
          </div>
        )}
      </form>

      <style jsx>{`
        .macro-calculator {
          margin-bottom: var(--space-6);
          padding: var(--space-4);
        }

        .calculator-form {
          margin-bottom: var(--space-4);
        }

        .form-row {
          display: flex;
          gap: var(--space-3);
          align-items: end;
        }

        .calculation-result {
          background: var(--bg-tertiary);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          margin-top: var(--space-4);
        }

        .macros-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-3);
          margin: var(--space-3) 0;
        }

        .macro-item {
          text-align: center;
          padding: var(--space-3);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .macro-label {
          display: block;
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          margin-bottom: var(--space-1);
        }

        .macro-value {
          display: block;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .warnings {
          background: var(--accent-warning-alpha);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          margin: var(--space-3) 0;
        }

        .warnings h5 {
          margin: 0 0 var(--space-2) 0;
          color: var(--accent-warning);
        }

        .warnings ul {
          margin: 0;
          padding-left: var(--space-4);
        }

        .goals-sections {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .goals-section {
          background: var(--bg-tertiary);
          padding: var(--space-4);
          border-radius: var(--radius-md);
        }

        .goals-section h3 {
          margin: 0 0 var(--space-4) 0;
          color: var(--text-primary);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-3);
        }

        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            align-items: stretch;
          }

          .macros-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Metrics Tab Component
const MetricsTab = ({ metrics }) => {
  const metricsData = [
    { label: 'BMI', value: metrics?.bmi || 'N/A', unit: '' },
    { label: 'BMR', value: Math.round(metrics?.bmr || 0), unit: 'cal/day' },
    { label: 'TDEE', value: Math.round(metrics?.tdee || 0), unit: 'cal/day' },
    { label: 'Waist-to-Height', value: metrics?.waist_to_height_ratio || 'N/A', unit: '' },
    { label: 'Waist-to-Shoulder', value: metrics?.waist_to_shoulder_ratio || 'N/A', unit: '' },
    { label: 'Legs-to-Height', value: metrics?.legs_to_height_ratio || 'N/A', unit: '' },
    { label: 'Fat Mass', value: metrics?.fat_mass_percentage || 'N/A', unit: '%' },
    { label: 'Lean Mass', value: metrics?.lean_mass_percentage || 'N/A', unit: '%' },
    { label: 'FFBMI', value: metrics?.ffbmi || 'N/A', unit: '' }
  ];

  return (
    <div className="metrics-tab">
      <div className="tab-header">
        <h2>Body Metrics</h2>
        <div className="fitness-rank-info">
          <span className="rank-label">Current Rank:</span>
          <span 
            className="rank-value"
            style={{ color: '#FFD700' }} // Gold color for visibility
          >
            {metrics?.fitness_rank?.current_rank?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
      </div>

      <div className="metrics-grid">
        {metricsData.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">
              {metric.value}
              {metric.unit && <span className="metric-unit">{metric.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {metrics?.fitness_rank && (
        <div className="rank-progress">
          <h3>Fitness Ranking Progress</h3>
          <div className="progress-info">
            <div className="progress-item">
              <span className="progress-label">Current BMI:</span>
              <span className="progress-value">{metrics.fitness_rank.current_bmi}</span>
            </div>
            <div className="progress-item">
              <span className="progress-label">Next Rank:</span>
              <span className="progress-value">{metrics.fitness_rank.next_rank}</span>
            </div>
            <div className="progress-item">
              <span className="progress-label">BMI to Next:</span>
              <span className="progress-value">{metrics.fitness_rank.bmi_to_next}</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .fitness-rank-info {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .rank-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .rank-value {
          font-weight: var(--font-weight-bold);
          font-size: var(--text-lg);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .metric-card {
          background: var(--bg-tertiary);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          text-align: center;
          border: 1px solid var(--border-primary);
        }

        .metric-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-2);
        }

        .metric-value {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .metric-unit {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin-left: var(--space-1);
        }

        .rank-progress {
          background: var(--bg-secondary);
          padding: var(--space-4);
          border-radius: var(--radius-md);
        }

        .rank-progress h3 {
          margin: 0 0 var(--space-4) 0;
          color: var(--text-primary);
        }

        .progress-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-3);
        }

        .progress-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-2);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }

        .progress-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .progress-value {
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .progress-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// History Tab Component
const HistoryTab = ({ historical }) => {
  return (
    <div className="history-tab">
      <div className="tab-header">
        <h2>Historical Data</h2>
      </div>

      <div className="history-summary">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Total Weight Change</div>
            <div className={`summary-value ${historical?.weight_trend === 'gaining' ? 'positive' : historical?.weight_trend === 'losing' ? 'negative' : 'neutral'}`}>
              {historical?.total_weight_change > 0 ? '+' : ''}{historical?.total_weight_change || 0} kg
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-label">Weekly Recommendation</div>
            <div className={`summary-value ${historical?.weekly_recommendation > 0 ? 'positive' : historical?.weekly_recommendation < 0 ? 'negative' : 'neutral'}`}>
              {historical?.weekly_recommendation > 0 ? '+' : ''}{historical?.weekly_recommendation || 0} kg/week
            </div>
          </div>
          
          <div className="summary-card">
            <div className="summary-label">Weight Trend</div>
            <div className={`summary-value trend-${historical?.weight_trend || 'unknown'}`}>
              {historical?.weight_trend || 'No Data'}
            </div>
          </div>
        </div>
      </div>

      {historical?.weight_logs && historical.weight_logs.length > 0 && (
        <div className="weight-history">
          <h3>Weight History</h3>
          <div className="weight-chart">
            {/* Simple text-based chart */}
            <div className="chart-container">
              {historical.weight_logs.slice(-10).map((log, index) => (
                <div key={index} className="chart-bar">
                  <div className="bar-label">{new Date(log.date).toLocaleDateString()}</div>
                  <div className="bar-value">{log.weight} kg</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .history-summary {
          margin-bottom: var(--space-6);
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .summary-card {
          background: var(--bg-tertiary);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          text-align: center;
          border: 1px solid var(--border-primary);
        }

        .summary-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-2);
        }

        .summary-value {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
        }

        .summary-value.positive {
          color: var(--accent-success);
        }

        .summary-value.negative {
          color: var(--accent-danger);
        }

        .summary-value.neutral {
          color: var(--text-primary);
        }

        .trend-gaining {
          color: var(--accent-success);
        }

        .trend-losing {
          color: var(--accent-danger);
        }

        .trend-stable {
          color: var(--text-primary);
        }

        .trend-no_data {
          color: var(--text-tertiary);
        }

        .weight-history {
          background: var(--bg-secondary);
          padding: var(--space-4);
          border-radius: var(--radius-md);
        }

        .weight-history h3 {
          margin: 0 0 var(--space-4) 0;
          color: var(--text-primary);
        }

        .chart-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .chart-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-2);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }

        .bar-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .bar-value {
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .summary-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
