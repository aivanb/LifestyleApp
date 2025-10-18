import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoonIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const SleepTracker = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    date_time: new Date().toISOString().split('T')[0],
    time_went_to_bed: '',
    time_got_out_of_bed: '',
    time_fell_asleep: '',
    time_in_light_sleep: '',
    time_in_deep_sleep: '',
    time_in_rem_sleep: '',
    number_of_times_woke_up: '',
    resting_heart_rate: ''
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getSleepLogs();
      setLogs(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading sleep logs:', error);
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
      // Validate required fields more thoroughly
      if (!formData.time_went_to_bed || formData.time_went_to_bed.trim() === '') {
        alert('Please fill in the bedtime field.');
        return;
      }
      if (!formData.time_got_out_of_bed || formData.time_got_out_of_bed.trim() === '') {
        alert('Please fill in the wake time field.');
        return;
      }
      if (!formData.date_time || formData.date_time.trim() === '') {
        alert('Please select a date.');
        return;
      }
      
      const logData = {
        date_time: formData.date_time,
        time_went_to_bed: formData.time_went_to_bed,
        time_got_out_of_bed: formData.time_got_out_of_bed,
        time_fell_asleep: formData.time_fell_asleep && formData.time_fell_asleep.trim() !== '' ? formData.time_fell_asleep : null,
        time_in_light_sleep: formData.time_in_light_sleep && formData.time_in_light_sleep.trim() !== '' ? parseInt(formData.time_in_light_sleep) : null,
        time_in_deep_sleep: formData.time_in_deep_sleep && formData.time_in_deep_sleep.trim() !== '' ? parseInt(formData.time_in_deep_sleep) : null,
        time_in_rem_sleep: formData.time_in_rem_sleep && formData.time_in_rem_sleep.trim() !== '' ? parseInt(formData.time_in_rem_sleep) : null,
        number_of_times_woke_up: formData.number_of_times_woke_up && formData.number_of_times_woke_up.trim() !== '' ? parseInt(formData.number_of_times_woke_up) : null,
        resting_heart_rate: formData.resting_heart_rate && formData.resting_heart_rate.trim() !== '' ? parseInt(formData.resting_heart_rate) : null
      };

      console.log('Sending sleep data:', logData); // Debug log

      if (editingLog) {
        await api.updateSleepLog(editingLog.sleep_log_id, logData);
      } else {
        await api.createSleepLog(logData);
      }

      await loadLogs();
      resetForm();
    } catch (error) {
      console.error('Error saving sleep log:', error);
      console.error('Error details:', error.response?.data); // More detailed error logging
      
      // Show specific validation errors to the user
      let errorMessage = 'Error saving sleep log. ';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle field-specific errors
        if (errorData.time_went_to_bed) {
          errorMessage += `Bedtime error: ${Array.isArray(errorData.time_went_to_bed) ? errorData.time_went_to_bed[0] : errorData.time_went_to_bed}. `;
        }
        if (errorData.time_got_out_of_bed) {
          errorMessage += `Wake time error: ${Array.isArray(errorData.time_got_out_of_bed) ? errorData.time_got_out_of_bed[0] : errorData.time_got_out_of_bed}. `;
        }
        if (errorData.date_time) {
          errorMessage += `Date error: ${Array.isArray(errorData.date_time) ? errorData.date_time[0] : errorData.date_time}. `;
        }
        if (errorData.non_field_errors) {
          errorMessage += `Validation error: ${Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors}. `;
        }
        
        // Handle general validation errors
        if (errorData.detail) {
          errorMessage += errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage += errorData;
        } else if (Object.keys(errorData).length === 0) {
          errorMessage += 'Please check that all required fields are filled correctly.';
        }
      } else {
        errorMessage += 'Please check that all required fields are filled correctly.';
      }
      
      alert(errorMessage);
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      date_time: log.date_time,
      time_went_to_bed: log.time_went_to_bed || '',
      time_got_out_of_bed: log.time_got_out_of_bed || '',
      time_fell_asleep: log.time_fell_asleep || '',
      time_in_light_sleep: log.time_in_light_sleep ? log.time_in_light_sleep.toString() : '',
      time_in_deep_sleep: log.time_in_deep_sleep ? log.time_in_deep_sleep.toString() : '',
      time_in_rem_sleep: log.time_in_rem_sleep ? log.time_in_rem_sleep.toString() : '',
      number_of_times_woke_up: log.number_of_times_woke_up ? log.number_of_times_woke_up.toString() : '',
      resting_heart_rate: log.resting_heart_rate ? log.resting_heart_rate.toString() : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (logId) => {
    if (window.confirm('Are you sure you want to delete this sleep entry?')) {
      try {
        await api.deleteSleepLog(logId);
        await loadLogs();
      } catch (error) {
        console.error('Error deleting sleep log:', error);
        alert('Error deleting sleep log. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      date_time: new Date().toISOString().split('T')[0],
      time_went_to_bed: '',
      time_got_out_of_bed: '',
      time_fell_asleep: '',
      time_in_light_sleep: '',
      time_in_deep_sleep: '',
      time_in_rem_sleep: '',
      number_of_times_woke_up: '',
      resting_heart_rate: ''
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
                <MoonIcon 
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
                  Sleep Tracker
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                  Track your sleep patterns and quality
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
            <span>Add Sleep</span>
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
                  {editingLog ? 'Edit Sleep Entry' : 'Add Sleep Entry'}
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
                    Time Went to Bed
                  </label>
                  <input
                    type="time"
                    name="time_went_to_bed"
                    value={formData.time_went_to_bed}
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
                    Time Got Out of Bed
                  </label>
                  <input
                    type="time"
                    name="time_got_out_of_bed"
                    value={formData.time_got_out_of_bed}
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
                    Time Fell Asleep (Optional)
                  </label>
                  <input
                    type="time"
                    name="time_fell_asleep"
                    value={formData.time_fell_asleep}
                    onChange={handleInputChange}
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

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ 
                    color: 'var(--text-primary)', 
                    fontFamily: 'var(--font-primary)' 
                  }}>
                    Light Sleep (minutes)
                  </label>
                  <input
                    type="number"
                    name="time_in_light_sleep"
                    value={formData.time_in_light_sleep}
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
                    Deep Sleep (minutes)
                  </label>
                  <input
                    type="number"
                    name="time_in_deep_sleep"
                    value={formData.time_in_deep_sleep}
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
                    REM Sleep (minutes)
                  </label>
                  <input
                    type="number"
                    name="time_in_rem_sleep"
                    value={formData.time_in_rem_sleep}
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
                    Times Woke Up
                  </label>
                  <input
                    type="number"
                    name="number_of_times_woke_up"
                    value={formData.number_of_times_woke_up}
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
                Your latest sleep records
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {getRecentLogs().length === 0 ? (
                <div className="p-8 text-center">
                  <MoonIcon 
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
                    No sleep entries yet
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                    Start tracking your sleep to see your patterns
                  </p>
                </div>
              ) : (
                getRecentLogs().map((log) => (
                  <div key={log.sleep_log_id} className="p-6 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                          <MoonIcon 
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
                              {log.time_went_to_bed} - {log.time_got_out_of_bed}
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
                          onClick={() => handleDelete(log.sleep_log_id)}
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

export default SleepTracker;