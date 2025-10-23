import React, { useState, useEffect } from 'react';
import api from '../services/api';
import VoiceRecorder from './VoiceRecorder';

/**
 * FoodChatbot Component
 * 
 * AI-powered food logging chatbot with:
 * - Text input for typing food descriptions
 * - Voice input with transcription
 * - Parse and log multiple foods automatically
 * - Create meals from parsed foods
 * - Recent interaction history
 */
const FoodChatbot = ({ onFoodsLogged }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showVoice, setShowVoice] = useState(false);
  const [createMeal, setCreateMeal] = useState(false);
  const [recentFoods, setRecentFoods] = useState([]);
  const [aiStats, setAiStats] = useState({ tokens: 0, prompts: 0 });

  useEffect(() => {
    loadRecentFoods();
    loadAiStats();
  }, []);

  const loadRecentFoods = async () => {
    try {
      const response = await api.getRecentlyLoggedFoods(7);
      if (response.data.data && response.data.data.foods) {
        setRecentFoods(response.data.data.foods);
      }
    } catch (err) {
      console.error('Failed to load recent foods:', err);
    }
  };

  const loadAiStats = async () => {
    try {
      const response = await api.get('/openai/usage/');
      if (response.data && response.data.data) {
        setAiStats({
          tokens: response.data.data.total_tokens || 0,
          prompts: response.data.data.total_requests || 0
        });
      }
    } catch (err) {
      console.error('Failed to load AI stats:', err);
      // Set default values if API fails
      setAiStats({ tokens: 0, prompts: 0 });
    }
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      setError('Please enter food description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.parseFoodInput(inputText, createMeal);

      const result = response.data.data || response.data;

      // Add to history
      const historyEntry = {
        id: Date.now(),
        input: inputText,
        timestamp: new Date().toISOString(),
        foods_parsed: result.foods_parsed || [],
        logs_created: result.logs_created || [],
        meal_created: result.meal_created,
        errors: result.errors || [],
        success: result.success
      };

      setHistory(prev => [historyEntry, ...prev].slice(0, 10)); // Keep last 10

      // Clear input on success
      if (result.success) {
        setInputText('');
        
        // Refresh recent foods and AI stats
        loadRecentFoods();
        loadAiStats();
        
        // Notify parent to refresh
        if (onFoodsLogged) {
          onFoodsLogged();
        }
      } else {
        setError(result.errors ? result.errors.join(', ') : 'Failed to parse food input');
      }

    } catch (err) {
      console.error('Failed to parse food:', err);
      setError(err.response?.data?.error?.message || 'Failed to parse food input');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscription = (text) => {
    setInputText(text);
    setShowVoice(false);
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

            {/* Voice Input */}
            {showVoice && (
              <div className="mb-4 animate-slide-in-up">
                <VoiceRecorder onTranscriptionComplete={handleVoiceTranscription} />
              </div>
            )}

            {/* Text Input */}
            <div className="form-group">
              <label className="form-label">Describe your food</label>
              <textarea
                className="form-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows="3"
                disabled={loading}
              />
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
                className="btn btn-icon-only"
                onClick={() => setShowVoice(!showVoice)}
                disabled={loading}
                title={showVoice ? 'Hide Voice Input' : 'Voice Input'}
              >
                <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>

              <button
                className="btn btn-icon-only btn-primary"
                onClick={handleSubmit}
                disabled={loading || !inputText.trim()}
                title={loading ? 'Parsing...' : 'Send'}
              >
                <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
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

      {/* Recent Foods */}
      {recentFoods.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <svg className="icon icon-lg" viewBox="0 0 20 20" fill="var(--text-secondary)">
              <path fillRule="evenodd" d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
            </svg>
            <h3 style={{ margin: 0 }}>Recent Foods</h3>
          </div>

          <div className="recent-foods-list">
            {recentFoods.slice(0, 10).map((food) => (
              <div key={food.macro_log_id} className="recent-food-item" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-primary)' }}>
                <div className="food-item-content">
                  <div className="food-main-info">
                    <div className="flex items-center gap-3">
                      <div className="food-icon">
                        {food.food_group === 'protein' && '🥩'}
                        {food.food_group === 'fruit' && '🍎'}
                        {food.food_group === 'vegetable' && '🥬'}
                        {food.food_group === 'grain' && '🌾'}
                        {food.food_group === 'dairy' && '🥛'}
                        {(!food.food_group || food.food_group === 'other') && '🍽️'}
                      </div>
                      <div>
                        <div className="food-name">{food.food_name}</div>
                        <div className="food-time">{formatTimestamp(food.date_time)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="food-metadata">
                    <div className="metadata-grid">
                      <div className="metadata-item">
                        <span className="metadata-label">Calories</span>
                        <span className="metadata-value">{Math.round(food.macro_preview?.calories || 0)}</span>
                      </div>
                      <div className="metadata-item">
                        <span className="metadata-label macro-label-protein">Protein</span>
                        <span className="metadata-value">{Math.round(food.macro_preview?.protein || 0)}g</span>
                      </div>
                      <div className="metadata-item">
                        <span className="metadata-label macro-label-carbohydrates">Carbohydrates</span>
                        <span className="metadata-value">{Math.round(food.macro_preview?.carbohydrates || 0)}g</span>
                      </div>
                      <div className="metadata-item">
                        <span className="metadata-label macro-label-fats">Fats</span>
                        <span className="metadata-value">{Math.round(food.macro_preview?.fat || 0)}g</span>
                      </div>
                      <div className="metadata-item">
                        <span className="metadata-label">Serving Size</span>
                        <span className="metadata-value">{food.serving_size || 1} {food.unit || 'serving'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
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

        .recent-food-item:last-child {
          border-bottom: none;
        }

        .btn-icon-only {
          width: 48px;
          height: 48px;
          padding: 0;
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon-only:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border-color: var(--accent-primary);
          transform: translateY(-2px);
        }

        .btn-icon-only.btn-primary {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .btn-icon-only.btn-primary:hover {
          background: var(--accent-primary-dark);
          border-color: var(--accent-primary-dark);
        }

        .food-item-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .food-main-info {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .food-icon {
          font-size: var(--text-xl);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
        }

        .food-name {
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
        }

        .food-time {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .food-metadata {
          background: var(--bg-secondary);
          padding: var(--space-3);
          border-radius: var(--radius-md);
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-3);
        }

        .metadata-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
        }

        .metadata-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: var(--font-weight-medium);
        }

        .metadata-value {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .metadata-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default FoodChatbot;