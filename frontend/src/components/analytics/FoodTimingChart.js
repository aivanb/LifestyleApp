import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import AnalyticsSizedChart from './AnalyticsSizedChart';
import { useAnalyticsCartesianMargin } from './analyticsChartMargins';
import api from '../../services/api';
import { ANALYTICS_COLORS } from './analyticsChartColors';

const FoodTimingChart = ({ dateRangeParams = {} }) => {
  const margin = useAnalyticsCartesianMargin();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadataType, setMetadataType] = useState('calories');

  const metadataOptions = [
    'calories', 'protein', 'fat', 'carbohydrates', 'fiber', 'sodium',
    'sugar', 'saturated_fat', 'trans_fat', 'calcium', 'iron', 'magnesium',
    'cholesterol', 'vitamin_a', 'vitamin_c', 'vitamin_d', 'caffeine'
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await api.getFoodTiming({
          ...dateRangeParams,
          metadata_type: metadataType
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
    loadData();
  }, [metadataType, dateRangeParams]);

  const controls = (
    <select value={metadataType} onChange={(e) => setMetadataType(e.target.value)} className="chart-select">
      {metadataOptions.map(opt => (
        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
      ))}
    </select>
  );

  return (
    <AnalyticsChartBase title="Food Timing" controls={controls}>
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : data.length > 0 ? (
        <AnalyticsSizedChart height={300}>
          <BarChart data={data} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip contentStyle={{ color: '#1a1a1a', fontWeight: 500 }} />
            <Legend />
            <Bar dataKey="value" fill={ANALYTICS_COLORS.primary} name={metadataType} />
          </BarChart>
        </AnalyticsSizedChart>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default FoodTimingChart;

