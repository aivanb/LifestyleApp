import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../../services/api';
import AnalyticsSizedChart from './AnalyticsSizedChart';
import { METRIC_OPTIONS } from './WorkoutAnalyticsControlsCard';
import { ANALYTICS_COLORS } from './analyticsChartColors';
import { useAnalyticsCartesianMargin } from './analyticsChartMargins';

const TOOLTIP_STYLE = { color: '#1a1a1a', fontWeight: 500 };

const WorkoutProgressionChart = ({
  dateRangeParams = {},
  workoutId = '',
  progressionType = 'avg_weight_reps',
  comparisonMetric = '',
  metricOffset = 0,
  title = null
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const cartesianMargin = useAnalyticsCartesianMargin();
  const metricLabel = comparisonMetric ? (METRIC_OPTIONS.find((m) => m.key === comparisonMetric)?.label || comparisonMetric) : '';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {
          ...dateRangeParams,
          progression_type: progressionType,
          metric_offset: metricOffset
        };
        if (workoutId) params.workout_id = workoutId;
        if (comparisonMetric) params.metrics = comparisonMetric;
        const res = await api.getWorkoutProgression(params);
        if (res.data?.success) setData(res.data.data.points || []);
        else setData([]);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workoutId, progressionType, comparisonMetric, metricOffset, dateRangeParams]);

  const hasMetric = Boolean(comparisonMetric && data.some((d) => d[comparisonMetric] != null));
  const chartMargin = {
    ...cartesianMargin,
    right: hasMetric ? 56 : 32,
  };

  const titleBlock = title ? <div className="workout-progression-chart-title">{title}</div> : null;
  const chartStyles = (
    <style>{`
      .workout-progression-chart-title {
        font-family: var(--font-primary);
        font-size: var(--text-lg);
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        margin-bottom: var(--space-4);
      }
    `}</style>
  );
  if (loading) {
    return (
      <div className="workout-progression-chart">
        {titleBlock}
        <div className="chart-loading">Loading...</div>
        {chartStyles}
      </div>
    );
  }
  if (!workoutId && !data.length) {
    return (
      <div className="workout-progression-chart">
        {titleBlock}
        <div className="chart-no-data">No workout data in range</div>
        {chartStyles}
      </div>
    );
  }
  if (workoutId && !data.length) {
    return (
      <div className="workout-progression-chart">
        {titleBlock}
        <div className="chart-no-data">No data for this workout in range</div>
        {chartStyles}
      </div>
    );
  }

  return (
    <div className="workout-progression-chart">
      {titleBlock}
      <AnalyticsSizedChart height={360} debounce={50} className="analytics-chart-body">
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" orientation="left" />
          {hasMetric && <YAxis yAxisId="right" orientation="right" />}
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="progression"
            stroke={ANALYTICS_COLORS.primary}
            strokeWidth={2}
            name="Progression"
            dot={{ r: 4 }}
          />
          {hasMetric && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={comparisonMetric}
              stroke={ANALYTICS_COLORS.accent}
              strokeWidth={2}
              name={metricLabel}
              dot={{ r: 3 }}
              connectNulls
            />
          )}
        </LineChart>
      </AnalyticsSizedChart>
      {chartStyles}
    </div>
  );
};

export default WorkoutProgressionChart;
