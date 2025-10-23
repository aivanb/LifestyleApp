import React from 'react';

/**
 * CircularProgressBar Component
 * 
 * Displays a circular progress bar for macro goals.
 * Features:
 * - Animated circular progress
 * - Color-coded based on progress percentage
 * - Displays current/target values
 * - Responsive design
 */
export const CircularProgressBar = ({ 
  current, 
  target, 
  label, 
  color = 'var(--accent-primary)',
  size = 120,
  strokeWidth = 12,
  showValues = true 
}) => {
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on progress - red-pink (0-20%, 170%-n%), yellow (21-80%, 120-169%), green (81-119%)
  const getProgressColor = () => {
    if ((percentage >= 0 && percentage <= 20) || percentage >= 170) {
      return '#ff6b9d'; // red-pink
    }
    if ((percentage >= 21 && percentage <= 80) || (percentage >= 120 && percentage <= 169)) {
      return '#ffd93d'; // yellow
    }
    if (percentage >= 81 && percentage <= 119) {
      return '#6bcf7f'; // green
    }
    return 'var(--accent-primary)'; // fallback
  };

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-svg">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getProgressColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="progress-circle"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out, stroke 0.3s ease-in-out'
          }}
        />
      </svg>
      
      <div className="progress-content">
        <div className="progress-percentage" style={{ color: getProgressColor() }}>
          {Math.round(percentage)}%
        </div>
        {showValues && (
          <div className="progress-values">
            <div className="progress-current">{Math.round(current)}</div>
            <div className="progress-target">/ {Math.round(target)}</div>
          </div>
        )}
        <div className="progress-label">{label}</div>
      </div>

      <style>{`
        .circular-progress {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .progress-svg {
          transform: rotate(-90deg);
        }

        .progress-content {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .progress-percentage {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          line-height: 1;
        }

        .progress-values {
          display: flex;
          align-items: baseline;
          gap: 2px;
          margin-top: var(--space-1);
        }

        .progress-current {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
        }

        .progress-target {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .progress-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: var(--space-1);
        }

        .progress-circle {
          /* Removed blue glow filter */
        }
      `}</style>
    </div>
  );
};

/**
 * LinearProgressBar Component
 * 
 * Displays a linear progress bar for detailed macro tracking.
 * Features:
 * - Horizontal progress bar
 * - Color-coded progress
 * - Current/target/remaining values
 * - Customizable width and height
 */
