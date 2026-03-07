import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';
import { ANALYTICS_COLORS } from './analyticsChartColors';

const TOOLTIP_STYLE = { color: '#1a1a1a', fontWeight: 500 };

const ActivationProgressChart = ({ dateRangeParams = {} }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await api.getActivationProgress(dateRangeParams);
        if (response.data.success) setData(response.data.data.points || []);
        else setData([]);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dateRangeParams]);

  if (loading) return <AnalyticsChartBase title="Activation Progress vs Expected"><div className="chart-loading">Loading...</div></AnalyticsChartBase>;
  if (!data.length) return <AnalyticsChartBase title="Activation Progress vs Expected"><div className="chart-no-data">No data available</div></AnalyticsChartBase>;

  return (
    <AnalyticsChartBase title="Activation Progress vs Expected">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 24, right: 24, left: 24, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend />
          <Area type="monotone" dataKey="total_expected" fill={ANALYTICS_COLORS.tertiary} fillOpacity={0.4} stroke={ANALYTICS_COLORS.tertiary} name="Expected" />
          <Line type="monotone" dataKey="total_actual" stroke={ANALYTICS_COLORS.primary} strokeWidth={2} name="Actual" dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </AnalyticsChartBase>
  );
};

export default ActivationProgressChart;
