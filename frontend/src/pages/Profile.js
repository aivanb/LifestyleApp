import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Profile Component
 * 
 * Comprehensive profile management with:
 * - Personal information editing
 * - Body metrics display with fitness ranking
 * - Historical data and trends
 * - Responsive mobile/desktop layouts
 */

const RANK_ORDER = [
  'dirt',
  'gravel',
  'tin',
  'aluminum',
  'lead',
  'bronze',
  'copper',
  'iron',
  'quartz',
  'gold',
  'ruby',
  'crystal',
  'emerald',
  'diamond',
  'titanium',
  'platinum',
  'mithril',
];

const RANK_COLORS = {
  dirt: '#8B4513',
  gravel: '#696969',
  tin: '#C0C0C0',
  aluminum: '#D3D3D3',
  lead: '#708090',
  bronze: '#CD7F32',
  copper: '#B87333',
  iron: '#4B4B4B',
  quartz: '#E6E6FA',
  gold: '#FFD700',
  ruby: '#E0115F',
  crystal: '#B8E6B8',
  emerald: '#50C878',
  diamond: '#B9F2FF',
  titanium: '#878681',
  platinum: '#E5E4E2',
  mithril: '#9C7C38',
};

const RANK_EMOJIS = {
  dirt: '🌱',
  gravel: '🪨',
  tin: '🥫',
  aluminum: '🥤',
  lead: '⚫',
  bronze: '🥉',
  copper: '🟤',
  iron: '⚙️',
  quartz: '🔮',
  gold: '🥇',
  ruby: '♦️',
  crystal: '🔷',
  emerald: '💚',
  diamond: '💎',
  titanium: '⚡',
  platinum: '🏆',
  mithril: '✨',
};

const makeRanges = (edges) => {
  if (!Array.isArray(edges) || edges.length !== RANK_ORDER.length + 1) {
    throw new Error('Invalid rank edges definition');
  }
  return RANK_ORDER.map((rank, idx) => ({
    rank,
    min: edges[idx],
    max: edges[idx + 1],
  }));
};

