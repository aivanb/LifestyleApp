import React, { useState } from 'react';
import DateRangeSelector from '../components/analytics/DateRangeSelector';
import WorkoutAnalyticsControlsCard from '../components/analytics/WorkoutAnalyticsControlsCard';
import WorkoutProgressionChart from '../components/analytics/WorkoutProgressionChart';
import ActivationProgressChart from '../components/analytics/ActivationProgressChart';
import SetsPerDayChart from '../components/analytics/SetsPerDayChart';
import FoodMetadataProgressChart from '../components/analytics/FoodMetadataProgressChart';
import FoodTimingChart from '../components/analytics/FoodTimingChart';
import MacroSplitChart from '../components/analytics/MacroSplitChart';
import FoodFrequencyChart from '../components/analytics/FoodFrequencyChart';
import FoodCostChart from '../components/analytics/FoodCostChart';

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
    <div className="analytics-page">
      <div className="analytics-tabs">
        {sections.map(section => (
          <button
            key={section.id}
            className={`analytics-tab ${activeSection === section.id ? 'active' : ''}`}
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
                <SetsPerDayChart dateRangeParams={workoutParams} />
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
              <div className="analytics-chart-card">
                <FoodCostChart dateRangeParams={foodParams} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .analytics-page {
          padding: var(--space-6);
          max-width: 1400px;
          margin: 0 auto;
          overflow-x: hidden;
        }
        .analytics-tabs {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
          border-bottom: 2px solid var(--border-primary);
        }
        .analytics-tab {
          padding: var(--space-3) var(--space-6);
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          color: var(--text-secondary);
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .analytics-tab:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }
        .analytics-tab.active {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
        }
        .analytics-content { min-height: 400px; }
        .analytics-charts-grid { display: grid; gap: var(--space-6); }
        .analytics-charts-fullwidth { grid-template-columns: 1fr; }
        .analytics-chart-card {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          box-shadow: var(--shadow-lg);
          width: 100%;
        }
        .analytics-food-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: var(--space-6);
        }
        .analytics-food-date-card {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--space-4) var(--space-6);
          box-shadow: var(--shadow-lg);
        }
        .analytics-food-date-card .analytics-date-range-selector {
          margin-bottom: 0;
        }

        @media (max-width: 768px) {
          .analytics-page {
            padding: var(--space-4) var(--space-2);
            padding-top: var(--space-4);
            max-width: 100%;
          }
          .analytics-tabs {
            margin-bottom: var(--space-3);
          }
          .analytics-tab {
            padding: var(--space-2) var(--space-3);
            font-size: var(--text-sm);
          }
          .analytics-charts-grid {
            gap: var(--space-3);
          }
          .analytics-chart-card {
            padding: var(--space-2) var(--space-2);
            padding-left: var(--space-1);
            min-height: 300px;
            overflow: visible;
            display: flex;
            flex-direction: column;
          }
          .analytics-chart-card h3,
          .analytics-chart-card .analytics-chart-title,
          .analytics-chart-card [class*="title"] {
            margin-bottom: var(--space-2);
          }
          .analytics-chart-card .chart-loading,
          .analytics-chart-card .chart-no-data,
          .analytics-chart-card .analytics-chart > div:first-child {
            margin: var(--space-2) 0;
          }
          .analytics-chart-card .recharts-responsive-container,
          .analytics-chart-card .recharts-wrapper {
            min-height: 260px !important;
            height: 260px !important;
            width: 100% !important;
            margin: 0 !important;
          }
          .analytics-page .recharts-cartesian-axis-tick text,
          .analytics-page .recharts-legend-item-text {
            font-size: 12px !important;
          }
          .analytics-page .recharts-wrapper {
            margin: 0;
            margin-left: 0 !important;
            padding-left: 0;
            width: 100% !important;
            min-height: 260px;
          }
          .analytics-page .recharts-legend-wrapper {
            padding: 0 2px;
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
