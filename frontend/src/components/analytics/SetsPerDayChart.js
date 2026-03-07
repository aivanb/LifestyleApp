import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';
import { ANALYTICS_COLORS } from './analyticsChartColors';

const TOOLTIP_STYLE = { color: '#1a1a1a', fontWeight: 500 };

const SetsPerDayChart = ({ dateRangeParams = {} }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getWorkoutSetsPerDay(dateRangeParams);
        if (res.data?.success) setData(res.data.data.points || []);
        else setData([]);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dateRangeParams]);

  if (loading) return <AnalyticsChartBase title="Sets per day"><div className="chart-loading">Loading...</div></AnalyticsChartBase>;
  if (!data.length) return <AnalyticsChartBase title="Sets per day"><div className="chart-no-data">No sets data in range</div></AnalyticsChartBase>;

  return (
    <AnalyticsChartBase title="Sets per day">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 24, right: 24, left: 24, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend />
          <Bar dataKey="total_sets" fill={ANALYTICS_COLORS.primary} name="Total sets" />
          <Bar dataKey="attribute_sets" fill={ANALYTICS_COLORS.tertiary} name="Attribute sets" />
        </BarChart>
      </ResponsiveContainer>
    </AnalyticsChartBase>
  );
};

export default SetsPerDayChart;
