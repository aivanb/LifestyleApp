import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    height: user?.height || '',
    birthday: user?.birthday || '',
    gender: user?.gender || ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const result = await updateProfile(formData);
    
    if (result.success) {
      setMessage('Profile updated successfully!');
    } else {
      setMessage(`Error: ${result.error}`);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <h1>Profile</h1>
      
      <div className="card">
        <h2>User Information</h2>
        
        {message && (
          <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
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
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Account Information</h2>
        <p><strong>Access Level:</strong> {user?.access_level}</p>
        <p><strong>Member Since:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
      </div>
    </div>
  );
};

export default Profile;
