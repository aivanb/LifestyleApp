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
  const { logout } = useAuth();
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
          Body Metrics & History
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
            profileData={profileData}
            metrics={metrics}
          />
        )}
        
        {activeTab === 'metrics' && (
          <MetricsTab metrics={{...metrics, historical}} />
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
    username: profileData?.username || '',
    email: profileData?.email || '',
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

      {/* Editable Form */}
      {editing ? (
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username || ''}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="form-input"
                step="0.1"
                placeholder="Enter height"
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
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="form-input"
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

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="user-info-display">
          <div className="info-section">
            <h3>Personal Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Username:</span>
                <span className="info-value">{profileData?.username || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{profileData?.email || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Height:</span>
                <span className="info-value">{profileData?.height ? `${profileData.height} cm` : 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Birthday:</span>
                <span className="info-value">
                  {profileData?.birthday ? new Date(profileData.birthday).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Gender:</span>
                <span className="info-value">{profileData?.gender || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Unit Preference:</span>
                <span className="info-value">
                  {profileData?.unit_preference?.unit_name || 'Not set'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Activity Level:</span>
                <span className="info-value">
                  {profileData?.activity_level?.name || 'Not set'}
                </span>
              </div>
              {profileData?.activity_level?.description && (
                <div className="info-item info-item-full">
                  <span className="info-label">Activity Description:</span>
                  <span className="info-value">{profileData.activity_level.description}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
        }

        .user-info-display {
          margin-bottom: var(--space-6);
        }

        .info-section {
          background: var(--bg-secondary);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-4);
          border: 1px solid var(--border-color);
        }

        .info-section h3 {
          margin: 0 0 var(--space-4) 0;
          color: var(--text-primary);
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-3);
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-2);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }

        .info-item-full {
          grid-column: 1 / -1;
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-1);
        }

        .info-label {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
        }

        .info-value {
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
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
          
          .info-grid {
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
  applyCalculatedMacros,
  profileData,
  metrics
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

  // Get current weight from latest weight log
  const currentWeight = metrics?.user_data?.weight || 0;
  const leanMass = metrics?.lean_mass_percentage || 0;
  const fatMass = metrics?.fat_mass_percentage || 0;

  // Auto-calculate macros when weight goal changes
  useEffect(() => {
    if (formData.weight_goal && formData.weight_goal !== goals?.weight_goal) {
      // Trigger macro calculation when weight goal changes
      const weightDiff = Math.abs(parseFloat(formData.weight_goal) - currentWeight);
      if (weightDiff > 0.1) { // Only calculate if there's a meaningful difference
        const timeframe = 12; // Default 12 weeks
        setMacroCalculation(prev => ({
          ...prev,
          weight_goal: formData.weight_goal,
          timeframe_weeks: timeframe.toString()
        }));
        // Auto-calculate macros
        setTimeout(() => {
          calculateMacros();
        }, 500);
      }
    }
  }, [formData.weight_goal, currentWeight, goals?.weight_goal]);

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

      {/* Current Weight Information */}
      <div className="current-weight-section">
        <h3>Current Body Composition</h3>
        <div className="weight-info-grid">
          <div className="weight-info-item">
            <span className="weight-label">Current Weight:</span>
            <span className="weight-value">{currentWeight.toFixed(1)} kg</span>
          </div>
          <div className="weight-info-item">
            <span className="weight-label">Lean Mass:</span>
            <span className="weight-value">{leanMass.toFixed(1)} kg</span>
          </div>
          <div className="weight-info-item">
            <span className="weight-label">Fat Mass:</span>
            <span className="weight-value">{fatMass.toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      {/* Weight Goal Calculator */}
      <div className="weight-calculator card">
        <h3>Weight Goal Calculator</h3>
        <p className="calculator-description">
          Set your target weight and timeframe to calculate optimal macro goals for your body composition goals.
        </p>
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
                placeholder="Enter target weight"
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
                placeholder="Enter weeks"
              />
            </div>
            <div className="form-group">
              <button
                type="button"
                className="btn btn-primary"
                onClick={calculateMacros}
                disabled={macroCalculation.calculating}
              >
                {macroCalculation.calculating ? 'Calculating...' : 'Calculate Macros'}
              </button>
            </div>
          </div>
        </div>

        {macroCalculation.result && (
          <div className="calculation-result">
            <h4>Calculated Macro Goals</h4>
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
              <div className="macro-item">
                <span className="macro-label">Fiber</span>
                <span className="macro-value">{macroCalculation.result.fiber}g</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">Sodium</span>
                <span className="macro-value">{macroCalculation.result.sodium}mg</span>
              </div>
            </div>
            
            {macroCalculation.result.warnings && macroCalculation.result.warnings.length > 0 && (
              <div className="warnings">
                <h5>Important Notes:</h5>
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
              Apply These Goals
            </button>
          </div>
        )}
      </div>

      {/* Goals Display and Edit */}
      <div className="goals-display">
        <div className="goals-section">
          <h3>Weight Goals</h3>
          <div className="goals-grid">
            <div className="goal-item">
              <span className="goal-label">Weight Goal:</span>
              <span className="goal-value">{goals?.weight_goal ? `${goals.weight_goal} kg` : 'Not set'}</span>
            </div>
            <div className="goal-item">
              <span className="goal-label">Lean Mass Goal:</span>
              <span className="goal-value">{goals?.lean_mass_goal ? `${goals.lean_mass_goal} kg` : 'Not set'}</span>
            </div>
            <div className="goal-item">
              <span className="goal-label">Fat Mass Goal:</span>
              <span className="goal-value">{goals?.fat_mass_goal ? `${goals.fat_mass_goal} kg` : 'Not set'}</span>
            </div>
            <div className="goal-item">
              <span className="goal-label">Cost Goal:</span>
              <span className="goal-value">{goals?.cost_goal ? `$${goals.cost_goal}` : 'Not set'}</span>
            </div>
          </div>
        </div>

        <div className="goals-section">
          <h3>Macro Goals</h3>
          <div className="macros-display-grid">
            <div className="macro-display-item">
              <span className="macro-display-label">Calories:</span>
              <span className="macro-display-value">{goals?.calories_goal || 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Protein:</span>
              <span className="macro-display-value">{goals?.protein_goal ? `${goals.protein_goal}g` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Fat:</span>
              <span className="macro-display-value">{goals?.fat_goal ? `${goals.fat_goal}g` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Carbohydrates:</span>
              <span className="macro-display-value">{goals?.carbohydrates_goal ? `${goals.carbohydrates_goal}g` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Fiber:</span>
              <span className="macro-display-value">{goals?.fiber_goal ? `${goals.fiber_goal}g` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Sodium:</span>
              <span className="macro-display-value">{goals?.sodium_goal ? `${goals.sodium_goal}mg` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Sugar:</span>
              <span className="macro-display-value">{goals?.sugar_goal ? `${goals.sugar_goal}g` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Saturated Fat:</span>
              <span className="macro-display-value">{goals?.saturated_fat_goal ? `${goals.saturated_fat_goal}g` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Trans Fat:</span>
              <span className="macro-display-value">{goals?.trans_fat_goal ? `${goals.trans_fat_goal}g` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Cholesterol:</span>
              <span className="macro-display-value">{goals?.cholesterol_goal ? `${goals.cholesterol_goal}mg` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Calcium:</span>
              <span className="macro-display-value">{goals?.calcium_goal ? `${goals.calcium_goal}mg` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Iron:</span>
              <span className="macro-display-value">{goals?.iron_goal ? `${goals.iron_goal}mg` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Magnesium:</span>
              <span className="macro-display-value">{goals?.magnesium_goal ? `${goals.magnesium_goal}mg` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Vitamin A:</span>
              <span className="macro-display-value">{goals?.vitamin_a_goal ? `${goals.vitamin_a_goal}IU` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Vitamin C:</span>
              <span className="macro-display-value">{goals?.vitamin_c_goal ? `${goals.vitamin_c_goal}mg` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Vitamin D:</span>
              <span className="macro-display-value">{goals?.vitamin_d_goal ? `${goals.vitamin_d_goal}IU` : 'Not set'}</span>
            </div>
            <div className="macro-display-item">
              <span className="macro-display-label">Caffeine:</span>
              <span className="macro-display-value">{goals?.caffeine_goal ? `${goals.caffeine_goal}mg` : 'Not set'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Goals Form */}
      {editing && (
        <form onSubmit={handleSubmit}>
          <div className="goals-sections">
            <div className="goals-section">
              <h3>Edit Weight Goals</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Weight Goal (kg)</label>
                  <input
                    type="number"
                    name="weight_goal"
                    value={formData.weight_goal || ''}
                    onChange={handleChange}
                    className="form-input"
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
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost Goal ($)</label>
                  <input
                    type="number"
                    name="cost_goal"
                    value={formData.cost_goal || ''}
                    onChange={handleChange}
                    className="form-input"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="goals-section">
              <h3>Edit Macro Goals</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Calories</label>
                  <input
                    type="number"
                    name="calories_goal"
                    value={formData.calories_goal || ''}
                    onChange={handleChange}
                    className="form-input"
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
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fiber (g)</label>
                  <input
                    type="number"
                    name="fiber_goal"
                    value={formData.fiber_goal || ''}
                    onChange={handleChange}
                    className="form-input"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sodium (mg)</label>
                  <input
                    type="number"
                    name="sodium_goal"
                    value={formData.sodium_goal || ''}
                    onChange={handleChange}
                    className="form-input"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Save Goals
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .current-weight-section {
          background: var(--bg-secondary);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-6);
          border: 1px solid var(--border-color);
        }

        .current-weight-section h3 {
          margin: 0 0 var(--space-4) 0;
          color: var(--text-primary);
        }

        .weight-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-3);
        }

        .weight-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-3);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }

        .weight-label {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
        }

        .weight-value {
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          font-size: var(--text-lg);
        }

        .weight-calculator {
          margin-bottom: var(--space-6);
          padding: var(--space-4);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .weight-calculator h3 {
          margin: 0 0 var(--space-2) 0;
          color: var(--text-primary);
        }

        .calculator-description {
          color: var(--text-secondary);
          margin-bottom: var(--space-4);
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
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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

        .goals-display {
          margin-bottom: var(--space-6);
        }

        .goals-section {
          background: var(--bg-secondary);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-4);
          border: 1px solid var(--border-color);
        }

        .goals-section h3 {
          margin: 0 0 var(--space-4) 0;
          color: var(--text-primary);
        }

        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-3);
        }

        .goal-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-2);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }

        .goal-label {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
        }

        .goal-value {
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
        }

        .macros-display-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-3);
        }

        .macro-display-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-2);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }

        .macro-display-label {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
        }

        .macro-display-value {
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
        }

        .goals-sections {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
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

          .weight-info-grid {
            grid-template-columns: 1fr;
          }

          .goals-grid {
            grid-template-columns: 1fr;
          }

          .macros-display-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Metrics Tab Component
const MetricsTab = ({ metrics }) => {
  // Helper function to get rank color
  const getRankColor = (rank) => {
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

  // Helper function to calculate overall fitness level as average of all ranks
  const calculateOverallFitnessLevel = () => {
    const rankValues = {
      'dirt': 1, 'gravel': 2, 'tin': 3, 'aluminum': 4, 'lead': 5,
      'bronze': 6, 'copper': 7, 'iron': 8, 'quartz': 9, 'gold': 10,
      'ruby': 11, 'crystal': 12, 'emerald': 13, 'diamond': 14,
      'titanium': 15, 'platinum': 16, 'mithril': 17
    };

    const rankNames = Object.keys(rankValues);
    
    let totalValue = 0;
    let validMetrics = 0;

    // Calculate average rank from all metrics
    metricsData.forEach(metric => {
      const metricRank = calculateMetricRank(metric.value, metric.type);
      if (metricRank.rank !== 'N/A' && rankValues[metricRank.rank]) {
        totalValue += rankValues[metricRank.rank];
        validMetrics++;
      }
    });

    if (validMetrics === 0) {
      return { rank: 'UNKNOWN', color: '#666' };
    }

    const averageValue = totalValue / validMetrics;
    const roundedAverage = Math.round(averageValue);
    
    // Find the closest rank
    const overallRank = rankNames[roundedAverage - 1] || 'UNKNOWN';
    
    return {
      rank: overallRank.toUpperCase(),
      color: getRankColor(overallRank),
      averageValue: averageValue,
      validMetrics: validMetrics
    };
  };

  // Helper function to calculate rank for individual metrics
  const calculateMetricRank = (value, metricType) => {
    if (!value || value === 'N/A') return { rank: 'N/A', progress: 0, nextRank: 'N/A', valueNeeded: 0, direction: '', ranges: [] };
    
    const numValue = parseFloat(value);
    
    switch (metricType) {
      case 'BMI':
        // BMI ranking (optimal range is 18.5-24.9, so we rank based on distance from optimal)
        const bmiRanges = [
          { rank: 'mithril', min: 18.5, max: 24.9 },      // Optimal range
          { rank: 'platinum', min: 17, max: 18.5 },       // Slightly underweight
          { rank: 'diamond', min: 24.9, max: 27 },        // Slightly overweight
          { rank: 'emerald', min: 16, max: 17 },          // Underweight
          { rank: 'crystal', min: 27, max: 30 },          // Overweight
          { rank: 'ruby', min: 15, max: 16 },            // Severely underweight
          { rank: 'gold', min: 30, max: 35 },            // Obese Class I
          { rank: 'quartz', min: 14, max: 15 },          // Very severely underweight
          { rank: 'iron', min: 35, max: 40 },            // Obese Class II
          { rank: 'copper', min: 13, max: 14 },          // Extremely underweight
          { rank: 'bronze', min: 40, max: 100 },         // Obese Class III
          { rank: 'lead', min: 12, max: 13 },            // Dangerously underweight
          { rank: 'aluminum', min: 11, max: 12 },        // Critically underweight
          { rank: 'tin', min: 10, max: 11 },             // Life-threatening underweight
          { rank: 'gravel', min: 9, max: 10 },           // Fatal underweight
          { rank: 'dirt', min: 0, max: 9 }               // Impossible underweight
        ];
        
        for (let i = 0; i < bmiRanges.length; i++) {
          const range = bmiRanges[i];
          if (numValue >= range.min && numValue < range.max) {
            let nextRank = 'MAX';
            let valueNeeded = 0;
            let direction = '';
            
            if (i === 0) {
              // Already at optimal (mithril), no next rank
              nextRank = 'MAX';
              valueNeeded = 0;
              direction = '';
            } else {
              // For all other ranks, next rank is one step closer to optimal
              nextRank = bmiRanges[i - 1].rank;
              const nextRange = bmiRanges[i - 1];
              
              // Calculate distance to next rank boundary
              if (i === 1) {
                // Currently platinum (underweight), need to reach mithril (optimal)
                valueNeeded = 18.5 - numValue;
                direction = 'gain';
              } else if (i === 2) {
                // Currently diamond (overweight), need to reach mithril (optimal)
                valueNeeded = numValue - 24.9;
                direction = 'lose';
              } else {
                // For other ranks, calculate distance to next rank boundary
                if (numValue < 18.5) {
                  // Underweight - need to gain to reach next rank
                  valueNeeded = nextRange.min - numValue;
                  direction = 'gain';
                } else if (numValue > 24.9) {
                  // Overweight - need to lose to reach next rank
                  valueNeeded = numValue - nextRange.max;
                  direction = 'lose';
                } else {
                  // In optimal range but not mithril
                  valueNeeded = Math.abs(numValue - 21.7); // Distance to optimal center
                  direction = numValue < 21.7 ? 'gain' : 'lose';
                }
              }
            }
            
            return {
              rank: range.rank,
              progress: 0,
              nextRank: nextRank,
              valueNeeded: Math.max(0, valueNeeded),
              direction: direction,
              ranges: bmiRanges,
              currentRange: range
            };
          }
        }
        return { rank: 'dirt', progress: 0, nextRank: 'gravel', valueNeeded: Math.max(0, 9 - numValue), direction: 'gain', ranges: bmiRanges };
      
      case 'BMR':
        // BMR ranking (higher is better, based on age/gender)
        const bmrRanges = [
          { rank: 'dirt', min: 0, max: 1200 },
          { rank: 'gravel', min: 1200, max: 1300 },
          { rank: 'tin', min: 1300, max: 1400 },
          { rank: 'aluminum', min: 1400, max: 1500 },
          { rank: 'lead', min: 1500, max: 1600 },
          { rank: 'bronze', min: 1600, max: 1700 },
          { rank: 'copper', min: 1700, max: 1800 },
          { rank: 'iron', min: 1800, max: 1900 },
          { rank: 'quartz', min: 1900, max: 2000 },
          { rank: 'gold', min: 2000, max: 2100 },
          { rank: 'ruby', min: 2100, max: 2200 },
          { rank: 'crystal', min: 2200, max: 2300 },
          { rank: 'emerald', min: 2300, max: 2400 },
          { rank: 'diamond', min: 2400, max: 2500 },
          { rank: 'titanium', min: 2500, max: 2600 },
          { rank: 'platinum', min: 2600, max: 2700 },
          { rank: 'mithril', min: 2700, max: 10000 }
        ];
        
        for (let i = 0; i < bmrRanges.length; i++) {
          const range = bmrRanges[i];
          if (numValue >= range.min && numValue < range.max) {
            const nextRank = i < bmrRanges.length - 1 ? bmrRanges[i + 1].rank : 'MAX';
            const valueNeeded = i < bmrRanges.length - 1 ? Math.max(0, bmrRanges[i + 1].min - numValue) : 0;
            return {
              rank: range.rank,
              progress: 0,
              nextRank: nextRank,
              valueNeeded: valueNeeded,
              direction: 'increase',
              ranges: bmrRanges,
              currentRange: range
            };
          }
        }
        return { rank: 'mithril', progress: 0, nextRank: 'MAX', valueNeeded: 0, direction: '', ranges: bmrRanges };
      
      case 'TDEE':
        // TDEE ranking (higher is better)
        const tdeeRanges = [
          { rank: 'dirt', min: 0, max: 1500 },
          { rank: 'gravel', min: 1500, max: 1700 },
          { rank: 'tin', min: 1700, max: 1900 },
          { rank: 'aluminum', min: 1900, max: 2100 },
          { rank: 'lead', min: 2100, max: 2300 },
          { rank: 'bronze', min: 2300, max: 2500 },
          { rank: 'copper', min: 2500, max: 2700 },
          { rank: 'iron', min: 2700, max: 2900 },
          { rank: 'quartz', min: 2900, max: 3100 },
          { rank: 'gold', min: 3100, max: 3300 },
          { rank: 'ruby', min: 3300, max: 3500 },
          { rank: 'crystal', min: 3500, max: 3700 },
          { rank: 'emerald', min: 3700, max: 3900 },
          { rank: 'diamond', min: 3900, max: 4100 },
          { rank: 'titanium', min: 4100, max: 4300 },
          { rank: 'platinum', min: 4300, max: 4500 },
          { rank: 'mithril', min: 4500, max: 10000 }
        ];
        
        for (let i = 0; i < tdeeRanges.length; i++) {
          const range = tdeeRanges[i];
          if (numValue >= range.min && numValue < range.max) {
            const nextRank = i < tdeeRanges.length - 1 ? tdeeRanges[i + 1].rank : 'MAX';
            const valueNeeded = i < tdeeRanges.length - 1 ? Math.max(0, tdeeRanges[i + 1].min - numValue) : 0;
            return {
              rank: range.rank,
              progress: 0,
              nextRank: nextRank,
              valueNeeded: valueNeeded,
              direction: 'increase',
              ranges: tdeeRanges,
              currentRange: range
            };
          }
        }
        return { rank: 'mithril', progress: 0, nextRank: 'MAX', valueNeeded: 0, direction: '', ranges: tdeeRanges };
      
      case 'Fat Mass':
        // Fat mass percentage ranking (lower is better)
        const fatRanges = [
          { rank: 'mithril', min: 0, max: 5 },
          { rank: 'platinum', min: 5, max: 10 },
          { rank: 'diamond', min: 10, max: 15 },
          { rank: 'emerald', min: 15, max: 20 },
          { rank: 'crystal', min: 20, max: 25 },
          { rank: 'ruby', min: 25, max: 30 },
          { rank: 'gold', min: 30, max: 35 },
          { rank: 'quartz', min: 35, max: 40 },
          { rank: 'iron', min: 40, max: 45 },
          { rank: 'copper', min: 45, max: 50 },
          { rank: 'bronze', min: 50, max: 100 }
        ];
        
        for (let i = 0; i < fatRanges.length; i++) {
          const range = fatRanges[i];
          if (numValue >= range.min && numValue < range.max) {
            const nextRank = i > 0 ? fatRanges[i - 1].rank : 'MAX';
            const valueNeeded = i > 0 ? Math.max(0, numValue - fatRanges[i - 1].max) : 0;
            return {
              rank: range.rank,
              progress: 0,
              nextRank: nextRank,
              valueNeeded: valueNeeded,
              direction: 'decrease',
              ranges: fatRanges,
              currentRange: range
            };
          }
        }
        return { rank: 'bronze', progress: 0, nextRank: 'copper', valueNeeded: numValue - 50, direction: 'decrease', ranges: fatRanges };
      
      case 'Lean Mass':
        // Lean mass percentage ranking (higher is better)
        const leanRanges = [
          { rank: 'mithril', min: 95, max: 100 },
          { rank: 'platinum', min: 90, max: 95 },
          { rank: 'diamond', min: 85, max: 90 },
          { rank: 'emerald', min: 80, max: 85 },
          { rank: 'crystal', min: 75, max: 80 },
          { rank: 'ruby', min: 70, max: 75 },
          { rank: 'gold', min: 65, max: 70 },
          { rank: 'quartz', min: 60, max: 65 },
          { rank: 'iron', min: 55, max: 60 },
          { rank: 'copper', min: 50, max: 55 },
          { rank: 'bronze', min: 0, max: 50 }
        ];
        
        for (let i = 0; i < leanRanges.length; i++) {
          const range = leanRanges[i];
          if (numValue >= range.min && numValue < range.max) {
            const nextRank = i > 0 ? leanRanges[i - 1].rank : 'MAX';
            const valueNeeded = i > 0 ? Math.max(0, leanRanges[i - 1].min - numValue) : 0;
            return {
              rank: range.rank,
              progress: 0,
              nextRank: nextRank,
              valueNeeded: valueNeeded,
              direction: 'increase',
              ranges: leanRanges,
              currentRange: range
            };
          }
        }
        return { rank: 'bronze', progress: 0, nextRank: 'copper', valueNeeded: 50 - numValue, direction: 'increase', ranges: leanRanges };
      
      case 'Waist/Height':
        // Waist to height ratio (lower is better)
        const waistHeightRanges = [
          { rank: 'mithril', min: 0, max: 0.4 },
          { rank: 'platinum', min: 0.4, max: 0.45 },
          { rank: 'diamond', min: 0.45, max: 0.5 },
          { rank: 'emerald', min: 0.5, max: 0.55 },
          { rank: 'crystal', min: 0.55, max: 0.6 },
          { rank: 'ruby', min: 0.6, max: 0.65 },
          { rank: 'gold', min: 0.65, max: 0.7 },
          { rank: 'quartz', min: 0.7, max: 0.75 },
          { rank: 'iron', min: 0.75, max: 0.8 },
          { rank: 'copper', min: 0.8, max: 0.85 },
          { rank: 'bronze', min: 0.85, max: 1.0 }
        ];
        
        for (let i = 0; i < waistHeightRanges.length; i++) {
          const range = waistHeightRanges[i];
          if (numValue >= range.min && numValue < range.max) {
            const nextRank = i > 0 ? waistHeightRanges[i - 1].rank : 'MAX';
            const valueNeeded = i > 0 ? Math.max(0, numValue - waistHeightRanges[i - 1].max) : 0;
            return {
              rank: range.rank,
              progress: 0,
              nextRank: nextRank,
              valueNeeded: valueNeeded,
              direction: 'decrease',
              ranges: waistHeightRanges,
              currentRange: range
            };
          }
        }
        return { rank: 'bronze', progress: 0, nextRank: 'copper', valueNeeded: Math.max(0, numValue - 0.85), direction: 'decrease', ranges: waistHeightRanges };
      
      case 'Waist/Shoulder':
        // Waist to shoulder ratio (lower is better for V-shape)
        const waistShoulderRanges = [
          { rank: 'mithril', min: 0, max: 0.7 },
          { rank: 'platinum', min: 0.7, max: 0.75 },
          { rank: 'diamond', min: 0.75, max: 0.8 },
          { rank: 'emerald', min: 0.8, max: 0.85 },
          { rank: 'crystal', min: 0.85, max: 0.9 },
          { rank: 'ruby', min: 0.9, max: 0.95 },
          { rank: 'gold', min: 0.95, max: 1.0 },
          { rank: 'quartz', min: 1.0, max: 1.05 },
          { rank: 'iron', min: 1.05, max: 1.1 },
          { rank: 'copper', min: 1.1, max: 1.15 },
          { rank: 'bronze', min: 1.15, max: 2 }
        ];
        
        for (let i = 0; i < waistShoulderRanges.length; i++) {
          const range = waistShoulderRanges[i];
          if (numValue >= range.min && numValue < range.max) {
            const nextRank = i > 0 ? waistShoulderRanges[i - 1].rank : 'MAX';
            const valueNeeded = i > 0 ? Math.max(0, numValue - waistShoulderRanges[i - 1].max) : 0;
            return {
              rank: range.rank,
              progress: 0,
              nextRank: nextRank,
              valueNeeded: valueNeeded,
              direction: 'decrease',
              ranges: waistShoulderRanges,
              currentRange: range
            };
          }
        }
        return { rank: 'bronze', progress: 0, nextRank: 'copper', valueNeeded: numValue - 1.15, direction: 'decrease', ranges: waistShoulderRanges };
      
      case 'Legs/Height':
        // Legs to height ratio (higher is better for aesthetics)
        const legsHeightRanges = [
          { rank: 'mithril', min: 0.5, max: 1 },
          { rank: 'platinum', min: 0.48, max: 0.5 },
          { rank: 'diamond', min: 0.46, max: 0.48 },
          { rank: 'emerald', min: 0.44, max: 0.46 },
          { rank: 'crystal', min: 0.42, max: 0.44 },
          { rank: 'ruby', min: 0.4, max: 0.42 },
          { rank: 'gold', min: 0.38, max: 0.4 },
          { rank: 'quartz', min: 0.36, max: 0.38 },
          { rank: 'iron', min: 0.34, max: 0.36 },
          { rank: 'copper', min: 0.32, max: 0.34 },
          { rank: 'bronze', min: 0, max: 0.32 }
        ];
        
        for (let i = 0; i < legsHeightRanges.length; i++) {
          const range = legsHeightRanges[i];
          if (numValue >= range.min && numValue < range.max) {
            const nextRank = i > 0 ? legsHeightRanges[i - 1].rank : 'MAX';
            const valueNeeded = i > 0 ? Math.max(0, legsHeightRanges[i - 1].min - numValue) : 0;
            return {
              rank: range.rank,
              progress: 0,
              nextRank: nextRank,
              valueNeeded: valueNeeded,
              direction: 'increase',
              ranges: legsHeightRanges,
              currentRange: range
            };
          }
        }
        return { rank: 'bronze', progress: 0, nextRank: 'copper', valueNeeded: 0.32 - numValue, direction: 'increase', ranges: legsHeightRanges };
      
      case 'FFBMI':
        // Fat-Free Body Mass Index (higher is better)
        const ffbmiRanges = [
          { rank: 'mithril', min: 20, max: 100 },
          { rank: 'platinum', min: 18, max: 20 },
          { rank: 'diamond', min: 16, max: 18 },
          { rank: 'emerald', min: 14, max: 16 },
          { rank: 'crystal', min: 12, max: 14 },
          { rank: 'ruby', min: 10, max: 12 },
          { rank: 'gold', min: 8, max: 10 },
          { rank: 'quartz', min: 6, max: 8 },
          { rank: 'iron', min: 4, max: 6 },
          { rank: 'copper', min: 2, max: 4 },
          { rank: 'bronze', min: 0, max: 2 }
        ];
        
        for (let i = 0; i < ffbmiRanges.length; i++) {
          const range = ffbmiRanges[i];
          if (numValue >= range.min && numValue < range.max) {
            const nextRank = i > 0 ? ffbmiRanges[i - 1].rank : 'MAX';
            const valueNeeded = i > 0 ? Math.max(0, ffbmiRanges[i - 1].min - numValue) : 0;
            return {
              rank: range.rank,
              progress: 0,
              nextRank: nextRank,
              valueNeeded: valueNeeded,
              direction: 'increase',
              ranges: ffbmiRanges,
              currentRange: range
            };
          }
        }
        return { rank: 'bronze', progress: 0, nextRank: 'copper', valueNeeded: Math.max(0, 2 - numValue), direction: 'increase', ranges: ffbmiRanges };
      
      default:
        return { rank: 'N/A', progress: 0, nextRank: 'N/A', valueNeeded: 0, direction: '', ranges: [] };
    }
  };

  const metricsData = [
    { 
      label: 'BMI', 
      value: metrics?.bmi || 'N/A', 
      unit: '',
      type: 'BMI',
      description: 'Body Mass Index - overall body composition indicator'
    },
    { 
      label: 'BMR', 
      value: Math.round(metrics?.bmr || 0), 
      unit: 'cal/day',
      type: 'BMR',
      description: 'Basal Metabolic Rate - calories burned at rest'
    },
    { 
      label: 'TDEE', 
      value: Math.round(metrics?.tdee || 0), 
      unit: 'cal/day',
      type: 'TDEE',
      description: 'Total Daily Energy Expenditure - total calories burned'
    },
    { 
      label: 'Waist-to-Height', 
      value: metrics?.waist_to_height_ratio || 'N/A', 
      unit: '',
      type: 'Waist/Height',
      description: 'Waist circumference divided by height'
    },
    { 
      label: 'Waist-to-Shoulder', 
      value: metrics?.waist_to_shoulder_ratio || 'N/A', 
      unit: '',
      type: 'Waist/Shoulder',
      description: 'Waist circumference divided by shoulder width'
    },
    { 
      label: 'Legs-to-Height', 
      value: metrics?.legs_to_height_ratio || 'N/A', 
      unit: '',
      type: 'Legs/Height',
      description: 'Leg length divided by total height'
    },
    { 
      label: 'Fat Mass', 
      value: metrics?.fat_mass_percentage || 'N/A', 
      unit: '%',
      type: 'Fat Mass',
      description: 'Percentage of body weight that is fat'
    },
    { 
      label: 'Lean Mass', 
      value: metrics?.lean_mass_percentage || 'N/A', 
      unit: '%',
      type: 'Lean Mass',
      description: 'Percentage of body weight that is lean tissue'
    },
    { 
      label: 'FFBMI', 
      value: metrics?.ffbmi || 'N/A', 
      unit: '',
      type: 'FFBMI',
      description: 'Fat-Free Body Mass Index'
    }
  ];

  return (
    <div className="metrics-tab">
      <div className="tab-header">
        <h2>Body Metrics & Rankings</h2>
        <div className="overall-rank-info">
          <span className="rank-label">Overall Fitness Level:</span>
          <span 
            className="rank-value"
            style={{ color: calculateOverallFitnessLevel().color }}
          >
            {calculateOverallFitnessLevel().rank}
          </span>
          <span className="rank-details">
            (Average of {calculateOverallFitnessLevel().validMetrics} metrics)
          </span>
        </div>
      </div>

      <div className="metrics-grid">
        {metricsData.map((metric, index) => {
          const metricRank = calculateMetricRank(metric.value, metric.type);
          return (
            <div key={index} className="metric-card">
              <div className="metric-header">
                <div className="metric-label">{metric.label}</div>
                <div 
                  className="metric-rank"
                  style={{ color: getRankColor(metricRank.rank) }}
                >
                  {metricRank.rank.toUpperCase()}
                </div>
              </div>
              <div className="metric-value">
                {metric.value}
                {metric.unit && <span className="metric-unit">{metric.unit}</span>}
              </div>
              <div className="metric-description">
                {metric.description}
              </div>
              
              {/* Show ranking system for metrics that have ranks */}
              {metricRank.ranges && metricRank.ranges.length > 0 && (
                <div className="ranking-system">
                  <div className="ranking-header">
                    <span className="ranking-title">Ranking System:</span>
                  </div>
                  <div className="ranking-ranges">
                    {metricRank.ranges.map((range, idx) => (
                      <div key={idx} className="ranking-range">
                        <span 
                          className="ranking-rank"
                          style={{ color: getRankColor(range.rank) }}
                        >
                          {range.rank.toUpperCase()}
                        </span>
                        <span className="ranking-values">
                          {range.min}-{range.max}{metric.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .overall-rank-info {
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

        .rank-details {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          margin-left: var(--space-2);
        }
        

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .metric-card {
          background: var(--bg-secondary);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
        }

        .metric-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-weight-medium);
        }

        .metric-rank {
          font-size: var(--text-xs);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-value {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .metric-unit {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin-left: var(--space-1);
        }

        .metric-description {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          margin-bottom: var(--space-2);
          line-height: 1.4;
        }

        .ranking-system {
          margin: var(--space-3) 0;
          padding: var(--space-2);
          background: var(--bg-tertiary);
          border-radius: var(--radius-sm);
        }

        .ranking-header {
          margin-bottom: var(--space-2);
        }

        .ranking-title {
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ranking-ranges {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .ranking-range {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-1);
          background: var(--bg-secondary);
          border-radius: var(--radius-xs);
        }

        .ranking-rank {
          font-size: var(--text-xs);
          font-weight: var(--font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ranking-values {
          font-size: var(--text-xs);
          color: var(--text-secondary);
        }

        .ranking-more {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-align: center;
          font-style: italic;
        }


        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
