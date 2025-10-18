import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScaleIcon,
  BeakerIcon,
  UserIcon,
  HeartIcon,
  MoonIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const AdditionalTrackersMenu = () => {
  const navigate = useNavigate();
  const [streaks, setStreaks] = useState({});
  const [loading, setLoading] = useState(true);

  // Tracker configurations with unique colors and icons
  const trackers = [
    {
      id: 'weight',
      name: 'Weight Log',
      icon: ScaleIcon,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      route: '/additional-trackers/weight'
    },
    {
      id: 'water',
      name: 'Water Log',
      icon: BeakerIcon,
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      hoverColor: 'hover:from-cyan-600 hover:to-cyan-700',
      route: '/additional-trackers/water'
    },
    {
      id: 'body_measurement',
      name: 'Body Measurements',
      icon: ScaleIcon,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      route: '/additional-trackers/body-measurement'
    },
    {
      id: 'steps',
      name: 'Steps Log',
      icon: UserIcon,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      route: '/additional-trackers/steps'
    },
    {
      id: 'cardio',
      name: 'Cardio Log',
      icon: HeartIcon,
      color: 'bg-gradient-to-br from-red-500 to-red-600',
      hoverColor: 'hover:from-red-600 hover:to-red-700',
      route: '/additional-trackers/cardio'
    },
    {
      id: 'sleep',
      name: 'Sleep Log',
      icon: MoonIcon,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      hoverColor: 'hover:from-indigo-600 hover:to-indigo-700',
      route: '/additional-trackers/sleep'
    },
    {
      id: 'health_metrics',
      name: 'Health Metrics',
      icon: ChartBarIcon,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
      route: '/additional-trackers/health-metrics'
    }
  ];

  useEffect(() => {
    loadStreaks();
  }, []);

  const loadStreaks = async () => {
    try {
      setLoading(true);
      const response = await api.getAllTrackerStreaks();
      setStreaks(response.data);
    } catch (error) {
      console.error('Error loading streaks:', error);
      // Set default streaks if API fails
      setStreaks({
        weight: 0,
        body_measurement: 0,
        water: 0,
        steps: 0,
        cardio: 0,
        sleep: 0,
        health_metrics: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrackerClick = (tracker) => {
    navigate(tracker.route);
  };

  const getStreakText = (streak) => {
    if (streak === 0) return 'No streak';
    if (streak === 1) return '1 day';
    return `${streak} days`;
  };

  const getStreakColor = (streak) => {
    if (streak === 0) return 'text-gray-500';
    if (streak < 7) return 'text-yellow-600';
    if (streak < 30) return 'text-orange-600';
    return 'text-green-600';
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
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)', fontWeight: 'var(--font-weight-bold)' }}>
              Additional Trackers
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-primary)' }}>
              Track various health and fitness metrics with detailed logging
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
            <CalendarIcon 
              className="h-5 w-5" 
              style={{
                width: '20px',
                height: '20px',
                minWidth: '20px',
                minHeight: '20px',
                color: 'var(--text-tertiary)'
              }}
            />
            <span>Track your daily progress</span>
          </div>
        </div>
      </div>

      {/* Tracker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {trackers.map((tracker) => {
            const Icon = tracker.icon;
            const streak = streaks[tracker.id] || 0;
            
            return (
              <div
                key={tracker.id}
                onClick={() => handleTrackerClick(tracker)}
                className="p-4 rounded-lg cursor-pointer transition-all duration-200 hover:transform hover:scale-105 group"
                style={{ 
                  backgroundColor: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <Icon 
                      className="h-6 w-6" 
                      style={{
                        width: '24px',
                        height: '24px',
                        minWidth: '24px',
                        minHeight: '24px',
                        color: 'var(--accent-color)'
                      }}
                    />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-primary)' }}>
                      {streak}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                      day streak
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2 group-hover:text-opacity-80 transition-colors" style={{ 
                  color: 'var(--text-primary)', 
                  fontFamily: 'var(--font-primary)', 
                  fontWeight: 'var(--font-weight-semibold)' 
                }}>
                  {tracker.name}
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ 
                    color: getStreakColor(streak) === 'text-gray-500' ? 'var(--text-tertiary)' : 
                           getStreakColor(streak) === 'text-yellow-600' ? 'var(--accent-warning)' :
                           getStreakColor(streak) === 'text-orange-600' ? 'var(--accent-warning)' :
                           'var(--accent-secondary)',
                    fontFamily: 'var(--font-primary)' 
                  }}>
                    {getStreakText(streak)}
                  </span>
                  <div className="flex items-center space-x-1 text-xs" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-primary)' }}>
                    <span>Click to track</span>
                    <svg 
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      style={{
                        width: '16px',
                        height: '16px',
                        minWidth: '16px',
                        minHeight: '16px'
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Info Section */}
      <div className="p-6 rounded-lg" style={{ 
        backgroundColor: 'var(--bg-secondary)', 
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ 
            color: 'var(--text-primary)', 
            fontFamily: 'var(--font-primary)', 
            fontWeight: 'var(--font-weight-bold)' 
          }}>
            Track Your Health Journey
          </h2>
          <p className="text-lg mb-6 max-w-3xl mx-auto" style={{ 
            color: 'var(--text-secondary)', 
            fontFamily: 'var(--font-primary)' 
          }}>
            Maintain consistent logging habits to build meaningful streaks. Each tracker helps you 
            monitor different aspects of your health and fitness, providing insights into your 
            progress over time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold mb-2" style={{ 
                color: 'var(--text-primary)', 
                fontFamily: 'var(--font-primary)', 
                fontWeight: 'var(--font-weight-semibold)' 
              }}>
                Detailed Analytics
              </h3>
              <p className="text-sm" style={{ 
                color: 'var(--text-secondary)', 
                fontFamily: 'var(--font-primary)' 
              }}>
                View trends and patterns in your health data with comprehensive tracking.
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold mb-2" style={{ 
                color: 'var(--text-primary)', 
                fontFamily: 'var(--font-primary)', 
                fontWeight: 'var(--font-weight-semibold)' 
              }}>
                Goal Tracking
              </h3>
              <p className="text-sm" style={{ 
                color: 'var(--text-secondary)', 
                fontFamily: 'var(--font-primary)' 
              }}>
                Set and monitor progress toward your health and fitness objectives.
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
              <div className="text-2xl mb-2">📈</div>
              <h3 className="font-semibold mb-2" style={{ 
                color: 'var(--text-primary)', 
                fontFamily: 'var(--font-primary)', 
                fontWeight: 'var(--font-weight-semibold)' 
              }}>
                Progress Insights
              </h3>
              <p className="text-sm" style={{ 
                color: 'var(--text-secondary)', 
                fontFamily: 'var(--font-primary)' 
              }}>
                Understand how your daily habits impact your overall wellness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalTrackersMenu;
