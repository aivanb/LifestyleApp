import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ThemeSwitcher from '../components/ThemeSwitcher';

/**
 * Profile Component
 * 
 * Comprehensive profile management with:
 * - Personal information editing
 * - Body metrics display with fitness ranking
 * - Historical data and trends
 * - Responsive mobile/desktop layouts
 */
const Profile = () => {
  // const { logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [historical, setHistorical] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  const [editing, setEditing] = useState(false);

  // Calculate overall rank based on average of all metrics
  const calculateOverallRank = () => {
    const rankOrder = ['dirt', 'gravel', 'tin', 'aluminum', 'lead', 'bronze', 'copper', 'iron', 'quartz', 'gold', 'ruby', 'crystal', 'emerald', 'diamond', 'titanium', 'platinum', 'mithril'];
    
    const metricsToCheck = [
      { value: metrics?.bmi || 0, type: 'bmi' },
      { value: metrics?.waist_to_height_ratio || 0, type: 'waist_to_height_ratio' },
      { value: metrics?.waist_to_shoulder_ratio || 0, type: 'waist_to_shoulder_ratio' },
      { value: metrics?.legs_to_height_ratio || 0, type: 'legs_to_height_ratio' },
      { value: metrics?.bmr || 0, type: 'bmr' },
      { value: metrics?.tdee || 0, type: 'tdee' },
      { value: metrics?.fat_mass_percentage || 0, type: 'fat_mass_percentage' },
      { value: metrics?.lean_mass_percentage || 0, type: 'lean_mass_percentage' },
      { value: metrics?.ffbmi || 0, type: 'ffbmi' }
    ];

    const ranges = {
      bmi: [
        { min: 0, max: 18.5, rank: 'dirt' },
        { min: 18.5, max: 25, rank: 'bronze' },
        { min: 25, max: 30, rank: 'iron' },
        { min: 30, max: 35, rank: 'gold' },
        { min: 35, max: 40, rank: 'diamond' },
        { min: 40, max: Infinity, rank: 'mithril' }
      ],
      waist_to_height_ratio: [
        { min: 0, max: 0.4, rank: 'dirt' },
        { min: 0.4, max: 0.5, rank: 'bronze' },
        { min: 0.5, max: 0.6, rank: 'iron' },
        { min: 0.6, max: 0.7, rank: 'gold' },
        { min: 0.7, max: 0.8, rank: 'diamond' },
        { min: 0.8, max: Infinity, rank: 'mithril' }
      ],
      waist_to_shoulder_ratio: [
        { min: 0, max: 0.6, rank: 'dirt' },
        { min: 0.6, max: 0.7, rank: 'bronze' },
        { min: 0.7, max: 0.8, rank: 'iron' },
        { min: 0.8, max: 0.9, rank: 'gold' },
        { min: 0.9, max: 1.0, rank: 'diamond' },
        { min: 1.0, max: Infinity, rank: 'mithril' }
      ],
      legs_to_height_ratio: [
        { min: 0, max: 0.4, rank: 'dirt' },
        { min: 0.4, max: 0.45, rank: 'bronze' },
        { min: 0.45, max: 0.5, rank: 'iron' },
        { min: 0.5, max: 0.55, rank: 'gold' },
        { min: 0.55, max: 0.6, rank: 'diamond' },
        { min: 0.6, max: Infinity, rank: 'mithril' }
      ],
      bmr: [
        { min: 0, max: 1200, rank: 'dirt' },
        { min: 1200, max: 1400, rank: 'bronze' },
        { min: 1400, max: 1600, rank: 'iron' },
        { min: 1600, max: 1800, rank: 'gold' },
        { min: 1800, max: 2000, rank: 'diamond' },
        { min: 2000, max: Infinity, rank: 'mithril' }
      ],
      tdee: [
        { min: 0, max: 1500, rank: 'dirt' },
        { min: 1500, max: 1800, rank: 'bronze' },
        { min: 1800, max: 2100, rank: 'iron' },
        { min: 2100, max: 2400, rank: 'gold' },
        { min: 2400, max: 2700, rank: 'diamond' },
        { min: 2700, max: Infinity, rank: 'mithril' }
      ],
      fat_mass_percentage: [
        { min: 0, max: 10, rank: 'dirt' },
        { min: 10, max: 15, rank: 'bronze' },
        { min: 15, max: 20, rank: 'iron' },
        { min: 20, max: 25, rank: 'gold' },
        { min: 25, max: 30, rank: 'diamond' },
        { min: 30, max: Infinity, rank: 'mithril' }
      ],
      lean_mass_percentage: [
        { min: 0, max: 70, rank: 'dirt' },
        { min: 70, max: 75, rank: 'bronze' },
        { min: 75, max: 80, rank: 'iron' },
        { min: 80, max: 85, rank: 'gold' },
        { min: 85, max: 90, rank: 'diamond' },
        { min: 90, max: Infinity, rank: 'mithril' }
      ],
      ffbmi: [
        { min: 0, max: 15, rank: 'dirt' },
        { min: 15, max: 18, rank: 'bronze' },
        { min: 18, max: 21, rank: 'iron' },
        { min: 21, max: 24, rank: 'gold' },
        { min: 24, max: 27, rank: 'diamond' },
        { min: 27, max: Infinity, rank: 'mithril' }
      ]
    };

    const ranks = metricsToCheck.map(metric => {
      const metricRanges = ranges[metric.type] || [];
      const rank = metricRanges.find(range => metric.value >= range.min && metric.value < range.max);
      return rank?.rank || 'dirt';
    });

    const rankIndices = ranks.map(rank => rankOrder.indexOf(rank));
    const averageIndex = Math.round(rankIndices.reduce((sum, index) => sum + index, 0) / rankIndices.length);
    
    return rankOrder[Math.max(0, Math.min(averageIndex, rankOrder.length - 1))];
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile/');
      
      if (response.data.data) {
        setProfileData(response.data.data.user);
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

  const getRankIcon = (rank) => {
    const icons = {
      'dirt': '🌱',
      'gravel': '🪨',
      'tin': '🥫',
      'aluminum': '🥤',
      'lead': '⚫',
      'bronze': '🥉',
      'copper': '🟤',
      'iron': '⚙️',
      'quartz': '💎',
      'gold': '🥇',
      'ruby': '💎',
      'crystal': '🔮',
      'emerald': '💚',
      'diamond': '💎',
      'titanium': '⚡',
      'platinum': '🏆',
      'mithril': '✨'
    };
    return icons[rank] || '⭐';
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
    <div className="profile-page">
      {/* Header Section */}
      <div className="profile-header">
        <div className="header-content">
          <div className="user-info">
            <div className="user-avatar">
              <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="user-details">
              <h1 className="user-name">{profileData?.username || 'User'}</h1>
              <p className="user-email">{profileData?.email}</p>
            </div>
          </div>
          
          <div className="fitness-rank">
            <div 
              className="rank-badge"
              style={{ backgroundColor: getFitnessRankColor(calculateOverallRank()) }}
            >
              {getRankIcon(calculateOverallRank())} {calculateOverallRank().toUpperCase()}
            </div>
          </div>
          
          <div className="theme-toggle-section">
            <ThemeSwitcher />
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
          <p>{error}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'personal' && (
          <PersonalInfoTab 
            profileData={profileData}
            editing={editing}
            setEditing={setEditing}
            updateProfile={updateProfile}
          />
        )}
        
        
        {activeTab === 'metrics' && (
          <MetricsTab metrics={{...metrics, historical}} />
        )}
      </div>

      <style jsx>{`
        .profile-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-6);
        }

        .profile-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .loading-spinner {
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

        .profile-header {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-6);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-6);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .user-avatar {
          width: 60px;
          height: 60px;
          background: var(--bg-tertiary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-details h1 {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin: 0 0 var(--space-1) 0;
        }

        .user-details p {
          color: var(--text-secondary);
          margin: 0;
        }

        .fitness-rank {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rank-badge {
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          color: white;
          font-weight: var(--font-weight-bold);
          font-size: var(--text-sm);
          text-align: center;
          min-width: 120px;
        }

        .theme-toggle-section {
          display: flex;
          align-items: center;
          justify-content: center;
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

        .form-input::placeholder {
          color: var(--text-tertiary);
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

        .tab-content {
          min-height: 400px;
        }

        @media (max-width: 768px) {
          .profile-page {
            padding: var(--space-4);
          }

          .header-content {
          flex-direction: column;
          gap: var(--space-4);
            text-align: center;
          }

          .user-info {
            flex-direction: column;
            text-align: center;
          }

          .profile-tabs {
            flex-wrap: wrap;
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
    unit_preference: profileData?.unit_preference?.unit_preference_id || '',
    activity_level: profileData?.activity_level?.activity_level_id || ''
  });

  useEffect(() => {
    setFormData({
      username: profileData?.username || '',
      email: profileData?.email || '',
      height: profileData?.height || '',
      birthday: profileData?.birthday || '',
      gender: profileData?.gender || '',
      unit_preference: profileData?.unit_preference?.unit_preference_id || '',
      activity_level: profileData?.activity_level?.activity_level_id || ''
    });
  }, [profileData]);

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
          {editing ? 'Cancel' : 'Edit Info'}
        </button>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="personal-info-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
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
                value={formData.email}
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
                <option value="1">Sedentary - Little to no exercise, desk job</option>
                <option value="2">Light Activity - Light exercise 1-3 days/week</option>
                <option value="3">Moderate Activity - Moderate exercise 3-5 days/week</option>
                <option value="4">Active - Heavy exercise 6-7 days/week</option>
                <option value="5">Very Active - Very heavy exercise, physical job</option>
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
        .personal-info-tab {
          max-width: 1200px;
          margin: 0 auto;
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
        }

        .tab-header h2 {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .form-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .form-actions {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
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

        .user-info-display {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
        }

        .info-section h3 {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          margin-bottom: var(--space-4);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-4);
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .info-item-full {
          grid-column: 1 / -1;
        }

        .info-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .info-value {
          font-size: var(--text-base);
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .tab-header {
            flex-direction: column;
            gap: var(--space-4);
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

// Metrics Tab Component
const MetricsTab = ({ metrics }) => {
  const [expandedRanking, setExpandedRanking] = useState(null);

  // Toggle ranking dropdown
  const toggleRankingDropdown = (index) => {
    setExpandedRanking(expandedRanking === index ? null : index);
  };

  // Helper function to get rank icon
  const getRankIcon = (rank) => {
    const icons = {
      'dirt': '🌱',
      'gravel': '🪨',
      'tin': '🥫',
      'aluminum': '🥤',
      'lead': '⚫',
      'bronze': '🥉',
      'copper': '🟤',
      'iron': '⚙️',
      'quartz': '💎',
      'gold': '🥇',
      'ruby': '💎',
      'crystal': '🔮',
      'emerald': '💚',
      'diamond': '💎',
      'titanium': '⚡',
      'platinum': '🏆',
      'mithril': '✨'
    };
    return icons[rank] || '⭐';
  };

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
    return colors[rank] || '#6B7280';
  };


  // Helper function to calculate metric rank
  const calculateMetricRank = (value, type) => {
    const ranges = {
      'bmi': [
        { rank: 'dirt', min: 0, max: 18.5 },
        { rank: 'gravel', min: 18.5, max: 25 },
        { rank: 'tin', min: 25, max: 30 },
        { rank: 'aluminum', min: 30, max: 35 },
        { rank: 'lead', min: 35, max: 40 },
        { rank: 'bronze', min: 40, max: 45 },
        { rank: 'copper', min: 45, max: 50 },
        { rank: 'iron', min: 50, max: 55 },
        { rank: 'quartz', min: 55, max: 60 },
        { rank: 'gold', min: 60, max: 65 },
        { rank: 'ruby', min: 65, max: 70 },
        { rank: 'crystal', min: 70, max: 75 },
        { rank: 'emerald', min: 75, max: 80 },
        { rank: 'diamond', min: 80, max: 85 },
        { rank: 'titanium', min: 85, max: 90 },
        { rank: 'platinum', min: 90, max: 95 },
        { rank: 'mithril', min: 95, max: 100 }
      ],
      'waist_to_height_ratio': [
        { rank: 'dirt', min: 0, max: 0.4 },
        { rank: 'gravel', min: 0.4, max: 0.45 },
        { rank: 'tin', min: 0.45, max: 0.5 },
        { rank: 'aluminum', min: 0.5, max: 0.55 },
        { rank: 'lead', min: 0.55, max: 0.6 },
        { rank: 'bronze', min: 0.6, max: 0.65 },
        { rank: 'copper', min: 0.65, max: 0.7 },
        { rank: 'iron', min: 0.7, max: 0.75 },
        { rank: 'quartz', min: 0.75, max: 0.8 },
        { rank: 'gold', min: 0.8, max: 0.85 },
        { rank: 'ruby', min: 0.85, max: 0.9 },
        { rank: 'crystal', min: 0.9, max: 0.95 },
        { rank: 'emerald', min: 0.95, max: 1.0 },
        { rank: 'diamond', min: 1.0, max: 1.05 },
        { rank: 'titanium', min: 1.05, max: 1.1 },
        { rank: 'platinum', min: 1.1, max: 1.15 },
        { rank: 'mithril', min: 1.15, max: 2.0 }
      ],
      'waist_to_shoulder_ratio': [
        { rank: 'dirt', min: 0, max: 0.7 },
        { rank: 'gravel', min: 0.7, max: 0.75 },
        { rank: 'tin', min: 0.75, max: 0.8 },
        { rank: 'aluminum', min: 0.8, max: 0.85 },
        { rank: 'lead', min: 0.85, max: 0.9 },
        { rank: 'bronze', min: 0.9, max: 0.95 },
        { rank: 'copper', min: 0.95, max: 1.0 },
        { rank: 'iron', min: 1.0, max: 1.05 },
        { rank: 'quartz', min: 1.05, max: 1.1 },
        { rank: 'gold', min: 1.1, max: 1.15 },
        { rank: 'ruby', min: 1.15, max: 1.2 },
        { rank: 'crystal', min: 1.2, max: 1.25 },
        { rank: 'emerald', min: 1.25, max: 1.3 },
        { rank: 'diamond', min: 1.3, max: 1.35 },
        { rank: 'titanium', min: 1.35, max: 1.4 },
        { rank: 'platinum', min: 1.4, max: 1.45 },
        { rank: 'mithril', min: 1.45, max: 2.0 }
      ],
      'legs_to_height_ratio': [
        { rank: 'dirt', min: 0, max: 0.4 },
        { rank: 'gravel', min: 0.4, max: 0.42 },
        { rank: 'tin', min: 0.42, max: 0.44 },
        { rank: 'aluminum', min: 0.44, max: 0.46 },
        { rank: 'lead', min: 0.46, max: 0.48 },
        { rank: 'bronze', min: 0.48, max: 0.5 },
        { rank: 'copper', min: 0.5, max: 0.52 },
        { rank: 'iron', min: 0.52, max: 0.54 },
        { rank: 'quartz', min: 0.54, max: 0.56 },
        { rank: 'gold', min: 0.56, max: 0.58 },
        { rank: 'ruby', min: 0.58, max: 0.6 },
        { rank: 'crystal', min: 0.6, max: 0.62 },
        { rank: 'emerald', min: 0.62, max: 0.64 },
        { rank: 'diamond', min: 0.64, max: 0.66 },
        { rank: 'titanium', min: 0.66, max: 0.68 },
        { rank: 'platinum', min: 0.68, max: 0.7 },
        { rank: 'mithril', min: 0.7, max: 1.0 }
      ],
      'bmr': [
        { rank: 'dirt', min: 0, max: 1000 },
        { rank: 'gravel', min: 1000, max: 1200 },
        { rank: 'tin', min: 1200, max: 1400 },
        { rank: 'aluminum', min: 1400, max: 1600 },
        { rank: 'lead', min: 1600, max: 1800 },
        { rank: 'bronze', min: 1800, max: 2000 },
        { rank: 'copper', min: 2000, max: 2200 },
        { rank: 'iron', min: 2200, max: 2400 },
        { rank: 'quartz', min: 2400, max: 2600 },
        { rank: 'gold', min: 2600, max: 2800 },
        { rank: 'ruby', min: 2800, max: 3000 },
        { rank: 'crystal', min: 3000, max: 3200 },
        { rank: 'emerald', min: 3200, max: 3400 },
        { rank: 'diamond', min: 3400, max: 3600 },
        { rank: 'titanium', min: 3600, max: 3800 },
        { rank: 'platinum', min: 3800, max: 4000 },
        { rank: 'mithril', min: 4000, max: 5000 }
      ],
      'tdee': [
          { rank: 'dirt', min: 0, max: 1500 },
        { rank: 'gravel', min: 1500, max: 1800 },
        { rank: 'tin', min: 1800, max: 2100 },
        { rank: 'aluminum', min: 2100, max: 2400 },
        { rank: 'lead', min: 2400, max: 2700 },
        { rank: 'bronze', min: 2700, max: 3000 },
        { rank: 'copper', min: 3000, max: 3300 },
        { rank: 'iron', min: 3300, max: 3600 },
        { rank: 'quartz', min: 3600, max: 3900 },
        { rank: 'gold', min: 3900, max: 4200 },
        { rank: 'ruby', min: 4200, max: 4500 },
        { rank: 'crystal', min: 4500, max: 4800 },
        { rank: 'emerald', min: 4800, max: 5100 },
        { rank: 'diamond', min: 5100, max: 5400 },
        { rank: 'titanium', min: 5400, max: 5700 },
        { rank: 'platinum', min: 5700, max: 6000 },
        { rank: 'mithril', min: 6000, max: 8000 }
      ],
      'fat_mass_percentage': [
        { rank: 'dirt', min: 0, max: 5 },
        { rank: 'gravel', min: 5, max: 10 },
        { rank: 'tin', min: 10, max: 15 },
        { rank: 'aluminum', min: 15, max: 20 },
        { rank: 'lead', min: 20, max: 25 },
        { rank: 'bronze', min: 25, max: 30 },
        { rank: 'copper', min: 30, max: 35 },
        { rank: 'iron', min: 35, max: 40 },
        { rank: 'quartz', min: 40, max: 45 },
        { rank: 'gold', min: 45, max: 50 },
        { rank: 'ruby', min: 50, max: 55 },
        { rank: 'crystal', min: 55, max: 60 },
        { rank: 'emerald', min: 60, max: 65 },
        { rank: 'diamond', min: 65, max: 70 },
        { rank: 'titanium', min: 70, max: 75 },
        { rank: 'platinum', min: 75, max: 80 },
        { rank: 'mithril', min: 80, max: 100 }
      ],
      'lean_mass_percentage': [
        { rank: 'dirt', min: 0, max: 20 },
        { rank: 'gravel', min: 20, max: 25 },
        { rank: 'tin', min: 25, max: 30 },
        { rank: 'aluminum', min: 30, max: 35 },
        { rank: 'lead', min: 35, max: 40 },
        { rank: 'bronze', min: 40, max: 45 },
          { rank: 'copper', min: 45, max: 50 },
        { rank: 'iron', min: 50, max: 55 },
        { rank: 'quartz', min: 55, max: 60 },
        { rank: 'gold', min: 60, max: 65 },
        { rank: 'ruby', min: 65, max: 70 },
        { rank: 'crystal', min: 70, max: 75 },
        { rank: 'emerald', min: 75, max: 80 },
        { rank: 'diamond', min: 80, max: 85 },
        { rank: 'titanium', min: 85, max: 90 },
          { rank: 'platinum', min: 90, max: 95 },
        { rank: 'mithril', min: 95, max: 100 }
      ],
      'ffbmi': [
        { rank: 'dirt', min: 0, max: 15 },
        { rank: 'gravel', min: 15, max: 17 },
        { rank: 'tin', min: 17, max: 19 },
        { rank: 'aluminum', min: 19, max: 21 },
        { rank: 'lead', min: 21, max: 23 },
        { rank: 'bronze', min: 23, max: 25 },
        { rank: 'copper', min: 25, max: 27 },
        { rank: 'iron', min: 27, max: 29 },
        { rank: 'quartz', min: 29, max: 31 },
        { rank: 'gold', min: 31, max: 33 },
        { rank: 'ruby', min: 33, max: 35 },
        { rank: 'crystal', min: 35, max: 37 },
        { rank: 'emerald', min: 37, max: 39 },
        { rank: 'diamond', min: 39, max: 41 },
        { rank: 'titanium', min: 41, max: 43 },
        { rank: 'platinum', min: 43, max: 45 },
        { rank: 'mithril', min: 45, max: 50 }
      ]
    };

    const metricRanges = ranges[type] || [];
    const rank = metricRanges.find(range => value >= range.min && value < range.max);
    
            return {
      rank: rank?.rank || 'dirt',
      ranges: metricRanges
    };
  };

  // Prepare metrics data
  const metricsData = [
    { 
      label: 'BMI', 
      value: metrics?.bmi || 0,
      unit: '',
      type: 'bmi',
      description: 'Body Mass Index'
    },
    {
      label: 'Waist-to-Height Ratio',
      value: metrics?.waist_to_height_ratio || 0,
      unit: '',
      type: 'waist_to_height_ratio',
      description: 'Waist-to-Height Ratio'
    },
    {
      label: 'Waist-to-Shoulder Ratio',
      value: metrics?.waist_to_shoulder_ratio || 0,
      unit: '',
      type: 'waist_to_shoulder_ratio',
      description: 'Waist-to-Shoulder Ratio'
    },
    {
      label: 'Legs-to-Height Ratio',
      value: metrics?.legs_to_height_ratio || 0,
      unit: '',
      type: 'legs_to_height_ratio',
      description: 'Legs-to-Height Ratio'
    },
    {
      label: 'BMR',
      value: metrics?.bmr || 0,
      unit: 'kcal/day',
      type: 'bmr',
      description: 'Basal Metabolic Rate'
    },
    {
      label: 'TDEE',
      value: metrics?.tdee || 0,
      unit: 'kcal/day',
      type: 'tdee',
      description: 'Total Daily Energy Expenditure'
    },
    {
      label: 'Fat Mass %',
      value: metrics?.fat_mass_percentage || 0,
      unit: '%',
      type: 'fat_mass_percentage',
      description: 'Fat Mass Percentage'
    },
    { 
      label: 'Lean Mass %',
      value: metrics?.lean_mass_percentage || 0,
      unit: '%',
      type: 'lean_mass_percentage',
      description: 'Lean Mass Percentage'
    },
    { 
      label: 'FFBMI', 
      value: metrics?.ffbmi || 0,
      unit: '',
      type: 'ffbmi',
      description: 'Fat-Free Body Mass Index'
    }
  ];

  return (
    <div className="metrics-tab">
      <div className="metrics-header">
        <h2>Body Metrics & History</h2>
        <p>Track your fitness progress and see your current rankings</p>
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
                  {getRankIcon(metricRank.rank)} {metricRank.rank.toUpperCase()}
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
                    <button className="ranking-toggle" onClick={() => toggleRankingDropdown(index)}>
                      {expandedRanking === index ? '▼' : '▶'}
                    </button>
                  </div>
                  {expandedRanking === index && (
                  <div className="ranking-ranges">
                    {metricRank.ranges.map((range, idx) => (
                      <div key={idx} className="ranking-range">
                        <span 
                          className="ranking-rank"
                          style={{ color: getRankColor(range.rank) }}
                        >
                            {getRankIcon(range.rank)} {range.rank.toUpperCase()}
                        </span>
                        <span className="ranking-values">
                          {range.min}-{range.max}{metric.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}
              
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .metrics-tab {
          max-width: 1200px;
          margin: 0 auto;
        }

        .metrics-header {
          margin-bottom: var(--space-8);
        }

        .metrics-header h2 {
          font-size: var(--text-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .metrics-header p {
          color: var(--text-secondary);
          font-size: var(--text-lg);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-6);
          padding: 0;
        }

        .metric-card {
          background: var(--bg-secondary);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
        }

        .metric-label {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
        }

        .metric-rank {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
        }

        .metric-value {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .metric-unit {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          margin-left: var(--space-1);
        }

        .metric-description {
          font-size: var(--text-sm);
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
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .ranking-toggle {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: var(--text-sm);
          padding: var(--space-1);
        }

        .ranking-toggle:hover {
          color: var(--text-primary);
        }

        .ranking-title {
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
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
          border-radius: var(--radius-sm);
        }

        .ranking-rank {
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
        }

        .ranking-values {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          margin-left: var(--space-2);
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
