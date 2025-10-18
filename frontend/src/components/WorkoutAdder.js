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
    <div className="form-container">
      <h2 className="text-2xl font-bold mb-6">Add New Workout</h2>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Icon Selection */}
        <div>
          <label className="form-label">Workout Icon</label>
          <div className="relative mt-2">
            <button
              type="button"
              onClick={() => setIsEmojiDropdownOpen(!isEmojiDropdownOpen)}
              className="btn btn-secondary w-full flex items-center justify-between px-4 py-2"
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
                className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  minWidth: '320px'
                }}
              >
                <div className="grid grid-cols-10 gap-1 p-2 max-h-48 overflow-y-auto" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
                  {availableIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => {
                        setSelectedIcon(icon);
                        setIsEmojiDropdownOpen(false);
                      }}
                      className={`p-1 text-lg rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center aspect-square ${
                        selectedIcon === icon 
                          ? 'bg-blue-100 dark:bg-blue-900' 
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
        <div>
          <label htmlFor="workout_name" className="form-label">Workout Name</label>
          <input
            type="text"
            id="workout_name"
            name="workout_name"
            value={formData.workout_name}
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
            placeholder="Enter workout name"
          />
        </div>

        {/* Equipment Brand */}
        <div>
          <label htmlFor="equipment_brand" className="form-label">Equipment Brand</label>
          <input
            type="text"
            id="equipment_brand"
            name="equipment_brand"
            value={formData.equipment_brand}
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
            placeholder="e.g., Rogue, Eleiko"
          />
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="form-label">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
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
        <div>
          <label htmlFor="location" className="form-label">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
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
            placeholder="e.g., Home gym, Commercial gym"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="form-label">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
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
            rows="3"
            placeholder="Additional notes about the workout"
          />
        </div>

        {/* Muscles */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="form-label">Muscles</label>
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
              <span>Workouts can be given activation ratings that range from 0-100. Muscles prioritized by the movement should have higher ratings. Examples: Bench Press: chest-100, triceps-75, front delt-40. Squats: quads-100, hamstrings-90, glutes-95, abs-20, abductor-90, adductor-90.</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {formData.muscles.map((muscle, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded" style={{ borderColor: 'var(--border-color)' }}>
                <select
                  value={muscle.muscle}
                  onChange={(e) => updateMuscle(index, 'muscle', e.target.value)}
                  className="form-input flex-1"
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
                
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={muscle.activation_rating}
                    onChange={(e) => updateMuscle(index, 'activation_rating', e.target.value)}
                    className="w-32 h-6 slider"
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
                </div>
                
                <button
                  type="button"
                  onClick={() => removeMuscle(index)}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addMuscle}
              className="btn btn-secondary flex items-center space-x-2 px-4 py-2"
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
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="make_public"
            name="make_public"
            checked={formData.make_public}
            onChange={handleInputChange}
            className="form-checkbox"
            style={{
              width: '18px',
              height: '18px',
              accentColor: 'var(--accent-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-sm)'
            }}
          />
          <label htmlFor="make_public" className="form-label">Make this workout public</label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isCreating || formData.muscles.length === 0}
          className="btn btn-primary w-full px-6 py-3"
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
    </div>
  );
};

export default WorkoutAdder;
