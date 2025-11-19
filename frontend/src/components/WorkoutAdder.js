import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PlusIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { getMuscleDescription } from '../utils/muscleDescriptions';

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
  const [activeMuscleDescription, setActiveMuscleDescription] = useState(null);
  const [showMuscleInstructionsTooltip, setShowMuscleInstructionsTooltip] = useState(false);
  const [availableIcons] = useState([
    // Energy & Power
    '⚡', '🔥', '💥', '💢', '💫', '✨', '🌟', '⭐', '🌠', '☄️',
    '🌪️', '🌊', '💧', '💦', '🌧️', '⛈️', '🌩️', '💎', '💍',
    
    // Nature & Elements
    '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑',
    '🌒', '🌓', '🌔', '🌙', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️',
    '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌈', '☔', '🌋', '🏔️',
    '⛰️', '🌲', '🌳', '🌿', '🍀', '🌱', '🌾', '🌵', '🌴', '🌰',
    '🍄', '🌺', '🌻', '🌷', '🌸', '🌼', '🌹', '🥀',
    
    // Objects & Tools
    '🔨', '⚒️', '🛠️', '⚙️', '🔧', '🔩', '⚖️', '🔗', '⛓️', '🧲',
    '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💻', '🖥️', '🖨️',
    '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸',
    '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻',
    '🔌', '🔋', '🔍', '🔎', '🔦', '🕯️', '💡', '🪔',
    
    // Symbols & Signs
    '⚛️', '🕉️', '✡️', '☸️', '☯️', '✝️', '☦️', '☪️', '☮️', '🕎',
    '🔯', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
    '♑', '♒', '♓', '⛎', '🔀', '🔁', '🔂', '🔃', '🔄', '🔅',
    '🔆', '🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕',
    '⚕️', '🛡️', '⚔️', '🗡️', '🏹',
    
    // Miscellaneous
    '🎭', '🎨', '🎪', '🎯', '🎲', '🎳', '🎮', '🕹️', '🎰', '🧩',
    '🎱', '🔮', '🪄', '🧿', '🪬', '🎊', '🎉', '🎈', '🎁', '🎀',
    '🎗️', '🏵️', '🎖️', '🏅', '🥇', '🥈', '🥉', '🏆', '📜', '📄',
    '📃', '📑', '📊', '📈', '📉', '📋', '📌', '📍', '📎', '🖇️',
    '✂️', '📏', '📐',
    
    // Additional Objects
    '🔑', '🗝️', '🔐', '🔒', '🔓', '🔏',
    '🏺', '🪣', '🪤', '🪥', '🪦', '🪧', '🪨', '🪩', '🪪', '🪫',
    '🪭', '🪮', '🪯', '🪰', '🪱', '🪲', '🪳', '🪴', '🪵',
    '🪶', '🪷', '🪸', '🪹', '🪺', '🪻', '🪼',
    
    // Animals & Insects (non-sports)
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
    '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
    '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
    '🕷️', '🦂', '🦗', '🦟',
    
    // Food & Drinks
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑',
    '🍍', '🥭', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽',
    '🥕', '🥔', '🥐', '🥨', '🥯', '🥖', '🧀', '🍖',
    '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯',
    '🥙', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧇',
    '🥞', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝',
    '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀',
    '🦞', '🦐', '🦑', '🦪',
    
    // Transport
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
    '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
    '🚁', '✈️', '🛫', '🛬', '🛩️', '💺', '🚀', '🛸', '🛥️',
    '⛵', '🚣', '🚢', '🚂',
    
    // Buildings & Structures
    '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪',
    '🏫', '🏬', '🏭', '🏯', '🏰', '🗼', '🗽', '⛪', '🕌', '🛕',
    '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌆', '🌇',
    
    // Weather & Time
    '🌉', '🌌', '🌍', '🌎', '🌏', '🌐', '⏰',
    
    // Tech & Objects
    '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙',
    '🕚', '🕛', '⌚', '🎙️', '🎚️', '🎛️', '🧭', '🗜️',
    
    // Removed problematic emoji ranges: 🫛-🫠, 🫨-🫰, 🫸-end, and 🪽-🪿
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEmojiDropdownOpen && !event.target.closest('.workout-adder-icon-selector')) {
        setIsEmojiDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmojiDropdownOpen]);

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

  const handleMuscleClick = (muscleName) => {
    if (activeMuscleDescription === muscleName) {
      setActiveMuscleDescription(null);
    } else {
      setActiveMuscleDescription(muscleName);
    }
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

      console.log('Creating workout with data:', workoutData);
      const response = await api.createWorkout(workoutData);
      console.log('Workout creation response:', response.data);
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
      // Log more detailed error information
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
      }
      const errorMessage = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to create workout';
      setError(errorMessage);
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
        <div className="workout-adder-form-layout">
          {/* Left Side - Workout Details (60%) */}
          <div className="workout-adder-left-section">
             {/* Workout Name with Icon */}
        <div className="workout-adder-form-group">
               <label htmlFor="workout_name" className="workout-adder-form-label">Workout Name</label>
               <div className="workout-name-with-icon">
          <div className="workout-adder-icon-selector">
            <button
              type="button"
              onClick={() => setIsEmojiDropdownOpen(!isEmojiDropdownOpen)}
              className="workout-adder-icon-dropdown-button"
                   >
                     <span style={{ fontSize: '28px' }}>{selectedIcon}</span>
            </button>
            
            {isEmojiDropdownOpen && (
              <div 
                className="workout-adder-icon-dropdown-menu"
                       onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                         minWidth: '800px'
                }}
              >
                       <div className="workout-adder-icon-grid" style={{ gridTemplateColumns: 'repeat(20, 1fr)', gap: '6px', padding: '10px' }}>
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
                               minWidth: '30px',
                               minHeight: '30px',
                               width: '30px',
                               height: '30px',
                               fontSize: '18px',
                               borderRadius: '4px',
                               border: selectedIcon === icon ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                               transition: 'all 0.2s ease'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <input
            type="text"
            id="workout_name"
            name="workout_name"
            value={formData.workout_name}
            onChange={handleInputChange}
            className="workout-adder-form-input"
            required
            placeholder="Enter workout name"
          />
               </div>
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
                 rows="8"
            placeholder="Additional notes about the workout"
          />
            </div>
        </div>

          {/* Right Side - Muscle Selection (40%) */}
          <div className="workout-adder-right-section">
        {/* Muscles */}
        <div className="workout-adder-form-group">
          <div className="workout-adder-muscles-header">
                 <div className="muscles-title-with-tooltip">
                   <h3 className="muscles-section-title">Muscle Activation Ratings</h3>
                   <button
                     type="button"
                     className="muscle-instructions-tooltip-trigger"
                     onClick={() => setShowMuscleInstructionsTooltip(!showMuscleInstructionsTooltip)}
                     title="Click for activation rating guidelines"
                   >
                     <InformationCircleIcon style={{ width: '20px', height: '20px' }} />
                   </button>
            </div>
                 
                 {showMuscleInstructionsTooltip && (
                   <div className="muscle-instructions-tooltip">
                     <div className="muscles-instructions">
                       <p><strong>How to set activation ratings:</strong></p>
                       <ul>
                         <li><strong>Primary muscles:</strong> 80-100 (main movers)</li>
                         <li><strong>Secondary muscles:</strong> 40-79 (assisting muscles)</li>
                         <li><strong>Stabilizers:</strong> 10-39 (supporting muscles)</li>
                         <li><strong>Minimal activation:</strong> 0-9 (barely involved)</li>
                       </ul>
                       <p><strong>Examples:</strong></p>
                       <ul>
                         <li><strong>Bench Press:</strong> Chest (100), Triceps (75), Front Delts (40)</li>
                         <li><strong>Squats:</strong> Quads (100), Hamstrings (90), Glutes (95), Abs (20)</li>
                       </ul>
                     </div>
                   </div>
                 )}
          </div>
          
          <div className="workout-adder-muscles-list">
                {formData.muscles.map((muscle, index) => {
                  // Get muscle name for description
                  const muscleName = muscle.muscle ? Object.values(muscles)
                    .flat()
                    .find(m => m.muscles_id === parseInt(muscle.muscle))?.muscle_name : null;
                  
                  return (
              <div key={index} className="workout-adder-muscle-item" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="workout-adder-muscle-header">
                        <div className="workout-adder-muscle-select-container">
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
                              padding: 'var(--spacing-sm) var(--spacing-md)',
                              flex: 1
                  }}
                  required
                >
                  <option value="">Select muscle</option>
                  {Object.entries(muscles).map(([groupName, groupMuscles]) => (
                    <optgroup key={groupName} label={groupName}>
                      {groupMuscles.map(muscleOption => (
                        <option key={muscleOption.muscles_id} value={muscleOption.muscles_id}>
                                    {muscleOption.muscle_name.charAt(0).toUpperCase() + muscleOption.muscle_name.slice(1)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                          {muscleName && (
                            <button 
                              type="button"
                              className="muscle-description-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMuscleClick(muscleName);
                              }}
                              title="Click to view muscle description"
                            >
                              <InformationCircleIcon style={{ width: '22px', height: '22px' }} />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMuscle(index)}
                          className="workout-adder-remove-muscle-button"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                
                <div className="workout-adder-muscle-controls">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={muscle.activation_rating}
                        onChange={(e) => updateMuscle(index, 'activation_rating', parseInt(e.target.value))}
                    className="workout-adder-muscle-slider"
                    style={{
                      backgroundColor: getSliderColor(muscle.activation_rating),
                      borderRadius: '10px'
                    }}
                  />
                    <div className="muscle-rating-stepper">
                      <button
                        type="button"
                        className="stepper-button stepper-decrease"
                        onClick={() => updateMuscle(index, 'activation_rating', Math.max(0, parseInt(muscle.activation_rating) - 1))}
                      >
                        −
                      </button>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={muscle.activation_rating}
                        onChange={(e) => updateMuscle(index, 'activation_rating', parseInt(e.target.value))}
                        className="workout-adder-form-input workout-adder-muscle-rating-input stepper-input"
                    required
                  />
                <button
                  type="button"
                        className="stepper-button stepper-increase"
                        onClick={() => updateMuscle(index, 'activation_rating', Math.min(100, parseInt(muscle.activation_rating) + 1))}
                >
                        +
                </button>
              </div>
                    </div>
                  </div>
                );
                })}
            
            <button
              type="button"
              onClick={addMuscle}
              className="workout-adder-add-muscle-button"
                >
                  <PlusIcon style={{ width: '20px', height: '20px' }} />
              <span>Add Muscle</span>
            </button>
          </div>
        </div>
          </div>
        </div>
      </form>

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
        onClick={handleSubmit}
        >
          {isCreating ? 'Creating Workout...' : 'Create Workout'}
        </button>

      {/* Muscle Description Overlay */}
      {activeMuscleDescription && (
        <div className="muscle-description-overlay" onClick={() => setActiveMuscleDescription(null)}>
          <div className="muscle-description-modal" onClick={(e) => e.stopPropagation()}>
            <div className="muscle-description-header">
              <h2 className="muscle-description-title">{activeMuscleDescription}</h2>
              <button
                className="muscle-description-close"
                onClick={() => setActiveMuscleDescription(null)}
              >
                ×
              </button>
            </div>
            <div className="muscle-description-content">
              <div className="muscle-description-detail">
                <strong>Description:</strong> {getMuscleDescription(activeMuscleDescription).description}
              </div>
              <div className="muscle-description-detail">
                <strong>Location:</strong> {getMuscleDescription(activeMuscleDescription).location}
              </div>
              <div className="muscle-description-detail">
                <strong>Function:</strong> {getMuscleDescription(activeMuscleDescription).function}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx="true">{`
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
          margin-bottom: var(--space-2);
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
          gap: var(--space-4);
        }

        .workout-adder-form-layout {
          display: flex;
          gap: var(--space-4);
          align-items: flex-start;
        }

        .workout-adder-left-section {
          flex: 0 0 60%;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .workout-adder-right-section {
          flex: 0 0 40%;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-width: 40%;
          overflow: visible;
        }

        .workout-adder-muscle-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          width: 100%;
        }

        .workout-adder-muscle-select-container {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex: 1;
        }

        .muscle-description-icon {
          cursor: pointer;
          font-size: var(--text-sm);
          opacity: 0.7;
          transition: opacity 0.3s ease;
          flex-shrink: 0;
          background: none;
          border: none;
          padding: 0;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
        }

        .muscle-description-icon:hover {
          opacity: 1;
        }

        .muscle-description-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .muscle-description-modal {
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: var(--shadow-xl);
        }

        .muscle-description-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }

        .muscle-description-title {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin: 0;
        }

        .muscle-description-close {
          background: none;
          border: none;
          font-size: var(--text-2xl);
          color: var(--text-secondary);
          cursor: pointer;
          padding: var(--space-1);
          line-height: 1;
        }

        .muscle-description-close:hover {
          color: var(--text-primary);
        }

        .muscle-description-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .muscle-description-detail {
          color: var(--text-primary);
          line-height: 1.6;
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

         .workout-name-with-icon {
           display: flex;
           align-items: center;
           gap: var(--space-3);
         }

         .workout-name-with-icon .workout-adder-icon-selector {
           flex-shrink: 0;
         }

         .workout-name-with-icon .workout-adder-icon-dropdown-button {
           width: 60px;
           height: 48px;
           padding: 0;
           display: flex;
           align-items: center;
           justify-content: center;
           text-align: center;
         }

         .workout-name-with-icon .workout-adder-form-input {
           flex: 1;
           height: 48px;
         }

        .workout-adder-form-input {
          padding: var(--space-3) var(--space-4);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          transition: all 0.3s ease;
          box-shadow: var(--shadow-sm);
          height: 48px;
        }

        .workout-adder-form-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: var(--bg-tertiary);
        }

         .workout-adder-form-input:hover {
           border-color: var(--accent-primary);
           transform: translateY(-1px);
           box-shadow: var(--shadow-md);
         }

         textarea.workout-adder-form-input {
           height: auto;
           min-height: 180px;
           resize: vertical;
        }

        .workout-adder-icon-selector {
          position: relative;
          margin: 0;
        }

        .workout-adder-icon-dropdown-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-2) var(--space-3);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          height: 40px;
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
           border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
           min-width: 800px;
        }

        .workout-adder-icon-grid {
          display: grid;
          grid-template-columns: repeat(20, 1fr);
          gap: var(--space-2);
          padding: var(--space-4);
          max-height: 400px;
          overflow-y: auto;
        }

        .workout-adder-icon-button {
          padding: var(--space-1);
          font-size: var(--text-base);
          border-radius: var(--radius-sm);
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
          cursor: pointer;
          background: transparent;
          border: none;
          min-width: 30px;
          min-height: 30px;
          width: 30px;
          height: 30px;
        }

        .workout-adder-icon-button:hover {
          background: var(--bg-hover);
        }

        .workout-adder-icon-button-selected {
          background: var(--accent-light);
        }

        .workout-adder-muscles-header {
           position: relative;
           margin-bottom: 0;
           overflow: visible;
         }

         .muscles-title-with-tooltip {
          display: flex;
          align-items: center;
           gap: var(--space-2);
           margin-bottom: 0;
         }

         .muscles-section-title {
           margin: 0;
           display: flex;
           align-items: center;
         }

         .muscle-instructions-tooltip-trigger {
           background: none;
           border: none;
           font-size: var(--text-lg);
           cursor: pointer;
           padding: 0;
           border-radius: var(--radius-sm);
           transition: all 0.2s ease;
           display: flex;
           align-items: center;
           justify-content: center;
           width: 24px;
           height: 24px;
           margin: 0;
           color: var(--accent-primary);
         }

         .muscle-instructions-tooltip-trigger:hover {
           background: var(--bg-tertiary);
           color: var(--accent-dark);
         }

         .muscle-instructions-tooltip {
           position: absolute;
           top: 100%;
           left: 0;
           z-index: 20;
           background: var(--bg-primary);
           border: 2px solid var(--border-primary);
           border-radius: var(--radius-md);
           box-shadow: var(--shadow-lg);
           padding: var(--space-4);
           margin-top: var(--space-2);
           width: 100%;
           max-width: 400px;
           overflow: visible;
         }

        .muscles-section-title {
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin: 0;
        }

        .muscles-instructions {
          color: var(--text-secondary);
          font-size: var(--text-sm);
          line-height: 1.5;
        }

        .muscles-instructions p {
          margin: 0 0 var(--space-2) 0;
        }

        .muscles-instructions ul {
          margin: 0 0 var(--space-3) 0;
          padding-left: var(--space-4);
        }

        .muscles-instructions li {
          margin-bottom: var(--space-1);
        }

        .muscles-instructions strong {
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
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
          gap: var(--space-2);
        }

        .workout-adder-muscle-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          padding: var(--space-3);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          width: 100%;
          box-sizing: border-box;
        }

        .workout-adder-muscle-select {
          flex: 1;
        }

        .workout-adder-muscle-controls {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          width: 100%;
        }

        .workout-adder-muscle-slider {
          flex: 1;
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
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
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
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-family: var(--font-primary);
          font-size: var(--text-base);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          height: 48px;
          font-weight: var(--font-weight-medium);
          margin-top: calc(var(--space-1) * -1);
        }

        .muscle-rating-stepper {
          display: flex;
          align-items: center;
          gap: 0;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 2px solid var(--border-primary);
        }

        .stepper-button {
          background: var(--bg-tertiary);
          border: none;
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          padding: var(--space-1) var(--space-2);
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 28px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stepper-decrease {
          border-radius: var(--radius-lg) 0 0 var(--radius-lg);
        }

        .stepper-increase {
          border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
        }

        .stepper-button:hover {
          background: var(--accent-primary);
          color: var(--text-on-primary);
        }

        .stepper-input {
          border-left: none !important;
          border-right: none !important;
          border-radius: 0 !important;
          width: 60px !important;
          height: 32px !important;
          padding: var(--space-1) !important;
          font-size: var(--text-sm) !important;
          text-align: center !important;
        }

        .workout-adder-checkbox-group {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: var(--space-6);
          margin-bottom: var(--space-6);
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
          padding: var(--space-2) var(--space-4);
          background: var(--accent-primary);
          color: var(--text-on-primary);
          border: 2px solid var(--accent-primary);
          border-radius: var(--radius-md);
          font-family: var(--font-primary);
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          height: 40px;
          margin-top: var(--space-4);
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
