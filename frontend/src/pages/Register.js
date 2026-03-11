import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    invite_key: '',
    height: '',
    birthday: '',
    gender: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteKeyStatus, setInviteKeyStatus] = useState(null); // null | 'valid' | 'invalid' | 'used'
  const [inviteKeyChecking, setInviteKeyChecking] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (name === 'invite_key') {
      setInviteKeyStatus(null);
    }
  };

  const handleInviteKeyBlur = async () => {
    const key = (formData.invite_key || '').trim();
    if (!key) {
      setInviteKeyStatus(null);
      return;
    }
    setInviteKeyChecking(true);
    setInviteKeyStatus(null);
    try {
      const api = (await import('../services/api')).default;
      const response = await api.validateInviteKey(key);
      const { valid, message } = response.data?.data || {};
      if (valid) {
        setInviteKeyStatus('valid');
      } else {
        setInviteKeyStatus(message && message.includes('already been used') ? 'used' : 'invalid');
      }
    } catch {
      setInviteKeyStatus('invalid');
    } finally {
      setInviteKeyChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!(formData.invite_key || '').trim()) {
      setError('Invite key is required to register.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Avoid sending optional fields as empty strings (backend treats them as invalid types)
    const payload = { ...formData };
    ['height', 'birthday', 'gender'].forEach((key) => {
      if (payload[key] === '' || payload[key] === null) {
        delete payload[key];
      }
    });
    payload.invite_key = (payload.invite_key || '').trim();

    const result = await register(payload);
    
    if (result.success) {
      navigate('/profile');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-layout" style={{ width: '100%', maxWidth: '520px', margin: '50px auto' }}>
      <div className="card" style={{ width: '100%', margin: 0 }}>
        <h2>Register</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="invite_key">
              Invite key *
            </label>
            <input
              type="text"
              id="invite_key"
              name="invite_key"
              className="form-input"
              style={{ width: '100%' }}
              value={formData.invite_key}
              onChange={handleChange}
              onBlur={handleInviteKeyBlur}
              required
              placeholder="Enter your invite key"
              autoComplete="off"
            />
            {inviteKeyChecking && (
              <span className="form-hint" style={{ fontSize: '0.9rem', color: 'var(--text-muted, #666)' }}>
                Checking...
              </span>
            )}
            {inviteKeyStatus === 'valid' && !inviteKeyChecking && (
              <span className="form-hint" style={{ fontSize: '0.9rem', color: 'var(--success, green)' }}>
                Invite key is valid.
              </span>
            )}
            {inviteKeyStatus === 'invalid' && !inviteKeyChecking && (
              <span className="form-hint" style={{ fontSize: '0.9rem', color: 'var(--error, #c00)' }}>
                Invalid invite key.
              </span>
            )}
            {inviteKeyStatus === 'used' && !inviteKeyChecking && (
              <span className="form-hint" style={{ fontSize: '0.9rem', color: 'var(--error, #c00)' }}>
                This invite key has already been used.
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              style={{ width: '100%' }}
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              style={{ width: '100%' }}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              style={{ width: '100%' }}
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password_confirm">
              Confirm Password *
            </label>
            <input
              type="password"
              id="password_confirm"
              name="password_confirm"
              className="form-input"
              style={{ width: '100%' }}
              value={formData.password_confirm}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="height">
              Height (cm)
            </label>
            <input
              type="number"
              id="height"
              name="height"
              className="form-input"
              style={{ width: '100%' }}
              value={formData.height}
              onChange={handleChange}
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="birthday">
              Birthday
            </label>
            <input
              type="date"
              id="birthday"
              name="birthday"
              className="form-input"
              style={{ width: '100%' }}
              value={formData.birthday}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              className="form-input"
              style={{ width: '100%' }}
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
