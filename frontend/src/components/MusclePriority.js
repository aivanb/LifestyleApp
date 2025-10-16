import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ChevronDownIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const MusclePriority = ({ onPrioritiesUpdated }) => {
  const [musclePriorities, setMusclePriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadMusclePriorities();
  }, []);

  const loadMusclePriorities = async () => {
    try {
      setLoading(true);
      const response = await api.getMusclePriorities();
      setMusclePriorities(response.data.data || []);
    } catch (err) {
      console.error('Failed to load muscle priorities:', err);
      setError('Failed to load muscle priorities');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const updatePriority = (muscleLogId, newPriority) => {
    setMusclePriorities(prev => 
      prev.map(muscleLog => 
        muscleLog.muscle_log_id === muscleLogId
          ? { ...muscleLog, importance: newPriority }
          : muscleLog
      )
    );
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      const updateData = musclePriorities.map(muscleLog => ({
        muscle_name: muscleLog.muscle_name.muscles_id,
        importance: muscleLog.importance
      }));

      await api.updateMusclePriorities(updateData);
      setSuccess('Muscle priorities updated successfully!');
      
      if (onPrioritiesUpdated) onPrioritiesUpdated();
    } catch (err) {
      console.error('Error updating muscle priorities:', err);
      setError('Failed to update muscle priorities');
    } finally {
      setIsUpdating(false);
    }
  };

  const resetToDefault = () => {
    setMusclePriorities(prev => 
      prev.map(muscleLog => ({
        ...muscleLog,
        importance: 80
      }))
    );
  };

  // Group muscles by muscle group
  const groupedMuscles = musclePriorities.reduce((groups, muscleLog) => {
    const group = muscleLog.muscle_name.muscle_group;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(muscleLog);
    return groups;
  }, {});

  const getPriorityColor = (priority) => {
    if (priority >= 90) return 'text-red-500';
    if (priority >= 80) return 'text-orange-500';
    if (priority >= 70) return 'text-yellow-500';
    if (priority >= 60) return 'text-green-500';
    return 'text-blue-500';
  };

  const getPriorityLabel = (priority) => {
    if (priority >= 90) return 'Very High';
    if (priority >= 80) return 'High';
    if (priority >= 70) return 'Medium-High';
    if (priority >= 60) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="form-container">
      <h2 className="text-2xl font-bold mb-4">Muscle Priority</h2>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Muscle Priority Explanation
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              Priority is used for emphasizing, balancing, or improving weaker/stronger muscles. 
              Base priority is 80 for all muscles. Higher priority muscles will receive more 
              volume in your workout splits.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedMuscles).map(([groupName, muscles]) => (
          <div key={groupName} className="border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => toggleGroup(groupName)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-lg font-semibold">{groupName}</h3>
              {expandedGroups[groupName] ? (
                <ChevronDownIcon className="h-5 w-5" />
              ) : (
                <ChevronRightIcon className="h-5 w-5" />
              )}
            </button>
            
            {expandedGroups[groupName] && (
              <div className="p-4 pt-0 space-y-3">
                {muscles.map(muscleLog => (
                  <div key={muscleLog.muscle_log_id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="font-medium">{muscleLog.muscle_name.muscle_name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={muscleLog.importance}
                          onChange={(e) => updatePriority(muscleLog.muscle_log_id, parseInt(e.target.value))}
                          className="w-24"
                        />
                        <span className={`text-sm font-medium w-16 ${getPriorityColor(muscleLog.importance)}`}>
                          {muscleLog.importance}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 dark:text-gray-400 w-20">
                        {getPriorityLabel(muscleLog.importance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex space-x-4">
        <button
          onClick={handleUpdate}
          className="btn btn-primary"
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update Priorities'}
        </button>
        
        <button
          onClick={resetToDefault}
          className="btn btn-secondary"
        >
          Reset to Default (80)
        </button>
      </div>

      {/* Priority Legend */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium mb-2">Priority Scale:</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>0-59: Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>60-69: Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>70-79: Medium-High</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>80-89: High</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>90-100: Very High</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusclePriority;