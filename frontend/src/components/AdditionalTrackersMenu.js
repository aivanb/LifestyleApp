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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Additional Trackers</h1>
              <p className="mt-2 text-gray-600">
                Track various health and fitness metrics with detailed logging
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <CalendarIcon className="h-5 w-5" />
              <span>Track your daily progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tracker Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trackers.map((tracker) => {
            const Icon = tracker.icon;
            const streak = streaks[tracker.id] || 0;
            
            return (
              <div
                key={tracker.id}
                onClick={() => handleTrackerClick(tracker)}
                className={`
                  relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-300
                  ${tracker.color} ${tracker.hoverColor} shadow-lg hover:shadow-xl hover:scale-105
                  group
                `}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                </div>

                {/* Content */}
                <div className="relative p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{streak}</div>
                      <div className="text-xs opacity-80">day streak</div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-2 group-hover:text-white transition-colors">
                    {tracker.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${getStreakColor(streak)}`}>
                      {getStreakText(streak)}
                    </span>
                    <div className="flex items-center space-x-1 text-xs opacity-80">
                      <span>Click to track</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Track Your Health Journey
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mb-6">
              Maintain consistent logging habits to build meaningful streaks. Each tracker helps you 
              monitor different aspects of your health and fitness, providing insights into your 
              progress over time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold text-gray-900 mb-2">Detailed Analytics</h3>
                <p className="text-gray-600 text-sm">
                  View trends and patterns in your health data with comprehensive tracking.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-2">Goal Tracking</h3>
                <p className="text-gray-600 text-sm">
                  Set and monitor progress toward your health and fitness objectives.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="font-semibold text-gray-900 mb-2">Progress Insights</h3>
                <p className="text-gray-600 text-sm">
                  Understand how your daily habits impact your overall wellness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalTrackersMenu;
