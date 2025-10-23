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

const WeightTracker = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    weight: '',
    weight_unit: 'lbs'
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getWeightLogs();
      setLogs(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading weight logs:', error);
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
        weight: parseFloat(formData.weight),
        weight_unit: formData.weight_unit
      };

      if (editingLog) {
        await api.updateWeightLog(editingLog.weight_log_id, logData);
      } else {
        await api.createWeightLog(logData);
      }

      await loadLogs();
      resetForm();
    } catch (error) {
      console.error('Error saving weight log:', error);
      alert('Error saving weight log. Please try again.');
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      weight: log.weight.toString(),
      weight_unit: log.weight_unit
    });
    setShowForm(true);
  };

  const handleDelete = async (logId) => {
    if (window.confirm('Are you sure you want to delete this weight entry?')) {
      try {
        await api.deleteWeightLog(logId);
        await loadLogs();
      } catch (error) {
        console.error('Error deleting weight log:', error);
        alert('Error deleting weight log. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      weight: '',
      weight_unit: 'lbs'
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
      <div className="loading-container flex items-center justify-center">
        <div 
          className="animate-spin rounded-full h-16 w-16 border-b-2" 
          style={{ borderColor: 'var(--accent-color)' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="weight-tracker-container">
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
                <ScaleIcon 
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
                  Weight Tracker
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                  Track your daily weight measurements
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="add-weight-button"
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
            <PlusIcon 
              className="h-5 w-5" 
              style={{
                width: '20px',
                height: '20px',
                minWidth: '20px',
                minHeight: '20px'
              }}
            />
            <span>Add Weight</span>
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
                  {editingLog ? 'Edit Weight Entry' : 'Add Weight Entry'}
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
                    Weight
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    placeholder="Enter weight"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ 
                    color: 'var(--text-primary)', 
                    fontFamily: 'var(--font-primary)' 
                  }}>
                    Unit
                  </label>
                  <select
                    name="weight_unit"
                    value={formData.weight_unit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
                  >
                    <option value="lbs">Pounds (lbs)</option>
                    <option value="kg">Kilograms (kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ 
                    color: 'var(--text-primary)', 
                    fontFamily: 'var(--font-primary)' 
                  }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
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
                Your latest weight measurements
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {getRecentLogs().length === 0 ? (
                <div className="p-8 text-center">
                  <ScaleIcon 
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
                    No weight entries yet
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                    Start tracking your weight to see your progress
                  </p>
                </div>
              ) : (
                getRecentLogs().map((log) => (
                  <div key={log.weight_log_id} className="p-6 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                          <ScaleIcon 
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
                            <span className="text-2xl font-bold" style={{ 
                              color: 'var(--text-primary)', 
                              fontFamily: 'var(--font-primary)', 
                              fontWeight: 'var(--font-weight-bold)' 
                            }}>
                              {log.weight}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                              {log.weight_unit}
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
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(log)}
                          className="edit-button"
                          style={{ 
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-2)',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s var(--ease-out-cubic)'
                          }}
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
                          onClick={() => handleDelete(log.weight_log_id)}
                          className="edit-button"
                          style={{ 
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-2)',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s var(--ease-out-cubic)'
                          }}
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

export default WeightTracker;

// CSS Styling - moved to component styling
  /*
  .weight-tracker-container {
    padding: 0;
    margin: 0;
  }

  .loading-container {
    min-height: 400px;
  }

  .add-weight-button {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    transition: all 0.2s var(--ease-out-cubic);
  }

  .add-weight-button:hover {
    background: var(--accent-primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .edit-button:hover {
    background: var(--bg-hover);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
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