export const LinearProgressBar = ({ 
  current, 
  target, 
  label, 
  unit = '',
  color = 'var(--accent-primary)',
  height = 12,
  showValues = true,
  showRemaining = true
}) => {
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const remaining = Math.max(target - current, 0);

  // Color based on progress - red-pink (0-20%, 170%-n%), yellow (21-80%, 120-169%), green (81-119%)
  const getProgressColor = () => {
    if ((percentage >= 0 && percentage <= 20) || percentage >= 170) {
      return '#ff6b9d'; // red-pink
    }
    if ((percentage >= 21 && percentage <= 80) || (percentage >= 120 && percentage <= 169)) {
      return '#ffd93d'; // yellow
    }
    if (percentage >= 81 && percentage <= 119) {
      return '#6bcf7f'; // green
    }
    return 'var(--accent-primary)'; // fallback
  };

  return (
    <div className="linear-progress">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        {showValues && (
          <span className="progress-percentage" style={{ color: getProgressColor() }}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      
      <div 
        className="progress-track"
        style={{ height: `${height}px` }}
      >
        <div
          className="progress-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getProgressColor(),
            height: `${height}px`
          }}
        />
      </div>
      
      {showValues && (
        <div className="progress-values">
          <span className="progress-current">
            {Math.round(current)}{unit}
          </span>
          <span className="progress-separator">/</span>
          <span className="progress-target">
            {Math.round(target)}{unit}
          </span>
          {showRemaining && remaining > 0 && (
            <>
              <span className="progress-separator">•</span>
              <span className="progress-remaining">
                {Math.round(remaining)}{unit} remaining
              </span>
            </>
          )}
        </div>
      )}

      <style>{`
        .linear-progress {
          width: 100%;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .progress-label {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .progress-percentage {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
        }

        .progress-track {
          width: 100%;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          border-radius: var(--radius-full);
          transition: width 0.5s ease-in-out, background-color 0.3s ease-in-out;
          position: relative;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progress-values {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          margin-top: var(--space-2);
          font-size: var(--text-xs);
        }

        .progress-current {
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
        }

        .progress-separator {
          color: var(--text-tertiary);
        }

        .progress-target {
          color: var(--text-secondary);
        }

        .progress-remaining {
          color: var(--text-tertiary);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

/**
 * ProgressGrid Component
 * 
 * Displays multiple circular progress bars in a grid layout.
 * Used for the main dashboard view.
 */
export const ProgressGrid = ({ goals, consumed, className = '' }) => {
  const mainMacros = [
    { key: 'calories', goalKey: 'calories_goal', label: 'Calories', color: 'var(--accent-primary)' },
    { key: 'protein', goalKey: 'protein_goal', label: 'Protein', color: 'var(--accent-secondary)' },
    { key: 'fat', goalKey: 'fat_goal', label: 'Fat', color: 'var(--accent-warning)' },
    { key: 'carbohydrates', goalKey: 'carbohydrates_goal', label: 'Carbs', color: 'var(--accent-info)' },
    { key: 'sodium', goalKey: 'sodium_goal', label: 'Sodium', color: 'var(--accent-success)' }
  ];

  return (
    <div className={`progress-grid ${className}`}>
      {mainMacros.map(macro => (
        <CircularProgressBar
          key={macro.key}
          current={consumed[macro.key] || 0}
          target={goals ? (goals[macro.goalKey] || 0) : 0}
          label={macro.label}
          color={macro.color}
          size={120}
          strokeWidth={12}
        />
      ))}
      
      <style>{`
        .progress-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: var(--space-6);
          justify-items: center;
          align-items: center;
        }

        @media (max-width: 768px) {
          .progress-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--space-4);
          }
        }
      `}</style>
    </div>
  );
};

/**
 * ExpandedProgressView Component
 * 
 * Displays all macro goals in linear progress bars.
 * Used when clicking on the main progress section.
 */
export const ExpandedProgressView = ({ goals, consumed, onClose }) => {
  const allMacros = [
    { key: 'calories', goalKey: 'calories_goal', label: 'Calories', unit: ' cal', color: 'var(--accent-primary)' },
    { key: 'protein', goalKey: 'protein_goal', label: 'Protein', unit: 'g', color: 'var(--accent-secondary)' },
    { key: 'fat', goalKey: 'fat_goal', label: 'Fat', unit: 'g', color: 'var(--accent-warning)' },
    { key: 'carbohydrates', goalKey: 'carbohydrates_goal', label: 'Carbohydrates', unit: 'g', color: 'var(--accent-info)' },
    { key: 'fiber', goalKey: 'fiber_goal', label: 'Fiber', unit: 'g', color: 'var(--accent-purple)' },
    { key: 'sodium', goalKey: 'sodium_goal', label: 'Sodium', unit: 'mg', color: 'var(--accent-success)' },
    { key: 'sugar', goalKey: 'sugar_goal', label: 'Sugar', unit: 'g', color: 'var(--accent-danger)' },
    { key: 'saturated_fat', goalKey: 'saturated_fat_goal', label: 'Saturated Fat', unit: 'g', color: 'var(--accent-warning)' },
    { key: 'trans_fat', goalKey: 'trans_fat_goal', label: 'Trans Fat', unit: 'g', color: 'var(--accent-danger)' },
    { key: 'calcium', goalKey: 'calcium_goal', label: 'Calcium', unit: 'mg', color: 'var(--accent-info)' },
    { key: 'iron', goalKey: 'iron_goal', label: 'Iron', unit: 'mg', color: 'var(--accent-secondary)' },
    { key: 'magnesium', goalKey: 'magnesium_goal', label: 'Magnesium', unit: 'mg', color: 'var(--accent-primary)' },
    { key: 'cholesterol', goalKey: 'cholesterol_goal', label: 'Cholesterol', unit: 'mg', color: 'var(--accent-warning)' },
    { key: 'vitamin_a', goalKey: 'vitamin_a_goal', label: 'Vitamin A', unit: 'mcg', color: 'var(--accent-secondary)' },
    { key: 'vitamin_c', goalKey: 'vitamin_c_goal', label: 'Vitamin C', unit: 'mg', color: 'var(--accent-info)' },
    { key: 'vitamin_d', goalKey: 'vitamin_d_goal', label: 'Vitamin D', unit: 'mcg', color: 'var(--accent-primary)' },
    { key: 'caffeine', goalKey: 'caffeine_goal', label: 'Caffeine', unit: 'mg', color: 'var(--accent-warning)' },
    { key: 'cost', goalKey: 'cost_goal', label: 'Cost', unit: '$', color: 'var(--accent-warning)' }
  ];

  return (
    <div className="expanded-progress card animate-scale-in">
      <div className="expanded-progress-header">
        <h3 className="expanded-progress-title">Daily Nutrition Progress</h3>
        {onClose && (
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 10 5.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="expanded-progress-grid">
        {allMacros.map(macro => (
          <LinearProgressBar
            key={macro.key}
            current={consumed[macro.key] || 0}
            target={goals ? (goals[macro.goalKey] || 0) : 0}
            label={macro.label}
            unit={macro.unit}
            color={macro.color}
            height={10}
            showValues={true}
            showRemaining={true}
          />
        ))}
      </div>

      <style>{`
        .expanded-progress {
          position: relative;
          width: 100%;
          margin: 0;
        }

        .expanded-progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-primary);
        }

        .expanded-progress-title {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-medium);
          margin: 0;
          color: var(--text-primary);
        }

        .expanded-progress-grid {
          display: grid;
          gap: var(--space-5);
        }

        @media (max-width: 768px) {
          .expanded-progress {
            margin: 0;
          }
          
          .expanded-progress-header {
            flex-direction: column;
            gap: var(--space-3);
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

const ProgressBarComponents = { CircularProgressBar, LinearProgressBar, ProgressGrid, ExpandedProgressView };
export default ProgressBarComponents;
