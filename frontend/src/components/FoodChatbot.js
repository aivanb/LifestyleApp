import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import voiceService from '../services/voiceService';

/**
 * FoodChatbot Component
 * 
 * AI-powered food logging chatbot with:
 * - Text input for typing food descriptions
 * - Voice input with automatic recording
 * - Parse and log multiple foods with inline preview
 * - Create meals from parsed foods
 */
const FoodChatbot = ({ onFoodsLogged }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [createMeal, setCreateMeal] = useState(false);
  const [aiStats, setAiStats] = useState({ tokens: 0, prompts: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewInputText, setPreviewInputText] = useState('');
  const [editedFoods, setEditedFoods] = useState([]);

  const timerRef = useRef(null);

  const textareaRef = useRef(null);
  const previewTextareaRef = useRef(null);

  useEffect(() => {
    loadAiStats();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (voiceService.isCurrentlyRecording()) {
        voiceService.stopRecording();
      }
    };
  }, []);

  // Auto-resize textarea on input change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  useEffect(() => {
    if (previewTextareaRef.current) {
      previewTextareaRef.current.style.height = 'auto';
      previewTextareaRef.current.style.height = `${previewTextareaRef.current.scrollHeight}px`;
    }
  }, [previewInputText]);

  const loadAiStats = async () => {
    try {
      const response = await api.getUsageStats();
      if (response.data && response.data.data) {
        setAiStats({
          tokens: response.data.data.total_tokens || 0,
          prompts: response.data.data.total_requests || 0
        });
      }
    } catch (err) {
      console.error('Failed to load AI stats:', err);
      setAiStats({ tokens: 0, prompts: 0 });
    }
  };

  const startVoiceRecording = async () => {
    if (!voiceService.isVoiceSupported()) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    setError('');
    setInterimText('');
    setRecordingTime(0);
    setIsRecording(true);

    const success = await voiceService.startRecording(
      (result) => {
        if (result.isFinal && result.final) {
          setInputText(prev => (prev + ' ' + result.final).trim());
          setInterimText('');
        } else {
          setInterimText(result.interim);
        }
      },
      (error) => {
        setError(`Recognition error: ${error}`);
        stopVoiceRecording();
      }
    );

    if (!success) {
      setError('Failed to start recording');
      setIsRecording(false);
      return;
    }

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 60) {
          stopVoiceRecording();
          return 60;
        }
        return newTime;
      });
    }, 1000);
  };

  const stopVoiceRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    voiceService.stopRecording();
    setIsRecording(false);
  };

  const handlePreview = async () => {
    const textToUse = inputText.trim() || interimText.trim();
    if (!textToUse) {
      setError('Please enter food description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.parseFoodInput(textToUse, createMeal, true);
      console.log('Parse response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      // Handle both success (200) and partial success (207) responses
      // Backend returns: {data: result} on 200, or {error: {...}, data: result} on 207
      let result = null;
      
      // Check for data in response.data.data (200 success case)
      if (response.data && response.data.data) {
        result = response.data.data;
      }
      // Check for data at response.data level (207 partial success case)
      else if (response.data && response.data.data === undefined && (response.data.foods_parsed !== undefined || response.data.errors !== undefined)) {
        result = response.data;
      }
      // Fallback to response.data if it looks like a result object
      else if (response.data && typeof response.data === 'object' && !response.data.error) {
        result = response.data;
      }

      console.log('Extracted result:', result);
      console.log('Foods parsed:', result?.foods_parsed);
      console.log('Result success:', result?.success);
      console.log('Result errors:', result?.errors);

      // Check if we have foods_parsed, even if success is false
      // The backend returns foods_parsed even when success=false if foods were found
      if (result && result.foods_parsed && Array.isArray(result.foods_parsed) && result.foods_parsed.length > 0) {
        setPreviewData(result);
        setPreviewInputText(textToUse);
        setEditedFoods(result.foods_parsed.map(food => ({ ...food })));
        setShowPreview(true);
        setError(''); // Clear any previous errors
        
        // Show warnings if there are errors but still have foods
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          setError(`Warning: ${result.errors.join(', ')}`);
        }
      } else {
        // No foods parsed - show error
        let errorMsg = 'No foods could be parsed from input';
        
        if (result && result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          errorMsg = result.errors.join(', ');
        } else if (response.data?.error) {
          if (typeof response.data.error === 'string') {
            errorMsg = response.data.error;
          } else if (response.data.error.message) {
            errorMsg = response.data.error.message;
          } else if (Array.isArray(response.data.error.details)) {
            errorMsg = response.data.error.details.join(', ');
          }
        }
        
        setError(errorMsg);
        setShowPreview(false);
      }
    } catch (err) {
      console.error('Failed to parse food:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      
      let errorMessage = 'Failed to parse food input';
      
      if (err.response?.data) {
        if (err.response.data.error) {
          if (typeof err.response.data.error === 'string') {
            errorMessage = err.response.data.error;
          } else if (err.response.data.error.message) {
            errorMessage = err.response.data.error.message;
          } else if (Array.isArray(err.response.data.error.details)) {
            errorMessage = err.response.data.error.details.join(', ');
          }
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setShowPreview(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFoodEdit = (index, field, value) => {
    const updated = [...editedFoods];
    if (updated[index].food) {
      updated[index].food = { ...updated[index].food, [field]: value };
    } else if (field === 'servings') {
      updated[index].servings = parseFloat(value) || 0;
    }
    setEditedFoods(updated);
  };

  const handleConfirmLog = async () => {
    if (!previewInputText.trim()) {
      setError('Please enter food description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update foods if metadata was changed
      for (let i = 0; i < editedFoods.length; i++) {
        const edited = editedFoods[i];
        const original = previewData.foods_parsed[i];
        
        if (edited.food && original.food) {
          // Check if any metadata changed
          const metadataChanged = Object.keys(edited.food).some(key => {
            if (key === 'food_id' || key === 'food_name') return false;
            return edited.food[key] !== original.food[key];
          });

          if (metadataChanged) {
            // Update food with edited metadata
            const foodUpdate = {
              serving_size: edited.food.serving_size,
              unit: edited.food.unit,
              calories: edited.food.calories,
              protein: edited.food.protein,
              fat: edited.food.fat,
              carbohydrates: edited.food.carbohydrates,
              fiber: edited.food.fiber,
              sodium: edited.food.sodium,
              sugar: edited.food.sugar,
              saturated_fat: edited.food.saturated_fat,
              trans_fat: edited.food.trans_fat,
              calcium: edited.food.calcium,
              iron: edited.food.iron,
              magnesium: edited.food.magnesium,
              cholesterol: edited.food.cholesterol,
              vitamin_a: edited.food.vitamin_a,
              vitamin_c: edited.food.vitamin_c,
              vitamin_d: edited.food.vitamin_d,
              caffeine: edited.food.caffeine,
              food_group: edited.food.food_group,
              brand: edited.food.brand || '',
              cost: edited.food.cost || null
            };
            
            try {
              await api.updateFood(edited.food.food_id, foodUpdate);
            } catch (err) {
              console.error(`Failed to update food ${edited.food.food_id}:`, err);
            }
          }
        }
      }

      // Now log the foods
      const response = await api.parseFoodInput(previewInputText, createMeal, false);
      const result = response.data.data || response.data;

      // Add to history
      const historyEntry = {
        id: Date.now(),
        input: previewInputText,
        timestamp: new Date().toISOString(),
        foods_parsed: result.foods_parsed || [],
        logs_created: result.logs_created || [],
        meal_created: result.meal_created,
        errors: result.errors || [],
        success: result.success
      };

      setHistory(prev => [historyEntry, ...prev].slice(0, 10));

      // Clear on success
      if (result.success) {
        setInputText('');
        setPreviewInputText('');
        setShowPreview(false);
        setPreviewData(null);
        setEditedFoods([]);
        loadAiStats();
        if (onFoodsLogged) {
          onFoodsLogged();
        }
      } else {
        setError(result.errors ? result.errors.join(', ') : 'Failed to parse food input');
      }
    } catch (err) {
      console.error('Failed to log food:', err);
      setError(err.response?.data?.error?.message || 'Failed to log food');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (isoString) => {
    try {
      if (!isoString) return '';
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString();
    } catch {
      return '';
    }
  };

  const metadataFields = [
    { key: 'serving_size', label: 'Serving Size', type: 'number', step: '0.01' },
    { key: 'unit', label: 'Unit', type: 'text' },
    { key: 'calories', label: 'Calories', type: 'number', step: '0.01' },
    { key: 'protein', label: 'Protein (g)', type: 'number', step: '0.01' },
    { key: 'fat', label: 'Fat (g)', type: 'number', step: '0.01' },
    { key: 'carbohydrates', label: 'Carbs (g)', type: 'number', step: '0.01' },
    { key: 'fiber', label: 'Fiber (g)', type: 'number', step: '0.01' },
    { key: 'sodium', label: 'Sodium (mg)', type: 'number', step: '0.01' },
    { key: 'sugar', label: 'Sugar (g)', type: 'number', step: '0.01' },
    { key: 'saturated_fat', label: 'Saturated Fat (g)', type: 'number', step: '0.01' },
    { key: 'trans_fat', label: 'Trans Fat (g)', type: 'number', step: '0.01' },
    { key: 'calcium', label: 'Calcium (mg)', type: 'number', step: '0.01' },
    { key: 'iron', label: 'Iron (mg)', type: 'number', step: '0.01' },
    { key: 'magnesium', label: 'Magnesium (mg)', type: 'number', step: '0.01' },
    { key: 'cholesterol', label: 'Cholesterol (mg)', type: 'number', step: '0.01' },
    { key: 'vitamin_a', label: 'Vitamin A (IU)', type: 'number', step: '0.01' },
    { key: 'vitamin_c', label: 'Vitamin C (mg)', type: 'number', step: '0.01' },
    { key: 'vitamin_d', label: 'Vitamin D (IU)', type: 'number', step: '0.01' },
    { key: 'caffeine', label: 'Caffeine (mg)', type: 'number', step: '0.01' },
    { key: 'food_group', label: 'Food Group', type: 'select', options: ['fruit', 'vegetable', 'grain', 'protein', 'dairy', 'other'] },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'cost', label: 'Cost', type: 'number', step: '0.01' }
  ];

  return (
    <div className="food-chatbot">
      <div className="chatbot-layout">
        {/* Text Input Card - 80% of left side */}
        <div className="chatbot-input-card">
          <div className="card">
            {error && (
              <div className="error-message mb-4">
                <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Text Input with Voice Recording */}
            <div className="form-group">
              <label className="form-label">Describe your food</label>
              <div className="input-with-voice">
              <textarea
                  ref={textareaRef}
                  className="form-input chatbot-textarea"
                value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                  }}
                  placeholder={isRecording ? "Listening..." : "Type or use voice to describe your food"}
                  disabled={loading}
                rows="3"
                  style={{ minHeight: '60px', maxHeight: '300px', overflowY: 'auto' }}
                />
                {interimText && (
                  <div className="interim-text text-sm text-tertiary mt-1">
                    <em>{interimText}</em>
                  </div>
                )}
                {isRecording && (
                  <div className="recording-indicator">
                    <div className="recording-dot"></div>
                    <span className="text-sm font-medium" style={{ color: 'var(--accent-danger)' }}>
                      Recording: {formatTime(recordingTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Create Meal Option */}
            <div className="form-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={createMeal}
                  onChange={(e) => setCreateMeal(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label">
                  Create this as a meal
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-6 justify-center">
              <button
                className={`btn btn-voice-logger ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                disabled={loading}
                title={isRecording ? 'Stop Recording' : 'Voice Logger'}
              >
                <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                Voice Logger
              </button>

              <button
                className="btn btn-primary"
                onClick={handlePreview}
                disabled={loading || (!inputText.trim() && !interimText.trim())}
                title={loading ? 'Parsing...' : 'Parse Food'}
              >
                <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                Parse Food
              </button>
            </div>

            {/* Inline Preview Section */}
            {showPreview && previewData && editedFoods.length > 0 && (
              <div className="preview-section">
                <div className="preview-header">
                  <h3>Preview Foods to Log</h3>
                  <button className="btn-icon-close" onClick={() => {
                    setShowPreview(false);
                    setPreviewData(null);
                    setEditedFoods([]);
                  }}>
                    <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Edit Input Text</label>
                  <textarea
                    ref={previewTextareaRef}
                    className="form-input chatbot-textarea"
                    value={previewInputText}
                    onChange={(e) => {
                      setPreviewInputText(e.target.value);
                    }}
                    rows="2"
                    style={{ minHeight: '40px', maxHeight: '200px', overflowY: 'auto' }}
                  />
                </div>

                <div className="preview-foods-list">
                  {editedFoods.map((food, index) => (
                    <div key={index} className="preview-food-card">
                      <div className="preview-food-header">
                        <h4>{food.name}</h4>
                        <div className="servings-input">
                          <label>Servings:</label>
                          <input
                            type="number"
                            step="0.1"
                            value={food.servings}
                            onChange={(e) => handleFoodEdit(index, 'servings', e.target.value)}
                            className="form-input-small"
                          />
                        </div>
                      </div>

                      {food.food && (
                        <div className="preview-food-metadata">
                          <div className="metadata-grid">
                            {metadataFields.map((field) => (
                              <div key={field.key} className="metadata-field">
                                <label className="metadata-label">{field.label}</label>
                                {field.type === 'select' ? (
                                  <select
                                    value={food.food[field.key] || ''}
                                    onChange={(e) => handleFoodEdit(index, field.key, e.target.value)}
                                    className="form-input-small"
                                  >
                                    {field.options.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={field.type}
                                    step={field.step}
                                    value={food.food[field.key] || ''}
                                    onChange={(e) => handleFoodEdit(index, field.key, e.target.value)}
                                    className="form-input-small"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {food.error && (
                        <div className="error-message-small mt-2">
                          {food.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {previewData.errors && previewData.errors.length > 0 && (
                  <div className="error-message mt-4">
                    <strong>Errors:</strong>
                    <ul>
                      {previewData.errors.map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="preview-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setPreviewInputText(previewInputText);
                      setShowPreview(false);
                      handlePreview();
                    }}
                    disabled={loading}
                  >
                    Re-parse
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmLog}
                    disabled={loading}
                  >
                    Log Foods
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Usage Statistics - 20% of right side */}
        <div className="chatbot-stats-card">
          <div className="card">
            <div className="ai-stats-grid">
              <div className="stat-item">
                <div className="stat-label">Prompts Sent (past 10 days)</div>
                <div className="stat-value">{aiStats.prompts}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Tokens Used (past 10 days)</div>
                <div className="stat-value">{aiStats.tokens.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Interactions */}
      {history.length > 0 && (
        <div className="card">
          <div className="history-list">
            {history.map((entry) => (
              <div key={entry.id} className="history-item card animate-slide-in-left" style={{ background: 'var(--bg-tertiary)', marginBottom: 'var(--space-2)', padding: 'var(--space-3)' }}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-tertiary">{formatTimestamp(entry.timestamp)}</span>
                  {entry.success ? (
                    <span className="badge badge-success text-xs">Success</span>
                  ) : (
                    <span className="badge badge-danger text-xs">Partial</span>
                  )}
                </div>

                <div className="mb-2">
                  <strong className="text-sm">You:</strong>
                  <p className="text-sm text-secondary mb-0 mt-1">{entry.input}</p>
                </div>

                <div>
                  <strong className="text-sm">Result:</strong>
                  <p className="text-sm text-secondary mb-0 mt-1">
                    {entry.logs_created.length} food(s) logged
                    {entry.meal_created && ` • Meal "${entry.meal_created.meal_name}" created`}
                  </p>
                  
                  {entry.errors.length > 0 && (
                    <p className="text-xs mt-1" style={{ color: 'var(--accent-warning)' }}>
                      Errors: {entry.errors.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .chatbot-layout {
          display: grid;
          grid-template-columns: 80% 20%;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .chatbot-input-card {
          display: flex;
          flex-direction: column;
        }

        .chatbot-stats-card {
          display: flex;
          flex-direction: column;
        }

        .chatbot-textarea {
          width: 100%;
          resize: none;
          box-sizing: border-box;
        }

        .input-with-voice {
          position: relative;
        }

        .interim-text {
          font-style: italic;
          opacity: 0.7;
          margin-top: var(--space-1);
        }

        .recording-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: var(--space-2);
        }

        .recording-dot {
          width: 12px;
          height: 12px;
          border-radius: var(--radius-full);
          background: var(--accent-danger);
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          cursor: pointer;
          user-select: none;
        }

        .checkbox-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .checkbox-custom {
          position: relative;
          width: 20px;
          height: 20px;
          background: var(--bg-secondary);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-sm);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .checkbox-input:checked + .checkbox-custom {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 1px;
          width: 6px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .btn-voice-logger {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
        }

        .btn-voice-logger.recording {
          background: var(--accent-danger);
          color: white;
          border-color: var(--accent-danger);
        }

        .stat-item {
          text-align: center;
          padding: var(--space-4);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }

        .stat-value {
          font-size: var(--text-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--accent-primary);
          margin-bottom: var(--space-1);
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .preview-section {
          margin-top: var(--space-6);
          padding-top: var(--space-6);
          border-top: 2px solid var(--border-primary);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }

        .preview-header h3 {
          margin: 0;
        }

        .btn-icon-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--space-2);
          color: var(--text-secondary);
          transition: color 0.2s;
        }

        .btn-icon-close:hover {
          color: var(--text-primary);
        }

        .preview-foods-list {
          margin-top: var(--space-4);
        }

        .preview-food-card {
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .preview-food-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }

        .preview-food-header h4 {
          margin: 0;
          font-size: var(--text-lg);
        }

        .servings-input {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .servings-input label {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
        }

        .form-input-small {
          width: 100px;
          padding: var(--space-2);
          font-size: var(--text-sm);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
        }

        .preview-food-metadata {
          margin-top: var(--space-4);
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-3);
        }

        .metadata-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .metadata-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }

        .preview-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-3);
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--border-primary);
        }

        .error-message-small {
          font-size: var(--text-xs);
          color: var(--accent-danger);
        }

        @media (max-width: 768px) {
          .chatbot-layout {
            grid-template-columns: 1fr;
          }

          .metadata-grid {
            grid-template-columns: 1fr;
          }

          .preview-food-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-2);
          }
        }
      `}</style>
    </div>
  );
};

export default FoodChatbot;
