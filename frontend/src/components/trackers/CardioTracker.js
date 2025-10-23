import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HeartIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const CardioTracker = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  // const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    cardio_type: '',
    duration: '',
    distance: '',
    distance_unit: 'miles',
    calories_burned: '',
    heart_rate: '',
    date_time: new Date().toISOString()
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getCardioLogs();
      setLogs(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading cardio logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const logData = {
        cardio_type: formData.cardio_type,
        duration: parseFloat(formData.duration),
        date_time: formData.date_time
      };

      // Only add optional fields if they have values
      if (formData.distance) {
        logData.distance = parseFloat(formData.distance);
        logData.distance_unit = formData.distance_unit;
      }
      if (formData.calories_burned) {
        logData.calories_burned = parseInt(formData.calories_burned);
      }
      if (formData.heart_rate) {
        logData.heart_rate = parseInt(formData.heart_rate);
      }

      if (editingLog) {
        await api.updateCardioLog(editingLog.cardio_log_id, logData);
      } else {
        await api.createCardioLog(logData);
      }

      await loadLogs();
      resetForm();
    } catch (error) {
      console.error('Error saving cardio log:', error);
      alert('Error saving cardio log. Please try again.');
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      cardio_type: log.cardio_type || '',
      duration: log.duration ? log.duration.toString() : '',
      distance: log.distance ? log.distance.toString() : '',
      distance_unit: log.distance_unit || 'miles',
      calories_burned: log.calories_burned ? log.calories_burned.toString() : '',
      heart_rate: log.heart_rate ? log.heart_rate.toString() : '',
      date_time: new Date(log.date_time).toISOString()
    });
    setShowForm(true);
  };

  const handleDelete = async (logId) => {
    if (window.confirm('Are you sure you want to delete this cardio entry?')) {
      try {
        await api.deleteCardioLog(logId);
        await loadLogs();
      } catch (error) {
        console.error('Error deleting cardio log:', error);
        alert('Error deleting cardio log. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      cardio_type: '',
      duration: '',
      distance: '',
      distance_unit: 'miles',
      calories_burned: '',
      heart_rate: '',
      date_time: new Date().toISOString()
    });
    setEditingLog(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getRecentLogs = () => {
    return logs.slice(0, 10);
  };

  const getDailyDuration = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => 
      new Date(log.date_time).toISOString().split('T')[0] === today
    );
    
    return todayLogs.reduce((total, log) => total + (log.duration || 0), 0);
  };

  if (loading) {
    return (
      <div className="loading-container min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="cardio-tracker-container min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/additional-trackers')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <HeartIcon className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Cardio Tracker</h1>
                  <p className="text-gray-600">Track your cardiovascular exercises</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="add-cardio-button"
              style={{ 
                backgroundColor: 'var(--accent-primary)', 
                color: 'white',
                borderRadius: 'var(--radius-lg)',
                fontFamily: 'var(--font-primary)',
                padding: 'var(--space-4) var(--space-6)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
                border: '1px solid var(--accent-primary)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Cardio</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Daily Total */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Today's Cardio</h2>
              <p className="text-red-100 mt-1">Keep your heart healthy!</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{formatDuration(getDailyDuration())}</div>
              <div className="text-red-100">total time</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            {showForm && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingLog ? 'Edit Cardio Entry' : 'Add Cardio Entry'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exercise Type *
                    </label>
                    <input
                      type="text"
                      name="cardio_type"
                      value={formData.cardio_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="e.g., Running, Cycling, Swimming"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter duration"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Distance
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        name="distance"
                        value={formData.distance}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <select
                        name="distance_unit"
                        value={formData.distance_unit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="miles">Miles</option>
                        <option value="km">Kilometers</option>
                        <option value="meters">Meters</option>
                        <option value="yards">Yards</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calories Burned
                      </label>
                      <input
                        type="number"
                        name="calories_burned"
                        value={formData.calories_burned}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heart Rate (BPM)
                      </label>
                      <input
                        type="number"
                        name="heart_rate"
                        value={formData.heart_rate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="date_time"
                      value={formData.date_time.slice(0, 16)}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        date_time: new Date(e.target.value).toISOString()
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <CheckIcon className="h-5 w-5" />
                      <span>{editingLog ? 'Update' : 'Save'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Logs Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Entries</h2>
                <p className="text-gray-600 mt-1">Your latest cardio sessions</p>
              </div>

              <div className="divide-y divide-gray-200">
                {getRecentLogs().length === 0 ? (
                  <div className="p-8 text-center">
                    <HeartIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No cardio entries yet</p>
                    <p className="text-gray-400 text-sm">Start tracking your cardio to see your progress</p>
                  </div>
                ) : (
                  getRecentLogs().map((log) => (
                    <div key={log.cardio_log_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <HeartIcon className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{log.cardio_type}</h3>
                              <span className="text-sm text-gray-500">{formatDuration(log.duration)}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{formatDate(log.date_time)}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {log.distance && (
                                <div>
                                  <span className="text-gray-500">Distance:</span>
                                  <span className="ml-1 font-medium">{log.distance} {log.distance_unit}</span>
                                </div>
                              )}
                              {log.calories_burned && (
                                <div>
                                  <span className="text-gray-500">Calories:</span>
                                  <span className="ml-1 font-medium">{log.calories_burned}</span>
                                </div>
                              )}
                              {log.heart_rate && (
                                <div>
                                  <span className="text-gray-500">Heart Rate:</span>
                                  <span className="ml-1 font-medium">{log.heart_rate} BPM</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(log)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(log.cardio_log_id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardioTracker;

// CSS Styling - moved to component styling
  /*
  .cardio-tracker-container {
    padding: 0;
    margin: 0;
  }

  .loading-container {
    min-height: 400px;
  }

  .add-cardio-button {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    transition: all 0.2s var(--ease-out-cubic);
  }

  .add-cardio-button:hover {
    background: var(--accent-primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .form-input {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    color: var(--text-primary);
    font-family: var(--font-primary);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
  }

  .form-input::placeholder {
    color: var(--text-tertiary);
  }
  */
