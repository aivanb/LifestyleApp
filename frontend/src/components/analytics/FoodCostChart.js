import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import AnalyticsSizedChart from './AnalyticsSizedChart';
import { useAnalyticsCartesianMargin } from './analyticsChartMargins';
import api from '../../services/api';

const FoodCostChart = ({ dateRangeParams = {} }) => {
  const margin = useAnalyticsCartesianMargin();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisType, setAnalysisType] = useState('average');
  const [period, setPeriod] = useState('day');
  const [metadataType, setMetadataType] = useState('calories');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params = {
          ...dateRangeParams,
          analysis_type: analysisType,
          period: period
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
    loadData();
  }, [analysisType, period, metadataType, dateRangeParams]);

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
    </>
  );

  return (
    <AnalyticsChartBase title="Food Cost Analytics" controls={controls}>
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <AnalyticsSizedChart height={300}>
          {analysisType === 'brand_density' ? (
            <BarChart data={data} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="brand" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_cost" fill="#5AA6FF" name="Total Cost" />
              <Bar dataKey="calorie_density" fill="#4ADE80" name="Calorie Density" />
            </BarChart>
          ) : (
            <LineChart data={data} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={analysisType === 'cost_vs_metadata' ? 'date' : 'period'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={analysisType === 'cost_vs_metadata' ? 'cost' : 'cost'} stroke="#5AA6FF" strokeWidth={2} name="Cost" />
            </LineChart>
          )}
        </AnalyticsSizedChart>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default FoodCostChart;