const METRIC_CONFIG = {
  bmi: {
    label: 'BMI',
    unit: '',
    description: 'Body Mass Index',
    equationPlain: 'BMI = bodyWeightKg ÷ heightMeters²',
    equationLegend: 'bodyWeightKg = body weight (kg), heightMeters = height (m)',
    decimals: 1,
    ranges: makeRanges([0, 16, 17, 18, 18.5, 19.5, 20.5, 21.5, 22.5, 23.5, 24.5, 25, 27, 29, 31, 33, 35, Infinity]),
  },
  waist_to_height_ratio: {
    label: 'Waist-to-Height',
    unit: '',
    description: 'Waist / Height ratio',
    equationPlain: 'WHtR = waistCircumference ÷ height',
    equationLegend: 'waistCircumference = waist (cm), height = height (cm)',
    decimals: 2,
    ranges: makeRanges([0, 0.35, 0.38, 0.41, 0.44, 0.47, 0.5, 0.53, 0.56, 0.59, 0.62, 0.65, 0.68, 0.71, 0.74, 0.77, 0.8, Infinity]),
  },
  waist_to_shoulder_ratio: {
    label: 'Waist-to-Shoulder',
    unit: '',
    description: 'Waist / Shoulder ratio',
    equationPlain: 'WSR = waistCircumference ÷ shoulderCircumference',
    equationLegend: 'waistCircumference = waist (cm), shoulderCircumference = shoulder (cm)',
    decimals: 2,
    ranges: makeRanges([0, 0.65, 0.68, 0.71, 0.74, 0.77, 0.8, 0.83, 0.86, 0.89, 0.92, 0.95, 0.98, 1.01, 1.04, 1.07, 1.1, Infinity]),
  },
  legs_to_height_ratio: {
    label: 'Legs-to-Height',
    unit: '',
    description: 'Leg length / Height ratio',
    equationPlain: 'LHR = legLength ÷ height',
    equationLegend: 'legLength = leg length (cm), height = height (cm)',
    decimals: 2,
    ranges: makeRanges([0, 0.38, 0.4, 0.42, 0.44, 0.46, 0.48, 0.5, 0.52, 0.54, 0.56, 0.58, 0.6, 0.62, 0.64, 0.66, 0.68, Infinity]),
  },
  bmr: {
    label: 'BMR',
    unit: 'kcal/day',
    description: 'Basal Metabolic Rate',
    equationPlain: 'BMR = 10×weight + 6.25×height − 5×age + sexConstant',
    equationLegend: 'weight (kg), height (cm), age (years), sexConstant = −161 (F) or +5 (M)',
    decimals: 0,
    ranges: makeRanges([0, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, Infinity]),
  },
  tdee: {
    label: 'TDEE',
    unit: 'kcal/day',
    description: 'Total Daily Energy Expenditure',
    equationPlain: 'TDEE = BMR × activityFactor',
    equationLegend: 'BMR = basal metabolic rate, activityFactor = 1.2–1.9 by activity level',
    decimals: 0,
    ranges: makeRanges([0, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800, 4000, 4200, 4400, Infinity]),
  },
  fat_mass_percentage: {
    label: 'Fat Mass',
    unit: '%',
    description: 'Body fat percentage',
    equationPlain: 'Fat % = (fatMassKg ÷ bodyWeightKg) × 100',
    equationLegend: 'fatMassKg = fat mass (kg), bodyWeightKg = body weight (kg)',
    decimals: 1,
    ranges: makeRanges([0, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 30, 33, 36, 40, Infinity]),
  },
  lean_mass_percentage: {
    label: 'Lean Mass',
    unit: '%',
    description: 'Lean mass percentage',
    equationPlain: 'Lean % = (leanMassKg ÷ bodyWeightKg) × 100',
    equationLegend: 'leanMassKg = lean mass (kg), bodyWeightKg = body weight (kg)',
    decimals: 1,
    ranges: makeRanges([0, 55, 60, 65, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, Infinity]),
  },
  ffbmi: {
    label: 'FFBMI',
    unit: '',
    description: 'Fat-Free Body Mass Index',
    equationPlain: 'FFBMI = leanMassKg ÷ heightMeters²',
    equationLegend: 'leanMassKg = lean mass (kg), heightMeters = height (m)',
    decimals: 1,
    ranges: makeRanges([0, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, Infinity]),
  },
};

const METRIC_ORDER = [
  'bmi',
  'waist_to_height_ratio',
  'waist_to_shoulder_ratio',
  'legs_to_height_ratio',
  'bmr',
  'tdee',
  'fat_mass_percentage',
  'lean_mass_percentage',
  'ffbmi',
];

const getFitnessRankColor = (rank) => RANK_COLORS[rank] || '#666';

const getRankEmoji = (rank) => RANK_EMOJIS[rank] || '⭐';

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return `rgba(0,0,0,${alpha})`;
  const cleaned = hex.replace('#', '');
  const full = cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned;
  const int = Number.parseInt(full, 16);
  if (!Number.isFinite(int)) return `rgba(0,0,0,${alpha})`;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const calculateMetricRank = (value, type) => {
  const config = METRIC_CONFIG[type];
  const ranges = config?.ranges || [];
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || ranges.length === 0) {
    return { rank: 'dirt', ranges };
  }

  const match = ranges.find((range) => numeric >= range.min && numeric < range.max);
  return { rank: match?.rank || 'dirt', ranges };
};

const calculateOverallRank = (metrics) => {
  const ranks = METRIC_ORDER.map((type) => {
    const value = metrics?.[type];
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return calculateMetricRank(numeric, type).rank;
  }).filter(Boolean);

  if (ranks.length === 0) return 'dirt';

  const indices = ranks.map((rank) => RANK_ORDER.indexOf(rank)).filter((i) => i >= 0);
  if (indices.length === 0) return 'dirt';
  const averageIndex = Math.round(indices.reduce((sum, i) => sum + i, 0) / indices.length);
  return RANK_ORDER[Math.max(0, Math.min(averageIndex, RANK_ORDER.length - 1))];
};

