import React, { useState } from 'react';
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

  const handleSubmit = async (createMeal = false) => {
    if (!inputText.trim()) {
      setError('Please enter food description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/openai/parse-food/', {
        input_text: inputText,
        create_meal: createMeal
      });

      const result = response.data.data;

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
        
        // Notify parent to refresh
        if (onFoodsLogged) {
          onFoodsLogged();
        }
      } else {
        setError(result.errors.join(', '));
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
      const date = new Date(isoString);
      return date.toLocaleTimeString();
    } catch {
      return '';
    }
  };

  return (
    <div className="food-chatbot">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <svg className="icon icon-lg" viewBox="0 0 20 20" fill="var(--accent-purple)">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <h2 className="card-title">AI Food Logger</h2>
          </div>
        </div>

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
            placeholder="e.g., 2 chicken breasts, 1 cup of rice, and a protein shake"
            rows="3"
            disabled={loading}
          />
          <p className="text-xs text-tertiary mt-2">
            Tip: Be specific with quantities and food names for best results
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <button
            className="btn btn-primary"
            onClick={() => handleSubmit(false)}
            disabled={loading || !inputText.trim()}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            {loading ? 'Parsing...' : 'Send'}
          </button>

          <button
            className="btn btn-success"
            onClick={() => handleSubmit(true)}
            disabled={loading || !inputText.trim()}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            Create Meal
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setShowVoice(!showVoice)}
            disabled={loading}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            {showVoice ? 'Hide' : 'Voice Input'}
          </button>
        </div>
      </div>

      {/* Recent Interactions */}
      {history.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <svg className="icon icon-lg" viewBox="0 0 20 20" fill="var(--text-secondary)">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <h3 style={{ margin: 0 }}>Recent Interactions</h3>
          </div>

          <div className="history-list">
            {history.map((entry) => (
              <div key={entry.id} className="history-item card animate-slide-in-left" style={{ background: 'var(--bg-tertiary)', marginBottom: 'var(--space-3)', padding: 'var(--space-4)' }}>
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
    </div>
  );
};

export default FoodChatbot;

