import React, { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * WorkoutAdder Component
 * 
 * Allows users to create new workouts with:
 * - All metadata fields from workouts table
 * - Muscle activation ratings via workout_muscle table
 * - Icon selection from predefined emoji list
 * - Information tooltip for activation ratings
 */
const WorkoutAdder = ({ onWorkoutCreated }) => {
  const [formData, setFormData] = useState({
    workout_name: '',
    equipment_brand: '',
    type: 'barbell',
    location: '',
    notes: '',
    make_public: false,
    workout_muscles: []
  });

  const [muscles, setMuscles] = useState({});
  const [selectedMuscles, setSelectedMuscles] = useState({});
  const [selectedIcon, setSelectedIcon] = useState('💪');
  const [icons, setIcons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMuscles();
    loadIcons();
  }, []);

  const loadMuscles = async () => {
    try {
      const response = await api.getMuscles();
      if (response.data.success) {
        setMuscles(response.data.data);
      }
    } catch (err) {
      setError('Failed to load muscles');
    }
  };

  const loadIcons = async () => {
    try {
      const response = await api.getWorkoutIcons();
      if (response.data.success) {
        setIcons(response.data.data);
      }
    } catch (err) {
      setError('Failed to load icons');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMuscleToggle = (muscleId, muscleName) => {
    setSelectedMuscles(prev => {
      const newSelected = { ...prev };
      if (newSelected[muscleId]) {
        delete newSelected[muscleId];
      } else {
        newSelected[muscleId] = {
          muscle: muscleId,
          activation_rating: 50 // Default activation rating
        };
      }
      return newSelected;
    });
  };

  const handleActivationChange = (muscleId, rating) => {
    setSelectedMuscles(prev => ({
      ...prev,
      [muscleId]: {
        ...prev[muscleId],
        activation_rating: parseInt(rating)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const workoutData = {
        ...formData,
        workout_name: `${selectedIcon} ${formData.workout_name.trim()}`,
        workout_muscles: Object.values(selectedMuscles)
      };

      const response = await api.createWorkout(workoutData);
      
      if (response.data.success) {
        setSuccess('Workout created successfully!');
        // Reset form
        setFormData({
          workout_name: '',
          equipment_brand: '',
          type: 'barbell',
          location: '',
          notes: '',
          make_public: false,
          workout_muscles: []
        });
        setSelectedMuscles({});
        setSelectedIcon('💪');
        
        if (onWorkoutCreated) {
          onWorkoutCreated(response.data.data);
        }
      } else {
        setError(response.data.error?.message || 'Failed to create workout');
      }
    } catch (err) {
      setError('Failed to create workout');
    } finally {
      setLoading(false);
    }
  };

  const muscleGroups = Object.keys(muscles);

  return (
    <div className="workout-adder">
      <div className="form-header">
        <h2>Add New Workout</h2>
        <div className="info-tooltip">
          <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div className="tooltip-content">
            <h4>Activation Ratings Guide</h4>
            <p>Workouts can be given activation ratings that range from 0-100. Muscles prioritized by the movement should have higher ratings.</p>
            <p><strong>Examples:</strong></p>
            <ul>
              <li>Bench Press: chest-100, triceps-75, front delt-40</li>
              <li>Squats: quads-100, hamstrings-90, glutes-95, abs-20, abductor-90, adductor-90</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Workout Information */}
        <div className="form-section">
          <h3>Workout Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Workout Name *</label>
              <div className="icon-input-group">
                <select
                  value={selectedIcon}
                  onChange={(e) => setSelectedIcon(e.target.value)}
                  className="icon-select"
                >
                  {icons.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
                <input
                  type="text"
                  name="workout_name"
                  value={formData.workout_name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter workout name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Equipment Brand</label>
              <input
                type="text"
                name="equipment_brand"
                value={formData.equipment_brand}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Rogue, Hammer Strength"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Equipment Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="barbell">Barbell</option>
                <option value="dumbbell">Dumbbell</option>
                <option value="plate_machine">Plate Machine</option>
                <option value="cable_machine">Cable Machine</option>
                <option value="bodyweight">Bodyweight</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Home Gym, Gold's Gym"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-input"
                rows="3"
                placeholder="Additional notes about this workout..."
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="make_public"
                  checked={formData.make_public}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                Make this workout public
              </label>
            </div>
          </div>
        </div>

        {/* Muscle Activation Ratings */}
        <div className="form-section">
          <h3>Muscle Activation Ratings</h3>
          <div className="muscle-groups">
            {muscleGroups.map(group => (
              <div key={group} className="muscle-group">
                <h4 className="muscle-group-title">{group.charAt(0).toUpperCase() + group.slice(1)}</h4>
                <div className="muscle-list">
                  {muscles[group].map(muscle => (
                    <div key={muscle.muscles_id} className="muscle-item">
                      <label className="muscle-checkbox">
                        <input
                          type="checkbox"
                          checked={!!selectedMuscles[muscle.muscles_id]}
                          onChange={() => handleMuscleToggle(muscle.muscles_id, muscle.muscle_name)}
                          className="checkbox-input"
                        />
                        <span className="checkbox-custom"></span>
                        {muscle.muscle_name}
                      </label>
                      
                      {selectedMuscles[muscle.muscles_id] && (
                        <div className="activation-slider">
                          <label className="slider-label">
                            Activation: {selectedMuscles[muscle.muscles_id].activation_rating}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedMuscles[muscle.muscles_id].activation_rating}
                            onChange={(e) => handleActivationChange(muscle.muscles_id, e.target.value)}
                            className="slider"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="error-message">
            <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !formData.workout_name.trim()}
          >
            {loading ? 'Creating...' : 'Create Workout'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .workout-adder {
          max-width: 800px;
          margin: 0 auto;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
        }

        .info-tooltip {
          position: relative;
          cursor: help;
          color: var(--text-tertiary);
        }

        .info-tooltip:hover .tooltip-content {
          opacity: 1;
          visibility: visible;
        }

        .tooltip-content {
          position: absolute;
          bottom: 100%;
          right: 0;
          background: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          width: 300px;
          box-shadow: var(--shadow-lg);
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s var(--ease-out-cubic);
          z-index: 1000;
        }

        .tooltip-content h4 {
          margin: 0 0 var(--space-2) 0;
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
        }

        .tooltip-content p {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-xs);
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .tooltip-content ul {
          margin: var(--space-2) 0 0 0;
          padding-left: var(--space-4);
          font-size: var(--text-xs);
          color: var(--text-secondary);
        }

        .tooltip-content li {
          margin-bottom: var(--space-1);
        }

        .form-section {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin-bottom: var(--space-6);
        }

        .form-section h3 {
          margin: 0 0 var(--space-4) 0;
          color: var(--text-primary);
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-4);
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .icon-input-group {
          display: flex;
          gap: var(--space-2);
        }

        .icon-select {
          width: 60px;
          padding: var(--space-2);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: var(--text-lg);
        }

        .muscle-groups {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .muscle-group {
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }

        .muscle-group-title {
          margin: 0 0 var(--space-3) 0;
          color: var(--text-primary);
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          text-transform: capitalize;
        }

        .muscle-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-3);
        }

        .muscle-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .muscle-checkbox {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .activation-slider {
          margin-left: var(--space-6);
        }

        .slider-label {
          display: block;
          font-size: var(--text-xs);
          color: var(--text-secondary);
          margin-bottom: var(--space-1);
        }

        .slider {
          width: 100%;
          height: 6px;
          border-radius: var(--radius-sm);
          background: var(--border-primary);
          outline: none;
          -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          background: var(--accent-primary);
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          background: var(--accent-primary);
          cursor: pointer;
          border: none;
        }

        .form-actions {
          display: flex;
          justify-content: center;
          margin-top: var(--space-6);
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .muscle-list {
            grid-template-columns: 1fr;
          }

          .tooltip-content {
            width: 250px;
            right: -50px;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkoutAdder;
