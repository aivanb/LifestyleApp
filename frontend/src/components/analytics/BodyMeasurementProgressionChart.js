import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const BodyMeasurementProgressionChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [measurementType, setMeasurementType] = useState('waist');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!dateFrom || !dateTo) return;
      
      setLoading(true);
      try {
        const response = await api.getBodyMeasurementProgression({
          measurement_type: measurementType,
          date_from: dateFrom,
          date_to: dateTo
        });
        
        if (response.data.success) {
          setData(response.data.data.points);
        }
      } catch (error) {
        console.error('Failed to load body measurement progression:', error);
      } finally {
        setLoading(false);
      }
    };

    // Set default dates
    if (!dateTo) {
      const today = new Date();
      setDateTo(today.toISOString().split('T')[0]);
    }
    if (!dateFrom) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      setDateFrom(threeMonthsAgo.toISOString().split('T')[0]);
    }

    loadData();
  }, [measurementType, dateFrom, dateTo]);

  const measurementOptions = [
    { value: 'upper_arm', label: 'Upper Arm' },
    { value: 'lower_arm', label: 'Lower Arm' },
    { value: 'waist', label: 'Waist' },
    { value: 'shoulder', label: 'Shoulder' },
    { value: 'leg', label: 'Leg' },
    { value: 'calf', label: 'Calf' }
  ];

  return (
    <div className="analytics-chart">
      <h3>Body Measurement Progression</h3>
      <div className="chart-controls">
        <select
          value={measurementType}
          onChange={(e) => setMeasurementType(e.target.value)}
          className="chart-select"
        >
          {measurementOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="chart-date-input"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="chart-date-input"
        />
      </div>
      
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
            <Line type="monotone" dataKey="value" stroke="#5AA6FF" strokeWidth={2} name="Measurement" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </div>
  );
};

export default BodyMeasurementProgressionChart;

