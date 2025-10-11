import React, { useState } from 'react';
import api from '../services/api';

const OpenAI = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usageStats, setUsageStats] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await api.sendPrompt(prompt);
      if (result.data.data) {
        setResponse(result.data.data.response);
        // Refresh usage stats
        loadUsageStats();
      } else {
        setError(result.data.error?.message || 'Failed to get response');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'An error occurred');
    }

    setLoading(false);
  };

  const loadUsageStats = async () => {
    try {
      const result = await api.getUsageStats();
      if (result.data.data) {
        setUsageStats(result.data.data);
      }
    } catch (err) {
      console.error('Failed to load usage stats:', err);
    }
  };

  React.useEffect(() => {
    loadUsageStats();
  }, []);

  return (
    <div>
      <h1>OpenAI Integration</h1>
      
      <div className="card">
        <h2>Send a Prompt</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="prompt">
              Your Prompt
            </label>
            <textarea
              id="prompt"
              className="form-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows="4"
              placeholder="Enter your prompt here..."
              maxLength="2000"
            />
            <small style={{ color: '#666' }}>
              {prompt.length}/2000 characters
            </small>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || !prompt.trim()}
          >
            {loading ? 'Sending...' : 'Send Prompt'}
          </button>
        </form>

        {error && (
          <div className="error-message" style={{ marginTop: '20px' }}>
            {error}
          </div>
        )}

        {loading && (
          <div className="loading" style={{ marginTop: '20px' }}>
            <div className="spinner"></div>
            <p>Processing your prompt...</p>
          </div>
        )}

        {response && (
          <div className="card" style={{ marginTop: '20px' }}>
            <h3>AI Response</h3>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '4px',
              whiteSpace: 'pre-wrap'
            }}>
              {response}
            </div>
          </div>
        )}
      </div>

      {usageStats && (
        <div className="card">
          <h2>Usage Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <h4>Total Tokens</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007bff' }}>
                {usageStats.total_tokens?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <h4>Total Cost</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                ${usageStats.total_cost || '0.00'}
              </p>
            </div>
            <div>
              <h4>Total Requests</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6c757d' }}>
                {usageStats.total_requests || 0}
              </p>
            </div>
            <div>
              <h4>Success Rate</h4>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#17a2b8' }}>
                {usageStats.success_rate || 0}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAI;