const formatNumber = (value, decimals) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numeric);
};

const formatRange = (value, decimals) => {
  if (value === Infinity) return null; // Caller will display as "> {prev}"
  return formatNumber(value, decimals);
};

const Profile = () => {
  // const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileData, setProfileData] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('info'); // 'info' | 'rankings'
  const [selectedMetricType, setSelectedMetricType] = useState('bmi');
  const [editing, setEditing] = useState(false);

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
  const overallRank = calculateOverallRank(metrics);
  const overallRankColor = getFitnessRankColor(overallRank);

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
      {view === 'info' ? (
        <div className="info-top-row">
          <div className="info-top-left" />
          <div className="info-top-center" />
          <div className="info-top-right" />
        </div>
      ) : (
        <div className="rankings-top-row">
          <div className="rankings-top-left" />
          <div className="rankings-top-center" />
          <div className="rankings-top-right">
            <button
              type="button"
              data-testid="back-to-info"
              className="nav-back-btn"
              onClick={() => setView('info')}
              aria-label="Back"
              title="Back"
            >
              <ArrowLeftIcon className="nav-back-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {view === 'info' ? (
        <div className="profile-info-layout">
          <PersonalInfoSection
            profileData={profileData}
            editing={editing}
            setEditing={setEditing}
            updateProfile={updateProfile}
            overallRank={overallRank}
            overallRankColor={overallRankColor}
            onRankingsClick={() => { setView('rankings'); setEditing(false); }}
          />
          <div className="profile-page-footer">
            <label className="theme-toggle theme-toggle--no-label" aria-label="Toggle theme">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
              />
              <span className="theme-toggle-track" aria-hidden="true" />
            </label>
          </div>
        </div>
      ) : (
        <RankingsSection
          metrics={metrics}
          selectedMetricType={selectedMetricType}
          setSelectedMetricType={setSelectedMetricType}
        />
      )}

      <style jsx>{`
        .profile-page {
          width: 100%;
          max-width: none;
          margin: 0 auto;
          padding: 0 var(--space-6) var(--space-6);
          min-height: calc(100vh - calc(var(--space-4) * 2) - calc(var(--space-6) * 2));
        }

        .profile-info-layout {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
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

        .rank-badge {
          padding: var(--space-4) var(--space-6);
          border-radius: var(--radius-xl);
          color: white;
          font-weight: var(--font-weight-bold);
          text-align: center;
          min-width: 200px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 2px solid transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          cursor: pointer;
        }

        .rank-badge-lg {
          font-size: clamp(1.1rem, 2.4vw, 1.6rem);
        }

        .rank-emoji {
          font-size: 1.4em;
          line-height: 1;
          filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.35));
        }

        .rank-text {
          line-height: 1;
        }

        .info-top-row,
        .rankings-top-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: var(--space-4);
          padding-top: var(--space-2);
          margin-bottom: var(--space-5);
        }

        .info-top-left,
        .rankings-top-left {
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }

        .info-top-center,
        .rankings-top-center {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .info-top-right,
        .rankings-top-right {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .nav-back-btn {
          padding: var(--space-3) var(--space-4);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          color: var(--text-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .nav-back-icon {
          width: 22px;
          height: 22px;
        }

        .nav-back-btn:hover {
          background: var(--bg-tertiary);
          border-color: var(--border-secondary);
        }

        .theme-toggle--no-label {
          display: inline-flex;
          align-items: center;
        }

        .theme-toggle--no-label .theme-toggle-track {
          width: 56px;
          height: 30px;
          border-radius: 999px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          position: relative;
          transition: background 0.2s var(--ease-out-cubic), border-color 0.2s var(--ease-out-cubic);
        }

        .theme-toggle--no-label .theme-toggle-track::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 4px;
          transform: translateY(-50%);
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: var(--text-primary);
          transition: transform 0.2s var(--ease-out-cubic), background 0.2s var(--ease-out-cubic);
        }

        .theme-toggle--no-label input:checked + .theme-toggle-track::after {
          transform: translate(26px, -50%);
          background: #ffffff;
        }

        .theme-toggle--no-label input:checked + .theme-toggle-track {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--border-secondary);
        }

        .theme-toggle--no-label input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .rank-badge--inside-info {
          margin-bottom: var(--space-10);
          display: block;
          width: 100%;
        }

        .profile-page-footer {
          margin-top: var(--space-4);
          padding: 0;
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        @media (max-width: 768px) {
          .profile-page {
            padding: 0 var(--space-4) var(--space-4);
            min-height: calc(100vh - calc(var(--space-4) * 2) - calc(var(--space-6) * 2));
          }

          .info-top-row,
          .rankings-top-row {
            grid-template-columns: 1fr;
            justify-items: center;
            margin-bottom: var(--space-4);
          }

          .info-top-left,
          .rankings-top-left,
          .info-top-right,
          .rankings-top-right {
            justify-content: center;
          }

          .user-info-display {
            padding: var(--space-4);
          }

          .rank-badge--inside-info {
            margin-bottom: var(--space-6);
          }

          .info-grid {
            gap: var(--space-4);
          }

          .profile-page-footer {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

// Personal Information Section Component
const PersonalInfoSection = ({ profileData, editing, setEditing, updateProfile, overallRank, overallRankColor, onRankingsClick }) => {
  const [formData, setFormData] = useState({
    first_name: profileData?.first_name || '',
    last_name: profileData?.last_name || '',
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
      first_name: profileData?.first_name || '',
      last_name: profileData?.last_name || '',
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
    <div className="personal-info-section">
      {editing ? (
        <div className="personal-info-edit-card card">
          <form onSubmit={handleSubmit} className="personal-info-form">
            <div className="form-grid">
            <div className="form-group">
              <label className="form-label">First name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter first name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter last name"
              />
            </div>

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
              <button type="submit" className="text-action text-action-primary">
                Save Changes
              </button>
              <button
                type="button"
                className="text-action"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="user-info-display">
          <div className="info-section">
            {overallRank != null && (
              <button
                type="button"
                data-testid="rank-badge"
                className="rank-badge rank-badge-lg rank-badge--inside-info"
                onClick={onRankingsClick}
                style={{
                  background: `linear-gradient(135deg, ${hexToRgba(overallRankColor, 0.18)}, rgba(0,0,0,0) 55%), #181b22`,
                  borderColor: overallRankColor,
                }}
                aria-label="Rankings"
                title="Rankings"
              >
                <span className="rank-emoji" aria-hidden="true">
                  {getRankEmoji(overallRank)}
                </span>
                <span className="rank-text">{overallRank.toUpperCase()}</span>
              </button>
            )}
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">First name</span>
                <span className="info-value">{profileData?.first_name || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last name</span>
                <span className="info-value">{profileData?.last_name || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Username</span>
                <span className="info-value">{profileData?.username || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{profileData?.email || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Height</span>
                <span className="info-value">{profileData?.height ? `${profileData.height} cm` : 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Birthday</span>
                <span className="info-value">
                  {profileData?.birthday ? new Date(profileData.birthday).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Gender</span>
                <span className="info-value">{profileData?.gender || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Units</span>
                <span className="info-value">
                  {profileData?.unit_preference?.unit_name || 'Not set'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Activity Level</span>
                <span className="info-value">
                  {profileData?.activity_level?.name || 'Not set'}
                </span>
              </div>
            </div>
            <div className="info-footer">
              <button
                type="button"
                className="text-action"
                onClick={() => setEditing(true)}
              >
                Edit info
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .personal-info-section {
          max-width: 1200px;
          margin: 0 auto;
        }

        .personal-info-edit-card {
          padding: var(--space-6);
          margin-bottom: var(--space-6);
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
          align-items: center;
        }

        .form-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
          text-align: center;
        }

        .form-actions {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
          align-items: center;
        }

        .text-action {
          background: transparent;
          border: none;
          padding: var(--space-2) 0;
          color: var(--text-secondary);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          cursor: pointer;
        }

        .text-action-primary {
          color: var(--accent-primary);
        }

        .text-action:hover {
          text-decoration: underline;
          color: var(--text-primary);
        }

        .user-info-display {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          box-shadow: var(--shadow-md);
        }

        .info-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: var(--space-8);
          gap: var(--space-6);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-6);
          text-align: center;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          align-items: center;
        }

        .info-item-full {
          grid-column: 1 / -1;
        }

        .info-label {
          font-size: var(--text-base);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .info-value {
          font-size: var(--text-xl);
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
        }

        .form-input {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
          padding: var(--space-4) var(--space-5);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-lg);
          transition: all 0.2s var(--ease-out-cubic);
          text-align: center;
        }
        select.form-input {
          text-align-last: center;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
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

const RankingsSection = ({ metrics, selectedMetricType, setSelectedMetricType }) => {
  const metricsData = METRIC_ORDER.map((type) => {
    const config = METRIC_CONFIG[type];
    const value = metrics?.[type];
    const { rank } = calculateMetricRank(value, type);
    return {
      type,
      label: config.label,
      description: config.description,
      equationPlain: config.equationPlain,
      equationLegend: config.equationLegend,
      unit: config.unit,
      decimals: config.decimals,
      value,
      rank,
    };
  });

  const renderEquation = (plain) => {
    if (!plain) return null;
    const parts = plain.split(/(\s+)/);
    const out = [];
    const varRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;
    parts.forEach((part, i) => {
      if (varRegex.test(part) && part.length > 2) {
        out.push(<span key={i} className="metric-eq-var">{part}</span>);
      } else {
        out.push(<span key={i} className="metric-eq-text">{part}</span>);
      }
    });
    return <span className="metric-equation-inner">{out}</span>;
  };

  const selectedConfig = METRIC_CONFIG[selectedMetricType] || METRIC_CONFIG.bmi;
  const selectedValue = metrics?.[selectedMetricType];
  const selectedRank = calculateMetricRank(selectedValue, selectedMetricType);

  return (
    <div className="rankings-section">
      <div className="rankings-layout">
        <div className="ranking-panel" data-testid="ranking-panel">
          <div className="ranking-panel-value">
            <div className="ranking-panel-value-label">{selectedConfig.label}</div>
            <div className="ranking-panel-value-number">
              {formatNumber(selectedValue, selectedConfig.decimals)}
              {selectedConfig.unit ? <span className="ranking-panel-unit"> {selectedConfig.unit}</span> : null}
            </div>
            <div
              className="ranking-panel-rank"
              style={{ color: getFitnessRankColor(selectedRank.rank) }}
            >
              {getRankEmoji(selectedRank.rank)} {selectedRank.rank.toUpperCase()}
            </div>
          </div>

          <div className="ranking-list">
            {selectedRank.ranges.map((range) => {
              const minStr = formatRange(range.min, selectedConfig.decimals);
              const maxStr = formatRange(range.max, selectedConfig.decimals);
              const rangeDisplay = maxStr === null
                ? `> ${formatNumber(range.min, selectedConfig.decimals)}${selectedConfig.unit ? ` ${selectedConfig.unit}` : ''}`
                : `${minStr}–${maxStr}${selectedConfig.unit ? selectedConfig.unit : ''}`;
              return (
                <div key={range.rank} className="ranking-row" data-testid="ranking-range">
                  <span
                    className="ranking-row-rank"
                    style={{ color: getFitnessRankColor(range.rank) }}
                  >
                    {getRankEmoji(range.rank)} {range.rank.toUpperCase()}
                  </span>
                  <span className="ranking-row-values">
                    {rangeDisplay}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="metrics-panel">
          <div className="metrics-grid">
            {metricsData.map((metric) => {
              const isSelected = metric.type === selectedMetricType;
              return (
                <button
                  key={metric.type}
                  type="button"
                  data-testid={`metric-card-${metric.type}`}
                  className={`metric-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedMetricType(metric.type)}
                  style={{
                    background: `linear-gradient(135deg, ${hexToRgba(getFitnessRankColor(metric.rank), 0.18)}, rgba(0,0,0,0) 55%), var(--bg-secondary)`,
                    borderColor: isSelected ? 'rgba(80, 200, 120, 0.65)' : 'var(--border-primary)',
                  }}
                >
                  <div className="metric-card-top">
                    <div className="metric-label">{metric.label}</div>
                    <div
                      className="metric-rank-pill"
                      style={{
                        color: getFitnessRankColor(metric.rank),
                      }}
                    >
                      <span aria-label={metric.rank.toUpperCase()} title={metric.rank.toUpperCase()}>
                        {getRankEmoji(metric.rank)}
                      </span>
                    </div>
                  </div>
                  <div className="metric-value">
                    {formatNumber(metric.value, metric.decimals)}
                    {metric.unit ? <span className="metric-unit"> {metric.unit}</span> : null}
                  </div>
                  <div className="metric-description">{metric.description}</div>
                  <div className="metric-equation">{renderEquation(metric.equationPlain)}</div>
                  {metric.equationLegend && (
                    <div className="metric-equation-legend">{metric.equationLegend}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .rankings-section {
          width: 100%;
          max-width: none;
          margin: 0;
        }

        .rankings-layout {
          display: grid;
          grid-template-columns: minmax(360px, 420px) 1fr;
          gap: var(--space-6);
          align-items: start;
        }

        .ranking-panel {
          position: sticky;
          top: var(--space-6);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          box-shadow: var(--shadow-md);
          animation: panelIn 0.25s var(--ease-out-cubic);
        }

        @keyframes panelIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ranking-panel-value {
          text-align: center;
          margin-bottom: var(--space-5);
          padding-bottom: var(--space-5);
          border-bottom: 1px solid var(--border-primary);
        }

        .ranking-panel-value-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--space-2);
        }

        .ranking-panel-value-number {
          font-size: var(--text-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .ranking-panel-unit {
          font-size: var(--text-base);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .ranking-panel-rank {
          font-size: var(--text-base);
          font-weight: var(--font-weight-bold);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .ranking-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .ranking-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          transition: transform 0.2s var(--ease-out-cubic);
        }

        .ranking-row:hover {
          transform: translateY(-1px);
        }

        .ranking-row-rank {
          font-size: var(--text-xs);
          font-weight: var(--font-weight-bold);
          letter-spacing: 0.1em;
        }

        .ranking-row-values {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
          animation: gridIn 0.25s var(--ease-out-cubic);
          align-items: stretch;
        }

        @keyframes gridIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .metric-card {
          text-align: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          cursor: pointer;
          transition: transform 0.25s var(--ease-out-cubic), box-shadow 0.25s var(--ease-out-cubic), border-color 0.25s var(--ease-out-cubic);
          box-shadow: var(--shadow-md);
          height: 280px;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }

        .metric-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 45px rgba(0, 0, 0, 0.24);
        }

        .metric-card.selected {
          border: 2px solid rgba(80, 200, 120, 0.65);
        }

        .metric-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .metric-label {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-secondary);
          text-align: center;
          width: 100%;
        }

        .metric-rank-pill {
          font-size: 1.8rem;
          line-height: 1;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-md);
          background: transparent;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .metric-value {
          font-size: clamp(1.7rem, 2.6vw, 2.2rem);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .metric-unit {
          font-size: var(--text-base);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .metric-description {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          line-height: 1.4;
        }

        .metric-equation {
          margin-top: var(--space-2);
          font-size: var(--text-xs);
          line-height: 1.5;
        }

        .metric-equation-inner {
          display: inline;
        }

        .metric-eq-text {
          color: var(--text-secondary);
        }

        .metric-eq-var {
          color: var(--accent-primary);
          font-weight: var(--font-weight-semibold);
        }

        .metric-equation-legend {
          margin-top: var(--space-2);
          font-size: 10px;
          color: var(--text-tertiary);
          line-height: 1.35;
          max-width: 100%;
        }

        @media (max-width: 900px) {
          .rankings-layout {
            grid-template-columns: 1fr;
          }

          .ranking-panel {
            position: relative;
            top: 0;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
