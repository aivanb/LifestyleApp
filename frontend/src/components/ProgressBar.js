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
  // Color based on progress percentage (not macro type).
  // Red-pink (0-20%, 170%-n%), yellow (21-80%, 120-169%), green (81-119%)
  const getProgressColor = () => {
    if ((percentage >= 0 && percentage <= 20) || percentage >= 170) {
      return '#ff6b9d';
    }
    if ((percentage >= 21 && percentage <= 80) || (percentage >= 120 && percentage <= 169)) {
      return '#ffd93d';
    }
    if (percentage >= 81 && percentage <= 119) {
      return '#6bcf7f';
    }
    return color;
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
          font-size: var(--text-xl);
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
          font-size: var(--text-base);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .progress-target {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .progress-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: var(--space-1);
        }

        .circular-progress .progress-label {
          color: var(--text-secondary);
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
  showRemaining = true,
  /** When `explicit`, the bar and optional % use `color` only. */
  colorMode = 'percentage',
  /** When true (e.g. muscle not on today’s split), bar uses `color` instead of percentage bands. */
  outOfSplit = false,
  layout = 'default',
  showPercentage = true,
  showLabelSeparatorDot = true,
}) => {
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const remaining = Math.max(target - current, 0);
  // Color based on progress percentage (not macro type).
  // Red-pink (0-20%, 170%-n%), yellow (21-80%, 120-169%), green (81-119%)
  const getProgressColor = () => {
    if (outOfSplit) {
      return color;
    }
    if (colorMode === 'explicit') {
      return color;
    }
    if ((percentage >= 0 && percentage <= 20) || percentage >= 170) {
      return '#ff6b9d';
    }
    if ((percentage >= 21 && percentage <= 80) || (percentage >= 120 && percentage <= 169)) {
      return '#ffd93d';
    }
    if (percentage >= 81 && percentage <= 119) {
      return '#6bcf7f';
    }
    return color;
  };

  const barColor = getProgressColor();

  if (layout === 'stacked') {
    return (
      <div className="linear-progress linear-progress--stacked">
        <div className="progress-stacked-label-wrap">
          <span className="progress-label progress-label--fade-edge">{label}</span>
        </div>
        {showValues && (
          <div className="progress-values-stacked">
            <span className="progress-current">
              {Math.round(current)}
              {unit}
            </span>
            <span className="progress-separator">/</span>
            <span className="progress-target">
              {Math.round(target)}
              {unit}
            </span>
            {showRemaining && remaining > 0 && (
              <span className="progress-remaining-inline">
                {' '}
                ({Math.round(remaining)}
                {unit} left)
              </span>
            )}
          </div>
        )}
        <div className="progress-track" style={{ height: `${height}px` }}>
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: barColor,
              height: `${height}px`,
            }}
          />
        </div>
        <style>{`
          .linear-progress--stacked {
            width: 100%;
          }
          .progress-stacked-label-wrap {
            margin-bottom: var(--space-1);
            min-width: 0;
            max-width: 100%;
          }
          .linear-progress--stacked .progress-label--fade-edge {
            display: block;
            font-size: var(--text-sm);
            font-weight: var(--font-weight-medium);
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            overflow: hidden;
            white-space: nowrap;
            max-width: 100%;
            -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 calc(100% - 1.5rem), transparent 100%);
            mask-image: linear-gradient(90deg, #000 0%, #000 calc(100% - 1.5rem), transparent 100%);
          }
          .progress-values-stacked {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 0 var(--space-1);
            font-size: var(--text-sm);
            margin-bottom: var(--space-2);
            color: var(--text-primary);
          }
          .linear-progress--stacked .progress-remaining-inline {
            color: var(--text-tertiary);
            font-style: italic;
            font-size: var(--text-xs);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="linear-progress">
      <div className="progress-header">
        <div className="progress-header-left">
          <span className="progress-label">{label}</span>
          {showValues && (
            <>
              {showLabelSeparatorDot && (
                <span className="progress-separator progress-separator--dot">•</span>
              )}
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
            </>
          )}
        </div>
        {showValues && showPercentage && (
            <span className="progress-percentage" style={{ color: barColor }}>
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
            backgroundColor: barColor,
            height: `${height}px`
          }}
        />
      </div>

      <style>{`
        .linear-progress {
          width: 100%;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
          gap: var(--space-3);
        }

        .progress-header-left {
          display: inline-flex;
          align-items: baseline;
          gap: var(--space-2);
          min-width: 0;
          flex: 1;
          flex-wrap: wrap;
        }

        .linear-progress .progress-label {
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .expanded-progress-grid .linear-progress .progress-label {
          color: var(--text-secondary);
        }

        .progress-percentage {
          font-size: var(--text-base);
          font-weight: var(--font-weight-bold);
          margin-left: auto;
          flex-shrink: 0;
          text-align: right;
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
          transition: none;
          position: relative;
        }

        .progress-values {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          margin-top: 0;
          font-size: var(--text-sm);
          white-space: nowrap;
          min-width: 0;
        }

        .progress-current {
          color: var(--text-primary);
          font-weight: var(--font-weight-bold);
        }

        .progress-separator {
          color: var(--text-tertiary);
        }

        .progress-separator--dot {
          font-size: var(--text-sm);
          line-height: 1;
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
    { key: 'calories', goalKey: 'calories_goal', label: 'Calories', color: '#fb923c' }, // eaten (orange)
    { key: 'protein', goalKey: 'protein_goal', label: 'Protein', color: '#ffe433' }, // protein (yellow)
    { key: 'fat', goalKey: 'fat_goal', label: 'Fat', color: '#5cff9d' }, // fat (green)
    { key: 'carbohydrates', goalKey: 'carbohydrates_goal', label: 'Carbs', color: '#3d8bff' } // carbs (blue)
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
          size={160}
          strokeWidth={16}
        />
      ))}
      
      <style>{`
        .progress-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
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
export const ExpandedProgressView = ({ goals, consumed, isClosing = false }) => {
  const allMacros = [
    { key: 'calories', goalKey: 'calories_goal', label: 'Calories', unit: ' cal', color: '#fb923c' },
    { key: 'protein', goalKey: 'protein_goal', label: 'Protein', unit: 'g', color: '#ffe433' },
    { key: 'fat', goalKey: 'fat_goal', label: 'Fat', unit: 'g', color: '#5cff9d' },
    { key: 'carbohydrates', goalKey: 'carbohydrates_goal', label: 'Carbohydrates', unit: 'g', color: '#3d8bff' },
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
    <div className={`expanded-progress card ${isClosing ? 'progress-expanded-out' : 'progress-expanded-in'}`}>
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
            showRemaining={false}
          />
        ))}
      </div>

      <style>{`
        @keyframes progressExpandedOpen {
          from {
            opacity: 0;
            transform: translateY(-14px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes progressExpandedClose {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-14px) scale(0.9);
          }
        }

        .progress-expanded-in {
          animation: progressExpandedOpen 260ms var(--ease-out-cubic) both;
        }

        .progress-expanded-out {
          animation: none;
        }

        .expanded-progress {
          position: relative;
          width: 100%;
          margin: 0;
        }

        .expanded-progress-grid {
          display: grid;
          gap: var(--space-5);
          padding-right: var(--space-2);
          scrollbar-gutter: stable;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .expanded-progress {
            margin: 0;
          }

          .expanded-progress-grid {
            padding-right: 0;
          }

          .progress-header {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: start;
            gap: var(--space-2);
          }

          .progress-header-left {
            min-width: 0;
            row-gap: 2px;
          }

          .progress-values {
            white-space: normal;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

const ProgressBarComponents = { CircularProgressBar, LinearProgressBar, ProgressGrid, ExpandedProgressView };
export default ProgressBarComponents;
