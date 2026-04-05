import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ChevronDownIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { getMuscleDescription } from '../utils/muscleDescriptions';

const MusclePriority = ({ onPrioritiesUpdated, showHeader = true, enableTooltips = false }) => {
  const [musclePriorities, setMusclePriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [activeMuscleDescription, setActiveMuscleDescription] = useState(null);
  const [priorityDrafts, setPriorityDrafts] = useState({});
  
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

  const getSliderBackground = (value) => {
    const clamped = Math.max(1, Math.min(100, Number(value) || 1));
    const pct = clamped;
    const neutral = 'rgba(255, 255, 255, 0.12)';
    const startHue = 10;
    const endHue = 220;
    const hue = startHue + ((endHue - startHue) * (clamped - 1) / 99);
    const color = `hsl(${hue}, 100%, 55%)`;
    return `linear-gradient(90deg, ${color} 0%, ${color} ${pct}%, ${neutral} ${pct}%, ${neutral} 100%)`;
  };

  const loadMusclePriorities = async () => {
    try {
      const response = await api.getMusclePriorities();
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

  const clampPriority = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return 1;
    return Math.max(1, Math.min(100, Math.round(x)));
  };

  const updatePriority = (muscleLogId, newPriority, isMajorGroup = false, majorGroupName = '') => {
    const p = clampPriority(newPriority);
    setMusclePriorities(prev => 
      prev.map(muscleLog => {
        if (isMajorGroup && majorGroupName && majorMuscleGroups[majorGroupName]) {
          // Update all sub-muscles in the major group
          if (majorMuscleGroups[majorGroupName].includes(muscleLog.muscle_name)) {
            return { ...muscleLog, priority: p };
          }
        } else if (muscleLog.muscle_log_id === muscleLogId) {
          // Update individual muscle - this will automatically update the group average
          return { ...muscleLog, priority: p };
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

  const handleMuscleClick = (muscleName) => {
    if (!enableTooltips) return;
    setActiveMuscleDescription((prev) => (prev === muscleName ? null : muscleName));
  };

  if (loading) {
    return <div className="text-center py-8">Loading muscle priorities...</div>;
  }

  if (musclePriorities.length === 0) {
    return (
      <div className="container">
        {showHeader && (
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
        )}
        
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
      <div className="muscle-priority-reset-top-mobile">
        <button
          onClick={resetToDefault}
          className="btn btn-secondary"
        >
          Reset to Default (80)
        </button>
      </div>
      <style>{`
        .muscle-priority-reset-top-mobile {
          display: none;
        }

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
          background: var(--profile-card-bg, var(--bg-secondary));
          border: 1px solid var(--profile-card-border, var(--border-primary));
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-4);
          box-shadow: var(--shadow-md);
          transition: border-color 0.2s var(--ease-out-cubic);
        }

        .muscle-group-card:hover {
          border-color: var(--profile-card-border, var(--border-primary));
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
          border: 1px solid var(--input-border);
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
          background: var(--bg-tertiary);
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
          border-left: 1px solid var(--input-border);
          border-right: 1px solid var(--input-border);
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

        .priority-slider-wrapper {
          padding: 20px 0;
          display: inline-flex;
          align-items: center;
        }

        .priority-slider {
          width: 384px;
          height: 20px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.12);
          border: none;
          border-radius: 999px;
          outline: none;
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
        }
        
        .priority-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 44px;
          width: 18px;
          border-radius: 4px;
          background: #d1d5db;
          cursor: pointer;
          border: 1px solid var(--border-primary);
          box-shadow: var(--shadow-sm);
          transition: all 0.2s var(--ease-out-cubic);
          margin-top: -12px;
        }
        
        .priority-slider::-moz-range-thumb {
          height: 44px;
          width: 18px;
          border-radius: 4px;
          background: #d1d5db;
          cursor: pointer;
          border: 1px solid var(--border-primary);
          box-shadow: var(--shadow-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }
        
        .priority-slider::-webkit-slider-runnable-track {
          height: 20px;
          border-radius: 999px;
          background: transparent;
        }
        
        .priority-slider::-moz-range-track {
          height: 20px;
          border-radius: 999px;
          background: transparent;
        }

        .muscle-group-expandable {
          border-top: 1px solid var(--border-primary);
        }

        .muscle-group-toggle-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-5);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: none;
          border-radius: 0 0 var(--radius-md) var(--radius-md);
          font-family: var(--font-primary);
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
        }

        .muscle-group-toggle-button:hover {
          background: var(--bg-hover);
        }

        .toggle-icon {
          width: 16px;
          height: 16px;
        }

        .individual-muscles-container {
          padding: var(--space-6);
          background: var(--profile-card-bg, var(--bg-secondary));
          border-top: none;
          min-height: 0;
        }

        .individual-muscles-wrapper.is-expanded > .individual-muscles-container {
          border-top: 1px solid var(--border-primary);
        }

        .individual-muscles-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          min-height: 0;
          max-height: 0;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          overflow: hidden;
          transition:
            grid-template-rows 0.42s cubic-bezier(0.4, 0, 0.2, 1),
            max-height 0.42s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.38s cubic-bezier(0.4, 0, 0.2, 1),
            visibility 0s linear 0.42s;
        }

        .individual-muscles-wrapper.is-expanded {
          grid-template-rows: 1fr;
          max-height: 2000px;
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transition:
            grid-template-rows 0.42s cubic-bezier(0.4, 0, 0.2, 1),
            max-height 0.42s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.38s cubic-bezier(0.4, 0, 0.2, 1),
            visibility 0s;
        }

        .individual-muscles-wrapper > .individual-muscles-container {
          overflow: hidden;
          min-height: 0;
        }

        .btn.btn-primary {
          background: #79b5fb;
          border-color: #79b5fb;
          color: #040508;
        }

        .btn.btn-primary:hover:not(:disabled) {
          filter: brightness(0.95);
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
          gap: var(--space-2);
        }

        .muscle-name-row {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
        }

        .muscle-info-button {
          background: transparent;
          border: none;
          padding: 0;
          color: var(--text-tertiary);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s var(--ease-out-cubic), color 0.2s var(--ease-out-cubic);
        }

        .muscle-info-button:hover {
          color: var(--accent-primary);
          transform: translateY(-1px);
        }

        .muscle-info-button svg {
          width: 18px;
          height: 18px;
        }

        .muscle-name {
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .muscle-priority-controls {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        /* Tooltip modal (same interaction pattern as workout-tracker) */
        .mp-muscle-description-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-6);
          z-index: 9999;
        }

        .mp-muscle-description-modal {
          width: min(720px, 100%);
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
          border: 1px solid var(--border-primary);
          overflow: hidden;
          font-family: var(--font-primary);
        }

        .mp-muscle-description-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-5) var(--space-6);
          border-bottom: 1px solid var(--border-primary);
        }

        .mp-muscle-description-title {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        .mp-close-overlay-button {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          font-size: var(--text-2xl);
          cursor: pointer;
          line-height: 1;
          padding: var(--space-1) var(--space-2);
        }

        .mp-close-overlay-button:hover {
          color: var(--text-primary);
        }

        .mp-muscle-description-content {
          padding: var(--space-6);
          display: grid;
          gap: var(--space-3);
          color: var(--text-secondary);
          font-size: var(--text-base);
        }

        .mp-muscle-description-detail strong {
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .muscle-priority-reset-top-mobile {
            display: block;
            margin-bottom: var(--space-4);
          }

          .muscle-priority-footer-reset-wrap {
            display: none;
          }

          .muscle-group-header-content {
            flex-wrap: wrap;
          }

          .muscle-group-priority-section {
            width: 100%;
            flex-wrap: wrap;
            margin-top: var(--space-2);
          }

          .priority-label {
            display: none;
          }

          .muscle-priority-controls {
            flex-wrap: wrap;
            width: 100%;
          }

          .muscle-priority-controls .priority-label {
            display: none;
          }

          .priority-controls {
            flex-wrap: wrap;
            gap: var(--space-2);
            width: 100%;
          }

          .priority-slider-wrapper {
            width: 100%;
            order: 10;
          }

          .priority-slider {
            width: 100%;
            max-width: 100%;
          }

          .individual-muscle-item {
            flex-wrap: wrap;
          }

          .muscle-priority-controls .priority-controls {
            width: 100%;
          }

          .muscle-priority-footer-actions {
            flex-wrap: wrap;
            gap: var(--space-3);
          }

          .muscle-priority-footer-actions .btn {
            padding: var(--space-3) var(--space-4);
            font-size: var(--text-base);
            min-height: 44px;
          }
        }
      `}</style>
      
      {showHeader && (
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
      )}

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
                            onClick={() => {
                              setPriorityDrafts((d) => {
                                const n = { ...d };
                                delete n[`m:${majorGroupName}`];
                                return n;
                              });
                              updatePriority(null, Math.max(1, majorGroupPriority - 1), true, majorGroupName);
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={
                              `m:${majorGroupName}` in priorityDrafts
                                ? priorityDrafts[`m:${majorGroupName}`]
                                : String(majorGroupPriority)
                            }
                            onChange={(e) =>
                              setPriorityDrafts((d) => ({
                                ...d,
                                [`m:${majorGroupName}`]: e.target.value,
                              }))
                            }
                            onBlur={(e) => {
                              updatePriority(null, clampPriority(e.target.value), true, majorGroupName);
                              setPriorityDrafts((d) => {
                                const n = { ...d };
                                delete n[`m:${majorGroupName}`];
                                return n;
                              });
                            }}
                            className="priority-input"
                            aria-label={`${majorGroupName} priority`}
                          />
                          <button
                            type="button"
                            className="priority-step-button"
                            onClick={() => {
                              setPriorityDrafts((d) => {
                                const n = { ...d };
                                delete n[`m:${majorGroupName}`];
                                return n;
                              });
                              updatePriority(null, Math.min(100, majorGroupPriority + 1), true, majorGroupName);
                            }}
                          >
                            +
                          </button>
                        </div>
                        <div className="priority-slider-wrapper">
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={majorGroupPriority}
                            onChange={(e) => {
                              setPriorityDrafts((d) => {
                                const n = { ...d };
                                delete n[`m:${majorGroupName}`];
                                return n;
                              });
                              updatePriority(null, parseInt(e.target.value, 10), true, majorGroupName);
                            }}
                            className="priority-slider"
                            style={{ background: getSliderBackground(majorGroupPriority) }}
                          />
                        </div>
                      </div>
          </div>
        </div>
      </div>

              {/* Expandable Sub-Muscles */}
              <div className="muscle-group-expandable">
            <button
                  onClick={() => toggleGroup(majorGroupName)}
                  className="muscle-group-toggle-button flex items-center justify-between"
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
            
                <div
                  className={`individual-muscles-wrapper ${expandedGroups[majorGroupName] ? 'is-expanded' : ''}`}
                  aria-hidden={!expandedGroups[majorGroupName]}
                >
                  <div className="individual-muscles-container">
                    {groupMuscles.map(muscleLog => (
                      <div key={muscleLog.muscle_log_id} className="individual-muscle-item">
                    <div className="muscle-info">
                          <div className="muscle-details">
                            <div className="muscle-name-row">
                              <span className="muscle-name">
                                {muscleLog.muscle_name}
                              </span>
                              {enableTooltips && (
                                <button
                                  type="button"
                                  className="muscle-info-button"
                                  onClick={() => handleMuscleClick(muscleLog.muscle_name)}
                                  aria-label={`Muscle info: ${muscleLog.muscle_name}`}
                                  title="View muscle info"
                                >
                                  <InformationCircleIcon />
                                </button>
                              )}
                            </div>
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
                            onClick={() => {
                              const k = `i:${muscleLog.muscle_log_id}`;
                              setPriorityDrafts((d) => {
                                const n = { ...d };
                                delete n[k];
                                return n;
                              });
                              updatePriority(muscleLog.muscle_log_id, Math.max(1, muscleLog.priority - 1));
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={
                              `i:${muscleLog.muscle_log_id}` in priorityDrafts
                                ? priorityDrafts[`i:${muscleLog.muscle_log_id}`]
                                : String(muscleLog.priority)
                            }
                            onChange={(e) =>
                              setPriorityDrafts((d) => ({
                                ...d,
                                [`i:${muscleLog.muscle_log_id}`]: e.target.value,
                              }))
                            }
                            onBlur={(e) => {
                              updatePriority(muscleLog.muscle_log_id, clampPriority(e.target.value));
                              setPriorityDrafts((d) => {
                                const n = { ...d };
                                delete n[`i:${muscleLog.muscle_log_id}`];
                                return n;
                              });
                            }}
                            className="priority-input"
                            aria-label={`${muscleLog.muscle_name} priority`}
                          />
                          <button
                            type="button"
                            className="priority-step-button"
                            onClick={() => {
                              const k = `i:${muscleLog.muscle_log_id}`;
                              setPriorityDrafts((d) => {
                                const n = { ...d };
                                delete n[k];
                                return n;
                              });
                              updatePriority(muscleLog.muscle_log_id, Math.min(100, muscleLog.priority + 1));
                            }}
                          >
                            +
                          </button>
                        </div>
                        <div className="priority-slider-wrapper">
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={muscleLog.priority}
                            onChange={(e) => {
                              const k = `i:${muscleLog.muscle_log_id}`;
                              setPriorityDrafts((d) => {
                                const n = { ...d };
                                delete n[k];
                                return n;
                              });
                              updatePriority(muscleLog.muscle_log_id, parseInt(e.target.value, 10));
                            }}
                            className="priority-slider"
                            style={{ background: getSliderBackground(muscleLog.priority) }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                  </div>
                </div>
          </div>
            </div>
          );
        })}
      </div>

      <div className="muscle-priority-footer-actions mt-8 flex justify-between">
        <span className="muscle-priority-footer-reset-wrap">
          <button
            onClick={resetToDefault}
            className="btn btn-secondary"
          >
            Reset to Default (80)
          </button>
        </span>

        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="btn btn-primary"
        >
          {isUpdating ? 'Updating...' : 'Update Priorities'}
        </button>
      </div>

      {enableTooltips && activeMuscleDescription && (
        <div
          className="mp-muscle-description-overlay"
          onClick={() => setActiveMuscleDescription(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="mp-muscle-description-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mp-muscle-description-header">
              <div className="mp-muscle-description-title">{activeMuscleDescription}</div>
              <button
                type="button"
                className="mp-close-overlay-button"
                onClick={() => setActiveMuscleDescription(null)}
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="mp-muscle-description-content">
              <div className="mp-muscle-description-detail">
                <strong>Description:</strong> {getMuscleDescription(activeMuscleDescription).description}
              </div>
              <div className="mp-muscle-description-detail">
                <strong>Location:</strong> {getMuscleDescription(activeMuscleDescription).location}
              </div>
              <div className="mp-muscle-description-detail">
                <strong>Function:</strong> {getMuscleDescription(activeMuscleDescription).function}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusclePriority;
