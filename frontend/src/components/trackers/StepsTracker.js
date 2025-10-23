import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const StepsTracker = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  // const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    steps: '',
    date_time: new Date().toISOString()
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.getStepsLogs();
      setLogs(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading steps logs:', error);
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
        steps: parseInt(formData.steps),
        date_time: formData.date_time
      };

      if (editingLog) {
        await api.updateStepsLog(editingLog.step_log_id, logData);
      } else {
        await api.createStepsLog(logData);
      }

      await loadLogs();
      resetForm();
    } catch (error) {
      console.error('Error saving steps log:', error);
      alert('Error saving steps log. Please try again.');
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      steps: log.steps.toString(),
      date_time: new Date(log.date_time).toISOString()
    });
    setShowForm(true);
  };

  const handleDelete = async (logId) => {
    if (window.confirm('Are you sure you want to delete this steps entry?')) {
      try {
        await api.deleteStepsLog(logId);
        await loadLogs();
      } catch (error) {
        console.error('Error deleting steps log:', error);
        alert('Error deleting steps log. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      steps: '',
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

  const getRecentLogs = () => {
    return logs.slice(0, 10);
  };

  const getDailySteps = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLog = logs.find(log => 
      new Date(log.date_time).toISOString().split('T')[0] === today
    );
    return todayLog ? todayLog.steps : 0;
  };

  const formatSteps = (steps) => {
    return steps.toLocaleString();
  };

  if (loading) {
    return (
      <div className="loading-container min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="steps-tracker-container min-h-screen bg-gray-50">
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
                <div className="p-2 bg-green-100 rounded-xl">
                  <UserIcon className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Steps Tracker</h1>
                  <p className="text-gray-600">Track your daily step count</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="add-steps-button"
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
              <span>Add Steps</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Daily Total */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Today's Steps</h2>
              <p className="text-green-100 mt-1">Keep moving towards your goals!</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{formatSteps(getDailySteps())}</div>
              <div className="text-green-100">steps</div>
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
                    {editingLog ? 'Edit Steps Entry' : 'Add Steps Entry'}
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
                      Steps
                    </label>
                    <input
                      type="number"
                      name="steps"
                      value={formData.steps}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter step count"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="date_time"
                      value={formData.date_time.slice(0, 16)}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        date_time: new Date(e.target.value).toISOString()
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                <p className="text-gray-600 mt-1">Your latest step counts</p>
              </div>

              <div className="divide-y divide-gray-200">
                {getRecentLogs().length === 0 ? (
                  <div className="p-8 text-center">
                    <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No steps entries yet</p>
                    <p className="text-gray-400 text-sm">Start tracking your steps to see your progress</p>
                  </div>
                ) : (
                  getRecentLogs().map((log) => (
                    <div key={log.step_log_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <UserIcon className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-gray-900">
                                {formatSteps(log.steps)}
                              </span>
                              <span className="text-gray-600">steps</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{formatDate(log.date_time)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(log)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(log.step_log_id)}
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

export default StepsTracker;

// CSS Styling - moved to component styling
  /*
  .steps-tracker-container {
    padding: 0;
    margin: 0;
  }

  .loading-container {
    min-height: 400px;
  }

  .add-steps-button {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    transition: all 0.2s var(--ease-out-cubic);
  }

  .add-steps-button:hover {
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
