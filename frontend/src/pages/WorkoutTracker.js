import React, { useState } from 'react';
import WorkoutAdder from '../components/WorkoutAdder';
import MusclePriority from '../components/MusclePriority';
import SplitCreator from '../components/SplitCreator';
import WorkoutLogger from '../components/WorkoutLogger';
import WorkoutLog from '../components/WorkoutLog';

const WorkoutTracker = () => {
  const [activeTab, setActiveTab] = useState('muscle-priority');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = [
    { id: 'muscle-priority', label: 'Muscle Priority', icon: '🎯' },
    { id: 'workout-adder', label: 'Workout Adder', icon: '🏋️' },
    { id: 'split-creator', label: 'Split Creator', icon: '📅' },
    { id: 'workout-logger', label: 'Workout Logger', icon: '📝' },
    { id: 'workout-log', label: 'Workout Log', icon: '📊' }
  ];

  const handleWorkoutAdded = () => {
    // Refresh data if needed
  };

  const handleWorkoutUpdated = () => {
    // Refresh data if needed
  };

  const handleSplitCreated = () => {
    // Refresh data if needed
  };

  const handleSplitUpdated = () => {
    // Refresh data if needed
  };

  const handlePrioritiesUpdated = () => {
    // Refresh data if needed
  };

  const handleWorkoutLogged = () => {
    // Refresh workout log data by updating the key
    setRefreshKey(prev => prev + 1);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'muscle-priority':
        return <MusclePriority onPrioritiesUpdated={handlePrioritiesUpdated} />;
      case 'workout-adder':
        return (
          <WorkoutAdder 
            onWorkoutAdded={handleWorkoutAdded}
            onWorkoutUpdated={handleWorkoutUpdated}
          />
        );
      case 'split-creator':
        return (
          <SplitCreator 
            onSplitCreated={handleSplitCreated}
            onSplitUpdated={handleSplitUpdated}
          />
        );
      case 'workout-logger':
        return (
          <WorkoutLogger 
            selectedDate={selectedDate}
            onWorkoutLogged={handleWorkoutLogged}
          />
        );
      case 'workout-log':
        return (
          <WorkoutLog 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onWorkoutLogged={handleWorkoutLogged}
            refreshTrigger={refreshKey}
          />
        );
      default:
        return <MusclePriority onPrioritiesUpdated={handlePrioritiesUpdated} />;
    }
  };

  return (
    <div className="workout-tracker-page">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Workout Tracker</h1>
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn ${
                  activeTab === tab.id 
                    ? 'btn-primary' 
                    : 'btn-secondary'
                } flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default WorkoutTracker;
