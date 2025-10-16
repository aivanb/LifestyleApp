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
      const logData = {
        date_time: formData.date_time,
        time_went_to_bed: formData.time_went_to_bed,
        time_got_out_of_bed: formData.time_got_out_of_bed
      };

      // Only add optional fields if they have values
      if (formData.time_fell_asleep) {
        logData.time_fell_asleep = formData.time_fell_asleep;
      }
      if (formData.time_in_light_sleep) {
        logData.time_in_light_sleep = parseInt(formData.time_in_light_sleep);
      }
      if (formData.time_in_deep_sleep) {
        logData.time_in_deep_sleep = parseInt(formData.time_in_deep_sleep);
      }
      if (formData.time_in_rem_sleep) {
        logData.time_in_rem_sleep = parseInt(formData.time_in_rem_sleep);
      }
      if (formData.number_of_times_woke_up) {
        logData.number_of_times_woke_up = parseInt(formData.number_of_times_woke_up);
      }
      if (formData.resting_heart_rate) {
        logData.resting_heart_rate = parseInt(formData.resting_heart_rate);
      }

      if (editingLog) {
        await api.updateSleepLog(editingLog.sleep_log_id, logData);
      } else {
        await api.createSleepLog(logData);
      }

      await loadLogs();
      resetForm();
    } catch (error) {
      console.error('Error saving sleep log:', error);
      alert('Error saving sleep log. Please try again.');
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

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const calculateSleepDuration = (log) => {
    if (!log.time_went_to_bed || !log.time_got_out_of_bed) return null;
    
    const bedTime = new Date(`2000-01-01T${log.time_went_to_bed}`);
    const wakeTime = new Date(`2000-01-01T${log.time_got_out_of_bed}`);
    
    // Handle overnight sleep
    if (wakeTime < bedTime) {
      wakeTime.setDate(wakeTime.getDate() + 1);
    }
    
    const diffMs = wakeTime - bedTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    const hours = Math.floor(diffHours);
    const minutes = Math.round((diffHours - hours) * 60);
    
    return `${hours}h ${minutes}m`;
  };

  const getRecentLogs = () => {
    return logs.slice(0, 10);
  };

  const getAverageSleepDuration = () => {
    const validLogs = logs.filter(log => log.time_went_to_bed && log.time_got_out_of_bed);
    if (validLogs.length === 0) return null;
    
    const totalMinutes = validLogs.reduce((total, log) => {
      const bedTime = new Date(`2000-01-01T${log.time_went_to_bed}`);
      const wakeTime = new Date(`2000-01-01T${log.time_got_out_of_bed}`);
      
      if (wakeTime < bedTime) {
        wakeTime.setDate(wakeTime.getDate() + 1);
      }
      
      return total + (wakeTime - bedTime) / (1000 * 60);
    }, 0);
    
    const avgMinutes = totalMinutes / validLogs.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.round(avgMinutes % 60);
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
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
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <MoonIcon className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Sleep Tracker</h1>
                  <p className="text-gray-600">Track your sleep patterns and quality</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Sleep</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Average Sleep Duration */}
        {getAverageSleepDuration() && (
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Average Sleep Duration</h2>
                <p className="text-indigo-100 mt-1">Based on your recent entries</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{getAverageSleepDuration()}</div>
                <div className="text-indigo-100">per night</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            {showForm && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingLog ? 'Edit Sleep Entry' : 'Add Sleep Entry'}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bed Time *
                      </label>
                      <input
                        type="time"
                        name="time_went_to_bed"
                        value={formData.time_went_to_bed}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wake Time *
                      </label>
                      <input
                        type="time"
                        name="time_got_out_of_bed"
                        value={formData.time_got_out_of_bed}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time to Fall Asleep
                    </label>
                    <input
                      type="time"
                      name="time_fell_asleep"
                      value={formData.time_fell_asleep}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Light Sleep (min)
                      </label>
                      <input
                        type="number"
                        name="time_in_light_sleep"
                        value={formData.time_in_light_sleep}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deep Sleep (min)
                      </label>
                      <input
                        type="number"
                        name="time_in_deep_sleep"
                        value={formData.time_in_deep_sleep}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        REM Sleep (min)
                      </label>
                      <input
                        type="number"
                        name="time_in_rem_sleep"
                        value={formData.time_in_rem_sleep}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Times Woke Up
                      </label>
                      <input
                        type="number"
                        name="number_of_times_woke_up"
                        value={formData.number_of_times_woke_up}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resting HR (BPM)
                      </label>
                      <input
                        type="number"
                        name="resting_heart_rate"
                        value={formData.resting_heart_rate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
                <p className="text-gray-600 mt-1">Your latest sleep records</p>
              </div>

              <div className="divide-y divide-gray-200">
                {getRecentLogs().length === 0 ? (
                  <div className="p-8 text-center">
                    <MoonIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No sleep entries yet</p>
                    <p className="text-gray-400 text-sm">Start tracking your sleep to see your patterns</p>
                  </div>
                ) : (
                  getRecentLogs().map((log) => (
                    <div key={log.sleep_log_id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <MoonIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {formatDate(log.date_time)}
                              </h3>
                              {calculateSleepDuration(log) && (
                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
                                  {calculateSleepDuration(log)}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Bed:</span>
                                <span className="ml-1 font-medium">{formatTime(log.time_went_to_bed)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Wake:</span>
                                <span className="ml-1 font-medium">{formatTime(log.time_got_out_of_bed)}</span>
                              </div>
                              {log.time_fell_asleep && (
                                <div>
                                  <span className="text-gray-500">Asleep:</span>
                                  <span className="ml-1 font-medium">{formatTime(log.time_fell_asleep)}</span>
                                </div>
                              )}
                              {log.number_of_times_woke_up && (
                                <div>
                                  <span className="text-gray-500">Woke up:</span>
                                  <span className="ml-1 font-medium">{log.number_of_times_woke_up} times</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(log)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(log.sleep_log_id)}
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

export default SleepTracker;
