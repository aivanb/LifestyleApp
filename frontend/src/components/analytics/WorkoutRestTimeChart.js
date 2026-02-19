import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';

const WorkoutRestTimeChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workoutId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!dateFrom || !dateTo) return;
      
      setLoading(true);
      try {
        const params = { date_from: dateFrom, date_to: dateTo };
        if (workoutId) params.workout_id = workoutId;
        
        const response = await api.getWorkoutRestTimeAnalysis(params);
        if (response.data.success) {
          setData(response.data.data.points.map(p => ({ x: p.rest_time, y: p.weight_change })));
        }
      } catch (error) {
        console.error('Failed to load rest time analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!dateTo) {
      const today = new Date();
      setDateTo(today.toISOString().split('T')[0]);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      setDateFrom(threeMonthsAgo.toISOString().split('T')[0]);
    }

    loadData();
  }, [workoutId, dateFrom, dateTo]);

  const controls = (
    <>
      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="chart-date-input" />
      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="chart-date-input" />
    </>
  );

  return (
    <AnalyticsChartBase title="Rest Time vs Weight Change" controls={controls}>
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" name="Rest Time (seconds)" />
            <YAxis dataKey="y" name="Weight Change (lbs)" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter dataKey="y" fill="#5AA6FF" />
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default WorkoutRestTimeChart;

