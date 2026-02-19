import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';

const FoodFrequencyChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entryType, setEntryType] = useState('food_group');
  const [limit, setLimit] = useState(10);
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await api.getFoodFrequency({
          entry_type: entryType,
          limit: limit,
          order: order
        });
        if (response.data.success) {
          setData(response.data.data.items);
        }
      } catch (error) {
        console.error('Failed to load food frequency:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [entryType, limit, order]);

  const controls = (
    <>
      <select value={entryType} onChange={(e) => setEntryType(e.target.value)} className="chart-select">
        <option value="food_group">Food Group</option>
        <option value="brand">Brand</option>
      </select>
      <input type="number" value={limit} onChange={(e) => setLimit(parseInt(e.target.value))} className="chart-select" min="1" max="50" />
      <select value={order} onChange={(e) => setOrder(e.target.value)} className="chart-select">
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>
    </>
  );

  return (
    <AnalyticsChartBase title="Food Frequency" controls={controls}>
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#5AA6FF" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default FoodFrequencyChart;

