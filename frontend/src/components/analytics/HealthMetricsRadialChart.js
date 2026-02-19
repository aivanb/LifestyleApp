import React, { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';

const HealthMetricsRadialChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!dateFrom || !dateTo) return;
      setLoading(true);
      try {
        const response = await api.getHealthMetricsRadial({ date_from: dateFrom, date_to: dateTo });
        if (response.data.success) {
          const chartData = [
            { metric: 'Mood', value: response.data.data.mood },
            { metric: 'Morning Energy', value: response.data.data.morning_energy },
            { metric: 'Soreness', value: response.data.data.soreness },
            { metric: 'Illness', value: response.data.data.illness },
            { metric: 'Stress', value: response.data.data.stress }
          ];
          setData(chartData);
        }
      } catch (error) {
        console.error('Failed to load health metrics radial:', error);
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
    <AnalyticsChartBase title="Health Metrics Radial Chart" controls={controls}>
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={90} domain={[0, 10]} />
            <Radar name="Average" dataKey="value" stroke="#5AA6FF" fill="#5AA6FF" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default HealthMetricsRadialChart;

