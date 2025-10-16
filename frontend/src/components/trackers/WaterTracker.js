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
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => 
      new Date(log.created_at).toISOString().split('T')[0] === today
    );
    
    return todayLogs.reduce((total, log) => {
      // Convert to oz for calculation (simplified)
      let amountInOz = log.amount;
      if (log.unit === 'ml') amountInOz = log.amount * 0.033814;
      else if (log.unit === 'cup') amountInOz = log.amount * 8;
      else if (log.unit === 'liter' || log.unit === 'L') amountInOz = log.amount * 33.814;
      
      return total + amountInOz;
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-600"></div>
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
                <div className="p-2 bg-cyan-100 rounded-xl">
                  <BeakerIcon className="h-8 w-8 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Water Tracker</h1>
                  <p className="text-gray-600">Track your daily water intake</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Water</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Daily Total */}
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Today's Total</h2>
              <p className="text-cyan-100 mt-1">Keep up the great hydration!</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{getDailyTotal().toFixed(1)}</div>
              <div className="text-cyan-100">oz</div>
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
                    {editingLog ? 'Edit Water Entry' : 'Add Water Entry'}
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
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="Enter amount"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="oz">Fluid Ounces (fl oz)</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="cup">Cups</option>
                      <option value="liter">Liters (L)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
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
                <p className="text-gray-600 mt-1">Your latest water intake records</p>
              </div>

              <div className="divide-y divide-gray-200">
                {getRecentLogs().length === 0 ? (
                  <div className="p-8 text-center">
                    <BeakerIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No water entries yet</p>
                    <p className="text-gray-400 text-sm">Start tracking your hydration to see your progress</p>
                  </div>
                ) : (
                  getRecentLogs().map((log) => (
                    <div key={log.water_log_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-cyan-100 rounded-lg">
                            <BeakerIcon className="h-5 w-5 text-cyan-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-gray-900">
                                {log.amount}
                              </span>
                              <span className="text-gray-600">{log.unit}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{formatDate(log.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(log)}
                            className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(log.water_log_id)}
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

export default WaterTracker;
