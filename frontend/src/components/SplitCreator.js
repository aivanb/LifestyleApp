import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { PlusIcon, XMarkIcon, InformationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

const SplitCreator = ({ onSplitCreated }) => {
  const [muscles, setMuscles] = useState([]);
  const [musclePriorities, setMusclePriorities] = useState([]);
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [analysis, setAnalysis] = useState({});
  
  // UI State
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'edit'
  const [selectedSplit, setSelectedSplit] = useState(null);
  
  const [formData, setFormData] = useState({
    split_name: '',
    start_date: '',
    split_days: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [musclesResponse, prioritiesResponse, splitsResponse] = await Promise.all([
        api.getMuscles(),
        api.getMusclePriorities(),
        api.getSplits()
      ]);
      
      if (musclesResponse.data.success) {
        setMuscles(musclesResponse.data.data);
      }
      
      if (prioritiesResponse.data.success) {
        setMusclePriorities(prioritiesResponse.data.data);
      }

      if (splitsResponse.data.success) {
        setSplits(splitsResponse.data.data);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalysis = useCallback(() => {
    if (formData.split_days.length === 0 || musclePriorities.length === 0) {
      setAnalysis({});
      return;
    }

    const analysisData = {};
    const numDays = formData.split_days.length;

    musclePriorities.forEach(muscleLog => {
      const priority = muscleLog.priority;
      const muscleId = muscleLog.muscle_id;
      
      // Calculate total activation across all days
      let totalActivation = 0;
      formData.split_days.forEach(day => {
        const target = day.targets?.find(t => t.muscle === muscleId);
        if (target) {
          totalActivation += target.target_activation;
        }
      });

      // Calculate optimal range using the correct formulas
      // Lower: R(P,D) = 90⋅(10+0.1P)⋅7/D
      // Upper: R(P,D) = 90⋅(20+0.1P)⋅7⋅D
      const lowerEnd = 90 * (10 + 0.1 * priority) * 7 / numDays;
      const upperEnd = 90 * (20 + 0.1 * priority) * 7 * numDays;

      analysisData[muscleId] = {
        totalActivation,
        optimalActivation: lowerEnd, // Use lower bound as optimal for autofill
        optimalRange: { lower: lowerEnd, upper: upperEnd },
        priority,
        muscleName: muscleLog.muscle_name,
        muscleGroup: muscleLog.muscle_group,
        totalSets: Math.round(totalActivation / 85),
        optimalSets: Math.round(lowerEnd / 85)
      };
    });

    setAnalysis(analysisData);
  }, [formData.split_days, musclePriorities]);

  useEffect(() => {
    calculateAnalysis();
  }, [calculateAnalysis]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSplitDay = () => {
    setFormData(prev => ({
      ...prev,
      split_days: [...prev.split_days, {
        day_name: '',
        day_order: prev.split_days.length + 1,
        targets: []
      }]
    }));
  };

  const removeSplitDay = (index) => {
    setFormData(prev => ({
      ...prev,
      split_days: prev.split_days.filter((_, i) => i !== index).map((day, i) => ({
        ...day,
        day_order: i + 1
      }))
    }));
  };

  const addTarget = (dayIndex) => {
    setFormData(prev => ({
      ...prev,
      split_days: prev.split_days.map((day, i) => 
        i === dayIndex 
          ? { ...day, targets: [...day.targets, { muscle: '', target_activation: 225 }] }
          : day
      )
    }));
  };

  const getOptimalActivation = (muscleId) => {
    if (!musclePriorities.length || !formData.split_days.length) return 225;
    
    const muscleLog = musclePriorities.find(ml => ml.muscle_id === muscleId);
    if (!muscleLog) return 225;
    
    const priority = muscleLog.priority;
    const numDays = formData.split_days.length;
    // Lower bound: R(P,D) = 90⋅(10+0.1P)⋅7/D
    const lowerActivation = 90 * (10 + 0.1 * priority) * 7 / numDays;
    return Math.round(lowerActivation);
  };

  const loadSplitForEditing = (split) => {
    setSelectedSplit(split);
    setFormData({
      split_name: split.split_name,
      start_date: split.start_date || '',
      split_days: split.split_days || []
    });
    setActiveTab('edit');
  };

  const removeTarget = (dayIndex, targetIndex) => {
    setFormData(prev => ({
      ...prev,
      split_days: prev.split_days.map((day, i) => 
        i === dayIndex 
          ? { ...day, targets: day.targets.filter((_, j) => j !== targetIndex) }
          : day
      )
    }));
  };

  const updateDayName = (dayIndex, value) => {
    setFormData(prev => ({
      ...prev,
      split_days: prev.split_days.map((day, i) => 
        i === dayIndex ? { ...day, day_name: value } : day
      )
    }));
  };

  const updateTarget = (dayIndex, targetIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      split_days: prev.split_days.map((day, i) => 
        i === dayIndex 
          ? { 
              ...day, 
              targets: day.targets.map((target, j) => 
                j === targetIndex ? { ...target, [field]: value } : target
              )
            }
          : day
      )
    }));
  };

  const getMuscleStatus = (muscleId) => {
    const muscleAnalysis = analysis[muscleId];
    if (!muscleAnalysis) return { status: 'warning', color: '#E74C3C', label: 'No activation' };
    
    const { totalActivation, optimalRange } = muscleAnalysis;
    
    if (totalActivation === 0) {
      return { status: 'warning', color: '#E74C3C', label: 'No activation' };
    } else if (totalActivation < optimalRange.lower) {
      return { status: 'below', color: '#95A5A6', label: 'Below optimal' };
    } else if (totalActivation <= optimalRange.upper * 1.15) {
      return { status: 'optimal', color: '#27AE60', label: 'Within optimal' };
    } else {
      return { status: 'above', color: '#E74C3C', label: 'Above optimal' };
    }
  };

  const handleSplitActivation = async (splitId, startDate) => {
    try {
      await api.activateSplit(splitId, startDate);
      setSuccess('Split activated successfully!');
      loadData(); // Reload splits to get updated data
    } catch (err) {
      setError('Failed to activate split');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    setSuccess('');

    try {
      const splitData = {
        ...formData,
        split_days: formData.split_days.map(day => ({
          ...day,
          targets: day.targets.map(target => ({
            muscle: parseInt(target.muscle),
            target_activation: parseInt(target.target_activation)
          }))
        }))
      };

      const response = await api.createSplit(splitData);
      if (response.data.success) {
        setSuccess('Split created successfully!');
        setFormData({
          split_name: '',
          start_date: '',
          split_days: []
        });
        
        if (onSplitCreated) onSplitCreated();
        loadData(); // Reload splits
      }
    } catch (err) {
      console.error('Error creating split:', err);
      setError('Failed to create split');
    } finally {
      setIsCreating(false);
    }
  };

  const getAvailableMuscles = (dayIndex, currentTargetIndex) => {
    // Get all muscles that are not already used in this day (except the current target)
    const usedMuscleIds = formData.split_days[dayIndex]?.targets
      .map((target, index) => index !== currentTargetIndex ? target.muscle : null)
      .filter(Boolean) || [];
    
    return muscles.filter(muscle => !usedMuscleIds.includes(muscle.muscles_id.toString()));
  };

  if (loading) {
    return <div className="text-center py-8">Loading data...</div>;
  }

  return (
    <div className="form-container">
      <h2 className="text-2xl font-bold mb-6">Split Creator</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-200 rounded">
          {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`px-4 py-2 rounded transition-colors ${
            activeTab === 'manage' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-medium)',
            backgroundColor: activeTab === 'manage' ? 'var(--accent-color)' : 'var(--bg-secondary)',
            color: activeTab === 'manage' ? 'var(--text-on-primary)' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)'
          }}
        >
          Manage Splits
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 rounded transition-colors ${
            activeTab === 'edit' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-medium)',
            backgroundColor: activeTab === 'edit' ? 'var(--accent-color)' : 'var(--bg-secondary)',
            color: activeTab === 'edit' ? 'var(--text-on-primary)' : 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)'
          }}
        >
          Edit Split
        </button>
      </div>

      {/* Manage Splits Tab */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Existing Splits</h3>
          
          {splits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No splits found. Create a new split in the Edit Split tab.
            </div>
          ) : (
            <div className="space-y-4">
              {splits.map((split) => (
                <div key={split.splits_id} className="border rounded-lg p-4" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{split.split_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {split.split_days?.length || 0} days • 
                        {split.start_date ? ` Active since ${split.start_date}` : ' Not active'}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => loadSplitForEditing(split)}
                        className="btn btn-secondary px-3 py-1 text-sm"
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-normal)',
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--border-radius)'
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  
                  {/* Start Date Assignment */}
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium">Set Start Date:</label>
                    <input
                      type="date"
                      className="form-input text-sm"
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-weight-normal)',
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--border-radius)',
                        padding: 'var(--spacing-xs) var(--spacing-sm)'
                      }}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSplitActivation(split.splits_id, e.target.value);
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Split Tab */}
      {activeTab === 'edit' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Split Selection */}
          {selectedSplit && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Editing: <strong>{selectedSplit.split_name}</strong>
              </p>
            </div>
          )}

          {/* Split Name */}
          <div>
            <label htmlFor="split_name" className="form-label">Split Name</label>
            <input
              type="text"
              id="split_name"
              name="split_name"
              value={formData.split_name}
              onChange={handleInputChange}
              className="form-input"
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-normal)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                padding: 'var(--spacing-sm) var(--spacing-md)'
              }}
              required
              placeholder="e.g., Push/Pull/Legs"
            />
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="form-label">Start Date</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              className="form-input"
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-normal)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                padding: 'var(--spacing-sm) var(--spacing-md)'
              }}
            />
          </div>

          {/* Split Days */}
          <div className="flex gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <label className="form-label">Split Days</label>
                <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  <InformationCircleIcon 
                    className="h-3 w-3" 
                    style={{ 
                      width: '12px',
                      height: '12px',
                      minWidth: '12px',
                      minHeight: '12px'
                    }}
                  />
                  <span>Add muscles to each day. Activation auto-calculated using R(P,D) = 90⋅(10+0.1P)⋅7/D formula.</span>
                </div>
              </div>
            
            <div className="space-y-4">
              {formData.split_days.map((day, dayIndex) => (
                <div key={dayIndex} className="border rounded-lg p-4" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={day.day_name}
                      onChange={(e) => updateDayName(dayIndex, e.target.value)}
                      className="form-input flex-1 mr-3"
                      style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-normal)',
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--border-radius)',
                        padding: 'var(--spacing-sm) var(--spacing-md)'
                      }}
                      placeholder="Day name (e.g., Push Day)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeSplitDay(dayIndex)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {day.targets.map((target, targetIndex) => (
                      <div key={targetIndex} className="flex items-center space-x-2">
                        <select
                          value={target.muscle}
                          onChange={(e) => {
                            const muscleId = e.target.value;
                            updateTarget(dayIndex, targetIndex, 'muscle', muscleId);
                            if (muscleId) {
                              const optimalActivation = getOptimalActivation(parseInt(muscleId));
                              updateTarget(dayIndex, targetIndex, 'target_activation', optimalActivation);
                            }
                          }}
                          className="form-input flex-1"
                          style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-normal)',
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius)',
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            minHeight: '40px'
                          }}
                          required
                        >
                          <option value="">Select muscle</option>
                          {getAvailableMuscles(dayIndex, targetIndex).map(muscle => (
                            <option key={muscle.muscles_id} value={muscle.muscles_id}>
                              {muscle.muscle_name}
                            </option>
                          ))}
                        </select>
                        
                        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          Lower bound auto-calculated: R(P,D) = 90⋅(10+0.1P)⋅7/D
                        </div>
                        
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={target.target_activation}
                          onChange={(e) => updateTarget(dayIndex, targetIndex, 'target_activation', e.target.value)}
                          className="form-input w-16 text-center"
                          style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 'var(--font-weight-normal)',
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius)',
                            padding: 'var(--spacing-xs)'
                          }}
                          required
                        />
                        {target.muscle && (
                          <span 
                            className="text-xs ml-1"
                            style={{ 
                              color: 'var(--accent-color)',
                              fontSize: '10px'
                            }}
                            title="Auto-calculated optimal activation"
                          >
                            ✨
                          </span>
                        )}
                        
                        {target.muscle && (
                          <button
                            type="button"
                            onClick={() => {
                              const optimalActivation = getOptimalActivation(parseInt(target.muscle));
                              updateTarget(dayIndex, targetIndex, 'target_activation', optimalActivation);
                            }}
                            className="text-xs px-2 py-1 ml-1 rounded"
                            style={{
                              color: 'var(--accent-color)',
                              backgroundColor: 'var(--bg-secondary)',
                              border: '1px solid var(--accent-color)',
                              borderRadius: 'var(--border-radius)',
                              fontSize: '10px'
                            }}
                            title="Reset to optimal activation"
                          >
                            Reset
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => removeTarget(dayIndex, targetIndex)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => addTarget(dayIndex)}
                        className="btn btn-secondary flex items-center space-x-2 px-3 py-1 text-sm"
                        style={{
                          fontFamily: 'var(--font-primary)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-normal)',
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--border-radius)'
                        }}
                      >
                        <PlusIcon className="h-3 w-3" />
                        <span>Add Target</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addSplitDay}
                className="btn btn-primary flex items-center space-x-2 px-4 py-2"
                style={{
                  fontFamily: 'var(--font-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-on-primary)',
                  backgroundColor: 'var(--accent-color)',
                  border: '1px solid var(--accent-color)',
                  borderRadius: 'var(--border-radius)'
                }}
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Split Day</span>
              </button>
            </div>
            </div>
            
            {/* Muscle Status Sidebar */}
            {Object.keys(analysis).length > 0 && (
              <div className="w-64">
                <h4 className="font-semibold mb-3 text-sm">Muscle Status</h4>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {Object.entries(analysis).map(([muscleId, data]) => {
                    const status = getMuscleStatus(muscleId);
                    const isOptimal = status.status === 'optimal';
                    const isBelow = status.status === 'below';
                    const isAbove = status.status === 'above';
                    
                    return (
                      <div key={muscleId} className="p-2 border rounded text-xs" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center justify-between">
                          <span 
                            className="font-medium"
                            style={{ 
                              color: isOptimal ? '#27AE60' : 
                                     isBelow ? '#95A5A6' : 
                                     isAbove ? '#E74C3C' : 
                                     '#E74C3C'
                            }}
                          >
                            {data.muscleName}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {data.totalSets}s
                          </span>
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          {Math.round(data.optimalRange.lower)}-{Math.round(data.optimalRange.upper)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>


          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating || formData.split_days.length === 0}
            className="btn btn-primary w-full px-6 py-3"
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--text-on-primary)',
              backgroundColor: 'var(--accent-color)',
              border: '1px solid var(--accent-color)',
              borderRadius: 'var(--border-radius)',
              opacity: (isCreating || formData.split_days.length === 0) ? 0.5 : 1,
              cursor: (isCreating || formData.split_days.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {isCreating ? 'Creating Split...' : 'Create Split'}
          </button>
        </form>
      )}
    </div>
  );
};

export default SplitCreator;
