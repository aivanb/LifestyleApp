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
          <div className="flex items-center space-x-3 text-xs text-tertiary">
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
        .slider {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          border-radius: 10px;
          outline: none;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 3px solid #333;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 3px solid #333;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-webkit-slider-track {
          height: 20px;
          border-radius: 10px;
          background: transparent;
          border: none;
        }
        
        .slider::-moz-range-track {
          height: 20px;
          border-radius: 10px;
          background: transparent;
          border: none;
        }
      `}</style>
      
      <div className="flex items-center justify-between mb-6">
        <h2 
          className="text-2xl font-bold"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-primary)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--font-weight-bold)'
          }}
        >
          Muscle Priority
        </h2>
        <div 
          className="flex items-center space-x-3"
          style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-primary)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
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
            <div key={majorGroupName} className="card">
              {/* Major Group Header with Priority Control */}
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 
                      className="card-title"
                      style={{
                        color: 'var(--accent-primary)',
                        fontFamily: 'var(--font-primary)',
                        fontSize: 'var(--text-xl)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}
                    >
                      {majorGroupName}
                    </h3>
                    <span 
                      className="text-sm"
                      style={{
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-primary)',
                        fontSize: 'var(--text-sm)'
                      }}
                    >
                      ({groupMuscles.length} muscles)
                    </span>
                  </div>
                    <div className="flex items-center space-x-4">
                      <span 
                        className="text-sm font-medium"
                        style={{
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-primary)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        Priority:
                      </span>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={majorGroupPriority}
                          onChange={(e) => updatePriority(null, parseInt(e.target.value) || 1, true, majorGroupName)}
                          className="form-input w-16 text-center"
                        />
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={majorGroupPriority}
                          onChange={(e) => updatePriority(null, parseInt(e.target.value), true, majorGroupName)}
                          className="w-96 h-6 slider"
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
              <div>
            <button
                  onClick={() => toggleGroup(majorGroupName)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all duration-200 ease-out"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    borderTop: '1px solid var(--border-primary)',
                    borderRadius: '0',
                    fontFamily: 'var(--font-primary)',
                    cursor: 'pointer'
                  }}
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
                      className="h-4 w-4" 
                      style={{ color: 'var(--text-primary)' }}
                    />
                  ) : (
                    <ChevronRightIcon 
                      className="h-4 w-4" 
                      style={{ color: 'var(--text-primary)' }}
                    />
              )}
            </button>
            
                {expandedGroups[majorGroupName] && (
                  <div 
                    className="p-6 space-y-4"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderTop: '1px solid var(--border-primary)'
                    }}
                  >
                    {groupMuscles.map(muscleLog => (
                      <div key={muscleLog.muscle_log_id} className="flex items-center space-x-6">
                    <div className="flex-1">
                          <div className="flex flex-col">
                            <span 
                              className="font-medium text-sm"
                              style={{
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-primary)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 'var(--font-weight-medium)'
                              }}
                            >
                              {muscleLog.muscle_name}
                            </span>
                            <span 
                              className="text-xs"
                              style={{
                                color: 'var(--text-tertiary)',
                                fontFamily: 'var(--font-primary)',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 'var(--font-weight-normal)',
                                marginTop: '2px'
                              }}
                            >
                              {getMuscleDescription(muscleLog.muscle_name)}
                            </span>
                          </div>
                    </div>
                    
                        <div className="flex items-center space-x-4">
                          <span 
                            className="text-sm font-medium"
                            style={{
                              color: 'var(--text-secondary)',
                              fontFamily: 'var(--font-primary)',
                              fontSize: 'var(--text-sm)',
                              fontWeight: 'var(--font-weight-medium)'
                            }}
                          >
                            Priority:
                          </span>
                    <div className="flex items-center space-x-3">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={muscleLog.priority}
                              onChange={(e) => updatePriority(muscleLog.muscle_log_id, parseInt(e.target.value) || 1)}
                              className="form-input w-16 text-center"
                            />
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={muscleLog.priority}
                          onChange={(e) => updatePriority(muscleLog.muscle_log_id, parseInt(e.target.value))}
                          className="w-96 h-6 slider"
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
