import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const HealthMetricsTracker = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    date_time: new Date().toISOString().split('T')[0],
    resting_heart_rate: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    morning_energy: '',
    stress_level: '',
    mood: '',
    soreness: '',
    illness_level: ''
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getHealthMetricsLogs();
      setLogs(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading health metrics logs:', error);
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
        date_time: formData.date_time
      };

      // Only add fields that have values
      if (formData.resting_heart_rate) {
        logData.resting_heart_rate = parseInt(formData.resting_heart_rate);
      }
      if (formData.blood_pressure_systolic) {
        logData.blood_pressure_systolic = parseInt(formData.blood_pressure_systolic);
      }
      if (formData.blood_pressure_diastolic) {
        logData.blood_pressure_diastolic = parseInt(formData.blood_pressure_diastolic);
      }
      if (formData.morning_energy) {
        logData.morning_energy = parseInt(formData.morning_energy);
      }
      if (formData.stress_level) {
        logData.stress_level = parseInt(formData.stress_level);
      }
      if (formData.mood) {
        logData.mood = parseInt(formData.mood);
      }
      if (formData.soreness) {
        logData.soreness = parseInt(formData.soreness);
      }
      if (formData.illness_level) {
        logData.illness_level = parseInt(formData.illness_level);
      }

      if (editingLog) {
        await api.updateHealthMetricsLog(editingLog.health_metrics_id, logData);
      } else {
        await api.createHealthMetricsLog(logData);
      }

      await loadLogs();
      resetForm();
    } catch (error) {
      console.error('Error saving health metrics log:', error);
      alert('Error saving health metrics log. Please try again.');
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      date_time: log.date_time,
      resting_heart_rate: log.resting_heart_rate ? log.resting_heart_rate.toString() : '',
      blood_pressure_systolic: log.blood_pressure_systolic ? log.blood_pressure_systolic.toString() : '',
      blood_pressure_diastolic: log.blood_pressure_diastolic ? log.blood_pressure_diastolic.toString() : '',
      morning_energy: log.morning_energy ? log.morning_energy.toString() : '',
      stress_level: log.stress_level ? log.stress_level.toString() : '',
      mood: log.mood ? log.mood.toString() : '',
      soreness: log.soreness ? log.soreness.toString() : '',
      illness_level: log.illness_level ? log.illness_level.toString() : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (logId) => {
    if (window.confirm('Are you sure you want to delete this health metrics entry?')) {
      try {
        await api.deleteHealthMetricsLog(logId);
        await loadLogs();
      } catch (error) {
        console.error('Error deleting health metrics log:', error);
        alert('Error deleting health metrics log. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date_time: new Date().toISOString().split('T')[0],
      resting_heart_rate: '',
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      morning_energy: '',
      stress_level: '',
      mood: '',
      soreness: '',
      illness_level: ''
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

  const getRecentLogs = () => {
    return logs.slice(0, 10);
  };

  const getAverageRating = (field) => {
    const validLogs = logs.filter(log => log[field] !== null && log[field] !== undefined);
    if (validLogs.length === 0) return null;
    
    const sum = validLogs.reduce((total, log) => total + log[field], 0);
    return (sum / validLogs.length).toFixed(1);
  };

  const getRatingColor = (rating) => {
    if (rating >= 8) return 'text-green-600';
    if (rating >= 6) return 'text-yellow-600';
    if (rating >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingEmoji = (field, value) => {
    if (!value) return '';
    
    const emojiMap = {
      morning_energy: ['😴', '😑', '😐', '🙂', '😊', '😃', '🤩', '🚀', '💪', '🔥'],
      stress_level: ['😌', '😊', '🙂', '😐', '😕', '😟', '😰', '😨', '😱', '💥'],
      mood: ['😢', '😞', '😔', '😐', '🙂', '😊', '😃', '😄', '🤩', '😍'],
      soreness: ['😌', '🙂', '😐', '😕', '😣', '😖', '😫', '😩', '😵', '💀'],
      illness_level: ['😌', '🙂', '😐', '😕', '🤧', '🤒', '😷', '🤢', '🤮', '💀']
    };
    
    return emojiMap[field] ? emojiMap[field][value - 1] : '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <div className="p-2 bg-orange-100 rounded-xl">
                  <ChartBarIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Health Metrics</h1>
                  <p className="text-gray-600">Track your daily health and wellness metrics</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Metrics</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Average Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { field: 'mood', label: 'Average Mood', color: 'from-blue-500 to-blue-600' },
            { field: 'morning_energy', label: 'Average Energy', color: 'from-green-500 to-green-600' },
            { field: 'stress_level', label: 'Average Stress', color: 'from-red-500 to-red-600' },
            { field: 'soreness', label: 'Average Soreness', color: 'from-purple-500 to-purple-600' }
          ].map(({ field, label, color }) => {
            const avg = getAverageRating(field);
            return avg ? (
              <div key={field} className={`bg-gradient-to-r ${color} rounded-2xl shadow-lg p-6 text-white`}>
                <div className="text-center">
                  <div className="text-3xl font-bold">{avg}/10</div>
                  <div className="text-sm opacity-90">{label}</div>
                </div>
              </div>
            ) : null;
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            {showForm && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingLog ? 'Edit Health Metrics' : 'Add Health Metrics'}
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
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date_time"
                      value={formData.date_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resting HR (BPM)
                      </label>
                      <input
                        type="number"
                        name="resting_heart_rate"
                        value={formData.resting_heart_rate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Pressure
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          name="blood_pressure_systolic"
                          value={formData.blood_pressure_systolic}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Systolic"
                        />
                        <span className="flex items-center text-gray-500">/</span>
                        <input
                          type="number"
                          name="blood_pressure_diastolic"
                          value={formData.blood_pressure_diastolic}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Diastolic"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { field: 'morning_energy', label: 'Morning Energy (1-10)', emoji: '⚡' },
                      { field: 'stress_level', label: 'Stress Level (1-10)', emoji: '😰' },
                      { field: 'mood', label: 'Mood (1-10)', emoji: '😊' },
                      { field: 'soreness', label: 'Muscle Soreness (1-10)', emoji: '💪' },
                      { field: 'illness_level', label: 'Illness Level (1-10)', emoji: '🤒' }
                    ].map(({ field, label, emoji }) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {emoji} {label}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          name={field}
                          value={formData[field]}
                          onChange={handleInputChange}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1</span>
                          <span className="font-medium">{formData[field] || '5'}/10</span>
                          <span>10</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
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
                <p className="text-gray-600 mt-1">Your latest health metrics</p>
              </div>

              <div className="divide-y divide-gray-200">
                {getRecentLogs().length === 0 ? (
                  <div className="p-8 text-center">
                    <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No health metrics yet</p>
                    <p className="text-gray-400 text-sm">Start tracking your health metrics to see your progress</p>
                  </div>
                ) : (
                  getRecentLogs().map((log) => (
                    <div key={log.health_metrics_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <ChartBarIcon className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-1 text-sm text-gray-500 mb-3">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{formatDate(log.date_time)}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {[
                                { field: 'morning_energy', label: 'Energy', emoji: '⚡' },
                                { field: 'stress_level', label: 'Stress', emoji: '😰' },
                                { field: 'mood', label: 'Mood', emoji: '😊' },
                                { field: 'soreness', label: 'Soreness', emoji: '💪' },
                                { field: 'illness_level', label: 'Illness', emoji: '🤒' },
                                { field: 'resting_heart_rate', label: 'HR', suffix: ' BPM' },
                                { field: 'blood_pressure_systolic', label: 'BP', suffix: ' mmHg' }
                              ].map(({ field, label, emoji, suffix }) => {
                                const value = log[field];
                                if (value !== null && value !== undefined) {
                                  return (
                                    <div key={field} className="flex items-center space-x-1">
                                      {emoji && <span>{getRatingEmoji(field, value)}</span>}
                                      <span className="text-gray-500">{label}:</span>
                                      <span className={`font-medium ${getRatingColor(value)}`}>
                                        {value}{suffix || ''}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(log)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(log.health_metrics_id)}
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

export default HealthMetricsTracker;
