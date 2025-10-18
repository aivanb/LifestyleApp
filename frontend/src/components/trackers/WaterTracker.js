import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BeakerIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const WaterTracker = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    amount: '',
    unit: 'oz'
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getWaterLogs();
      setLogs(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading water logs:', error);
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
        amount: parseFloat(formData.amount),
        unit: formData.unit
      };

      if (editingLog) {
        await api.updateWaterLog(editingLog.water_log_id, logData);
      } else {
        await api.createWaterLog(logData);
      }

      await loadLogs();
      resetForm();
    } catch (error) {
      console.error('Error saving water log:', error);
      alert('Error saving water log. Please try again.');
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      amount: log.amount.toString(),
      unit: log.unit
    });
    setShowForm(true);
  };

  const handleDelete = async (logId) => {
    if (window.confirm('Are you sure you want to delete this water entry?')) {
      try {
        await api.deleteWaterLog(logId);
        await loadLogs();
      } catch (error) {
        console.error('Error deleting water log:', error);
        alert('Error deleting water log. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      unit: 'oz'
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

  const getDailyTotal = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(log => {
        if (!log.created_at) return false;
        return new Date(log.created_at).toISOString().split('T')[0] === today;
      });
      
      return todayLogs.reduce((total, log) => {
        if (!log.amount || !log.unit) return total;
        
        // Convert to oz for calculation (simplified)
        let amountInOz = parseFloat(log.amount) || 0;
        if (log.unit === 'ml') amountInOz = amountInOz * 0.033814;
        else if (log.unit === 'cup') amountInOz = amountInOz * 8;
        else if (log.unit === 'liter' || log.unit === 'L') amountInOz = amountInOz * 33.814;
        
        return total + amountInOz;
      }, 0);
    } catch (error) {
      console.error('Error calculating daily total:', error);
      return 0;
    }
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
                <BeakerIcon 
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
                  Water Tracker
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                  Track your daily water intake
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
            <span>Add Water</span>
          </button>
        </div>
      </div>

      {/* Daily Total */}
      <div className="p-6 mb-8 rounded-lg" style={{ 
        backgroundColor: 'var(--accent-color)', 
        borderRadius: 'var(--radius-lg)',
        color: 'white'
      }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-bold)' }}>
              Today's Total
            </h2>
            <p className="mt-1" style={{ opacity: 0.8, fontFamily: 'var(--font-primary)' }}>
              Keep up the great hydration!
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold" style={{ fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-bold)' }}>
              {getDailyTotal().toFixed(1)}
            </div>
            <div style={{ opacity: 0.8, fontFamily: 'var(--font-primary)' }}>oz</div>
          </div>
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
                  {editingLog ? 'Edit Water Entry' : 'Add Water Entry'}
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
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg"
                    style={{ 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    placeholder="Enter amount"
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
                    name="unit"
                    value={formData.unit}
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
                    <option value="oz">Fluid Ounces (fl oz)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="cup">Cups</option>
                    <option value="liter">Liters (L)</option>
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
                Your latest water intake records
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {getRecentLogs().length === 0 ? (
                <div className="p-8 text-center">
                  <BeakerIcon 
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
                    No water entries yet
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                    Start tracking your hydration to see your progress
                  </p>
                </div>
              ) : (
                getRecentLogs().map((log) => (
                  <div key={log.water_log_id} className="p-6 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                          <BeakerIcon 
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
                              {log.amount}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                              {log.unit}
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
                          onClick={() => handleDelete(log.water_log_id)}
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

export default WaterTracker;