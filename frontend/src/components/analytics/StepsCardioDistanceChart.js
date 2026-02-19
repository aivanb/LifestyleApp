import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';

const StepsCardioDistanceChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!dateFrom || !dateTo) return;
      setLoading(true);
      try {
        const response = await api.getStepsCardioDistance({ date_from: dateFrom, date_to: dateTo });
        if (response.data.success) {
          setData(response.data.data.points);
        }
      } catch (error) {
        console.error('Failed to load steps/cardio distance:', error);
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
    <AnalyticsChartBase title="Steps vs Cardio Distance" controls={controls}>
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="steps_distance_miles" stroke="#5AA6FF" strokeWidth={2} name="Steps Distance" />
            <Line type="monotone" dataKey="cardio_distance_miles" stroke="#4ADE80" strokeWidth={2} name="Cardio Distance" />
            <Line type="monotone" dataKey="difference_miles" stroke="#FACC15" strokeWidth={2} name="Difference" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default StepsCardioDistanceChart;

