import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';

const FoodTimingChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadataType, setMetadataType] = useState('calories');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const metadataOptions = [
    'calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sodium',
    'sugar', 'saturated_fat', 'trans_fat', 'calcium', 'iron', 'magnesium',
    'cholesterol', 'vitamin_a', 'vitamin_c', 'vitamin_d', 'caffeine'
  ];

  useEffect(() => {
    const loadData = async () => {
      if (!dateFrom || !dateTo) return;
      setLoading(true);
      try {
        const response = await api.getFoodTiming({
          metadata_type: metadataType,
          date_from: dateFrom,
          date_to: dateTo
        });
        if (response.data.success) {
          setData(response.data.data.heatmap.map(h => ({ hour: h.hour, value: h.value })));
        }
      } catch (error) {
        console.error('Failed to load food timing:', error);
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
  }, [metadataType, dateFrom, dateTo]);

  const controls = (
    <>
      <select value={metadataType} onChange={(e) => setMetadataType(e.target.value)} className="chart-select">
        {metadataOptions.map(opt => (
          <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
        ))}
      </select>
      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="chart-date-input" />
      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="chart-date-input" />
    </>
  );

  return (
    <AnalyticsChartBase title="Food Timing Heatmap" controls={controls}>
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#5AA6FF" name={metadataType} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default FoodTimingChart;

