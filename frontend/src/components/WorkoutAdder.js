import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PlusIcon, XMarkIcon, InformationCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const WorkoutAdder = ({ onWorkoutAdded }) => {
  const [muscles, setMuscles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    workout_name: '',
    equipment_brand: '',
    type: 'barbell',
    location: '',
    notes: '',
    make_public: false,
    muscles: []
  });

  const [selectedIcon, setSelectedIcon] = useState('⚡');
  const [isEmojiDropdownOpen, setIsEmojiDropdownOpen] = useState(false);
  const [availableIcons] = useState([
    '⚡', '🔥', '💎', '🌟', '⭐', '✨', '💫', '🎨', '🎭', '🎪',
    '🎯', '🎲', '🎳', '🔮', '💧', '🌊', '❄️', '🌈', '☀️', '🌙',
    '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔴', '🟠', '🟡', '🟢',
    '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨', '🟩', '🟦',
    '🟪', '🟫', '⬛', '⬜'
  ]);

  // Gradient slider color function
  const getSliderColor = (value) => {
    const percentage = (value - 0) / 100;
    
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

  useEffect(() => {
    loadMuscles();
  }, []);

  const loadMuscles = async () => {
    try {
      const response = await api.getMuscles();
      if (response.data.success) {
        // Group muscles by muscle group
        const groupedMuscles = response.data.data.reduce((groups, muscle) => {
          const group = muscle.muscle_group;
          if (!groups[group]) {
            groups[group] = [];
          }
          groups[group].push(muscle);
          return groups;
        }, {});
        setMuscles(groupedMuscles);
      }
    } catch (err) {
      setError('Failed to load muscles');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addMuscle = () => {
    setFormData(prev => ({
      ...prev,
      muscles: [...prev.muscles, { muscle: '', activation_rating: 50 }]
    }));
  };

  const removeMuscle = (index) => {
    setFormData(prev => ({
      ...prev,
      muscles: prev.muscles.filter((_, i) => i !== index)
    }));
  };

  const updateMuscle = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      muscles: prev.muscles.map((muscle, i) => 
        i === index ? { ...muscle, [field]: value } : muscle
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');
    setSuccess('');

    try {
      const workoutData = {
        ...formData,
        workout_name: `${selectedIcon} ${formData.workout_name}`,
        muscles: formData.muscles.map(muscle => ({
          muscle: parseInt(muscle.muscle),
          activation_rating: parseInt(muscle.activation_rating)
        }))
      };

      const response = await api.createWorkout(workoutData);
      if (response.data.success) {
        setSuccess('Workout created successfully!');
        setFormData({
          workout_name: '',
          equipment_brand: '',
          type: 'barbell',
          location: '',
          notes: '',
          make_public: false,
          muscles: []
        });
        setSelectedIcon('⚡');
        
        if (onWorkoutAdded) onWorkoutAdded();
      }
    } catch (err) {
      console.error('Error creating workout:', err);
      setError('Failed to create workout');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading muscles...</div>;
  }

  return (
    <div className="workout-adder-container">
      <h2 className="workout-adder-header">Add New Workout</h2>

      {error && (
        <div className="workout-adder-error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="workout-adder-success-message">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="workout-adder-form">
        {/* Icon Selection */}
        <div className="workout-adder-form-group">
          <label className="workout-adder-form-label">Workout Icon</label>
          <div className="workout-adder-icon-selector">
            <button
              type="button"
              onClick={() => setIsEmojiDropdownOpen(!isEmojiDropdownOpen)}
              className="workout-adder-icon-dropdown-button"
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-normal)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}
            >
              <span className="text-2xl">{selectedIcon}</span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            
            {isEmojiDropdownOpen && (
              <div 
                className="workout-adder-icon-dropdown-menu"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  minWidth: '320px'
                }}
              >
                <div className="workout-adder-icon-grid" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                  {availableIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(icon);
                        setIsEmojiDropdownOpen(false);
                      }}
                      className={`workout-adder-icon-button ${
                        selectedIcon === icon 
                          ? 'workout-adder-icon-button-selected' 
                          : ''
                      }`}
                      style={{
                        backgroundColor: selectedIcon === icon ? 'var(--accent-light)' : 'transparent',
                        minWidth: '32px',
                        minHeight: '32px',
                        width: '32px',
                        height: '32px'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Workout Name */}
        <div className="workout-adder-form-group">
          <label htmlFor="workout_name" className="workout-adder-form-label">Workout Name</label>
          <input
            type="text"
            id="workout_name"
            name="workout_name"
            value={formData.workout_name}
            onChange={handleInputChange}
            className="workout-adder-form-input"
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
            placeholder="Enter workout name"
          />
        </div>

        {/* Equipment Brand */}
        <div className="workout-adder-form-group">
          <label htmlFor="equipment_brand" className="workout-adder-form-label">Equipment Brand</label>
          <input
            type="text"
            id="equipment_brand"
            name="equipment_brand"
            value={formData.equipment_brand}
            onChange={handleInputChange}
            className="workout-adder-form-input"
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
            placeholder="e.g., Rogue, Eleiko"
          />
        </div>

        {/* Type */}
        <div className="workout-adder-form-group">
          <label htmlFor="type" className="workout-adder-form-label">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="workout-adder-form-input"
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
          >
            <option value="barbell">Barbell</option>
            <option value="dumbbell">Dumbbell</option>
            <option value="machine">Machine</option>
            <option value="bodyweight">Bodyweight</option>
            <option value="cable">Cable</option>
            <option value="kettlebell">Kettlebell</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Location */}
        <div className="workout-adder-form-group">
          <label htmlFor="location" className="workout-adder-form-label">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="workout-adder-form-input"
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
            placeholder="e.g., Home gym, Commercial gym"
          />
        </div>

        {/* Notes */}
        <div className="workout-adder-form-group">
          <label htmlFor="notes" className="workout-adder-form-label">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="workout-adder-form-input"
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
            rows="3"
            placeholder="Additional notes about the workout"
          />
        </div>

        {/* Muscles */}
        <div className="workout-adder-form-group">
          <div className="workout-adder-muscles-header">
            <label className="workout-adder-form-label">Muscles</label>
            <div className="workout-adder-muscles-info" style={{ color: 'var(--text-tertiary)' }}>
              <InformationCircleIcon 
                className="h-3 w-3" 
                style={{ 
                  width: '12px',
                  height: '12px',
                  minWidth: '12px',
                  minHeight: '12px'
                }}
              />
              <span>Workouts can be given activation ratings that range from 0-100. Muscles prioritized by the movement should have higher ratings. Examples: Bench Press: chest-100, triceps-75, front delt-40. Squats: quads-100, hamstrings-90, glutes-95, abs-20, abductor-90, adductor-90.</span>
            </div>
          </div>
          
          <div className="workout-adder-muscles-list">
            {formData.muscles.map((muscle, index) => (
              <div key={index} className="workout-adder-muscle-item" style={{ borderColor: 'var(--border-color)' }}>
                <select
                  value={muscle.muscle}
                  onChange={(e) => updateMuscle(index, 'muscle', e.target.value)}
                  className="workout-adder-form-input workout-adder-muscle-select"
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
                >
                  <option value="">Select muscle</option>
                  {Object.entries(muscles).map(([groupName, groupMuscles]) => (
                    <optgroup key={groupName} label={groupName}>
                      {groupMuscles.map(muscleOption => (
                        <option key={muscleOption.muscles_id} value={muscleOption.muscles_id}>
                          {muscleOption.muscle_name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                
                <div className="workout-adder-muscle-controls">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={muscle.activation_rating}
                    onChange={(e) => updateMuscle(index, 'activation_rating', e.target.value)}
                    className="workout-adder-muscle-slider"
                    style={{
                      backgroundColor: getSliderColor(muscle.activation_rating),
                      borderRadius: '10px'
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={muscle.activation_rating}
                    onChange={(e) => updateMuscle(index, 'activation_rating', e.target.value)}
                    className="workout-adder-form-input workout-adder-muscle-rating-input"
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
                </div>
                
                <button
                  type="button"
                  onClick={() => removeMuscle(index)}
                  className="workout-adder-remove-muscle-button"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addMuscle}
              className="workout-adder-add-muscle-button"
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-normal)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Muscle</span>
            </button>
          </div>
        </div>

        {/* Make Public */}
        <div className="workout-adder-checkbox-group">
          <input
            type="checkbox"
            id="make_public"
            name="make_public"
            checked={formData.make_public}
            onChange={handleInputChange}
            className="workout-adder-checkbox"
            style={{
              width: '18px',
              height: '18px',
              accentColor: 'var(--accent-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-sm)'
            }}
          />
          <label htmlFor="make_public" className="workout-adder-form-label">Make this workout public</label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isCreating || formData.muscles.length === 0}
          className="workout-adder-submit-button"
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-on-primary)',
            backgroundColor: 'var(--accent-color)',
            border: '1px solid var(--accent-color)',
            borderRadius: 'var(--border-radius)',
            opacity: (isCreating || formData.muscles.length === 0) ? 0.5 : 1,
            cursor: (isCreating || formData.muscles.length === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {isCreating ? 'Creating Workout...' : 'Create Workout'}
        </button>
      </form>
      
      <style jsx>{`
        .workout-adder-container {
          padding: var(--space-6);
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
        }

        .workout-adder-header {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-6);
          font-family: var(--font-primary);
        }

        .workout-adder-error-message {
          margin-bottom: var(--space-4);
          padding: var(--space-4);
          background: var(--error-light);
          border: 1px solid var(--error-primary);
          color: var(--error-primary);
          border-radius: var(--radius-md);
          font-family: var(--font-primary);
        }

        .workout-adder-success-message {
          margin-bottom: var(--space-4);
          padding: var(--space-4);
          background: var(--success-light);
          border: 1px solid var(--success-primary);
          color: var(--success-primary);
          border-radius: var(--radius-md);
          font-family: var(--font-primary);
        }

        .workout-adder-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .workout-adder-form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .workout-adder-form-label {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          font-family: var(--font-primary);
        }

        .workout-adder-form-input {
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-base);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .workout-adder-form-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
        }

        .workout-adder-icon-selector {
          position: relative;
          margin-top: var(--space-2);
        }

        .workout-adder-icon-dropdown-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-base);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
        }

        .workout-adder-icon-dropdown-button:hover {
          background: var(--bg-tertiary);
        }

        .workout-adder-icon-dropdown-menu {
          position: absolute;
          z-index: 10;
          margin-top: var(--space-1);
          width: 100%;
          background: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          min-width: 320px;
        }

        .workout-adder-icon-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: var(--space-1);
          padding: var(--space-2);
          max-height: 192px;
          overflow-y: auto;
        }

        .workout-adder-icon-button {
          padding: var(--space-1);
          font-size: var(--text-lg);
          border-radius: var(--radius-md);
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
          cursor: pointer;
          background: transparent;
          border: none;
          min-width: 32px;
          min-height: 32px;
          width: 32px;
          height: 32px;
        }

        .workout-adder-icon-button:hover {
          background: var(--bg-hover);
        }

        .workout-adder-icon-button-selected {
          background: var(--accent-light);
        }

        .workout-adder-muscles-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-3);
        }

        .workout-adder-muscles-info {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .workout-adder-muscles-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .workout-adder-muscle-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
        }

        .workout-adder-muscle-select {
          flex: 1;
        }

        .workout-adder-muscle-controls {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .workout-adder-muscle-slider {
          width: 128px;
          height: 24px;
          -webkit-appearance: none;
          appearance: none;
          border-radius: 12px;
          outline: none;
        }

        .workout-adder-muscle-slider::-webkit-slider-thumb {
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

        .workout-adder-muscle-slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 3px solid #333;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .workout-adder-muscle-slider::-webkit-slider-track {
          height: 24px;
          border-radius: 12px;
          background: transparent;
          border: none;
        }

        .workout-adder-muscle-slider::-moz-range-track {
          height: 24px;
          border-radius: 12px;
          background: transparent;
          border: none;
        }

        .workout-adder-muscle-rating-input {
          width: 64px;
          text-align: center;
          padding: var(--space-2);
        }

        .workout-adder-remove-muscle-button {
          padding: var(--space-1);
          color: var(--error-primary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
        }

        .workout-adder-remove-muscle-button:hover {
          color: var(--error-dark);
          background: var(--error-light);
          border-radius: var(--radius-sm);
        }

        .workout-adder-add-muscle-button {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-base);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
        }

        .workout-adder-add-muscle-button:hover {
          background: var(--bg-tertiary);
        }

        .workout-adder-checkbox-group {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .workout-adder-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--accent-primary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
        }

        .workout-adder-submit-button {
          width: 100%;
          padding: var(--space-4) var(--space-6);
          background: var(--accent-primary);
          color: var(--text-on-primary);
          border: 1px solid var(--accent-primary);
          border-radius: var(--radius-md);
          font-family: var(--font-primary);
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
        }

        .workout-adder-submit-button:hover:not(:disabled) {
          background: var(--accent-dark);
          border-color: var(--accent-dark);
        }

        .workout-adder-submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default WorkoutAdder;
