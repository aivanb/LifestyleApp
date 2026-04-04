import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import AnalyticsSizedChart from './AnalyticsSizedChart';
import { useAnalyticsCartesianMargin } from './analyticsChartMargins';
import api from '../../services/api';
import { ANALYTICS_COLORS } from './analyticsChartColors';

const FoodMetadataProgressChart = ({ dateRangeParams = {} }) => {
  const margin = useAnalyticsCartesianMargin();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadataType, setMetadataType] = useState('calories');
  const [stats, setStats] = useState(null);

  const metadataOptions = [
    'calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sodium',
    'sugar', 'saturated_fat', 'trans_fat', 'calcium', 'iron', 'magnesium',
    'cholesterol', 'vitamin_a', 'vitamin_c', 'vitamin_d', 'caffeine'
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await api.getFoodMetadataProgress({
          ...dateRangeParams,
          metadata_type: metadataType
        });
        if (response.data.success) {
          setData(response.data.data.points.map(p => ({
            date: p.date,
            actual: p.actual,
            goal: p.goal,
            is_below: p.is_below_goal,
            is_above: p.is_above_goal
          })));
          setStats({
            average: response.data.data.average,
            ratio_within_8_percent: response.data.data.ratio_within_8_percent
          });
        }
      } catch (error) {
        console.error('Failed to load metadata progress:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [metadataType, dateRangeParams]);

  const controls = (
    <select value={metadataType} onChange={(e) => setMetadataType(e.target.value)} className="chart-select">
      {metadataOptions.map(opt => (
        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
      ))}
    </select>
  );

  return (
    <AnalyticsChartBase title="Metadata Progress vs Goal" controls={controls}>
      {stats && (
        <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Average: {stats.average.toFixed(2)} | Within 8%: {stats.ratio_within_8_percent.toFixed(1)}%
        </div>
      )}
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <AnalyticsSizedChart height={300}>
          <LineChart data={data} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip contentStyle={{ color: '#1a1a1a', fontWeight: 500 }} />
            <Legend />
            <Line type="monotone" dataKey="actual" stroke={ANALYTICS_COLORS.primary} strokeWidth={2} name="Actual" />
            <Line type="monotone" dataKey="goal" stroke={ANALYTICS_COLORS.accent} strokeWidth={2} name="Goal" />
          </LineChart>
        </AnalyticsSizedChart>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default FoodMetadataProgressChart;

