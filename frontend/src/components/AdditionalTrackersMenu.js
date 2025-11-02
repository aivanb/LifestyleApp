import React, { useState, useEffect } from 'react';
import {
  ScaleIcon,
  UserIcon,
  HeartIcon,
  MoonIcon,
  ChartBarIcon,
  RectangleGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const AdditionalTrackersMenu = () => {
  const [streaks, setStreaks] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [heatmapData, setHeatmapData] = useState({});
  const [graphData, setGraphData] = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [hiddenFields, setHiddenFields] = useState({});
  const [expandedTables, setExpandedTables] = useState({}); // Track which tables are expanded
  const [dateRanges, setDateRanges] = useState({
    weight: '2weeks',
    body_measurement: '2weeks',
    steps: '2weeks',
    cardio: '2weeks',
    sleep: '2weeks',
    health_metrics: '2weeks'
  }); // Per-tracker date ranges: '2weeks', '1month', '6months', '1year', 'custom'
  const [customDates, setCustomDates] = useState({}); // { trackerId: { startDate: '', endDate: '' } }

  // Tracker configurations with unique colors and icons
  const trackers = [
    {
      id: 'weight',
      name: 'Weight Log',
      icon: ScaleIcon,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      id: 'body_measurement',
      name: 'Body Measurements',
      icon: RectangleGroupIcon,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    },
    {
      id: 'steps',
      name: 'Steps Log',
      icon: UserIcon,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
    },
    {
      id: 'cardio',
      name: 'Cardio Log',
      icon: HeartIcon,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      hoverColor: 'hover:from-red-600 hover:to-red-700',
    },
    {
      id: 'sleep',
      name: 'Sleep Log',
      icon: MoonIcon,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      hoverColor: 'hover:from-indigo-600 hover:to-indigo-700',
    },
    {
      id: 'health_metrics',
      name: 'Health Metrics',
      icon: ChartBarIcon,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    }
  ];

  // Load all data on mount
  useEffect(() => {
    loadStreaks();
    loadHeatmapAndGraphData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark initial load as complete once data is loaded
  useEffect(() => {
    if (!loading && !dataLoading && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, dataLoading]);

  // Reload data when date ranges change
  useEffect(() => {
    if (initialLoadComplete) { // Only reload if initial load is complete
      loadHeatmapAndGraphData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRanges, customDates]);

  // Set default to show only first metric for each tracker when data first loads
  useEffect(() => {
    if (!dataLoading && Object.keys(graphData).length > 0 && Object.keys(hiddenFields).length === 0) {
      const defaultHiddenFields = {};
      
      // For weight and steps, there's only one field so nothing to hide
      // For body measurements, hide all except first
      if (graphData.body_measurement && graphData.body_measurement.dates) {
        const bodyFields = ['upper_arm', 'lower_arm', 'waist', 'shoulder', 'leg', 'calf'];
        const fieldsWithData = bodyFields.filter(field => 
          graphData.body_measurement[field]?.some(v => v != null && v > 0)
        );
        if (fieldsWithData.length > 0) {
          defaultHiddenFields.body_measurement = fieldsWithData.slice(1);
        }
      }
      
      // For cardio, hide all except first
      if (graphData.cardio && graphData.cardio.dates) {
        const cardioFields = ['duration', 'calories_burned', 'heart_rate'];
        const fieldsWithData = cardioFields.filter(field => 
          graphData.cardio[field]?.some(v => v != null && v > 0)
        );
        if (fieldsWithData.length > 0) {
          defaultHiddenFields.cardio = fieldsWithData.slice(1);
        }
      }
      
      // For sleep, hide all except first
      if (graphData.sleep && graphData.sleep.dates) {
        const sleepFields = ['time_in_light_sleep', 'time_in_deep_sleep', 'time_in_rem_sleep', 'number_of_times_woke_up', 'resting_heart_rate'];
        const fieldsWithData = sleepFields.filter(field => 
          graphData.sleep[field]?.some(v => v != null && v > 0)
        );
        if (fieldsWithData.length > 0) {
          defaultHiddenFields.sleep = fieldsWithData.slice(1);
        }
      }
      
      // For health metrics, hide all except first
      if (graphData.health_metrics && graphData.health_metrics.dates) {
        const healthFields = ['resting_heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'morning_energy', 'stress_level', 'mood', 'soreness', 'illness_level'];
        const fieldsWithData = healthFields.filter(field => 
          graphData.health_metrics[field]?.some(v => v != null && v > 0)
        );
        if (fieldsWithData.length > 0) {
          defaultHiddenFields.health_metrics = fieldsWithData.slice(1);
        }
      }
      
      if (Object.keys(defaultHiddenFields).length > 0) {
        setHiddenFields(defaultHiddenFields);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, graphData]);

  const getDateRange = (trackerId) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const dateRange = dateRanges[trackerId] || '2weeks';
    let startDate;
    
    if (dateRange === '2weeks') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 14);
    } else if (dateRange === '1month') {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 1);
    } else if (dateRange === '6months') {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 6);
    } else if (dateRange === '1year') {
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
    } else if (dateRange === 'custom') {
      const custom = customDates[trackerId];
      if (custom && custom.startDate && custom.endDate) {
        startDate = new Date(custom.startDate);
        const endDate = new Date(custom.endDate);
        endDate.setHours(23, 59, 59, 999);
        return { startDate, endDate };
      }
      // Fallback to 2 weeks if custom dates not set
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 14);
    } else {
      // Default to 2 weeks
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 14);
    }
    
    startDate.setHours(0, 0, 0, 0);
    return { startDate, endDate: today };
  };

  const loadStreaks = async () => {
    try {
      setLoading(true);
      const response = await api.getAllTrackerStreaks();
      setStreaks(response.data);
    } catch (error) {
      console.error('Error loading streaks:', error);
      setStreaks({
        weight: 0,
        body_measurement: 0,
        steps: 0,
        cardio: 0,
        sleep: 0,
        health_metrics: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHeatmapAndGraphData = async () => {
    try {
      setDataLoading(true);
      
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const todayStr = today.toISOString().split('T')[0];
      
      // Check cache for heatmap data (cache for 1 hour)
      const cacheKey = 'heatmap_data_cache';
      const cacheTimestampKey = 'heatmap_data_cache_timestamp';
      const cachedHeatmap = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      let heatmap = {};
      if (cachedHeatmap && cacheTimestamp && (now - parseInt(cacheTimestamp)) < oneHour) {
        // Use cached data
        heatmap = JSON.parse(cachedHeatmap);
        setHeatmapData(heatmap);
      } else {
        // Fetch heatmap data for past 6 months (180 days) - independent of tracker date ranges
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setDate(today.getDate() - 180);
        sixMonthsAgo.setHours(0, 0, 0, 0);
        
        const heatmapApiParams = {
          start_date: sixMonthsAgo.toISOString().split('T')[0],
          end_date: todayStr,
          page_size: 10000  // Fetch all results for heatmap
        };
        
        const [weightDataForHeatmap, bodyMeasurementDataForHeatmap, stepsDataForHeatmap, 
               cardioDataForHeatmap, sleepDataForHeatmap, healthDataForHeatmap] = await Promise.all([
          api.getWeightLogs(heatmapApiParams).catch(() => ({ data: { results: [] } })),
          api.getBodyMeasurementLogs(heatmapApiParams).catch(() => ({ data: { results: [] } })),
          api.getStepsLogs(heatmapApiParams).catch(() => ({ data: { results: [] } })),
          api.getCardioLogs(heatmapApiParams).catch(() => ({ data: { results: [] } })),
          api.getSleepLogs(heatmapApiParams).catch(() => ({ data: { results: [] } })),
          api.getHealthMetricsLogs(heatmapApiParams).catch(() => ({ data: { results: [] } }))
        ]);

        // Process heatmap data (past 6 months / 180 days)
        heatmap = {};
        
        for (let i = 0; i <= 180; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          heatmap[dateStr] = 0;
        }

        const allDataByDate = {};
        [
          { data: weightDataForHeatmap.data.results || [], key: 'weight' },
          { data: bodyMeasurementDataForHeatmap.data.results || [], key: 'body_measurement' },
          { data: stepsDataForHeatmap.data.results || [], key: 'steps' },
          { data: cardioDataForHeatmap.data.results || [], key: 'cardio' },
          { data: sleepDataForHeatmap.data.results || [], key: 'sleep' },
          { data: healthDataForHeatmap.data.results || [], key: 'health_metrics' }
        ].forEach(({ data, key }) => {
          data.forEach(entry => {
            const rawDate = entry.date_time || entry.created_at;
            const date = typeof rawDate === 'string' ? rawDate.split('T')[0] : todayStr;
            if (!allDataByDate[date]) {
              allDataByDate[date] = new Set();
            }
            allDataByDate[date].add(key);
          });
        });

        Object.keys(allDataByDate).forEach(date => {
          if (heatmap[date] !== undefined) {
            heatmap[date] = allDataByDate[date].size;
          }
        });

        // Cache the heatmap data
        localStorage.setItem(cacheKey, JSON.stringify(heatmap));
        localStorage.setItem(cacheTimestampKey, now.toString());
        
        setHeatmapData(heatmap);
      }
      
      // Fetch data for each tracker with its own date range filtering (for graphs only)
      const fetchPromises = trackers.map(async (tracker) => {
        const { startDate, endDate } = getDateRange(tracker.id);
        const apiParams = {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          page_size: 10000  // Fetch all results for graphs
        };
        
        switch(tracker.id) {
          case 'weight':
            return { tracker: 'weight', data: await api.getWeightLogs(apiParams).catch(() => ({ data: { results: [] } })), startDate, endDate };
          case 'body_measurement':
            return { tracker: 'body_measurement', data: await api.getBodyMeasurementLogs(apiParams).catch(() => ({ data: { results: [] } })), startDate, endDate };
          case 'steps':
            return { tracker: 'steps', data: await api.getStepsLogs(apiParams).catch(() => ({ data: { results: [] } })), startDate, endDate };
          case 'cardio':
            return { tracker: 'cardio', data: await api.getCardioLogs(apiParams).catch(() => ({ data: { results: [] } })), startDate, endDate };
          case 'sleep':
            return { tracker: 'sleep', data: await api.getSleepLogs(apiParams).catch(() => ({ data: { results: [] } })), startDate, endDate };
          case 'health_metrics':
            return { tracker: 'health_metrics', data: await api.getHealthMetricsLogs(apiParams).catch(() => ({ data: { results: [] } })), startDate, endDate };
          default:
            return null;
        }
      });
      
      const trackerDataArray = await Promise.all(fetchPromises);
      const trackerData = {};
      trackerDataArray.forEach(item => {
        if (item) {
          trackerData[item.tracker] = { data: item.data, startDate: item.startDate, endDate: item.endDate };
        }
      });

      // Process graph data for each tracker with its own date range
      const graphDataState = {};
      trackers.forEach(tracker => {
        const trackerInfo = trackerData[tracker.id];
        if (trackerInfo) {
          const data = trackerInfo.data.data.results || [];
          const { startDate, endDate } = trackerInfo;
          
          switch(tracker.id) {
            case 'weight':
              graphDataState.weight = processNumericData(data, 'weight', startDate, endDate, true);
              break;
            case 'body_measurement':
              graphDataState.body_measurement = processBodyMeasurementData(data, startDate, endDate);
              break;
            case 'steps':
              graphDataState.steps = processNumericData(data, 'steps', startDate, endDate, false);
              break;
            case 'cardio':
              graphDataState.cardio = processCardioData(data, startDate, endDate);
              break;
            case 'sleep':
              graphDataState.sleep = processSleepData(data, startDate, endDate);
              break;
            case 'health_metrics':
              graphDataState.health_metrics = processHealthMetricsData(data, startDate, endDate);
              break;
          }
        }
      });

      setGraphData(graphDataState);
    } catch (error) {
      console.error('Error loading historical data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Process single-field numeric data (weight, steps)
  // Averages for weight, sums for steps
  const processNumericData = (data, field, startDate, endDate, average = false) => {
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group data by date
    const dataByDate = {};
    dates.forEach(date => {
      dataByDate[date] = [];
    });

    // Find the most recent value before startDate
    let previousValue = null;
    const startDateStr = startDate.toISOString().split('T')[0];

    data.forEach(entry => {
      let rawDate = entry.date_time || entry.created_at;
      let entryDate = null;
      if (rawDate) {
        if (typeof rawDate === 'string') {
          entryDate = rawDate.split('T')[0];
        } else if (rawDate instanceof Date) {
          entryDate = rawDate.toISOString().split('T')[0];
        }
      }
      
      if (entryDate && entry[field] != null) {
        if (dataByDate[entryDate]) {
          dataByDate[entryDate].push(parseFloat(entry[field]));
        } else if (entryDate < startDateStr) {
          // This is data before our graph window - track for dotted line
          const val = parseFloat(entry[field]);
          previousValue = val; // Keep the most recent one
        }
      }
    });

    // Process each date
    const values = dates.map(date => {
      const vals = dataByDate[date];
      if (vals.length === 0) return null;
      
      if (average) {
        // Average for weight
        return vals.reduce((sum, v) => sum + v, 0) / vals.length;
      } else {
        // Sum for steps
        return vals.reduce((sum, v) => sum + v, 0);
      }
    });

    return { dates, [field]: values, _previousValue: previousValue };
  };

  const processBodyMeasurementData = (data, startDate, endDate) => {
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const measurements = ['upper_arm', 'lower_arm', 'waist', 'shoulder', 'leg', 'calf'];
    
    // Group data by date
    const dataByDate = {};
    dates.forEach(date => {
      dataByDate[date] = [];
    });

    const startDateStr = startDate.toISOString().split('T')[0];
    const previousValues = {};
    measurements.forEach(m => previousValues[m] = null);

    data.forEach(entry => {
      let rawDate = entry.date_time || entry.created_at;
      let entryDate = null;
      if (rawDate) {
        if (typeof rawDate === 'string') {
          entryDate = rawDate.split('T')[0];
        } else if (rawDate instanceof Date) {
          entryDate = rawDate.toISOString().split('T')[0];
        }
      }
      
      if (entryDate) {
        if (dataByDate[entryDate]) {
          dataByDate[entryDate].push(entry);
        } else if (entryDate < startDateStr) {
          // Track previous values for dotted lines
          measurements.forEach(measurement => {
            if (entry[measurement] != null) {
              previousValues[measurement] = parseFloat(entry[measurement]);
            }
          });
        }
      }
    });

    // Process each measurement
    const result = { dates, _previousValues: previousValues };
    measurements.forEach(measurement => {
      result[measurement] = dates.map(date => {
        const entries = dataByDate[date];
        if (!entries || entries.length === 0) return null;
        
        // Average all entries for this date
        const values = entries
          .map(entry => entry[measurement])
          .filter(val => val != null)
          .map(val => parseFloat(val));
        
        if (values.length === 0) return null;
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      });
    });

    return result;
  };

  const processCardioData = (data, startDate, endDate) => {
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const metrics = ['duration', 'calories_burned', 'heart_rate'];
    
    // Group data by date
    const dataByDate = {};
    dates.forEach(date => {
      dataByDate[date] = [];
    });

    const startDateStr = startDate.toISOString().split('T')[0];
    const previousValues = {};
    metrics.forEach(m => previousValues[m] = null);

    data.forEach(entry => {
      let rawDate = entry.date_time || entry.created_at;
      let entryDate = null;
      if (rawDate) {
        if (typeof rawDate === 'string') {
          entryDate = rawDate.split('T')[0];
        } else if (rawDate instanceof Date) {
          entryDate = rawDate.toISOString().split('T')[0];
        }
      }
      
      if (entryDate) {
        if (dataByDate[entryDate]) {
          dataByDate[entryDate].push(entry);
        } else if (entryDate < startDateStr) {
          metrics.forEach(metric => {
            if (entry[metric] != null) {
              previousValues[metric] = parseFloat(entry[metric]);
            }
          });
        }
      }
    });

    // Process each metric
    const result = { dates, _previousValues: previousValues };
    metrics.forEach(metric => {
      result[metric] = dates.map(date => {
        const entries = dataByDate[date];
        if (!entries || entries.length === 0) return null;
        
        // Sum all entries for this date
        const values = entries
          .map(entry => entry[metric])
          .filter(val => val != null)
          .map(val => parseFloat(val));
        
        if (values.length === 0) return null;
        return values.reduce((sum, v) => sum + v, 0);
      });
    });

    return result;
  };

  const processSleepData = (data, startDate, endDate) => {
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const metrics = ['time_in_light_sleep', 'time_in_deep_sleep', 'time_in_rem_sleep', 'number_of_times_woke_up', 'resting_heart_rate'];
    
    // Group data by date
    const dataByDate = {};
    dates.forEach(date => {
      dataByDate[date] = [];
    });

    const startDateStr = startDate.toISOString().split('T')[0];
    const previousValues = {};
    metrics.forEach(m => previousValues[m] = null);

    data.forEach(entry => {
      let rawDate = entry.date_time || entry.created_at;
      let entryDate = null;
      if (rawDate) {
        if (typeof rawDate === 'string') {
          entryDate = rawDate.split('T')[0];
        } else if (rawDate instanceof Date) {
          entryDate = rawDate.toISOString().split('T')[0];
        }
      }
      
      if (entryDate) {
        if (dataByDate[entryDate]) {
          dataByDate[entryDate].push(entry);
        } else if (entryDate < startDateStr) {
          metrics.forEach(metric => {
            if (entry[metric] != null) {
              previousValues[metric] = parseFloat(entry[metric]);
            }
          });
        }
      }
    });

    // Process each metric
    const result = { dates, _previousValues: previousValues };
    metrics.forEach(metric => {
      result[metric] = dates.map(date => {
        const entries = dataByDate[date];
        if (!entries || entries.length === 0) return null;
        
        // Sum all entries for this date
        const values = entries
          .map(entry => entry[metric])
          .filter(val => val != null)
          .map(val => parseFloat(val));
        
        if (values.length === 0) return null;
        return values.reduce((sum, v) => sum + v, 0);
      });
    });

    return result;
  };

  const processHealthMetricsData = (data, startDate, endDate) => {
    const dates = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const metrics = ['resting_heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'morning_energy', 'stress_level', 'mood', 'soreness', 'illness_level'];
    
    // Group data by date
    const dataByDate = {};
    dates.forEach(date => {
      dataByDate[date] = [];
    });

    const startDateStr = startDate.toISOString().split('T')[0];
    const previousValues = {};
    metrics.forEach(m => previousValues[m] = null);

    data.forEach(entry => {
      let rawDate = entry.date_time || entry.created_at;
      let entryDate = null;
      if (rawDate) {
        if (typeof rawDate === 'string') {
          entryDate = rawDate.split('T')[0];
        } else if (rawDate instanceof Date) {
          entryDate = rawDate.toISOString().split('T')[0];
        }
      }
      
      if (entryDate) {
        if (dataByDate[entryDate]) {
          dataByDate[entryDate].push(entry);
        } else if (entryDate < startDateStr) {
          metrics.forEach(metric => {
            if (entry[metric] != null) {
              previousValues[metric] = parseFloat(entry[metric]);
            }
          });
        }
      }
    });

    // Process each metric
    const result = { dates, _previousValues: previousValues };
    metrics.forEach(metric => {
      result[metric] = dates.map(date => {
        const entries = dataByDate[date];
        if (!entries || entries.length === 0) return null;
        
        // Sum all entries for this date
        const values = entries
          .map(entry => entry[metric])
          .filter(val => val != null)
          .map(val => parseFloat(val));
        
        if (values.length === 0) return null;
        return values.reduce((sum, v) => sum + v, 0);
      });
    });

    return result;
  };

  const handleTrackerClick = (tracker) => {
    setFormData(getInitialFormData(tracker.id));
    setActiveModal(tracker.id);
  };

  const closeModal = () => {
    setActiveModal(null);
    setFormData({});
  };

  const getInitialFormData = (trackerId) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString().slice(0, 16); // datetime-local format
    switch(trackerId) {
      case 'weight':
        return { weight: '', weight_unit: 'lbs', date_time: now };
      case 'body_measurement':
        return { upper_arm: '', lower_arm: '', waist: '', shoulder: '', leg: '', calf: '', date_time: now };
      case 'steps':
        return { steps: '', date_time: now };
      case 'cardio':
        return { cardio_type: '', duration: '', distance: '', distance_unit: 'miles', calories_burned: '', heart_rate: '', date_time: now };
      case 'sleep':
        return { 
          date_time: today,
          time_went_to_bed: '',
          time_got_out_of_bed: '',
          time_fell_asleep: '',
          time_in_light_sleep: '',
          time_in_deep_sleep: '',
          time_in_rem_sleep: '',
          number_of_times_woke_up: '',
          resting_heart_rate: ''
        };
      case 'health_metrics':
        return {
          date_time: today,
          resting_heart_rate: '',
          blood_pressure_systolic: '',
          blood_pressure_diastolic: '',
          morning_energy: '',
          stress_level: '',
          mood: '',
          soreness: '',
          illness_level: ''
        };
      default:
        return {};
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
    setSubmitting(true);
    
    try {
      let logData = { ...formData };
      
      // Convert date_time to ISO format if present
      if (logData.date_time) {
        logData.date_time = new Date(logData.date_time).toISOString();
      }
      
      // Convert numeric fields (but not date_time)
      Object.keys(logData).forEach(key => {
        if (key !== 'date_time' && typeof logData[key] === 'string' && logData[key] !== '' && !isNaN(logData[key])) {
          logData[key] = parseFloat(logData[key]);
        }
      });

      switch(activeModal) {
        case 'weight':
          await api.createWeightLog(logData);
          break;
        case 'body_measurement':
          const bodyData = {};
          Object.keys(logData).forEach(key => {
            if (logData[key] && logData[key] !== '') {
              bodyData[key] = logData[key];
            }
          });
          await api.createBodyMeasurementLog(bodyData);
          break;
        case 'steps':
          await api.createStepsLog(logData);
          break;
        case 'cardio':
          await api.createCardioLog(logData);
          break;
        case 'sleep':
          await api.createSleepLog(logData);
          break;
        case 'health_metrics':
          await api.createHealthMetricsLog(logData);
          break;
        default:
          console.error('Unknown tracker type:', activeModal);
          return;
      }
      
      await loadStreaks();
      await loadHeatmapAndGraphData();
      closeModal();
    } catch (error) {
      console.error('Error saving log:', error);
      alert('Error saving entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  const getHeatmapColor = (count) => {
    const colors = {
      0: 'transparent',
      1: '#f87171',
      2: '#fb923c',
      3: '#facc15',
      4: '#4ade80',
      5: '#60a5fa',
      6: '#c084fc'
    };
    return colors[count] || colors[0];
  };

  const generateLast180Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i <= 180; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days.reverse();
  };

  const generateHeatmapData = () => {
    const days = generateLast180Days();
    const weeks = Math.ceil(days.length / 5); // 5 rows instead of 7
    const heatmap = [];
    
    for (let week = 0; week < weeks; week++) {
      const weekData = [];
      for (let day = 0; day < 5; day++) { // 5 rows
        const idx = week * 5 + day;
        if (idx < days.length) {
          weekData.push(days[idx]);
        } else {
          weekData.push(null);
        }
      }
      heatmap.push(weekData);
    }
    
    return { heatmap, days };
  };

  const getMonthLabel = (weekStartDate) => {
    if (!weekStartDate) return '';
    const date = new Date(weekStartDate);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    // Only show label if it's the first of the month or if previous week was a different month
    return day <= 7 ? month : '';
  };

  const renderLineGraph = (trackerId, graphDataForTracker, dateRangeForTracker) => {
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
    
    // Get all metric keys for this tracker - must match the fields in the database models
    let metricKeys = [];
    if (trackerId === 'weight') {
      metricKeys = ['weight'];
    } else if (trackerId === 'body_measurement') {
      metricKeys = ['upper_arm', 'lower_arm', 'waist', 'shoulder', 'leg', 'calf'];
    } else if (trackerId === 'steps') {
      metricKeys = ['steps'];
    } else if (trackerId === 'cardio') {
      metricKeys = ['duration', 'calories_burned', 'heart_rate'];
    } else if (trackerId === 'sleep') {
      metricKeys = ['time_in_light_sleep', 'time_in_deep_sleep', 'time_in_rem_sleep', 'number_of_times_woke_up', 'resting_heart_rate'];
    } else if (trackerId === 'health_metrics') {
      metricKeys = ['resting_heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'morning_energy', 'stress_level', 'mood', 'soreness', 'illness_level'];
    }

    if (!graphDataForTracker || !graphDataForTracker.dates) {
    return (
        <div style={{ marginTop: 'var(--space-4)', marginLeft: '-24px', marginRight: '-24px', padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', width: 'calc(100% + 48px)' }}>
          <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
            No data available
          </div>
        </div>
      );
    }

    // Filter out hidden fields
    const activeMetrics = metricKeys.filter(key => !hiddenFields[trackerId]?.includes(key));
    
    const hasData = activeMetrics.some(key => {
      const values = graphDataForTracker[key];
      return values && values.some(v => v != null && v > 0);
    });

    const graphHeight = 120;
    const padding = { top: 10, right: 10, bottom: 30, left: 40 };

    // Calculate min and max values only from active (non-hidden) metrics for tighter Y-axis scaling
    const allActiveValues = activeMetrics
      .map(key => graphDataForTracker[key] || [])
      .flat()
      .filter(v => typeof v === 'number' && v != null && v > 0);
    
    const minValue = allActiveValues.length > 0 ? Math.min(...allActiveValues) : 0;
    const maxValue = allActiveValues.length > 0 ? Math.max(...allActiveValues) : 1;
    
    // Add padding (5% above and below) to prevent clipping, with a minimum range
    const range = maxValue - minValue;
    const paddedMin = Math.max(0, minValue - (range * 0.05 + Math.max(range * 0.01, 0.1)));
    const paddedMax = maxValue + (range * 0.05 + Math.max(range * 0.01, 0.1));
    const finalRange = paddedMax - paddedMin;

    // Don't return early - show empty graph instead of "no data" message

    // Use absolute pixel values for proper rendering
    const svgWidth = 600;
    const effectiveWidth = svgWidth - padding.left - padding.right - 10; // Add extra margin to prevent clipping

    const getYValue = (value) => {
      if (finalRange === 0) return padding.top + graphHeight / 2;
      return padding.top + graphHeight - (((value - paddedMin) / finalRange) * graphHeight);
    };

    const getXValue = (index, total) => {
      if (total === 0) return padding.left;
      return padding.left + ((index / total) * effectiveWidth);
    };

    // Determine which points to show based on date range
    const shouldShowPoint = (index) => {
      if (!dateRangeForTracker) return true; // Fallback to showing all
      
      const totalDays = graphDataForTracker.dates.length;
      
      if (dateRangeForTracker === '2weeks') {
        // Every day for 2 weeks
        return true;
      } else if (dateRangeForTracker === '1month') {
        // 2 points a week (every 3.5 days, so every 3 or 4 days)
        return index % 3 === 0 || index === totalDays - 1;
      } else if (dateRangeForTracker === '6months') {
        // 1 point per month (approximately every 30 days)
        const daysPerMonth = totalDays / 6;
        return index % Math.floor(daysPerMonth) === 0 || index === totalDays - 1;
      } else if (dateRangeForTracker === '1year') {
        // 1 point per month (approximately every 30 days)
        const daysPerMonth = totalDays / 12;
        return index % Math.floor(daysPerMonth) === 0 || index === totalDays - 1;
      } else if (dateRangeForTracker === 'custom') {
        // Max 10 points
        const interval = Math.max(1, Math.floor(totalDays / 10));
        return index % interval === 0 || index === totalDays - 1;
      }
      
      return true; // Default: show all
    };

    return (
      <div style={{ marginTop: 'var(--space-4)', marginLeft: '-24px', marginRight: '-24px', padding: 'var(--space-4)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', width: 'calc(100% + 48px)' }}>
        <svg width={svgWidth} height={graphHeight + padding.top + padding.bottom} viewBox={`0 0 ${svgWidth} ${graphHeight + padding.top + padding.bottom}`} style={{ maxWidth: '100%', height: 'auto' }}>
          <defs>
            <filter id="shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" opacity="0.2"/>
            </filter>
          </defs>
          
          {/* Y-axis labels */}
          {[0.25, 0.5, 0.75, 1.0].map((fraction, idx) => {
            const value = paddedMin + (finalRange * fraction);
            const y = getYValue(value);
            return (
              <text
                key={`y-label-${idx}`}
                x={5}
                y={y + 4}
                fontSize="10"
                fill="var(--text-secondary)"
                fontFamily="var(--font-primary)"
                textAnchor="start"
              >
                {Math.round(value)}
              </text>
            );
          })}

          {/* X-axis labels (dates) */}
          {graphDataForTracker.dates.filter((_, i) => i % Math.ceil(graphDataForTracker.dates.length / 5) === 0 || i === graphDataForTracker.dates.length - 1).map((date, idx) => {
            const originalIndex = graphDataForTracker.dates.indexOf(date);
            const x = getXValue(originalIndex, graphDataForTracker.dates.length - 1);
            return (
              <text
                key={`x-label-${idx}`}
                x={x}
                y={graphHeight + padding.top + padding.bottom - 5}
                fontSize="9"
                fill="var(--text-secondary)"
                fontFamily="var(--font-primary)"
                textAnchor="middle"
              >
                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            );
          })}

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1.0].map((fraction) => {
            const value = paddedMin + (finalRange * fraction);
            return (
              <line
                key={fraction}
                x1={padding.left}
                x2={padding.left + effectiveWidth}
                y1={getYValue(value)}
                y2={getYValue(value)}
                stroke="var(--border-primary)"
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}

          {/* Draw lines for each metric */}
          {activeMetrics.map((metricKey) => {
            const values = graphDataForTracker[metricKey];
            if (!values) return null;
            
            // Get the index from the original metricKeys array to maintain consistent colors
            const originalIdx = metricKeys.indexOf(metricKey);
            const color = colors[originalIdx % colors.length];
            
            // Build path segments - dashed lines only for gaps between non-consecutive days
            const segments = [];
            let currentSegment = [];
            let prevValidIndex = -1;
            let prevValidCoords = null;
            
            values.forEach((value, i) => {
              const isValidValue = value != null && value > 0;
              
              if (isValidValue) {
                const x = getXValue(i, values.length - 1);
                const y = getYValue(value);
                
                // Check if there's a gap (non-consecutive day)
                const isGap = prevValidIndex !== -1 && i - prevValidIndex > 1;
                
                if (isGap && prevValidCoords) {
                  // Start a new segment if there's a gap
                  if (currentSegment.length > 0) {
                    segments.push({ path: currentSegment, isDashed: false });
                  }
                  
                  // Add a dashed connecting line between segments
                  segments.push({
                    path: `M ${prevValidCoords.x} ${prevValidCoords.y} L ${x} ${y}`,
                    isDashed: true
                  });
                  
                  currentSegment = [];
                }
                
                if (currentSegment.length === 0 || !isGap) {
                  currentSegment.push(`${currentSegment.length === 0 ? 'M' : 'L'} ${x} ${y}`);
                }
                
                prevValidIndex = i;
                prevValidCoords = { x, y };
              }
            });
            
            if (currentSegment.length > 0) {
              segments.push({ path: currentSegment, isDashed: false });
            }

            // Add dotted line from older data if first segment doesn't start at index 0
            if (segments.length > 0) {
              const firstValidIndex = values.findIndex(v => v != null && v > 0);
              
              if (firstValidIndex > 0) {
                // Find previous value from data (for multi-field trackers)
                const prevValue = graphDataForTracker._previousValues 
                  ? graphDataForTracker._previousValues[metricKey] 
                  : graphDataForTracker._previousValue;
                
                // Check if this is single-field tracker with previous value
                const firstMetricKey = metricKeys[0];
                const isSingleField = graphDataForTracker._previousValue != null && 
                                     (trackerId === 'weight' || trackerId === 'steps');
                
                if (isSingleField || (graphDataForTracker._previousValues && prevValue != null)) {
                  const firstX = getXValue(firstValidIndex, values.length - 1);
                  const firstY = getYValue(values[firstValidIndex]);
                  
                  // Add a horizontal dotted line from the left edge
                  segments.unshift({
                    path: `M ${padding.left} ${firstY} L ${firstX} ${firstY}`,
                    isDashed: true
                  });
                }
              }
            }

            return (
              <g key={metricKey}>
                {segments.map((segment, segIdx) => (
                  <path
                    key={`segment-${segIdx}`}
                    d={segment.path}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray={segment.isDashed ? "5,5" : "0"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                    filter="url(#shadow)"
                  />
                ))}
                {/* Invisible hover areas for tooltips */}
                {values.map((value, i) => {
                  if (value == null || value <= 0) return null;
                  const x = getXValue(i, values.length - 1);
                  const y = getYValue(value);
                  return (
                    <circle
                      key={`hover-${i}`}
                      cx={x}
                      cy={y}
                      r="8"
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth="0"
                    >
                      <title>{`${graphDataForTracker.dates[i]}: ${Math.round(value * 100) / 100}`}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}

          {/* Axes lines */}
          <line
            x1={padding.left}
            x2={padding.left}
            y1={padding.top}
            y2={graphHeight + padding.top}
            stroke="var(--text-primary)"
            strokeWidth="1"
            opacity="0.5"
          />
          <line
            x1={padding.left}
            x2={padding.left + effectiveWidth}
            y1={graphHeight + padding.top}
            y2={graphHeight + padding.top}
            stroke="var(--text-primary)"
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)', justifyContent: 'center' }}>
          {metricKeys.filter(key => graphDataForTracker[key]?.some(v => v != null && v > 0)).map((metricKey) => {
            const isHidden = hiddenFields[trackerId]?.includes(metricKey);
            // Get the index from the original metricKeys array to maintain consistent colors
            const originalIdx = metricKeys.indexOf(metricKey);
            const color = colors[originalIdx % colors.length];
            return (
              <div 
                key={metricKey} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--space-1)', 
                  cursor: 'pointer',
                  opacity: isHidden ? 0.3 : 1
                }}
                onClick={() => {
                  setHiddenFields(prev => {
                    const trackerFields = prev[trackerId] || [];
                    const isCurrentlyHidden = trackerFields.includes(metricKey);
                    
                    // Only allow one metric to be visible at a time
                    // If clicking the currently selected metric, hide all
                    const allMetricKeys = metricKeys.filter(key => graphDataForTracker[key]?.some(v => v != null && v > 0));
                    
                    if (isCurrentlyHidden) {
                      // Hide all except this one
                      return {
                        ...prev,
                        [trackerId]: allMetricKeys.filter(k => k !== metricKey)
                      };
                    } else {
                      // Hide all except this one
                      return {
                        ...prev,
                        [trackerId]: allMetricKeys.filter(k => k !== metricKey)
                      };
                    }
                  });
                }}
              >
                <div style={{ width: '12px', height: '12px', background: color, borderRadius: '2px' }} />
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                  {metricKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Data Table for Testing - Collapsible */}
        {graphDataForTracker.dates && graphDataForTracker.dates.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <button
              onClick={() => setExpandedTables(prev => ({ ...prev, [trackerId]: !prev[trackerId] }))}
              style={{
                width: '100%',
                padding: 'var(--space-2)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'var(--font-primary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)'
              }}
            >
              <span>View Data Table</span>
              <span>{expandedTables[trackerId] ? '▼' : '▶'}</span>
            </button>
            
            {expandedTables[trackerId] && (
              <div style={{ marginTop: 'var(--space-2)', overflowX: 'auto', maxHeight: '200px', overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: 'var(--text-xs)', borderCollapse: 'collapse', fontFamily: 'var(--font-primary)' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                    <tr>
                      <th style={{ padding: 'var(--space-1)', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 'bold' }}>Date</th>
                      {activeMetrics.filter(key => graphDataForTracker[key]?.some(v => v != null && v > 0)).map((metricKey) => {
                        const originalIdx = metricKeys.indexOf(metricKey);
                        const color = colors[originalIdx % colors.length];
                        return (
                          <th 
                            key={metricKey} 
                            style={{ 
                              padding: 'var(--space-1)', 
                              textAlign: 'right', 
                              color: color,
                              fontWeight: 'bold',
                              opacity: hiddenFields[trackerId]?.includes(metricKey) ? 0.3 : 1
                            }}
                          >
                            {metricKey.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {graphDataForTracker.dates.map((date, i) => {
                      const hasAnyData = activeMetrics.some(key => {
                        const values = graphDataForTracker[key];
                        return values && values[i] != null && values[i] > 0;
                      });
                      
                      if (!hasAnyData) return null;
                      
                      return (
                        <tr key={date} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                          <td style={{ padding: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          {activeMetrics.filter(key => graphDataForTracker[key]?.some(v => v != null && v > 0)).map((metricKey) => {
                            const values = graphDataForTracker[metricKey];
                            const value = values && values[i];
                            const originalIdx = metricKeys.indexOf(metricKey);
                            const color = colors[originalIdx % colors.length];
                            return (
                              <td 
                                key={metricKey}
                                style={{ 
                                  padding: 'var(--space-1)', 
                                  textAlign: 'right', 
                                  color: color,
                                  opacity: hiddenFields[trackerId]?.includes(metricKey) ? 0.3 : 1
                                }}
                              >
                                {value != null && value > 0 ? Math.round(value * 100) / 100 : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderModalContent = () => {
    const tracker = trackers.find(t => t.id === activeModal);
    if (!tracker) return null;

    return (
      <div className="modal-backdrop" onClick={closeModal}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">{tracker.name}</div>
            <button className="modal-close-button" onClick={closeModal}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {activeModal === 'weight' && (
                <>
                  <div className="form-group">
                    <label htmlFor="date_time">Date & Time</label>
                    <input
                      type="datetime-local"
                      id="date_time"
                      name="date_time"
                      value={formData.date_time}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="weight">Weight</label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                      step="0.1"
                    />
                    <select
                      name="weight_unit"
                      value={formData.weight_unit}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </>
              )}

              {activeModal === 'body_measurement' && (
                <>
                  <div className="form-group">
                    <label htmlFor="date_time">Date & Time</label>
                    <input
                      type="datetime-local"
                      id="date_time"
                      name="date_time"
                      value={formData.date_time}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="upper_arm">Upper Arm (inches)</label>
                    <input
                      type="number"
                      id="upper_arm"
                      name="upper_arm"
                      value={formData.upper_arm}
                      onChange={handleInputChange}
                      className="form-input"
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lower_arm">Lower Arm (inches)</label>
                    <input
                      type="number"
                      id="lower_arm"
                      name="lower_arm"
                      value={formData.lower_arm}
                      onChange={handleInputChange}
                      className="form-input"
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="waist">Waist (inches)</label>
                    <input
                      type="number"
                      id="waist"
                      name="waist"
                      value={formData.waist}
                      onChange={handleInputChange}
                      className="form-input"
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="shoulder">Shoulder (inches)</label>
                    <input
                      type="number"
                      id="shoulder"
                      name="shoulder"
                      value={formData.shoulder}
                      onChange={handleInputChange}
                      className="form-input"
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="leg">Leg (inches)</label>
                    <input
                      type="number"
                      id="leg"
                      name="leg"
                      value={formData.leg}
                      onChange={handleInputChange}
                      className="form-input"
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="calf">Calf (inches)</label>
                    <input
                      type="number"
                      id="calf"
                      name="calf"
                      value={formData.calf}
                      onChange={handleInputChange}
                      className="form-input"
                      step="0.1"
                    />
                  </div>
                </>
              )}

              {activeModal === 'steps' && (
                <>
                  <div className="form-group">
                    <label htmlFor="date_time">Date & Time</label>
                    <input
                      type="datetime-local"
                      id="date_time"
                      name="date_time"
                      value={formData.date_time}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="steps">Steps</label>
                    <input
                      type="number"
                      id="steps"
                      name="steps"
                      value={formData.steps}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                </>
              )}

              {activeModal === 'cardio' && (
                <>
                  <div className="form-group">
                    <label htmlFor="date_time">Date & Time</label>
                    <input
                      type="datetime-local"
                      id="date_time"
                      name="date_time"
                      value={formData.date_time}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cardio_type">Cardio Type</label>
                    <input
                      type="text"
                      id="cardio_type"
                      name="cardio_type"
                      value={formData.cardio_type}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                      placeholder="Running, Cycling, etc."
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="duration">Duration (minutes)</label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="form-input"
                      step="1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="distance">Distance</label>
                    <input
                      type="number"
                      id="distance"
                      name="distance"
                      value={formData.distance}
                      onChange={handleInputChange}
                      className="form-input"
                      step="0.1"
                    />
                    <select
                      name="distance_unit"
                      value={formData.distance_unit}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="miles">miles</option>
                      <option value="km">km</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="calories_burned">Calories Burned</label>
                    <input
                      type="number"
                      id="calories_burned"
                      name="calories_burned"
                      value={formData.calories_burned}
                      onChange={handleInputChange}
                      className="form-input"
                      step="1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="heart_rate">Heart Rate (BPM)</label>
                    <input
                      type="number"
                      id="heart_rate"
                      name="heart_rate"
                      value={formData.heart_rate}
                      onChange={handleInputChange}
                      className="form-input"
                      step="1"
                    />
                  </div>
                </>
              )}

              {activeModal === 'sleep' && (
                <>
                  <div className="form-group">
                    <label htmlFor="date_time">Date</label>
                    <input
                      type="date"
                      id="date_time"
                      name="date_time"
                      value={formData.date_time}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="time_went_to_bed">Went to Bed</label>
                    <input
                      type="time"
                      id="time_went_to_bed"
                      name="time_went_to_bed"
                      value={formData.time_went_to_bed}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="time_got_out_of_bed">Got Out of Bed</label>
                    <input
                      type="time"
                      id="time_got_out_of_bed"
                      name="time_got_out_of_bed"
                      value={formData.time_got_out_of_bed}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="time_fell_asleep">Time Fell Asleep</label>
                    <input
                      type="time"
                      id="time_fell_asleep"
                      name="time_fell_asleep"
                      value={formData.time_fell_asleep}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="time_in_light_sleep">Light Sleep (minutes)</label>
                    <input
                      type="number"
                      id="time_in_light_sleep"
                      name="time_in_light_sleep"
                      value={formData.time_in_light_sleep}
                      onChange={handleInputChange}
                      className="form-input"
                      step="1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="time_in_deep_sleep">Deep Sleep (minutes)</label>
                    <input
                      type="number"
                      id="time_in_deep_sleep"
                      name="time_in_deep_sleep"
                      value={formData.time_in_deep_sleep}
                      onChange={handleInputChange}
                      className="form-input"
                      step="1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="time_in_rem_sleep">REM Sleep (minutes)</label>
                    <input
                      type="number"
                      id="time_in_rem_sleep"
                      name="time_in_rem_sleep"
                      value={formData.time_in_rem_sleep}
                      onChange={handleInputChange}
                      className="form-input"
                      step="1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="number_of_times_woke_up">Number of Times Woke Up</label>
                    <input
                      type="number"
                      id="number_of_times_woke_up"
                      name="number_of_times_woke_up"
                      value={formData.number_of_times_woke_up}
                      onChange={handleInputChange}
                      className="form-input"
                      step="1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="resting_heart_rate">Resting Heart Rate (BPM)</label>
                    <input
                      type="number"
                      id="resting_heart_rate"
                      name="resting_heart_rate"
                      value={formData.resting_heart_rate}
                      onChange={handleInputChange}
                      className="form-input"
                      step="1"
                    />
                  </div>
                </>
              )}

              {activeModal === 'health_metrics' && (
                <>
                  <div className="form-group">
                    <label htmlFor="date_time">Date</label>
                    <input
                      type="date"
                      id="date_time"
                      name="date_time"
                      value={formData.date_time}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="resting_heart_rate">Resting Heart Rate</label>
                    <input
                      type="number"
                      id="resting_heart_rate"
                      name="resting_heart_rate"
                      value={formData.resting_heart_rate}
                      onChange={handleInputChange}
                      className="form-input"
                      step="1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="blood_pressure_systolic">Blood Pressure - Systolic</label>
                    <input
                      type="number"
                      id="blood_pressure_systolic"
                      name="blood_pressure_systolic"
                      value={formData.blood_pressure_systolic}
                      onChange={handleInputChange}
                      className="form-input"
                      step="1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="blood_pressure_diastolic">Blood Pressure - Diastolic</label>
                    <input
                      type="number"
                      id="blood_pressure_diastolic"
                      name="blood_pressure_diastolic"
                      value={formData.blood_pressure_diastolic}
                      onChange={handleInputChange}
                      className="form-input"
                      step="1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="morning_energy">Morning Energy (1-10)</label>
                    <input
                      type="range"
                      id="morning_energy"
                      name="morning_energy"
                      value={formData.morning_energy}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="form-input"
                    />
                    <span>{formData.morning_energy || '1'}/10</span>
                  </div>
                  <div className="form-group">
                    <label htmlFor="mood">Mood (1-10)</label>
                    <input
                      type="range"
                      id="mood"
                      name="mood"
                      value={formData.mood}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="form-input"
                    />
                    <span>{formData.mood || '1'}/10</span>
                  </div>
                  <div className="form-group">
                    <label htmlFor="stress_level">Stress Level (1-10)</label>
                    <input
                      type="range"
                      id="stress_level"
                      name="stress_level"
                      value={formData.stress_level}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="form-input"
                    />
                    <span>{formData.stress_level || '1'}/10</span>
                  </div>
                  <div className="form-group">
                    <label htmlFor="soreness">Soreness (1-10)</label>
                    <input
                      type="range"
                      id="soreness"
                      name="soreness"
                      value={formData.soreness}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="form-input"
                    />
                    <span>{formData.soreness || '1'}/10</span>
                  </div>
                  <div className="form-group">
                    <label htmlFor="illness_level">Illness Level (1-10)</label>
                    <input
                      type="range"
                      id="illness_level"
                      name="illness_level"
                      value={formData.illness_level}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="form-input"
                    />
                    <span>{formData.illness_level || '1'}/10</span>
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Only show loading screen on initial load, not when date ranges change
  if (!initialLoadComplete) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div 
          className="animate-spin rounded-full h-16 w-16 border-b-2" 
          style={{ borderColor: 'var(--accent-primary)' }}
        />
      </div>
    );
  }

  const heatmapDataStructure = generateHeatmapData();

  return (
    <>
    <div className="additional-trackers-container">
      {/* Heatmap Section - Moved to top */}
      <div style={{ 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-8)'
      }}>
        {/* GitHub-style heatmap */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3px' }}>
          {/* Main heatmap - vertical columns */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-start' }}>
              {heatmapDataStructure.heatmap.map((week, weekIdx) => (
                <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {/* Month label at top */}
                  {weekIdx === 0 ? (
                    <div style={{ height: '18px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                      {getMonthLabel(week[0])}
          </div>
                  ) : getMonthLabel(week[0]) !== getMonthLabel(heatmapDataStructure.heatmap[weekIdx - 1][0]) ? (
                    <div style={{ height: '18px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
                      {getMonthLabel(week[0])}
                    </div>
                  ) : (
                    <div style={{ height: '18px' }} />
                  )}
                  
                  {/* Day cells going down */}
                  {week.map((date, dayIdx) => {
                    if (!date) return <div key={dayIdx} style={{ width: '28px', height: '28px' }} />;
                    const count = heatmapData[date] || 0;
                    const backgroundColor = getHeatmapColor(count);
                    return (
                      <div
                        key={date}
              style={{
                          width: '28px',
                          height: '28px',
                          backgroundColor: backgroundColor,
                          border: backgroundColor === 'transparent' ? '1px solid var(--border-primary)' : 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title={`${date}: ${count} tracker${count !== 1 ? 's' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
          </div>
        </div>
      </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>Less</span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {[0, 1, 2, 3, 4, 5, 6].map(count => (
              <div
                key={count}
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: getHeatmapColor(count),
                  border: count === 0 ? '1px solid var(--border-primary)' : 'none',
                  borderRadius: '3px'
                }}
                title={`${count} tracker${count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
          <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>More</span>
        </div>
      </div>

        <div className="tracker-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-8)'
        }}>
          {trackers.map((tracker) => {
            const Icon = tracker.icon;
            const streak = streaks[tracker.id] || 0;
            
            return (
              <div
                key={tracker.id}
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div onClick={() => handleTrackerClick(tracker)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-3)' }}>
                    <Icon 
                      style={{
                        width: '48px',
                        height: '48px',
                        minWidth: '48px',
                        minHeight: '48px',
                        color: '#9ca3af'
                      }}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: '#60a5fa', fontFamily: 'var(--font-primary)' }}>
                      {streak}
                    </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                      day streak
                    </div>
                  </div>
                </div>

                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ 
                        fontSize: 'var(--text-lg)', 
                        fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)', 
                  fontFamily: 'var(--font-primary)', 
                        margin: 0
                }}>
                  {tracker.name}
                </h3>

                      {/* Date Range Selector for this tracker - Right edge */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={dateRanges[tracker.id] || '2weeks'}
                          onChange={(e) => {
                            setDateRanges(prev => ({
                              ...prev,
                              [tracker.id]: e.target.value
                            }));
                            if (e.target.value !== 'custom') {
                              setCustomDates(prev => {
                                const updated = { ...prev };
                                delete updated[tracker.id];
                                return updated;
                              });
                            }
                          }}
                      style={{
                            padding: 'var(--space-2) var(--space-3)',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-primary)',
                            color: 'var(--text-primary)',
                            background: 'var(--bg-secondary)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            textAlign: 'right'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="2weeks">2 Weeks</option>
                          <option value="1month">1 Month</option>
                          <option value="6months">6 Months</option>
                          <option value="1year">1 Year</option>
                          <option value="custom">Custom Range</option>
                        </select>
                  </div>
      </div>

                    {/* Custom date inputs on new line */}
                    {dateRanges[tracker.id] === 'custom' && (
                      <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <input
                            type="date"
                            value={customDates[tracker.id]?.startDate || ''}
                            onChange={(e) => {
                              setCustomDates(prev => ({
                                ...prev,
                                [tracker.id]: {
                                  ...prev[tracker.id],
                                  startDate: e.target.value
                                }
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              padding: 'var(--space-2) var(--space-3)',
                              fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-primary)', 
                color: 'var(--text-primary)', 
                              background: 'var(--bg-secondary)',
                              border: 'none',
                              borderRadius: 'var(--radius-md)'
                            }}
                          />
                          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>to</span>
                          <input
                            type="date"
                            value={customDates[tracker.id]?.endDate || ''}
                            onChange={(e) => {
                              setCustomDates(prev => ({
                                ...prev,
                                [tracker.id]: {
                                  ...prev[tracker.id],
                                  endDate: e.target.value
                                }
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              padding: 'var(--space-2) var(--space-3)',
                              fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-primary)', 
                color: 'var(--text-primary)', 
                              background: 'var(--bg-secondary)',
                              border: 'none',
                              borderRadius: 'var(--radius-md)'
                            }}
                          />
            </div>
            </div>
                    )}
          </div>
        </div>
                
                {/* Line Graph */}
                <div onClick={(e) => e.stopPropagation()}>
                  {renderLineGraph(tracker.id, graphData[tracker.id], dateRanges[tracker.id] || '2weeks')}
      </div>
    </div>
  );
          })}
      </div>
    </div>

      {activeModal && renderModalContent()}

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal {
          background: var(--bg-secondary);
          border-radius: var(--radius-xl);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 500px;
          width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--border-primary);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
    padding: var(--space-6);
          border-bottom: 1px solid var(--border-primary);
        }

        .modal-title {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          font-family: var(--font-primary);
        }

        .modal-close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary);
          padding: var(--space-2);
          border-radius: var(--radius-md);
          transition: background 0.2s ease;
        }

        .modal-close-button:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .modal-body {
          padding: var(--space-6);
        }

        .form-group {
          margin-bottom: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .form-group label {
          font-size: var(--text-sm);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          font-family: var(--font-primary);
        }

        .form-input {
          width: 100%;
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-base);
          font-family: var(--font-primary);
          color: var(--text-primary);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: var(--bg-primary);
        }

        .form-select {
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-base);
          font-family: var(--font-primary);
          color: var(--text-primary);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }

        .form-select:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .modal-actions {
    display: flex;
          gap: var(--space-3);
          margin-top: var(--space-6);
          justify-content: flex-end;
        }

        .btn-primary {
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-6);
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          font-family: var(--font-primary);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);
        }

        .btn-primary:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-6);
          font-size: var(--text-base);
          font-weight: var(--font-weight-medium);
          font-family: var(--font-primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: var(--bg-hover);
        }
      `}</style>
    </>
  );
};

export default AdditionalTrackersMenu;
