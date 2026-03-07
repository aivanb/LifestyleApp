/**
 * Card at top of Workout Analytics holding all user inputs:
 * date range, workout selection (sorted A–Z), progression type, comparison metric (single), Offset checkbox.
 * No labels for metric controls; increased space between controls.
 */
import React, { useState, useEffect, useMemo } from 'react';
import DateRangeSelector from './DateRangeSelector';
import api from '../../services/api';

const PROGRESSION_OPTIONS = [
  { value: 'avg_weight_reps', label: 'Epley 1RM' },
  { value: 'avg_weight_sets', label: 'Avg Weight × Total Sets' },
  { value: 'avg_weight', label: 'Average Weight' },
  { value: 'max_weight', label: 'Maximum Weight' }
];

const METRIC_OPTIONS = [
  { key: 'cardio__calories_burned', label: 'Cardio: Calories burned' },
  { key: 'cardio__duration', label: 'Cardio: Duration' },
  { key: 'food__total_calories', label: 'Food: Total calories' },
  { key: 'food__total_carbohydrates', label: 'Food: Total carbs' },
  { key: 'food__total_sugar', label: 'Food: Total sugar' },
  { key: 'food__total_fat', label: 'Food: Total fat' },
  { key: 'food__total_protein', label: 'Food: Total protein' },
  { key: 'food__total_sodium', label: 'Food: Total sodium' },
  { key: 'health__morning_energy', label: 'Health: Morning energy' },
  { key: 'health__stress_level', label: 'Health: Stress level' },
  { key: 'health__mood', label: 'Health: Mood' },
  { key: 'health__soreness', label: 'Health: Soreness' },
  { key: 'health__illness_level', label: 'Health: Illness level' },
  { key: 'sleep__total_sleep_time', label: 'Sleep: Total sleep time' },
  { key: 'sleep__time_in_light_sleep', label: 'Sleep: Light sleep' },
  { key: 'sleep__time_in_deep_sleep', label: 'Sleep: Deep sleep' },
  { key: 'sleep__time_in_rem_sleep', label: 'Sleep: REM sleep' },
  { key: 'steps__total_steps', label: 'Steps: Total steps' },
  { key: 'weight__weight', label: 'Weight: Weight' },
  { key: 'water__total_water', label: 'Water: Total water' },
  { key: 'workout_log__avg_rest_time', label: 'Workout: Avg rest time' },
  { key: 'workout_log__total_sets', label: 'Workout: Total sets' }
];

const WorkoutAnalyticsControlsCard = ({
  workoutRange,
  setWorkoutRange,
  workoutCustomFrom,
  setWorkoutCustomFrom,
  workoutCustomTo,
  setWorkoutCustomTo,
  workoutId,
  setWorkoutId,
  onWorkoutSelect,
  workoutSearch,
  setWorkoutSearch,
  progressionType,
  setProgressionType,
  comparisonMetric,
  setComparisonMetric,
  metricOffset,
  setMetricOffset
}) => {
  const [workouts, setWorkouts] = useState([]);

  const sortedWorkouts = useMemo(() => {
    return [...workouts].sort((a, b) => (a.workout_name || '').localeCompare(b.workout_name || ''));
  }, [workouts]);

  const filteredWorkouts = useMemo(() => {
    if (!workoutSearch.trim()) return sortedWorkouts;
    const q = workoutSearch.trim().toLowerCase();
    return sortedWorkouts.filter((w) => w.workout_name?.toLowerCase().includes(q));
  }, [sortedWorkouts, workoutSearch]);

  useEffect(() => {
    let mounted = true;
    api.getWorkouts().then((res) => {
      if (mounted && res.data?.success) setWorkouts(res.data.data || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleWorkoutChange = (e) => {
    const id = e.target.value;
    setWorkoutId(id);
    const w = filteredWorkouts.find((x) => String(x.workouts_id) === String(id));
    onWorkoutSelect?.(id, w?.workout_name ?? '');
  };

  return (
    <div className="workout-controls-card">
      <div className="workout-controls-top">
        <div className="workout-controls-row">
          <input
            type="text"
            placeholder="Search workouts..."
            value={workoutSearch}
            onChange={(e) => setWorkoutSearch(e.target.value)}
            className="chart-select workout-search"
            aria-label="Search workout"
          />
          <select
            value={workoutId}
            onChange={handleWorkoutChange}
            className="chart-select"
            aria-label="Workout"
          >
            <option value="">All workouts</option>
            {filteredWorkouts.map((w) => (
              <option key={w.workouts_id} value={w.workouts_id}>{w.workout_name}</option>
            ))}
          </select>
        <select
          value={progressionType}
          onChange={(e) => setProgressionType(e.target.value)}
          className="chart-select"
          aria-label="Progression type"
        >
          {PROGRESSION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={comparisonMetric}
          onChange={(e) => setComparisonMetric(e.target.value)}
          className="chart-select"
          aria-label="Comparison metric"
        >
          <option value="">None</option>
          {METRIC_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
        <label className="offset-checkbox-wrap">
          <input
            type="checkbox"
            checked={metricOffset === 1}
            onChange={(e) => setMetricOffset(e.target.checked ? 1 : 0)}
            className="offset-checkbox"
          />
          <span>Offset</span>
        </label>
        </div>
        <div className="workout-controls-date-wrap">
          <DateRangeSelector
            section="workouts"
            value={workoutRange}
            onChange={setWorkoutRange}
            dateFrom={workoutCustomFrom}
            dateTo={workoutCustomTo}
            onCustomDatesChange={(from, to) => {
              setWorkoutCustomFrom(from);
              setWorkoutCustomTo(to);
            }}
          />
        </div>
      </div>
      <style>{`
        .workout-controls-card {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          box-shadow: var(--shadow-lg);
          margin-bottom: var(--space-6);
        }
        .workout-controls-top {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-4);
        }
        .workout-controls-date-wrap {
          margin-left: auto;
          margin-bottom: 0;
        }
        .workout-controls-date-wrap .analytics-date-range-selector {
          margin-bottom: 0;
        }
        .workout-controls-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-4);
          align-items: center;
        }
        .workout-controls-row .chart-select,
        .workout-search {
          padding: var(--space-2) var(--space-3);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: var(--text-sm);
        }
        .workout-search { max-width: 200px; }
        .offset-checkbox-wrap {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          user-select: none;
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }
        .offset-checkbox {
          width: 1.1rem;
          height: 1.1rem;
          accent-color: var(--accent-primary);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default WorkoutAnalyticsControlsCard;
export { PROGRESSION_OPTIONS, METRIC_OPTIONS };
