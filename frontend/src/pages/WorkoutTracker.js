import React, { useState } from 'react';
import WorkoutAdder from '../components/WorkoutAdder';
import WorkoutLogger from '../components/WorkoutLogger';
import WorkoutLog from '../components/WorkoutLog';

const WorkoutTracker = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showWorkoutAdder, setShowWorkoutAdder] = useState(false);
  const [showWorkoutLogger, setShowWorkoutLogger] = useState(false);

  const handleWorkoutAdded = () => {
    setShowWorkoutAdder(false);
    // Refresh data if needed
  };

  const handleWorkoutUpdated = () => {
    // Refresh data if needed
  };

  const handleWorkoutLogged = () => {
    setShowWorkoutLogger(false);
    // Refresh workout log data by updating the key
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="workout-tracker-page">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Workout Log</h1>
        
        {/* Action Buttons */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowWorkoutAdder(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <span>🏋️</span>
              <span>Add New Workout</span>
            </button>
            <button
              onClick={() => setShowWorkoutLogger(true)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <span>📝</span>
              <span>Log Workout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="tab-content">
          <WorkoutLog 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onWorkoutLogged={handleWorkoutLogged}
            refreshTrigger={refreshKey}
          />
        </div>

        {/* Modal for Workout Adder */}
        {showWorkoutAdder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Add New Workout</h2>
                <button
                  onClick={() => setShowWorkoutAdder(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <WorkoutAdder 
                onWorkoutAdded={handleWorkoutAdded}
                onWorkoutUpdated={handleWorkoutUpdated}
              />
            </div>
          </div>
        )}

        {/* Modal for Workout Logger */}
        {showWorkoutLogger && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Log Workout</h2>
                <button
                  onClick={() => setShowWorkoutLogger(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <WorkoutLogger 
                selectedDate={selectedDate}
                onWorkoutLogged={handleWorkoutLogged}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutTracker;
