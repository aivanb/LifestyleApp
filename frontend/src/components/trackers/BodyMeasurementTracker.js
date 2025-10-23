import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScaleIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const BodyMeasurementTracker = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    upper_arm: '',
    lower_arm: '',
    waist: '',
    shoulder: '',
    leg: '',
    calf: ''
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getBodyMeasurementLogs();
      setLogs(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading body measurement logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const logData = {};
      
      // Only include fields that have values
      Object.keys(formData).forEach(key => {
        if (formData[key] && formData[key] !== '') {
          logData[key] = parseFloat(formData[key]);
        }
      });

      if (editingLog) {
        await api.updateBodyMeasurementLog(editingLog.measurement_id, logData);
      } else {
        await api.createBodyMeasurementLog(logData);
      }

      await loadLogs();
      resetForm();
    } catch (error) {
      console.error('Error saving body measurement log:', error);
      alert('Error saving body measurement log. Please try again.');
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      upper_arm: log.upper_arm ? log.upper_arm.toString() : '',
      lower_arm: log.lower_arm ? log.lower_arm.toString() : '',
      waist: log.waist ? log.waist.toString() : '',
      shoulder: log.shoulder ? log.shoulder.toString() : '',
      leg: log.leg ? log.leg.toString() : '',
      calf: log.calf ? log.calf.toString() : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (logId) => {
    if (window.confirm('Are you sure you want to delete this body measurement entry?')) {
      try {
        await api.deleteBodyMeasurementLog(logId);
        await loadLogs();
      } catch (error) {
        console.error('Error deleting body measurement log:', error);
        alert('Error deleting body measurement log. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      upper_arm: '',
      lower_arm: '',
      waist: '',
      shoulder: '',
      leg: '',
      calf: ''
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

  const measurementFields = [
    { key: 'upper_arm', label: 'Upper Arm', placeholder: 'inches' },
    { key: 'lower_arm', label: 'Lower Arm', placeholder: 'inches' },
    { key: 'waist', label: 'Waist', placeholder: 'inches' },
    { key: 'shoulder', label: 'Shoulder', placeholder: 'inches' },
    { key: 'leg', label: 'Leg', placeholder: 'inches' },
    { key: 'calf', label: 'Calf', placeholder: 'inches' }
  ];

  if (loading) {
    return (
      <div className="loading-container flex items-center justify-center">
        <div 
          className="animate-spin rounded-full h-16 w-16 border-b-2" 
          style={{ borderColor: 'var(--accent-color)' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="body-measurement-tracker-container min-h-screen bg-gray-50">
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
                <div className="p-2 bg-purple-100 rounded-xl">
                  <ScaleIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Body Measurements</h1>
                  <p className="text-gray-600">Track your body measurements over time</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="add-measurement-button"
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
              <span>Add Measurements</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            {showForm && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingLog ? 'Edit Measurements' : 'Add Measurements'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {measurementFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        name={field.key}
                        value={formData[field.key]}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-700">
                      <strong>Note:</strong> You only need to fill in the measurements you want to track. 
                      Leave fields empty if you don't want to record that measurement.
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
                <p className="text-gray-600 mt-1">Your latest body measurements</p>
              </div>

              <div className="divide-y divide-gray-200">
                {getRecentLogs().length === 0 ? (
                  <div className="p-8 text-center">
                    <ScaleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No body measurements yet</p>
                    <p className="text-gray-400 text-sm">Start tracking your measurements to see your progress</p>
                  </div>
                ) : (
                  getRecentLogs().map((log) => (
                    <div key={log.measurement_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <ScaleIcon className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-1 text-sm text-gray-500 mb-3">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{formatDate(log.created_at)}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {measurementFields.map((field) => {
                                const value = log[field.key];
                                if (value) {
                                  return (
                                    <div key={field.key} className="text-sm">
                                      <span className="text-gray-500">{field.label}:</span>
                                      <span className="ml-1 font-medium text-gray-900">{value}"</span>
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
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(log.measurement_id)}
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

export default BodyMeasurementTracker;

// CSS Styling - moved to component styling
  /*
  .body-measurement-tracker-container {
    padding: 0;
    margin: 0;
  }

  .loading-container {
    min-height: 400px;
  }

  .add-measurement-button {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    transition: all 0.2s var(--ease-out-cubic);
  }

  .add-measurement-button:hover {
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
