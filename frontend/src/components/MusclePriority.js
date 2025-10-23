import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ChevronDownIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const MusclePriority = ({ onPrioritiesUpdated }) => {
  const [musclePriorities, setMusclePriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Define major muscle groups and their sub-muscles
  const majorMuscleGroups = {
    'Chest': ['Pectoralis Major (Upper)', 'Pectoralis Major (Middle)', 'Pectoralis Major (Lower)', 'Pectoralis Minor'],
    'Back': ['Latissimus Dorsi', 'Trapezius (Upper)', 'Trapezius (Middle)', 'Trapezius (Lower)', 'Rhomboids', 'Erector Spinae', 'Teres Major', 'Teres Minor'],
    'Arms': ['Biceps Brachii', 'Brachialis', 'Brachioradialis', 'Triceps (Long Head)', 'Triceps (Lateral Head)', 'Triceps (Medial Head)', 'Forearm Flexors', 'Forearm Extensors', 'Anterior Deltoid', 'Lateral Deltoid', 'Posterior Deltoid', 'Rotator Cuff'],
    'Legs': ['Quadriceps (Rectus Femoris)', 'Quadriceps (Vastus Lateralis)', 'Quadriceps (Vastus Medialis)', 'Quadriceps (Vastus Intermedius)', 'Hamstrings (Biceps Femoris)', 'Hamstrings (Semitendinosus)', 'Hamstrings (Semimembranosus)', 'Glutes (Maximus)', 'Glutes (Medius)', 'Glutes (Minimus)', 'Adductors', 'Abductors', 'Calves (Gastrocnemius)', 'Calves (Soleus)', 'Tibialis Anterior'],
    'Core': ['Rectus Abdominis', 'External Obliques', 'Internal Obliques', 'Transverse Abdominis', 'Serratus Anterior'],
    'Other': ['Neck Flexors', 'Neck Extensors']
  };

  useEffect(() => {
    loadMusclePriorities();
  }, []);

  const loadMusclePriorities = async () => {
    try {
      const response = await api.getMusclePriorities();
      console.log('Muscle priorities response:', response.data);
      if (response.data.success) {
        setMusclePriorities(response.data.data);
        
        // Group muscles by muscle group
        const groups = {};
        response.data.data.forEach(muscleLog => {
          const group = muscleLog.muscle_group;
          if (!groups[group]) {
            groups[group] = [];
          }
          groups[group].push(muscleLog);
        });
        
        // Expand all groups by default
        const expanded = {};
        Object.keys(groups).forEach(group => {
          expanded[group] = true;
        });
        setExpandedGroups(expanded);
      }
    } catch (err) {
      console.error('Error loading muscle priorities:', err);
      setError('Failed to load muscle priorities');
    } finally {
      setLoading(false);
    }
  };

  const updatePriority = (muscleLogId, newPriority, isMajorGroup = false, majorGroupName = '') => {
    setMusclePriorities(prev => 
      prev.map(muscleLog => {
        if (isMajorGroup && majorGroupName && majorMuscleGroups[majorGroupName]) {
          // Update all sub-muscles in the major group
          if (majorMuscleGroups[majorGroupName].includes(muscleLog.muscle_name)) {
            return { ...muscleLog, priority: newPriority };
          }
        } else if (muscleLog.muscle_log_id === muscleLogId) {
          // Update individual muscle - this will automatically update the group average
          return { ...muscleLog, priority: newPriority };
        }
        return muscleLog;
      })
    );
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      const updateData = musclePriorities.map(muscleLog => ({
        muscle_name: muscleLog.muscle_id,
        priority: muscleLog.priority
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
        priority: 80
      }))
    );
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };


  const getMajorGroupPriority = (groupName) => {
    const groupMuscles = musclePriorities.filter(muscleLog => 
      majorMuscleGroups[groupName] && majorMuscleGroups[groupName].includes(muscleLog.muscle_name)
    );
    
    if (groupMuscles.length === 0) return 80;
    
    const totalPriority = groupMuscles.reduce((sum, muscleLog) => sum + muscleLog.priority, 0);
    return Math.round(totalPriority / groupMuscles.length);
  };

  const getSliderColor = (value) => {
    // Convert value (1-100) to percentage (0-1)
    const percentage = (value - 1) / 99;
    
    if (percentage <= 0.25) {
      // 0-25: Red to Orange
      const ratio = percentage / 0.25;
      return `rgb(${255}, ${Math.round(165 * ratio)}, 0)`;
    } else if (percentage <= 0.5) {
      // 25-50: Orange to Yellow
      const ratio = (percentage - 0.25) / 0.25;
      return `rgb(${Math.round(255 - 55 * ratio)}, ${Math.round(165 + 90 * ratio)}, 0)`;
    } else if (percentage <= 0.75) {
      // 50-75: Yellow to Green
      const ratio = (percentage - 0.5) / 0.25;
      return `rgb(${Math.round(200 - 200 * ratio)}, ${Math.round(255 - 55 * ratio)}, 0)`;
    } else {
      // 75-100: Green to Blue
      const ratio = (percentage - 0.75) / 0.25;
      return `rgb(${Math.round(0 + 0 * ratio)}, ${Math.round(200 - 200 * ratio)}, ${Math.round(0 + 255 * ratio)})`;
    }
  };

  const getMuscleDescription = (muscleName) => {
    const descriptions = {
      // Chest muscles
      'Pectoralis Major': 'Main chest muscle for pushing movements',
      'Pectoralis Minor': 'Smaller chest muscle, stabilizes shoulder blade',
      'Serratus Anterior': 'Pulls shoulder blade forward, important for overhead movements',
      
      // Back muscles
      'Latissimus Dorsi': 'Large back muscle for pulling movements',
      'Rhomboids': 'Retract shoulder blades, improve posture',
      'Trapezius': 'Elevates and retracts shoulder blades',
      'Erector Spinae': 'Spinal muscles for back extension and stability',
      'Infraspinatus': 'External rotation of shoulder',
      'Supraspinatus': 'Initiates shoulder abduction',
      'Teres Major': 'Adduction and internal rotation of arm',
      'Teres Minor': 'External rotation and stabilization of shoulder',
      
      // Arm muscles
      'Biceps Brachii': 'Flexes elbow and supinates forearm',
      'Triceps Brachii': 'Extends elbow, main arm extensor',
      'Brachialis': 'Primary elbow flexor',
      'Brachioradialis': 'Flexes elbow, assists in forearm rotation',
      'Anconeus': 'Assists triceps in elbow extension',
      'Pronator Teres': 'Pronates forearm',
      'Supinator': 'Supinates forearm',
      
      // Leg muscles
      'Quadriceps': 'Extends knee, main thigh muscle group',
      'Hamstrings': 'Flexes knee and extends hip',
      'Glutes': 'Hip extension and stabilization',
      'Calves': 'Plantar flexion of foot',
      'Tibialis Anterior': 'Dorsiflexion of foot',
      'Hip Flexors': 'Flex hip joint',
      'Adductors': 'Adduct thigh toward midline',
      'Abductors': 'Abduct thigh away from midline',
      
      // Core muscles
      'Rectus Abdominis': 'Flexes spine, main abdominal muscle',
      'Obliques': 'Rotate and laterally flex spine',
      'Transverse Abdominis': 'Deep core stabilizer',
      'Multifidus': 'Spinal stabilizer and rotator',
      
      // Other muscles
      'Deltoids': 'Shoulder abduction, flexion, and extension',
      'Rotator Cuff': 'Stabilizes shoulder joint',
      'Forearms': 'Grip strength and wrist movements',
      'Neck': 'Head and neck movement and stability'
    };
    
    return descriptions[muscleName] || 'Muscle for movement and stability';
  };

  if (loading) {
    return <div className="text-center py-8">Loading muscle priorities...</div>;
  }

  if (musclePriorities.length === 0) {
    return (
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Muscle Priority</h2>
          <div className="flex items-center space-x-6 text-xs text-tertiary">
            <InformationCircleIcon 
              className="h-6 w-6" 
              style={{ 
                width: '24px',
                height: '24px',
                minWidth: '24px',
                minHeight: '24px'
              }}
            />
            <span>Priority is used for emphasizing, balancing, or improving weaker/stronger muscles</span>
          </div>
        </div>
        
        <div className="text-center py-8">
          <p className="text-secondary mb-4">No muscle priorities found.</p>
          <p className="text-sm text-tertiary">
            Muscle priorities will be created automatically when you first use the workout system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <style jsx>{`
        .muscle-priority-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
        }

        .muscle-priority-title {
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          margin: 0;
        }

        .muscle-priority-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: var(--text-lg);
          color: var(--text-secondary);
          font-family: var(--font-primary);
          font-weight: var(--font-weight-medium);
        }

        .muscle-group-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-4);
        }

        .muscle-group-header {
          padding: var(--space-6);
        }

        .muscle-group-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .muscle-group-title-section {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .muscle-group-title {
          color: var(--accent-primary);
          font-family: var(--font-primary);
          font-size: var(--text-xl);
          font-weight: var(--font-weight-medium);
          margin: 0;
        }

        .muscle-group-count {
          color: var(--text-secondary);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
        }

        .muscle-group-priority-section {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .priority-label {
          color: var(--text-secondary);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .priority-controls {
          display: flex;
          align-items: center;
          gap: var(--space-8);
        }

        .priority-input-container {
          display: flex;
          align-items: center;
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          overflow: hidden;
        }

        .priority-step-button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border: none;
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
        }

        .priority-step-button:hover {
          background: var(--accent-primary);
          color: white;
        }

        .priority-step-button:active {
          transform: scale(0.95);
        }

        .priority-input {
          width: 64px;
          height: 32px;
          text-align: center;
          padding: 0;
          border: none;
          border-left: 1px solid var(--border-primary);
          border-right: 1px solid var(--border-primary);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .priority-input:focus {
          outline: none;
          background: var(--bg-secondary);
        }

        .priority-slider {
          width: 384px;
          height: 24px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(var(--border-primary-rgb), 0.2);
          border: 2px solid rgba(var(--accent-primary-rgb), 0.3);
          border-radius: 12px;
          outline: none;
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
        }
        
        .priority-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: var(--accent-primary);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }
        
        .priority-slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: var(--accent-primary);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }
        
        .priority-slider::-webkit-slider-track {
          height: 24px;
          border-radius: 12px;
          background: transparent;
          border: none;
        }
        
        .priority-slider::-moz-range-track {
          height: 24px;
          border-radius: 12px;
          background: transparent;
          border: none;
        }

        .muscle-group-expandable {
          border-top: 1px solid var(--border-primary);
        }

        .muscle-group-toggle-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3) var(--space-4);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: none;
          border-radius: 0;
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
        }

        .toggle-icon {
          width: 16px;
          height: 16px;
        }

        .individual-muscles-container {
          padding: var(--space-6);
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-primary);
        }

        .individual-muscle-item {
          display: flex;
          align-items: center;
          gap: var(--space-6);
          margin-bottom: var(--space-4);
        }

        .muscle-info {
          flex: 1;
        }

        .muscle-details {
          display: flex;
          flex-direction: column;
        }

        .muscle-name {
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .muscle-description {
          color: var(--text-tertiary);
          font-family: var(--font-primary);
          font-size: var(--text-xs);
          font-weight: var(--font-weight-normal);
          margin-top: 2px;
        }

        .muscle-priority-controls {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }
      `}</style>
      
      <div className="muscle-priority-header">
        <h2 className="muscle-priority-title">
          Muscle Priority
        </h2>
        <div className="muscle-priority-info">
          <InformationCircleIcon 
            className="h-6 w-6" 
            style={{ 
              color: 'var(--text-tertiary)',
              width: '24px',
              height: '24px',
              minWidth: '24px',
              minHeight: '24px'
            }}
          />
          <span>Priority is used for emphasizing, balancing, or improving weaker/stronger muscles</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* Major Muscle Groups Only */}
        {Object.keys(majorMuscleGroups).map((majorGroupName) => {
          const groupMuscles = musclePriorities.filter(muscleLog => 
            majorMuscleGroups[majorGroupName].includes(muscleLog.muscle_name)
          );
          
          if (groupMuscles.length === 0) return null;
          
          const majorGroupPriority = getMajorGroupPriority(majorGroupName);
          
          return (
            <div key={majorGroupName} className="muscle-group-card">
              {/* Major Group Header with Priority Control */}
              <div className="muscle-group-header">
                <div className="muscle-group-header-content">
                  <div className="muscle-group-title-section">
                    <h3 className="muscle-group-title">
                      {majorGroupName}
                    </h3>
                    <span className="muscle-group-count">
                      ({groupMuscles.length} muscles)
                    </span>
                  </div>
                    <div className="muscle-group-priority-section">
                      <span className="priority-label">
                        Priority:
                      </span>
                      <div className="priority-controls">
                        <div className="priority-input-container">
                          <button
                            type="button"
                            className="priority-step-button"
                            onClick={() => updatePriority(null, Math.max(1, majorGroupPriority - 1), true, majorGroupName)}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={majorGroupPriority}
                            onChange={(e) => updatePriority(null, parseInt(e.target.value) || 1, true, majorGroupName)}
                            className="priority-input"
                            readOnly
                          />
                          <button
                            type="button"
                            className="priority-step-button"
                            onClick={() => updatePriority(null, Math.min(100, majorGroupPriority + 1), true, majorGroupName)}
                          >
                            +
                          </button>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={majorGroupPriority}
                          onChange={(e) => updatePriority(null, parseInt(e.target.value), true, majorGroupName)}
                          className="priority-slider"
                          style={{
                            backgroundColor: getSliderColor(majorGroupPriority),
                            borderRadius: '10px'
                          }}
                        />
                      </div>
          </div>
        </div>
      </div>

              {/* Expandable Sub-Muscles */}
              <div className="muscle-group-expandable">
            <button
                  onClick={() => toggleGroup(majorGroupName)}
                  className="muscle-group-toggle-button flex items-center justify-between"
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                >
                  <span>Individual Muscles</span>
                  {expandedGroups[majorGroupName] ? (
                    <ChevronDownIcon 
                      className="toggle-icon" 
                      style={{ color: 'var(--text-primary)' }}
                    />
                  ) : (
                    <ChevronRightIcon 
                      className="toggle-icon" 
                      style={{ color: 'var(--text-primary)' }}
                    />
              )}
            </button>
            
                {expandedGroups[majorGroupName] && (
                  <div className="individual-muscles-container">
                    {groupMuscles.map(muscleLog => (
                      <div key={muscleLog.muscle_log_id} className="individual-muscle-item">
                    <div className="muscle-info">
                          <div className="muscle-details">
                            <span className="muscle-name">
                              {muscleLog.muscle_name}
                            </span>
                            <span className="muscle-description">
                              {getMuscleDescription(muscleLog.muscle_name)}
                            </span>
                          </div>
                    </div>
                    
                        <div className="muscle-priority-controls">
                          <span className="priority-label">
                            Priority:
                          </span>
                    <div className="priority-controls">
                        <div className="priority-input-container">
                          <button
                            type="button"
                            className="priority-step-button"
                            onClick={() => updatePriority(muscleLog.muscle_log_id, Math.max(1, muscleLog.priority - 1))}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={muscleLog.priority}
                            onChange={(e) => updatePriority(muscleLog.muscle_log_id, parseInt(e.target.value) || 1)}
                            className="priority-input"
                            readOnly
                          />
                          <button
                            type="button"
                            className="priority-step-button"
                            onClick={() => updatePriority(muscleLog.muscle_log_id, Math.min(100, muscleLog.priority + 1))}
                          >
                            +
                          </button>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={muscleLog.priority}
                          onChange={(e) => updatePriority(muscleLog.muscle_log_id, parseInt(e.target.value))}
                          className="priority-slider"
                          style={{
                            backgroundColor: getSliderColor(muscleLog.priority),
                            borderRadius: '10px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={resetToDefault}
          className="btn btn-secondary"
        >
          Reset to Default (80)
        </button>
        
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="btn btn-primary"
        >
          {isUpdating ? 'Updating...' : 'Update Priorities'}
        </button>
      </div>
    </div>
  );
};

export default MusclePriority;
