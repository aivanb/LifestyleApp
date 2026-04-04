import React from 'react';

/**
 * Base component for analytics charts with common styling
 */
const AnalyticsChartBase = ({ title, children, controls }) => {
  return (
    <div className="analytics-chart">
      {title ? <h3>{title}</h3> : null}
      {controls && <div className="chart-controls">{controls}</div>}
      <div className="analytics-chart-body">{children}</div>
      <style>{`
        .analytics-chart {
          width: 100%;
          min-width: 0;
        }

        .analytics-chart-body {
          width: 100%;
          min-width: 0;
        }

        .analytics-chart h3 {
          font-family: var(--font-primary);
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-4);
        }

        .chart-controls {
          display: flex;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
        }

        .chart-select,
        .chart-date-input {
          padding: var(--space-2) var(--space-3);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--text-sm);
        }

        .chart-loading,
        .chart-no-data {
          text-align: center;
          padding: var(--space-8);
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default AnalyticsChartBase;

