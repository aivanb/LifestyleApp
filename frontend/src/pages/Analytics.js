import React, { useState } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import BodyMeasurementProgressionChart from '../components/analytics/BodyMeasurementProgressionChart';
import WorkoutProgressionChart from '../components/analytics/WorkoutProgressionChart';
import WorkoutRestTimeChart from '../components/analytics/WorkoutRestTimeChart';
import WorkoutAttributesChart from '../components/analytics/WorkoutAttributesChart';
import StepsCardioDistanceChart from '../components/analytics/StepsCardioDistanceChart';
import ActivationProgressChart from '../components/analytics/ActivationProgressChart';
import FoodMetadataProgressChart from '../components/analytics/FoodMetadataProgressChart';
import FoodTimingChart from '../components/analytics/FoodTimingChart';
import MacroSplitChart from '../components/analytics/MacroSplitChart';
import FoodFrequencyChart from '../components/analytics/FoodFrequencyChart';
import FoodCostChart from '../components/analytics/FoodCostChart';
import FoodRadarChart from '../components/analytics/FoodRadarChart';
import WorkoutTrackingHeatmap from '../components/analytics/WorkoutTrackingHeatmap';
import WeightProgressionChart from '../components/analytics/WeightProgressionChart';
import HealthMetricsRadialChart from '../components/analytics/HealthMetricsRadialChart';

const Analytics = () => {
  const [activeSection, setActiveSection] = useState('workouts');

  const sections = [
    { id: 'workouts', label: 'Workout Analytics' },
    { id: 'foods', label: 'Food Analytics' },
    { id: 'health', label: 'Health Analytics' }
  ];

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="analytics-title">
          <ChartBarIcon className="analytics-header-icon" />
          <h1>Analytics Dashboard</h1>
        </div>
      </div>

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
            <h2>Workout Analytics</h2>
            <div className="analytics-charts-grid">
              <div className="analytics-chart-card">
                <BodyMeasurementProgressionChart />
              </div>
              <div className="analytics-chart-card">
                <WorkoutProgressionChart />
              </div>
              <div className="analytics-chart-card">
                <WorkoutRestTimeChart />
              </div>
              <div className="analytics-chart-card">
                <WorkoutAttributesChart />
              </div>
              <div className="analytics-chart-card">
                <StepsCardioDistanceChart />
              </div>
              <div className="analytics-chart-card">
                <ActivationProgressChart />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'foods' && (
          <div className="analytics-section">
            <h2>Food Analytics</h2>
            <div className="analytics-charts-grid">
              <div className="analytics-chart-card">
                <FoodMetadataProgressChart />
              </div>
              <div className="analytics-chart-card">
                <FoodTimingChart />
              </div>
              <div className="analytics-chart-card">
                <MacroSplitChart />
              </div>
              <div className="analytics-chart-card">
                <FoodFrequencyChart />
              </div>
              <div className="analytics-chart-card">
                <FoodCostChart />
              </div>
              <div className="analytics-chart-card">
                <FoodRadarChart />
              </div>
              <div className="analytics-chart-card">
                <WorkoutTrackingHeatmap />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'health' && (
          <div className="analytics-section">
            <h2>Health Analytics</h2>
            <div className="analytics-charts-grid">
              <div className="analytics-chart-card">
                <WeightProgressionChart />
              </div>
              <div className="analytics-chart-card">
                <HealthMetricsRadialChart />
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
        }

        .analytics-header {
          margin-bottom: var(--space-6);
        }

        .analytics-title {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          color: var(--text-primary);
        }

        .analytics-header-icon {
          width: 32px;
          height: 32px;
          color: var(--accent-primary);
        }

        .analytics-title h1 {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          margin: 0;
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

        .analytics-content {
          min-height: 400px;
        }

        .analytics-section h2 {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-6);
        }

        .analytics-charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
          gap: var(--space-6);
        }

        .analytics-chart-card {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          box-shadow: var(--shadow-lg);
        }

        @media (max-width: 768px) {
          .analytics-charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Analytics;

