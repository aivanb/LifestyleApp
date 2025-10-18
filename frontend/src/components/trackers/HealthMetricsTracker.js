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
        date_time: formData.date_time,
        resting_heart_rate: formData.resting_heart_rate ? parseInt(formData.resting_heart_rate) : null,
        blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
        blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
        morning_energy: formData.morning_energy ? parseInt(formData.morning_energy) : null,
        stress_level: formData.stress_level ? parseInt(formData.stress_level) : null,
        mood: formData.mood ? parseInt(formData.mood) : null,
        soreness: formData.soreness ? parseInt(formData.soreness) : null,
        illness_level: formData.illness_level ? parseInt(formData.illness_level) : null
      };

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

  if (loading) {
    return (
      <div className="form-container flex items-center justify-center">
        <div 
          className="animate-spin rounded-full h-16 w-16 border-b-2" 
          style={{ borderColor: 'var(--accent-color)' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="form-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/additional-trackers')}
              className="p-2 rounded-lg transition-colors"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)', 
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)'
              }}
            >
              <ArrowLeftIcon 
                className="h-5 w-5" 
                style={{
                  width: '20px',
                  height: '20px',
                  minWidth: '20px',
                  minHeight: '20px',
                  color: 'var(--text-secondary)'
                }}
              />
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                <ChartBarIcon 
                  className="h-8 w-8" 
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    color: 'var(--accent-color)'
                  }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-bold)' }}>
                  Health Metrics Tracker
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                  Track your daily health and wellness metrics
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: 'var(--accent-color)', 
              color: 'white',
              borderRadius: 'var(--radius-lg)',
              fontFamily: 'var(--font-primary)'
            }}
          >
            <PlusIcon 
              className="h-5 w-5" 
              style={{
                width: '20px',
                height: '20px',
                minWidth: '20px',
                minHeight: '20px'
              }}
            />
            <span>Add Metrics</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          {showForm && (
            <div className="p-6 mb-6 rounded-lg" style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold" style={{ 
                  color: 'var(--text-primary)', 
                  fontFamily: 'var(--font-primary)', 
                  fontWeight: 'var(--font-weight-semibold)' 
                }}>
                  {editingLog ? 'Edit Health Metrics' : 'Add Health Metrics'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-1 rounded-lg transition-colors"
                  style={{ borderRadius: 'var(--radius-lg)' }}
                >
                  <XMarkIcon 
                    className="h-5 w-5" 
                    style={{
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      minHeight: '20px',
                      color: 'var(--text-tertiary)'
                    }}
                  />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ 
                    color: 'var(--text-primary)', 
                    fontFamily: 'var(--font-primary)' 
                  }}>
                    Date
                  </label>
                  <input
                    type="date"
                    name="date_time"
                    value={formData.date_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ 
                    color: 'var(--text-primary)', 
                    fontFamily: 'var(--font-primary)' 
                  }}>
                    Resting Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    name="resting_heart_rate"
                    value={formData.resting_heart_rate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    placeholder="Optional"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ 
                      color: 'var(--text-primary)', 
                      fontFamily: 'var(--font-primary)' 
                    }}>
                      Systolic BP
                    </label>
                    <input
                      type="number"
                      name="blood_pressure_systolic"
                      value={formData.blood_pressure_systolic}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg"
                      style={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-primary)'
                      }}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ 
                      color: 'var(--text-primary)', 
                      fontFamily: 'var(--font-primary)' 
                    }}>
                      Diastolic BP
                    </label>
                    <input
                      type="number"
                      name="blood_pressure_diastolic"
                      value={formData.blood_pressure_diastolic}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg"
                      style={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-primary)'
                      }}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ 
                    color: 'var(--text-primary)', 
                    fontFamily: 'var(--font-primary)' 
                  }}>
                    Morning Energy (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="morning_energy"
                    value={formData.morning_energy}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ 
                    color: 'var(--text-primary)', 
                    fontFamily: 'var(--font-primary)' 
                  }}>
                    Stress Level (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="stress_level"
                    value={formData.stress_level}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ 
                    color: 'var(--text-primary)', 
                    fontFamily: 'var(--font-primary)' 
                  }}>
                    Mood (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="mood"
                    value={formData.mood}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ 
                    color: 'var(--text-primary)', 
                    fontFamily: 'var(--font-primary)' 
                  }}>
                    Soreness (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="soreness"
                    value={formData.soreness}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ 
                    color: 'var(--text-primary)', 
                    fontFamily: 'var(--font-primary)' 
                  }}>
                    Illness Level (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="illness_level"
                    value={formData.illness_level}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    placeholder="Optional"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: 'var(--accent-color)', 
                      color: 'white',
                      borderRadius: 'var(--radius-lg)',
                      fontFamily: 'var(--font-primary)'
                    }}
                  >
                    <CheckIcon 
                      className="h-5 w-5" 
                      style={{
                        width: '20px',
                        height: '20px',
                        minWidth: '20px',
                        minHeight: '20px'
                      }}
                    />
                    <span>{editingLog ? 'Update' : 'Save'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
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
          <div className="rounded-lg" style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xl font-semibold" style={{ 
                color: 'var(--text-primary)', 
                fontFamily: 'var(--font-primary)', 
                fontWeight: 'var(--font-weight-semibold)' 
              }}>
                Recent Entries
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                Your latest health metrics records
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {getRecentLogs().length === 0 ? (
                <div className="p-8 text-center">
                  <ChartBarIcon 
                    className="h-12 w-12 mx-auto mb-4" 
                    style={{
                      width: '48px',
                      height: '48px',
                      minWidth: '48px',
                      minHeight: '48px',
                      color: 'var(--text-tertiary)'
                    }}
                  />
                  <p style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                    No health metrics entries yet
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                    Start tracking your health metrics to see your progress
                  </p>
                </div>
              ) : (
                getRecentLogs().map((log) => (
                  <div key={log.health_metrics_id} className="p-6 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                          <ChartBarIcon 
                            className="h-5 w-5" 
                            style={{
                              width: '20px',
                              height: '20px',
                              minWidth: '20px',
                              minHeight: '20px',
                              color: 'var(--accent-color)'
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold" style={{ 
                              color: 'var(--text-primary)', 
                              fontFamily: 'var(--font-primary)', 
                              fontWeight: 'var(--font-weight-bold)' 
                            }}>
                              Health Metrics
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm mt-1">
                            <CalendarIcon 
                              className="h-4 w-4" 
                              style={{
                                width: '16px',
                                height: '16px',
                                minWidth: '16px',
                                minHeight: '16px',
                                color: 'var(--text-tertiary)'
                              }}
                            />
                            <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                              {formatDate(log.date_time)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(log)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ borderRadius: 'var(--radius-lg)' }}
                        >
                          <PencilIcon 
                            className="h-4 w-4" 
                            style={{
                              width: '16px',
                              height: '16px',
                              minWidth: '16px',
                              minHeight: '16px',
                              color: 'var(--text-tertiary)'
                            }}
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(log.health_metrics_id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ borderRadius: 'var(--radius-lg)' }}
                        >
                          <TrashIcon 
                            className="h-4 w-4" 
                            style={{
                              width: '16px',
                              height: '16px',
                              minWidth: '16px',
                              minHeight: '16px',
                              color: 'var(--text-tertiary)'
                            }}
                          />
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
  );
};

export default HealthMetricsTracker;