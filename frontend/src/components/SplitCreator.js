import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { PlusIcon, TrashIcon, InformationCircleIcon, PlayIcon } from '@heroicons/react/24/outline';

const SplitCreator = ({ onSplitCreated, onSplitUpdated }) => {
  const [splits, setSplits] = useState([]);
  const [muscles, setMuscles] = useState([]);
  const [musclePriorities, setMusclePriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [analysis, setAnalysis] = useState({});

  // Form state
  const [splitName, setSplitName] = useState('');
  const [splitDays, setSplitDays] = useState([]);
  const [newDayName, setNewDayName] = useState('');
  const [editingSplit, setEditingSplit] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const calculateAnalysis = useCallback(() => {
    if (splitDays.length === 0 || musclePriorities.length === 0) {
      setAnalysis({});
      return;
    }

    const analysis = {};
    const numDays = splitDays.length;

    musclePriorities.forEach(muscleLog => {
      const priority = muscleLog.importance;
      const muscleId = muscleLog.muscle_name;
      
      // Calculate total activation across all days
      let totalActivation = 0;
      splitDays.forEach(day => {
        const target = day.targets?.find(t => t.muscle === muscleId);
        if (target) {
          totalActivation += target.target_activation;
        }
      });

      // Calculate optimal range
      const lowerEnd = 90 * (10 + 0.1 * priority) * 7 / numDays;
      const upperEnd = 90 * (20 + 0.1 * priority) * 7 / numDays;

      analysis[muscleId] = {
        totalActivation,
        optimalRange: { lower: lowerEnd, upper: upperEnd },
        priority,
        muscleName: muscleLog.muscle_name,
        muscleGroup: muscleLog.muscle_group
      };
    });

    setAnalysis(analysis);
  }, [splitDays, musclePriorities]);

  useEffect(() => {
    calculateAnalysis();
  }, [calculateAnalysis]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [splitsRes, musclesRes, prioritiesRes] = await Promise.all([
        api.getSplits(),
        api.getMuscles(),
        api.getMusclePriorities()
      ]);

      setSplits(splitsRes.data.data || []);
      setMuscles(musclesRes.data.data || []);
      setMusclePriorities(prioritiesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addDay = () => {
    if (!newDayName.trim()) return;

    const newDay = {
      day_name: newDayName.trim(),
      day_order: splitDays.length + 1,
      targets: []
    };

    setSplitDays([...splitDays, newDay]);
    setNewDayName('');
  };

  const removeDay = (index) => {
    const updatedDays = splitDays.filter((_, i) => i !== index);
    // Reorder days
    updatedDays.forEach((day, i) => {
      day.day_order = i + 1;
    });
    setSplitDays(updatedDays);
  };

  const addTargetToDay = (dayIndex, muscleId, activation) => {
    const updatedDays = [...splitDays];
    const day = updatedDays[dayIndex];
    
    // Remove existing target for this muscle
    day.targets = day.targets.filter(t => t.muscle !== muscleId);
    
    // Add new target
    day.targets.push({
      muscle: muscleId,
      target_activation: activation
    });

    setSplitDays(updatedDays);
  };

  const removeTargetFromDay = (dayIndex, muscleId) => {
    const updatedDays = [...splitDays];
    updatedDays[dayIndex].targets = updatedDays[dayIndex].targets.filter(t => t.muscle !== muscleId);
    setSplitDays(updatedDays);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!splitName.trim()) {
      setError('Split name is required');
      return;
    }

    if (splitDays.length === 0) {
      setError('At least one day is required');
      return;
    }

    const splitData = {
      split_name: splitName.trim(),
      split_days: splitDays.map(day => ({
        day_name: day.day_name,
        day_order: day.day_order,
        targets: day.targets.map(target => ({
          muscle: target.muscle,
          target_activation: target.target_activation
        }))
      }))
    };

    try {
      if (editingSplit) {
        await api.updateSplit(editingSplit.splits_id, splitData);
        setSuccess('Split updated successfully!');
        if (onSplitUpdated) onSplitUpdated();
      } else {
        await api.createSplit(splitData);
        setSuccess('Split created successfully!');
        setSplitName('');
        setSplitDays([]);
        if (onSplitCreated) onSplitCreated();
      }
      await loadData();
    } catch (err) {
      console.error('Error saving split:', err);
      setError('Failed to save split');
    }
  };

  const handleEdit = (split) => {
    setEditingSplit(split);
    setSplitName(split.split_name);
    setSplitDays(split.split_days || []);
  };

  const handleCancel = () => {
    setEditingSplit(null);
    setSplitName('');
    setSplitDays([]);
    setError('');
    setSuccess('');
  };

  const activateSplit = async (splitId) => {
    try {
      const startDate = new Date().toISOString().split('T')[0];
      await api.activateSplit(splitId, startDate);
      setSuccess('Split activated successfully!');
      await loadData();
    } catch (err) {
      console.error('Error activating split:', err);
      setError('Failed to activate split');
    }
  };

  const getMuscleStatus = (muscleId) => {
    const data = analysis[muscleId];
    if (!data) return 'no-data';

    const { totalActivation, optimalRange } = data;
    
    if (totalActivation === 0) return 'warning';
    if (totalActivation < optimalRange.lower) return 'below';
    if (totalActivation <= optimalRange.upper * 1.15) return 'optimal';
    return 'above';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'warning': return 'text-red-500';
      case 'below': return 'text-gray-500';
      case 'optimal': return 'text-green-500';
      case 'above': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="form-container">
      <h2 className="text-2xl font-bold mb-4">Split Creator</h2>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      {/* Existing Splits */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Your Splits</h3>
        <div className="space-y-2">
          {splits.map(split => (
            <div key={split.splits_id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
              <div>
                <span className="font-medium">{split.split_name}</span>
                {split.is_active && <span className="ml-2 text-green-500 text-sm">(Active)</span>}
                <span className="ml-2 text-gray-500 text-sm">
                  {split.split_days?.length || 0} days
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(split)}
                  className="btn btn-secondary text-sm"
                >
                  Edit
                </button>
                {!split.is_active && (
                  <button
                    onClick={() => activateSplit(split.splits_id)}
                    className="btn btn-primary text-sm flex items-center"
                  >
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Split Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-section">
          <label htmlFor="splitName" className="form-label">Split Name:</label>
          <input
            type="text"
            id="splitName"
            className="form-input"
            value={splitName}
            onChange={(e) => setSplitName(e.target.value)}
            placeholder="e.g., Push/Pull/Legs"
            required
          />
        </div>

        {/* Add Day */}
        <div className="form-section">
          <h3 className="text-lg font-semibold mb-2">Split Days</h3>
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="text"
              className="form-input flex-grow"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              placeholder="Day name (e.g., Push Day)"
            />
            <button type="button" onClick={addDay} className="btn btn-primary p-2">
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Days List */}
          <div className="space-y-4">
            {splitDays.map((day, dayIndex) => (
              <div key={dayIndex} className="border border-gray-300 dark:border-gray-600 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{day.day_name}</h4>
                  <button
                    type="button"
                    onClick={() => removeDay(dayIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Add Target */}
                <div className="mb-3">
                  <select
                    className="form-select w-full mb-2"
                    onChange={(e) => {
                      if (e.target.value) {
                        const muscleId = parseInt(e.target.value);
                        addTargetToDay(dayIndex, muscleId, 225); // Default ~3 sets
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Add muscle target</option>
                    {muscles.map(muscle => (
                      <option key={muscle.muscles_id} value={muscle.muscles_id}>
                        {muscle.muscle_name} ({muscle.muscle_group})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Targets List */}
                <div className="space-y-2">
                  {day.targets.map((target, targetIndex) => {
                    const muscle = muscles.find(m => m.muscles_id === target.muscle);
                    return (
                      <div key={targetIndex} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        <span className="text-sm">
                          {muscle?.muscle_name} ({muscle?.muscle_group})
                        </span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            className="form-input w-20 text-sm"
                            value={target.target_activation}
                            onChange={(e) => {
                              const updatedDays = [...splitDays];
                              updatedDays[dayIndex].targets[targetIndex].target_activation = parseInt(e.target.value);
                              setSplitDays(updatedDays);
                            }}
                            min="0"
                            max="1000"
                          />
                          <span className="text-xs text-gray-500">activation</span>
                          <button
                            type="button"
                            onClick={() => removeTargetFromDay(dayIndex, target.muscle)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis */}
        {Object.keys(analysis).length > 0 && (
          <div className="form-section">
            <h3 className="text-lg font-semibold mb-2">Muscle Analysis</h3>
            <div className="mb-2">
              <InformationCircleIcon className="h-5 w-5 text-gray-400 inline mr-1" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Target activation ratings outline the volume for each muscle. ~225-275 activation ≈ 3 sets. 
                Optimal per week: 10-20 sets per muscle (~2250-5550 total activation).
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(analysis).map(([muscleId, data]) => {
                const status = getMuscleStatus(parseInt(muscleId));
                return (
                  <div key={muscleId} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    <span className="text-sm">
                      {data.muscleName} ({data.muscleGroup})
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${getStatusColor(status)}`}>
                        {data.totalActivation} / {Math.round(data.optimalRange.lower)}-{Math.round(data.optimalRange.upper)}
                      </span>
                      <span className={`text-xs ${getStatusColor(status)}`}>
                        {status === 'warning' && 'No activation'}
                        {status === 'below' && 'Below optimal'}
                        {status === 'optimal' && 'Within optimal'}
                        {status === 'above' && 'Above optimal'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button type="submit" className="btn btn-primary">
            {editingSplit ? 'Update Split' : 'Create Split'}
          </button>
          {editingSplit && (
            <button type="button" onClick={handleCancel} className="btn btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SplitCreator;
