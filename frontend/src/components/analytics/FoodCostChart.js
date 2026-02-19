import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';

const FoodCostChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisType, setAnalysisType] = useState('average');
  const [period, setPeriod] = useState('day');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [metadataType, setMetadataType] = useState('calories');

  useEffect(() => {
    const loadData = async () => {
      if (!dateFrom || !dateTo) return;
      setLoading(true);
      try {
        const params = {
          analysis_type: analysisType,
          period: period,
          date_from: dateFrom,
          date_to: dateTo
        };
        if (analysisType === 'cost_vs_metadata') {
          params.metadata_type = metadataType;
        }
        
        const response = await api.getFoodCost(params);
        if (response.data.success) {
          if (analysisType === 'average') {
            setData([{ period: period, cost: response.data.data.average_cost }]);
          } else if (analysisType === 'brand_density') {
            setData(response.data.data.brands || []);
          } else {
            setData(response.data.data.points || []);
          }
        }
      } catch (error) {
        console.error('Failed to load food cost:', error);
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
  }, [analysisType, period, dateFrom, dateTo, metadataType]);

  const controls = (
    <>
      <select value={analysisType} onChange={(e) => setAnalysisType(e.target.value)} className="chart-select">
        <option value="average">Average Cost</option>
        <option value="brand_density">Brand Density</option>
        <option value="cost_vs_metadata">Cost vs Metadata</option>
      </select>
      {analysisType === 'average' && (
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="chart-select">
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      )}
      {analysisType === 'cost_vs_metadata' && (
        <select value={metadataType} onChange={(e) => setMetadataType(e.target.value)} className="chart-select">
          <option value="calories">Calories</option>
          <option value="protein">Protein</option>
        </select>
      )}
      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="chart-date-input" />
      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="chart-date-input" />
    </>
  );

  return (
    <AnalyticsChartBase title="Food Cost Analytics" controls={controls}>
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          {analysisType === 'brand_density' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="brand" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_cost" fill="#5AA6FF" name="Total Cost" />
              <Bar dataKey="calorie_density" fill="#4ADE80" name="Calorie Density" />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={analysisType === 'cost_vs_metadata' ? 'date' : 'period'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={analysisType === 'cost_vs_metadata' ? 'cost' : 'cost'} stroke="#5AA6FF" strokeWidth={2} name="Cost" />
            </LineChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default FoodCostChart;

