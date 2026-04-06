import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import DateRangeSelector from '../components/analytics/DateRangeSelector';
import WorkoutAnalyticsControlsCard from '../components/analytics/WorkoutAnalyticsControlsCard';
import WorkoutProgressionChart from '../components/analytics/WorkoutProgressionChart';
import ActivationProgressChart from '../components/analytics/ActivationProgressChart';
import FoodMetadataProgressChart from '../components/analytics/FoodMetadataProgressChart';
import FoodTimingChart from '../components/analytics/FoodTimingChart';
import MacroSplitChart from '../components/analytics/MacroSplitChart';
import FoodFrequencyChart from '../components/analytics/FoodFrequencyChart';

const DEFAULT_RANGE = '2weeks';

export function getAnalyticsParams(range, customFrom, customTo) {
  const params = { range };
  if (range === 'custom' && customFrom && customTo) {
    params.date_from = customFrom;
    params.date_to = customTo;
  }
  return params;
}

const Analytics = () => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState('workouts');
  const [workoutRange, setWorkoutRange] = useState(DEFAULT_RANGE);
  const [workoutCustomFrom, setWorkoutCustomFrom] = useState('');
  const [workoutCustomTo, setWorkoutCustomTo] = useState('');
  const [workoutId, setWorkoutId] = useState('');
  const [selectedWorkoutName, setSelectedWorkoutName] = useState('');
  const [workoutSearch, setWorkoutSearch] = useState('');
  const [progressionType, setProgressionType] = useState('avg_weight_reps');
  const [comparisonMetric, setComparisonMetric] = useState('');
  const [metricOffset, setMetricOffset] = useState(0);

  const [foodRange, setFoodRange] = useState(DEFAULT_RANGE);
  const [foodCustomFrom, setFoodCustomFrom] = useState('');
  const [foodCustomTo, setFoodCustomTo] = useState('');

  const workoutParams = getAnalyticsParams(workoutRange, workoutCustomFrom, workoutCustomTo);
  const foodParams = getAnalyticsParams(foodRange, foodCustomFrom, foodCustomTo);

  const sections = [
    { id: 'workouts', label: 'Workout Analytics' },
    { id: 'foods', label: 'Food Analytics' }
  ];

  return (
    <div className={`analytics-page${theme === 'light' ? ' analytics-page--light' : ''}`}>
      <div className="analytics-inner">
        <div className="analytics-tabs" role="tablist" aria-label="Analytics sections">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeSection === section.id}
              className={`analytics-tab${activeSection === section.id ? ' analytics-tab--active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="analytics-content">
          {activeSection === 'workouts' && (
            <div className="analytics-section">
              <WorkoutAnalyticsControlsCard
                workoutRange={workoutRange}
                setWorkoutRange={setWorkoutRange}
                workoutCustomFrom={workoutCustomFrom}
                setWorkoutCustomFrom={setWorkoutCustomFrom}
                workoutCustomTo={workoutCustomTo}
                setWorkoutCustomTo={setWorkoutCustomTo}
                workoutId={workoutId}
                setWorkoutId={setWorkoutId}
                onWorkoutSelect={(id, name) => setSelectedWorkoutName(name || '')}
                workoutSearch={workoutSearch}
                setWorkoutSearch={setWorkoutSearch}
                progressionType={progressionType}
                setProgressionType={setProgressionType}
                comparisonMetric={comparisonMetric}
                setComparisonMetric={setComparisonMetric}
                metricOffset={metricOffset}
                setMetricOffset={setMetricOffset}
              />
              <div className="analytics-charts-grid analytics-charts-fullwidth">
                <div className="analytics-chart-card">
                  <WorkoutProgressionChart
                    dateRangeParams={workoutParams}
                    workoutId={workoutId}
                    progressionType={progressionType}
                    comparisonMetric={comparisonMetric}
                    metricOffset={metricOffset}
                    title={workoutId ? selectedWorkoutName || 'Workout' : 'All Workouts'}
                  />
                </div>
                <div className="analytics-chart-card">
                  <ActivationProgressChart dateRangeParams={workoutParams} />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'foods' && (
            <div className="analytics-section">
              <div className="analytics-food-header">
                <div className="analytics-food-date-card">
                  <DateRangeSelector
                    section="foods"
                    value={foodRange}
                    onChange={setFoodRange}
                    dateFrom={foodCustomFrom}
                    dateTo={foodCustomTo}
                    onCustomDatesChange={(from, to) => {
                      setFoodCustomFrom(from);
                      setFoodCustomTo(to);
                    }}
                  />
                </div>
              </div>
              <div className="analytics-charts-grid analytics-charts-fullwidth">
                <div className="analytics-chart-card">
                  <FoodMetadataProgressChart dateRangeParams={foodParams} />
                </div>
                <div className="analytics-chart-card">
                  <FoodTimingChart dateRangeParams={foodParams} />
                </div>
                <div className="analytics-chart-card">
                  <MacroSplitChart dateRangeParams={foodParams} />
                </div>
                <div className="analytics-chart-card">
                  <FoodFrequencyChart dateRangeParams={foodParams} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Shell matches Profile: grid background + card tokens (--profile-page uses same names as Profile.js) */
        .analytics-page {
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
          --analytics-tab-pad-y: var(--space-3);
          --analytics-tab-pad-x: var(--space-3);
          --analytics-tab-font: var(--text-sm);
          --analytics-controls-strip-min-height: 5rem;

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

        .analytics-page--light {
          --profile-shell-tint: rgba(0, 0, 0, 0.04);
          --profile-shell-strong: rgba(0, 0, 0, 0.1);
          --profile-card-bg: #ffffff;
          --profile-card-border: #d8dce8;
          background-color: #e8eaf2;
          background-image:
            linear-gradient(var(--profile-shell-tint) 1px, transparent 1px),
            linear-gradient(90deg, var(--profile-shell-tint) 1px, transparent 1px),
            linear-gradient(var(--profile-shell-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--profile-shell-strong) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 80px 80px, 80px 80px;
        }

        .analytics-inner {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--space-4) var(--space-4) var(--space-6);
          box-sizing: border-box;
          min-width: 0;
        }

        @media (min-width: 769px) {
          .analytics-page {
            --analytics-tab-pad-y: var(--space-4);
            --analytics-tab-pad-x: var(--space-5);
            --analytics-tab-font: var(--text-base);
          }

          .analytics-food-date-card {
            min-height: var(--analytics-controls-strip-min-height, 5rem);
            padding: var(--space-3) var(--space-4);
            display: flex;
            align-items: center;
            justify-content: flex-end;
            box-sizing: border-box;
          }
        }

        .analytics-tabs {
          display: flex;
          justify-content: flex-start;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
          flex-wrap: wrap;
        }

        .analytics-tab {
          flex: 0 1 auto;
          min-width: min(140px, 42%);
          max-width: 280px;
          padding: var(--analytics-tab-pad-y) var(--analytics-tab-pad-x);
          border-radius: var(--radius-md);
          border: 1px solid var(--input-border);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-weight: var(--font-weight-semibold);
          font-size: var(--analytics-tab-font);
          line-height: 1.2;
          cursor: pointer;
          transition: background 0.2s var(--ease-out-cubic), border-color 0.2s;
        }

        .analytics-tab:hover {
          border-color: var(--accent-primary);
        }

        .analytics-tab--active {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: #fff;
        }

        .analytics-content {
          min-height: 400px;
        }

        .analytics-charts-grid {
          display: grid;
          gap: var(--space-6);
        }

        .analytics-charts-fullwidth {
          grid-template-columns: 1fr;
        }

        .analytics-chart-card {
          background: var(--profile-card-bg);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          box-shadow: var(--shadow-md);
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .analytics-chart-card .workout-progression-chart,
        .analytics-chart-card .analytics-chart {
          width: 100%;
          min-width: 0;
        }

        .analytics-food-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: var(--space-6);
        }

        .analytics-food-date-card {
          background: var(--profile-card-bg);
          border-radius: var(--radius-lg);
          padding: var(--space-4) var(--space-5);
          box-shadow: var(--shadow-md);
        }

        .analytics-food-date-card .analytics-date-range-selector {
          margin-bottom: 0;
        }

        /* Center Recharts <Legend /> under the chart within the card */
        .analytics-page .recharts-legend-wrapper {
          position: absolute !important;
          left: 0 !important;
          right: 0 !important;
          margin-left: auto !important;
          margin-right: auto !important;
          width: fit-content !important;
          max-width: calc(100% - var(--space-4)) !important;
          display: flex !important;
          justify-content: center !important;
          box-sizing: border-box;
        }

        .analytics-page .recharts-default-legend {
          display: flex !important;
          flex-wrap: wrap;
          justify-content: center !important;
          width: 100%;
          margin: 0 auto;
        }

        .analytics-page .recharts-legend-item {
          margin-left: var(--space-2);
          margin-right: var(--space-2);
        }

        @media (max-width: 768px) {
          .analytics-page {
            padding-top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
            padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px));
            min-height: min-content;
            /* Avoid clipping wide chart rows / doughnut layouts (was hiding graphs on narrow viewports) */
            overflow-x: visible;
            --analytics-tab-pad-y: var(--space-3);
            --analytics-tab-pad-x: var(--space-3);
            --analytics-tab-font: var(--text-base);
          }

          .analytics-inner {
            padding: var(--space-3) var(--space-1) var(--space-4);
            overflow-x: visible;
          }

          .analytics-tabs {
            justify-content: center;
            margin-bottom: var(--space-4);
            padding-left: var(--space-2);
            padding-right: var(--space-2);
            padding-top: var(--space-2);
          }

          .analytics-tab {
            flex: 1;
            min-width: 0;
            max-width: none;
            line-height: 1.35;
          }

          .analytics-charts-grid {
            gap: var(--space-4);
          }

          /* Titles keep horizontal inset; plot area uses minimal left padding to reduce gap beside chart */
          .analytics-chart-card {
            padding: var(--space-3) var(--space-1) var(--space-2) 0;
            display: block;
            min-height: 0;
            overflow: visible;
          }

          .analytics-chart-card h3,
          .analytics-chart-card .analytics-chart-title,
          .analytics-chart-card .workout-progression-chart-title {
            padding: var(--space-2) var(--space-4) var(--space-1);
            margin-top: 0;
            margin-bottom: var(--space-2);
          }

          .analytics-chart-card .analytics-chart-body {
            width: 100%;
            min-width: 0;
          }

          .analytics-chart-card .analytics-sized-chart-host,
          .analytics-chart-card .analytics-sized-chart-host.analytics-chart-body {
            width: 100%;
            min-width: 0;
          }

          /* Cartesian charts only: extra nudge after tighter Recharts margins (analyticsChartMargins.js) */
          .analytics-chart-card:has(.recharts-cartesian-grid) .recharts-wrapper {
            margin-left: -20px !important;
            width: calc(100% + 20px) !important;
            max-width: none !important;
          }

          .analytics-page .recharts-yAxis {
            width: 26px !important;
            max-width: 26px !important;
          }

          .analytics-page .recharts-surface {
            overflow: visible;
          }

          /*
           * Widen the plot grid (horizontal span) without changing card/page padding.
           * Scales only the Cartesian grid group; Recharts draws grid in its own layer.
           */
          .analytics-page .recharts-cartesian-grid {
            transform: scaleX(1.07);
            transform-origin: center center;
          }

          .analytics-page .recharts-cartesian-grid line {
            vector-effect: non-scaling-stroke;
          }

          .analytics-page .recharts-xAxis .recharts-cartesian-axis-tick text {
            font-size: 11px !important;
          }

          /* Y-axis value labels sideways (read upward) */
          .analytics-page .recharts-yAxis .recharts-cartesian-axis-tick text {
            font-size: 12px !important;
            transform: rotate(-90deg);
            transform-box: fill-box;
            transform-origin: center;
          }

          .analytics-page .recharts-legend-item-text {
            font-size: 17px !important;
            font-weight: var(--font-weight-medium);
          }

          .analytics-page .recharts-legend-item {
            margin-left: var(--space-2);
            margin-right: var(--space-2);
            margin-bottom: var(--space-1);
          }

          .analytics-page .recharts-legend-icon {
            transform: scale(1.45);
            transform-origin: left center;
          }

          .analytics-page .recharts-legend-wrapper {
            padding: var(--space-1) var(--space-1) 0;
          }

          .analytics-page .recharts-default-legend {
            margin-bottom: 0 !important;
          }

          .analytics-content {
            overflow: visible;
          }
        }
      `}</style>
    </div>
  );
};

export default Analytics;
