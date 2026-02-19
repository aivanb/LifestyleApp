import React, { useState, useEffect } from 'react';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';

const WorkoutTrackingHeatmap = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!dateTo) return;
      setLoading(true);
      try {
        const response = await api.getWorkoutTrackingHeatmap({ date_to: dateTo });
        if (response.data.success) {
          setData(response.data.data.heatmap);
        }
      } catch (error) {
        console.error('Failed to load workout tracking heatmap:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!dateTo) {
      const today = new Date();
      setDateTo(today.toISOString().split('T')[0]);
    }

    loadData();
  }, [dateTo]);

  const controls = (
    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="chart-date-input" />
  );

  // Simple heatmap visualization (can be enhanced with a proper calendar component)
  const dates = Object.keys(data).sort();
  const maxWorkouts = Math.max(...Object.values(data), 1);

  return (
    <AnalyticsChartBase title="Workout Tracking Heatmap (Past Year)" controls={controls}>
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : dates.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(52, 1fr)', gap: '2px', fontSize: '10px' }}>
          {dates.slice(-365).map(date => {
            const intensity = data[date] / maxWorkouts;
            return (
              <div
                key={date}
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: `rgba(90, 166, 255, ${intensity})`,
                  borderRadius: '2px'
                }}
                title={`${date}: ${data[date]} workouts`}
              />
            );
          })}
        </div>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </AnalyticsChartBase>
  );
};

export default WorkoutTrackingHeatmap;

