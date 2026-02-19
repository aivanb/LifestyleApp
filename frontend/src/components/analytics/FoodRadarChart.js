import React, { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';

const FoodRadarChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!dateFrom || !dateTo) return;
      setLoading(true);
      try {
        const response = await api.getFoodRadarChart({ date_from: dateFrom, date_to: dateTo });
        if (response.data.success) {
          const actual = response.data.data.actual;
          const goal = response.data.data.goal;
          
          // Transform to radar chart format
          const chartData = Object.keys(actual).map(key => ({
            metric: key,
            actual: actual[key],
            goal: goal[key] || 0
          }));
          setData(chartData);
        }
      } catch (error) {
        console.error('Failed to load radar chart:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!dateTo) {
      const today = new Date();
      setDateTo(today.toISOString().split('T')[0]);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      setDateFrom(oneMonthAgo.toISOString().split('T')[0]);
    }

    loadData();
  }, [dateFrom, dateTo]);

  const controls = (
    <>
      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="chart-date-input" />
      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="chart-date-input" />
    </>
  );

  return (
    <AnalyticsChartBase title="Goal vs Actual Radar Chart" controls={controls}>
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis />
            <Radar name="Actual" dataKey="actual" stroke="#5AA6FF" fill="#5AA6FF" fillOpacity={0.6} />
            <Radar name="Goal" dataKey="goal" stroke="#4ADE80" fill="#4ADE80" fillOpacity={0.6} />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default FoodRadarChart;

