import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const WorkoutProgressionChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workoutId, setWorkoutId] = useState('');
  const [workouts, setWorkouts] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeMetrics, setIncludeMetrics] = useState(false);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const response = await api.getWorkouts();
        if (response.data.success) {
          setWorkouts(response.data.data);
        }
      } catch (error) {
        console.error('Failed to load workouts:', error);
      }
    };
    loadWorkouts();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!dateFrom || !dateTo) return;
      
      setLoading(true);
      try {
        const params = {
          date_from: dateFrom,
          date_to: dateTo,
          include_metrics: includeMetrics
        };
        if (workoutId) params.workout_id = workoutId;
        
        const response = await api.getWorkoutProgression(params);
        
        if (response.data.success) {
          setData(response.data.data.points);
        }
      } catch (error) {
        console.error('Failed to load workout progression:', error);
      } finally {
        setLoading(false);
      }
    };

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
  }, [workoutId, dateFrom, dateTo, includeMetrics]);

  return (
    <div className="analytics-chart">
      <h3>Workout Progression</h3>
      <div className="chart-controls">
        <select
          value={workoutId}
          onChange={(e) => setWorkoutId(e.target.value)}
          className="chart-select"
        >
          <option value="">All Workouts</option>
          {workouts.map(workout => (
            <option key={workout.workouts_id} value={workout.workouts_id}>{workout.workout_name}</option>
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
        <label>
          <input
            type="checkbox"
            checked={includeMetrics}
            onChange={(e) => setIncludeMetrics(e.target.checked)}
          />
          Include Metrics
        </label>
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
            <Line type="monotone" dataKey="progression" stroke="#5AA6FF" strokeWidth={2} name="Progression" />
            {includeMetrics && (
              <>
                {data.some(d => d.weight) && <Line type="monotone" dataKey="weight" stroke="#4ADE80" strokeWidth={2} name="Weight" />}
                {data.some(d => d.calories_before_workout) && <Line type="monotone" dataKey="calories_before_workout" stroke="#FACC15" strokeWidth={2} name="Calories Before" />}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-no-data">No data available</div>
      )}
    </div>
  );
};

export default WorkoutProgressionChart;

