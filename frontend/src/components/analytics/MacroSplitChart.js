import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';

const MacroSplitChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!dateFrom || !dateTo) return;
      setLoading(true);
      try {
        const response = await api.getMacroSplit({ date_from: dateFrom, date_to: dateTo });
        if (response.data.success) {
          setData(response.data.data.points);
        }
      } catch (error) {
        console.error('Failed to load macro split:', error);
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
    <AnalyticsChartBase title="Macro Split" controls={controls}>
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="protein_percentage" stackId="1" stroke="#5AA6FF" fill="#5AA6FF" name="Protein %" />
            <Area type="monotone" dataKey="fat_percentage" stackId="1" stroke="#4ADE80" fill="#4ADE80" name="Fat %" />
            <Area type="monotone" dataKey="carbohydrates_percentage" stackId="1" stroke="#FACC15" fill="#FACC15" name="Carbs %" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default MacroSplitChart;

