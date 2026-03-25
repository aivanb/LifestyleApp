import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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

/** Lighter tint of a hex fill (for rank badge border). */
const lightenHexForBorder = (hex, amount = 0.4) => {
  const cleaned = typeof hex === 'string' ? hex.replace('#', '') : '';
  const full = cleaned.length === 3 ? cleaned.split('').map((c) => c + c).join('') : cleaned;
  if (full.length !== 6) return 'rgb(200, 200, 200)';
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return 'rgb(200, 200, 200)';
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
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

/**
 * Overall rank = rounded mean of every metric's rank index (same ordering as metric cards).
 * Missing or invalid values count as `dirt` so the badge reflects all categories, not a subset.
 */
const calculateOverallRank = (metrics) => {
  const ranks = METRIC_ORDER.map((type) => {
    const value = metrics?.[type];
    const numeric = Number(value);
    const { rank } = calculateMetricRank(
      Number.isFinite(numeric) ? numeric : NaN,
      type
    );
    return rank;
  });

  const indices = ranks.map((rank) => {
    const i = RANK_ORDER.indexOf(rank);
    return i >= 0 ? i : 0;
  });
  const averageIndex = Math.round(
    indices.reduce((sum, i) => sum + i, 0) / indices.length
  );
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

/** Human-readable unit labels (API uses `metric` / `imperial` unit_name values). */
const formatUnitDisplayName = (unitName) => {
  if (!unitName) return '';
  const key = String(unitName).toLowerCase();
  if (key === 'metric') return 'Metric (kg, cm)';
  if (key === 'imperial') return 'Imperial (lbs, ft)';
  return unitName;
};

/** 6-week grid for custom birthday calendar (same logic as FoodLoggingDashboard). */
function buildCalendarDays(viewMonth) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  const days = [];
  const currentDate = new Date(startDate);
  for (let i = 0; i < 42; i += 1) {
    const dateString = currentDate.toISOString().split('T')[0];
    days.push({
      day: currentDate.getDate(),
      date: dateString,
      isCurrentMonth: currentDate.getMonth() === month,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
}

const Profile = () => {
  // const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileData, setProfileData] = useState(null);
  const [unitsCatalog, setUnitsCatalog] = useState([]);
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
        setUnitsCatalog(response.data.data.units || []);
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
  const overallRankBorderColor = useMemo(
    () => lightenHexForBorder(overallRankColor, 0.55),
    [overallRankColor]
  );

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div
      className={`profile-page profile-page--info${view === 'rankings' ? ' profile-page--rankings' : ''}${theme === 'light' ? ' profile-page--info-light' : ''}`}
    >
      {view === 'rankings' && (
        <div className="profile-rankings-header">
          <button
            type="button"
            data-testid="back-to-info"
            className="nav-back-btn nav-back-btn--ghost"
            onClick={() => setView('info')}
            aria-label="Back"
            title="Back"
          >
            <ArrowLeftIcon className="nav-back-icon" aria-hidden="true" />
          </button>
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
          <div className="profile-info-stack">
            {overallRank != null && (
              <div className="profile-rank-row">
                <button
                  type="button"
                  data-testid="rank-badge"
                  className="rank-badge rank-badge-lg rank-badge--solid"
                  onClick={() => { setView('rankings'); setEditing(false); }}
                  style={{
                    backgroundColor: overallRankColor,
                    color: '#0a0a0a',
                    border: `4px solid ${overallRankBorderColor}`,
                    boxSizing: 'border-box',
                  }}
                  aria-label="Rankings"
                  title="Rankings"
                >
                  <span className="rank-emoji" aria-hidden="true">
                    {getRankEmoji(overallRank)}
                  </span>
                  <span className="rank-text">{overallRank.toUpperCase()}</span>
                </button>
              </div>
            )}
            <div className="profile-info-primary">
              <PersonalInfoSection
                profileData={profileData}
                unitsCatalog={unitsCatalog}
                editing={editing}
                setEditing={setEditing}
                updateProfile={updateProfile}
              />
              <section className="profile-theme-section profile-info-surface" aria-label="Theme">
                <h3 className="profile-theme-heading">Appearance</h3>
                <div className="profile-theme-buttons">
                  <button
                    type="button"
                    className={`profile-theme-btn${theme === 'dark' ? ' profile-theme-btn--active' : ''}`}
                    onClick={() => setTheme('dark')}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    className={`profile-theme-btn${theme === 'light' ? ' profile-theme-btn--active' : ''}`}
                    onClick={() => setTheme('light')}
                  >
                    Light
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : (
        <RankingsSection
          className="rankings-section--in-profile"
          metrics={metrics}
          selectedMetricType={selectedMetricType}
          setSelectedMetricType={setSelectedMetricType}
        />
      )}

      <style jsx>{`
        .profile-page {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          margin: 0;
          box-sizing: border-box;
          padding: 0;
          min-height: 100dvh;
          min-height: 100svh;
          overflow-x: hidden;
          padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
        }

        .profile-page--info {
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

        .profile-page--info-light {
          --profile-shell-tint: rgba(0, 0, 0, 0.04);
          --profile-shell-strong: rgba(0, 0, 0, 0.1);
          --profile-card-bg: #ffffff;
          --profile-card-border: #d8dce8;
          background-color: #e8eaf2;
        }

        .profile-info-layout {
          position: relative;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: var(--space-4) var(--space-4) var(--space-6);
          box-sizing: border-box;
        }

        .profile-info-stack {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: var(--space-6);
        }

        .profile-rank-row {
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }

        .profile-info-primary {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
          width: 100%;
        }

        .rank-badge--solid {
          min-width: 0 !important;
          max-width: 220px;
        }

        .profile-theme-section {
          margin-top: var(--space-8);
          padding: var(--space-5);
        }

        .profile-theme-heading {
          margin: 0 0 var(--space-4);
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-secondary);
          font-weight: var(--font-weight-semibold);
        }

        .profile-theme-buttons {
          display: flex;
          gap: var(--space-3);
        }

        .profile-theme-btn {
          flex: 1;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--input-border);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          transition: background 0.2s var(--ease-out-cubic), border-color 0.2s;
        }

        .profile-theme-btn:hover {
          border-color: var(--accent-primary);
        }

        .profile-theme-btn--active {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: #fff;
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
          border: 4px solid var(--surface-overlay);
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
          margin: 0 var(--space-4) var(--space-6);
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
          outline: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          cursor: pointer;
        }

        .rank-badge:focus-visible {
          outline: 2px solid var(--accent-primary);
          outline-offset: 3px;
        }

        .rank-badge-lg {
          font-size: clamp(1rem, 2vw, 1.35rem);
        }

        .rank-badge--solid {
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
        }

        .rank-emoji {
          font-size: 1.4em;
          line-height: 1;
          filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.35));
        }

        .rank-text {
          line-height: 1;
        }

        .profile-rankings-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: var(--space-3);
          padding-top: var(--space-2);
        }

        @media (min-width: 769px) {
          /* Match profile rankings section horizontal inset so back aligns with metrics column right edge */
          .profile-rankings-header {
            width: 100%;
            max-width: none;
            margin-left: 0;
            margin-right: 0;
            padding-right: var(--space-4);
            box-sizing: border-box;
          }
        }

        .nav-back-btn {
          padding: var(--space-2);
          background: var(--bg-tertiary);
          border: 1px solid var(--input-border);
          color: var(--text-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .nav-back-btn--ghost {
          background: transparent;
          border: none;
          box-shadow: none;
        }

        .nav-back-btn--ghost:hover {
          background: transparent;
          color: var(--accent-primary);
        }

        .profile-page--rankings .nav-back-btn--ghost {
          min-width: 48px;
          min-height: 48px;
          padding: var(--space-3);
        }

        .nav-back-icon {
          width: 32px;
          height: 32px;
        }

        .profile-page--rankings .rankings-section {
          padding: 0 var(--space-4) var(--space-6);
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .profile-page {
            padding: 0;
            width: 100%;
            max-width: 100%;
            overflow-x: clip;
            padding-top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
            padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px));
            min-height: min-content;
          }

          .profile-info-layout {
            padding: var(--space-3) var(--space-3) var(--space-4);
          }

          .profile-rankings-header {
            position: fixed;
            top: calc(var(--space-2) + env(safe-area-inset-top, 0px));
            right: calc(var(--space-3) + env(safe-area-inset-right, 0px));
            z-index: 250;
            margin: 0;
            padding: 0;
          }

          .profile-page--rankings {
            padding-top: calc(68px + var(--space-4) + env(safe-area-inset-top, 0px));
          }

          .profile-page--rankings .rankings-section {
            padding: 0 var(--space-3) var(--space-4);
            margin-top: 0;
          }

          .personal-info-section {
            text-align: left;
          }

          .personal-info-section .form-grid,
          .personal-info-section .goals-display,
          .personal-info-section .form-group,
          .personal-info-section .form-group input,
          .personal-info-section .form-group select,
          .personal-info-section .form-group label {
            text-align: left;
          }

          .personal-info-section .form-group {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

// Personal Information Section Component
const PersonalInfoSection = ({
  profileData,
  unitsCatalog = [],
  editing,
  setEditing,
  updateProfile,
}) => {
  const unitChoices = useMemo(
    () =>
      (unitsCatalog || []).filter((u) =>
        ['metric', 'imperial'].includes(String(u.unit_name || '').toLowerCase())
      ),
    [unitsCatalog]
  );

  const unitPrefId =
    profileData?.unit_preference?.unit_id ?? profileData?.unit_preference?.unit_preference_id;

  const [formData, setFormData] = useState({
    first_name: profileData?.first_name || '',
    last_name: profileData?.last_name || '',
    username: profileData?.username || '',
    email: profileData?.email || '',
    height: profileData?.height ?? '',
    birthday: profileData?.birthday || '',
    gender: profileData?.gender || '',
    unit_preference: unitPrefId != null && unitPrefId !== '' ? String(unitPrefId) : '',
    activity_level:
      profileData?.activity_level?.activity_level_id != null &&
      profileData?.activity_level?.activity_level_id !== ''
        ? String(profileData.activity_level.activity_level_id)
        : '',
  });

  useEffect(() => {
    const upId =
      profileData?.unit_preference?.unit_id ?? profileData?.unit_preference?.unit_preference_id;
    setFormData({
      first_name: profileData?.first_name || '',
      last_name: profileData?.last_name || '',
      username: profileData?.username || '',
      email: profileData?.email || '',
      height: profileData?.height ?? '',
      birthday: profileData?.birthday || '',
      gender: profileData?.gender || '',
      unit_preference: upId != null && upId !== '' ? String(upId) : '',
      activity_level:
        profileData?.activity_level?.activity_level_id != null &&
        profileData?.activity_level?.activity_level_id !== ''
          ? String(profileData.activity_level.activity_level_id)
          : '',
    });
  }, [profileData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      unit_preference: formData.unit_preference === '' ? null : parseInt(formData.unit_preference, 10),
      activity_level:
        formData.activity_level === '' ? null : parseInt(formData.activity_level, 10),
    };
    if (Number.isNaN(payload.unit_preference)) payload.unit_preference = null;
    if (Number.isNaN(payload.activity_level)) payload.activity_level = null;
    updateProfile(payload);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [showBirthdayCalendar, setShowBirthdayCalendar] = useState(false);
  const [birthdayViewMonth, setBirthdayViewMonth] = useState(() => new Date());
  const birthdayPickerRef = useRef(null);

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    if (!showBirthdayCalendar) return undefined;
    const onDown = (event) => {
      if (birthdayPickerRef.current && !birthdayPickerRef.current.contains(event.target)) {
        setShowBirthdayCalendar(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showBirthdayCalendar]);

  const openBirthdayCalendar = () => {
    if (formData.birthday) {
      const d = new Date(`${formData.birthday}T12:00:00`);
      if (!Number.isNaN(d.getTime())) {
        setBirthdayViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    } else {
      setBirthdayViewMonth(new Date());
    }
    setShowBirthdayCalendar(true);
  };

  const selectBirthdayDate = (isoDate) => {
    setFormData((prev) => ({ ...prev, birthday: isoDate }));
    setShowBirthdayCalendar(false);
  };

  const birthdayCalendarDays = useMemo(
    () => buildCalendarDays(birthdayViewMonth),
    [birthdayViewMonth]
  );

  const now = new Date();
  const canBirthdayMonthGoNext =
    birthdayViewMonth.getFullYear() < now.getFullYear() ||
    (birthdayViewMonth.getFullYear() === now.getFullYear() &&
      birthdayViewMonth.getMonth() < now.getMonth());

  const fieldInputClass = 'profile-field-input';
  const birthdayDisplay = profileData?.birthday
    ? new Date(profileData.birthday).toLocaleDateString()
    : 'Not set';

  const birthdayFieldDisplay =
    formData.birthday && !Number.isNaN(new Date(`${formData.birthday}T12:00:00`).getTime())
      ? new Date(`${formData.birthday}T12:00:00`).toLocaleDateString()
      : '';

  return (
    <div className="personal-info-section">
      {editing ? (
        <div className="personal-info-edit-card profile-info-surface">
          <form onSubmit={handleSubmit} className="personal-info-form">
            <div className="profile-rows">
              <div className="profile-row profile-row--2">
                <label className="profile-field">
                  <span className="profile-field-label">First name</span>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={fieldInputClass}
                    autoComplete="given-name"
                  />
                </label>
                <label className="profile-field">
                  <span className="profile-field-label">Last name</span>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={fieldInputClass}
                    autoComplete="family-name"
                  />
                </label>
              </div>
              <div className="profile-row profile-row--2">
                <label className="profile-field">
                  <span className="profile-field-label">Username</span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={fieldInputClass}
                    autoComplete="username"
                  />
                </label>
                <label className="profile-field">
                  <span className="profile-field-label">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={fieldInputClass}
                    autoComplete="email"
                  />
                </label>
              </div>
              <div className="profile-row profile-row--2">
                <label className="profile-field">
                  <span className="profile-field-label">Height (cm)</span>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className={fieldInputClass}
                    step="0.1"
                  />
                </label>
                <label className="profile-field">
                  <span className="profile-field-label">Gender</span>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={fieldInputClass}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              <div className="profile-row profile-row--1">
                <label className="profile-field">
                  <span className="profile-field-label">Birthday</span>
                  <div className="profile-birthday-picker" ref={birthdayPickerRef}>
                    <input
                      type="text"
                      name="birthday_display"
                      readOnly
                      value={birthdayFieldDisplay}
                      placeholder="Select date"
                      className={`${fieldInputClass} profile-birthday-input`}
                      onClick={openBirthdayCalendar}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openBirthdayCalendar();
                        }
                      }}
                      aria-label="Birthday, opens calendar"
                    />
                    {showBirthdayCalendar && (
                      <div className="custom-calendar-popup" role="dialog" aria-label="Choose birthday">
                        <div className="calendar-header">
                          <button
                            type="button"
                            onClick={() =>
                              setBirthdayViewMonth(
                                new Date(
                                  birthdayViewMonth.getFullYear(),
                                  birthdayViewMonth.getMonth() - 1,
                                  1
                                )
                              )
                            }
                          >
                            ←
                          </button>
                          <span>
                            {birthdayViewMonth.toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <button
                            type="button"
                            disabled={!canBirthdayMonthGoNext}
                            onClick={() =>
                              setBirthdayViewMonth(
                                new Date(
                                  birthdayViewMonth.getFullYear(),
                                  birthdayViewMonth.getMonth() + 1,
                                  1
                                )
                              )
                            }
                          >
                            →
                          </button>
                        </div>
                        <div className="calendar-grid">
                          <div className="calendar-day-header">Sun</div>
                          <div className="calendar-day-header">Mon</div>
                          <div className="calendar-day-header">Tue</div>
                          <div className="calendar-day-header">Wed</div>
                          <div className="calendar-day-header">Thu</div>
                          <div className="calendar-day-header">Fri</div>
                          <div className="calendar-day-header">Sat</div>
                          {birthdayCalendarDays.map((day, index) => {
                            const isFuture = day.date > todayIso;
                            return (
                              <button
                                key={index}
                                type="button"
                                className={`calendar-day ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${day.date === formData.birthday ? 'selected' : ''}`}
                                onClick={() => !isFuture && selectBirthdayDate(day.date)}
                                disabled={!day.isCurrentMonth || isFuture}
                              >
                                {day.day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
              <div className="profile-row profile-row--1">
                <label className="profile-field">
                  <span className="profile-field-label">Units</span>
                  <select
                    name="unit_preference"
                    value={formData.unit_preference}
                    onChange={handleChange}
                    className={fieldInputClass}
                  >
                    <option value="">Select unit system</option>
                    {unitChoices.map((u) => (
                      <option key={u.unit_id} value={String(u.unit_id)}>
                        {formatUnitDisplayName(u.unit_name)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="profile-row profile-row--1">
                <label className="profile-field">
                  <span className="profile-field-label">Activity level</span>
                  <select
                    name="activity_level"
                    value={formData.activity_level}
                    onChange={handleChange}
                    className={fieldInputClass}
                  >
                    <option value="">Select activity level</option>
                    <option value="1">Sedentary - Little to no exercise, desk job</option>
                    <option value="2">Light Activity - Light exercise 1-3 days/week</option>
                    <option value="3">Moderate Activity - Moderate exercise 3-5 days/week</option>
                    <option value="4">Active - Heavy exercise 6-7 days/week</option>
                    <option value="5">Very Active - Very heavy exercise, physical job</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="text-action text-action-primary">
                Save Changes
              </button>
              <button type="button" className="text-action" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="user-info-display profile-info-surface">
          <div className="info-section">
            <div className="profile-rows">
              <div className="profile-row profile-row--2">
                <div className="profile-field">
                  <span className="profile-field-label">First name</span>
                  <span className="profile-field-value">{profileData?.first_name || 'Not set'}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Last name</span>
                  <span className="profile-field-value">{profileData?.last_name || 'Not set'}</span>
                </div>
              </div>
              <div className="profile-row profile-row--2">
                <div className="profile-field">
                  <span className="profile-field-label">Username</span>
                  <span className="profile-field-value">{profileData?.username || 'Not set'}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Email</span>
                  <span className="profile-field-value">{profileData?.email || 'Not set'}</span>
                </div>
              </div>
              <div className="profile-row profile-row--2">
                <div className="profile-field">
                  <span className="profile-field-label">Height</span>
                  <span className="profile-field-value">
                    {profileData?.height ? `${profileData.height} cm` : 'Not set'}
                  </span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Gender</span>
                  <span className="profile-field-value">{profileData?.gender || 'Not set'}</span>
                </div>
              </div>
              <div className="profile-row profile-row--1">
                <div className="profile-field">
                  <span className="profile-field-label">Birthday</span>
                  <span className="profile-field-value">{birthdayDisplay}</span>
                </div>
              </div>
              <div className="profile-row profile-row--1">
                <div className="profile-field">
                  <span className="profile-field-label">Units</span>
                  <span className="profile-field-value">
                    {profileData?.unit_preference?.unit_name
                      ? formatUnitDisplayName(profileData.unit_preference.unit_name)
                      : 'Not set'}
                  </span>
                </div>
              </div>
              <div className="profile-row profile-row--1">
                <div className="profile-field">
                  <span className="profile-field-label">Activity level</span>
                  <span className="profile-field-value">
                    {profileData?.activity_level?.name || 'Not set'}
                  </span>
                </div>
              </div>
            </div>
            <div className="info-footer">
              <button type="button" className="text-action" onClick={() => setEditing(true)}>
                Edit info
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .personal-info-section {
          max-width: none;
          width: 100%;
          margin: 0;
        }

        .profile-info-surface {
          background: var(--profile-card-bg, var(--bg-secondary));
          border: none;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
        }

        .profile-birthday-picker {
          position: relative;
          width: 100%;
        }

        .profile-birthday-input {
          cursor: pointer;
        }

        .profile-birthday-picker .custom-calendar-popup {
          position: absolute;
          top: 100%;
          left: 0;
          right: auto;
          background: var(--bg-secondary);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          padding: var(--space-5);
          min-width: min(100%, 350px);
          max-width: 400px;
          margin-top: var(--space-2);
        }

        .profile-birthday-picker .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
          padding-bottom: var(--space-2);
          border-bottom: 1px solid var(--input-border);
        }

        .profile-birthday-picker .calendar-header button {
          background: var(--bg-tertiary);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: var(--space-1) var(--space-2);
          cursor: pointer;
          font-size: var(--text-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .profile-birthday-picker .calendar-header button:hover:not(:disabled) {
          background: var(--accent-primary);
          color: white;
        }

        .profile-birthday-picker .calendar-header button:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .profile-birthday-picker .calendar-header span {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-primary);
        }

        .profile-birthday-picker .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .profile-birthday-picker .calendar-day-header {
          text-align: center;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-secondary);
          padding: var(--space-2);
        }

        .profile-birthday-picker .calendar-day {
          background: var(--bg-tertiary);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: var(--space-3);
          cursor: pointer;
          font-size: var(--text-base);
          transition: all 0.2s var(--ease-out-cubic);
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-birthday-picker .calendar-day:hover:not(:disabled) {
          background: var(--accent-primary);
          color: white;
        }

        .profile-birthday-picker .calendar-day.selected {
          background: var(--accent-primary);
          color: white;
          font-weight: 600;
        }

        .profile-birthday-picker .calendar-day.other-month {
          color: var(--text-secondary);
          opacity: 0.5;
        }

        .profile-birthday-picker .calendar-day.other-month:hover:not(:disabled) {
          opacity: 0.8;
        }

        .profile-birthday-picker .calendar-day:disabled {
          cursor: not-allowed;
          opacity: 0.3;
        }

        .profile-birthday-picker .calendar-day:disabled:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        @media (max-width: 400px) {
          .profile-birthday-picker .custom-calendar-popup {
            left: 0;
            right: 0;
            width: calc(100vw - 2rem);
            max-width: none;
            margin-left: 0;
            margin-right: 0;
          }
        }

        .personal-info-edit-card {
          padding: var(--space-5);
          margin-bottom: var(--space-4);
        }

        .user-info-display {
          padding: var(--space-5);
        }

        .profile-rows {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .profile-row--2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          align-items: start;
        }

        .profile-row--1 {
          display: block;
        }

        .profile-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin: 0;
          min-width: 0;
        }

        .profile-field-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: var(--font-weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .profile-field-value {
          display: flex;
          align-items: center;
          min-height: 52px;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid transparent;
          font-size: var(--text-lg);
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
          line-height: 1.3;
        }

        .profile-field-input {
          width: 100%;
          box-sizing: border-box;
          min-height: 52px;
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-lg);
          text-align: left;
          transition: border-color 0.2s var(--ease-out-cubic), box-shadow 0.2s;
        }

        select.profile-field-input {
          cursor: pointer;
        }

        .profile-field-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.12);
        }

        .form-actions {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
          align-items: center;
          margin-top: var(--space-6);
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

        .info-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: var(--space-6);
        }

        @media (max-width: 768px) {
          .profile-row--2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

const RankingsSection = ({ className = '', metrics, selectedMetricType, setSelectedMetricType }) => {
  const [mobileRankingPanelOpen, setMobileRankingPanelOpen] = useState(false);
  const mobilePanelOpenedAtRef = useRef(0);

  const openMobileRankingPanel = useCallback(() => {
    mobilePanelOpenedAtRef.current =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    setMobileRankingPanelOpen(true);
  }, []);

  const handleMobileOverlayDismiss = useCallback((e) => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - mobilePanelOpenedAtRef.current < 700) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setMobileRankingPanelOpen(false);
  }, []);
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
    <div className={`rankings-section${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="ranking-panel-toggle-mobile"
        onClick={openMobileRankingPanel}
        aria-label="Open ranking panel"
      >
        RANKS
      </button>
      {mobileRankingPanelOpen && (
        <div
          className="ranking-panel-overlay-mobile"
          onClick={handleMobileOverlayDismiss}
          aria-hidden="true"
        />
      )}
      <div className="rankings-layout">
        <div
          className={`ranking-panel ${mobileRankingPanelOpen ? 'ranking-panel--mobile-open' : ''}`}
          data-testid="ranking-panel"
        >
          <button
            type="button"
            className="ranking-panel-close-mobile"
            onClick={() => setMobileRankingPanelOpen(false)}
            aria-label="Close ranking panel"
          >
            ×
          </button>
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
                    borderColor: isSelected ? 'rgba(80, 200, 120, 0.65)' : 'transparent',
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
          font-size: var(--text-base);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--space-2);
        }

        .ranking-panel-value-number {
          font-size: var(--text-4xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .ranking-panel-unit {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .ranking-panel-rank {
          font-size: var(--text-lg);
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
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          letter-spacing: 0.1em;
        }

        .ranking-row-values {
          font-size: var(--text-sm);
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
          height: 300px;
          min-height: 300px;
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
          font-size: var(--text-xl);
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
          font-size: clamp(2rem, 3.2vw, 2.75rem);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .metric-unit {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .metric-description {
          font-size: var(--text-base);
          color: var(--text-tertiary);
          line-height: 1.45;
        }

        .metric-equation {
          margin-top: var(--space-2);
          font-size: var(--text-sm);
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

        .ranking-panel-toggle-mobile {
          display: none;
        }

        .ranking-panel-close-mobile {
          display: none;
        }

        .ranking-panel-overlay-mobile {
          display: none;
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

        @media (max-width: 768px) {
          .rankings-section {
            padding-left: var(--space-1);
            padding-right: var(--space-1);
          }

          .rankings-layout {
            padding: 0 var(--space-1);
          }

          .ranking-panel-toggle-mobile {
            display: block;
            position: fixed;
            bottom: calc(102px + env(safe-area-inset-bottom, 0px));
            right: var(--space-3);
            z-index: 400;
            padding: var(--space-4) var(--space-5);
            min-height: 52px;
            min-width: 88px;
            background: var(--accent-primary-alpha);
            color: var(--accent-primary);
            border: 1px solid var(--accent-primary);
            border-radius: var(--radius-lg);
            font-size: var(--text-sm);
            font-weight: var(--font-weight-semibold);
            letter-spacing: 0.06em;
            cursor: pointer;
            box-shadow: var(--shadow-lg);
          }

          .ranking-panel-overlay-mobile {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 450;
          }

          .ranking-panel {
            position: fixed;
            top: 0;
            right: 0;
            bottom: calc(88px + env(safe-area-inset-bottom, 0px));
            width: 88%;
            max-width: 340px;
            z-index: 500;
            transform: translateX(100%);
            transition: transform 0.3s var(--ease-out-cubic);
            border-radius: var(--radius-lg) 0 0 var(--radius-lg);
            padding-top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
            box-sizing: border-box;
            animation: none;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }

          .ranking-panel .ranking-panel-value {
            flex-shrink: 0;
            margin-bottom: var(--space-2);
            padding-bottom: var(--space-2);
          }

          .ranking-panel .ranking-panel-value-label {
            margin-bottom: 4px;
            font-size: var(--text-sm);
            letter-spacing: 0.1em;
          }

          .ranking-panel .ranking-panel-value-number {
            margin-bottom: 4px;
            font-size: var(--text-2xl);
            line-height: 1.2;
          }

          .ranking-panel .ranking-panel-unit {
            font-size: var(--text-sm);
          }

          .ranking-panel .ranking-panel-rank {
            font-size: var(--text-sm);
            line-height: 1.25;
            margin: 0;
          }

          .ranking-panel .ranking-list {
            flex: 1 1 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: stretch;
            gap: 0;
            overflow: hidden;
            padding-bottom: 0;
          }

          .ranking-panel .ranking-row {
            flex: 1 1 0;
            min-height: 0;
            padding: 2px var(--space-2);
            gap: var(--space-2);
            align-items: center;
          }

          .ranking-panel .ranking-row-rank {
            font-size: var(--text-xs);
            letter-spacing: 0.06em;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
          }

          .ranking-panel .ranking-row-values {
            font-size: var(--text-xs);
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
            flex-shrink: 1;
          }

          .ranking-panel.ranking-panel--mobile-open {
            transform: translateX(0);
          }

          .ranking-panel-close-mobile {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: var(--space-3);
            right: var(--space-3);
            min-width: 52px;
            min-height: 52px;
            padding: var(--space-3);
            background: transparent;
            border: none;
            box-shadow: none;
            border-radius: var(--radius-md);
            font-size: 2rem;
            font-weight: var(--font-weight-bold);
            color: var(--text-primary);
            cursor: pointer;
            line-height: 1;
          }

          .rankings-section--in-profile .metrics-grid {
            margin-top: var(--space-2);
          }

          .metrics-grid {
            grid-template-columns: 1fr 1fr;
            gap: var(--space-2);
          }

          .metric-card {
            height: auto;
            min-height: 0;
            padding: var(--space-3);
          }

          .metric-equation,
          .metric-equation-legend {
            display: none !important;
          }

          .metric-description {
            display: none !important;
          }

          .metric-value {
            font-size: clamp(1.35rem, 4.5vw, 1.85rem);
          }

          .metric-label {
            font-size: var(--text-base);
          }

          .metric-unit {
            font-size: var(--text-sm);
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
