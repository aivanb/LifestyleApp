import React, { useState } from 'react';
import FoodCreator from '../components/FoodCreator';
import MealCreator from '../components/MealCreator';
import FoodLogViewer from '../components/FoodLogViewer';
import FoodChatbot from '../components/FoodChatbot';

/**
 * FoodLog Page
 * 
 * Main interface for food logging system.
 * Integrates food creation, meal creation, and food log viewing.
 */
const FoodLog = () => {
  const [activeTab, setActiveTab] = useState('log'); // 'log', 'create-food', 'create-meal', 'chatbot'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFoodCreated = (food) => {
    // Refresh log viewer
    setRefreshTrigger(prev => prev + 1);
    
    // Optionally switch back to log view
    if (food.create_and_log) {
      setActiveTab('log');
    }
  };

  const handleMealCreated = (meal) => {
    // Refresh log viewer
    setRefreshTrigger(prev => prev + 1);
    
    // Optionally switch back to log view
    if (meal.create_and_log) {
      setActiveTab('log');
    }
  };

  return (
    <div className="food-log-page">
      <div className="flex items-center gap-4 mb-6">
        <svg className="icon icon-xl" viewBox="0 0 20 20" fill="var(--accent-secondary)">
          <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
        <h1 style={{ margin: 0 }}>Food Logging</h1>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'log' ? 'active' : ''}`}
            onClick={() => setActiveTab('log')}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            View Log
          </button>

          <button
            className={`tab ${activeTab === 'create-food' ? 'active' : ''}`}
            onClick={() => setActiveTab('create-food')}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Food
          </button>

          <button
            className={`tab ${activeTab === 'create-meal' ? 'active' : ''}`}
            onClick={() => setActiveTab('create-meal')}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            Create Meal
          </button>

          <button
            className={`tab ${activeTab === 'chatbot' ? 'active' : ''}`}
            onClick={() => setActiveTab('chatbot')}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            AI Chatbot
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'log' && (
          <FoodLogViewer refreshTrigger={refreshTrigger} />
        )}

        {activeTab === 'create-food' && (
          <FoodCreator
            onFoodCreated={handleFoodCreated}
          />
        )}

        {activeTab === 'create-meal' && (
          <MealCreator
            onMealCreated={handleMealCreated}
          />
        )}

        {activeTab === 'chatbot' && (
          <FoodChatbot
            onFoodsLogged={() => setRefreshTrigger(prev => prev + 1)}
          />
        )}
      </div>
    </div>
  );
};

export default FoodLog;

