import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';

const WeightProgressionChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeMetrics, setIncludeMetrics] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!dateFrom || !dateTo) return;
      setLoading(true);
      try {
        const response = await api.getWeightProgression({
          date_from: dateFrom,
          date_to: dateTo,
          include_metrics: includeMetrics
        });
        if (response.data.success) {
          setData(response.data.data.points);
        }
      } catch (error) {
        console.error('Failed to load weight progression:', error);
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
  }, [dateFrom, dateTo, includeMetrics]);

  const controls = (
    <>
      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="chart-date-input" />
      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="chart-date-input" />
      <label>
        <input
          type="checkbox"
          checked={includeMetrics}
          onChange={(e) => setIncludeMetrics(e.target.checked)}
        />
        Include Metrics
      </label>
    </>
  );

  return (
    <AnalyticsChartBase title="Weight Progression" controls={controls}>
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
            <Line type="monotone" dataKey="weight" stroke="#5AA6FF" strokeWidth={2} name="Weight" />
            <Line type="monotone" dataKey="goal_weight" stroke="#4ADE80" strokeWidth={2} strokeDasharray="5 5" name="Goal Weight" />
            {includeMetrics && data.some(d => d.calories) && (
              <Line type="monotone" dataKey="calories" stroke="#FACC15" strokeWidth={2} name="Calories" />
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default WeightProgressionChart;

