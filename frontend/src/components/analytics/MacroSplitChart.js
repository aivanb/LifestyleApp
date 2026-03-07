import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';
import { ANALYTICS_SERIES } from './analyticsChartColors';

const MacroSplitChart = ({ dateRangeParams = {} }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 24, right: 24, left: 24, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip contentStyle={{ color: '#1a1a1a', fontWeight: 500 }} />
            <Legend />
            <Bar dataKey="fat" fill={ANALYTICS_SERIES[1]} name="Fat (g)" stackId="macro" />
            <Bar dataKey="carbohydrates" fill={ANALYTICS_SERIES[2]} name="Carbs (g)" stackId="macro" />
            <Bar dataKey="protein" fill={ANALYTICS_SERIES[0]} name="Protein (g)" stackId="macro" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default MacroSplitChart;

