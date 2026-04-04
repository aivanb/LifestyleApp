import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import AnalyticsSizedChart from './AnalyticsSizedChart';
import { useAnalyticsCartesianMargin } from './analyticsChartMargins';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { ANALYTICS_SERIES } from './analyticsChartColors';

/** Dark outline between stacked segments (Recharts bar paths). */
const macroStackStroke = (theme) => (theme === 'light' ? '#0f172a' : '#030406');

const MacroSplitChart = ({ dateRangeParams = {} }) => {
  const { theme } = useTheme();
  const margin = useAnalyticsCartesianMargin();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const barStroke = macroStackStroke(theme);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await api.getMacroSplit(dateRangeParams);
        if (response.data.success) {
          setData(response.data.data.points);
        }
      } catch (error) {
        console.error('Failed to load macro split:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dateRangeParams]);

  return (
    <AnalyticsChartBase title="Macro Split">
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <AnalyticsSizedChart height={300}>
          <BarChart data={data} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip contentStyle={{ color: '#1a1a1a', fontWeight: 500 }} />
            <Legend />
            <Bar
              dataKey="fat"
              fill={ANALYTICS_SERIES[1]}
              name="Fat (g)"
              stackId="macro"
              stroke={barStroke}
              strokeWidth={1.25}
            />
            <Bar
              dataKey="carbohydrates"
              fill={ANALYTICS_SERIES[2]}
              name="Carbs (g)"
              stackId="macro"
              stroke={barStroke}
              strokeWidth={1.25}
            />
            <Bar
              dataKey="protein"
              fill={ANALYTICS_SERIES[0]}
              name="Protein (g)"
              stackId="macro"
              stroke={barStroke}
              strokeWidth={1.25}
            />
          </BarChart>
        </AnalyticsSizedChart>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default MacroSplitChart;

