import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const WorkoutLog = ({ selectedDate, onDateChange }) => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [workoutStats, setWorkoutStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWorkoutLogs = useCallback(async () => {
    try {
      const response = await api.getWorkoutLogs({ 
        date_from: selectedDate, 
        date_to: selectedDate 
      });
      setWorkoutLogs(response.data.data || []);
    } catch (err) {
      console.error('Failed to load workout logs:', err);
      setError('Failed to load workout logs');
    }
  }, [selectedDate]);

  useEffect(() => {
    loadWorkoutLogs();
    loadWorkoutStats();
  }, [selectedDate, loadWorkoutLogs]);

  const loadWorkoutStats = async () => {
    try {
      const response = await api.getWorkoutStats();
      setWorkoutStats(response.data.data);
    } catch (err) {
      console.error('Failed to load workout stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="form-container">
      <h2 className="text-2xl font-bold mb-4">Workout Log</h2>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Date Selection */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <CalendarIcon className="h-5 w-5" />
          <label htmlFor="date" className="form-label">Date:</label>
        </div>
        <input
          type="date"
          id="date"
          className="form-input w-48"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {/* Workout Logs for Selected Date */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Workouts Logged on {selectedDate}</h3>
        {workoutLogs.length > 0 ? (
          <div className="space-y-3">
            {workoutLogs.map(log => (
              <div key={log.workout_log_id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{log.workout_name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {log.weight} lbs × {log.reps} reps
                      {log.rir && ` (RIR: ${log.rir})`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.date_time).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{log.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No workouts logged for this date.</p>
        )}
      </div>


      {/* Workout Stats */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Today's Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
            <ChartBarIcon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{workoutStats.total_sets || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Sets</div>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold">{workoutStats.total_weight_lifted || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Weight Lifted</div>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold">{workoutStats.total_reps || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Reps</div>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold">{workoutStats.total_rir || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total RIR</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutLog;
