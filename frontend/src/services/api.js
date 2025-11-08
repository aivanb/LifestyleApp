import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                refresh: refreshToken
              });

              const { access } = response.data.data;
              localStorage.setItem('access_token', access);
              originalRequest.headers.Authorization = `Bearer ${access}`;

              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Generic HTTP methods
  get(url, config = {}) {
    return this.api.get(url, config);
  }

  post(url, data = {}, config = {}) {
    return this.api.post(url, data, config);
  }

  put(url, data = {}, config = {}) {
    return this.api.put(url, data, config);
  }

  patch(url, data = {}, config = {}) {
    return this.api.patch(url, data, config);
  }

  delete(url, config = {}) {
    return this.api.delete(url, config);
  }

  // Authentication methods
  login(credentials) {
    return this.post('/auth/login/', credentials);
  }

  register(userData) {
    return this.post('/auth/register/', userData);
  }

  logout(refreshToken) {
    return this.post('/auth/logout/', { refresh: refreshToken });
  }

  getProfile() {
    return this.get('/auth/profile/');
  }

  updateProfile(profileData) {
    return this.put('/auth/profile/update/', profileData);
  }

  changePassword(passwordData) {
    return this.post('/auth/change-password/', passwordData);
  }

  // OpenAI methods
  sendPrompt(prompt) {
    return this.post('/openai/prompt/', { prompt });
  }

  getUsageStats() {
    return this.get('/openai/usage/');
  }

  parseFoodInput(inputText, createMeal = false, previewOnly = false) {
    return this.post('/openai/parse-food/', {
      input_text: inputText,
      create_meal: createMeal,
      preview_only: previewOnly
    });
  }

  generateMetadata(foodId) {
    return this.post('/openai/generate-metadata/', { food_id: foodId });
  }

  transcribeAudio(audioData) {
    return this.post('/openai/transcribe/', { audio_data: audioData });
  }

  getTranscriptionStatus() {
    return this.get('/openai/transcription-status/');
  }

  // User methods
  getUserProfile() {
    return this.get('/users/profile/');
  }

  updateUserProfile(profileData) {
    return this.put('/users/profile/', profileData);
  }

  getUserGoals() {
    return this.get('/users/goals/');
  }

  createUserGoals(goalsData) {
    return this.post('/users/goals/', goalsData);
  }

  updateUserGoals(goalsData) {
    return this.put('/users/goals/', goalsData);
  }

  // Food methods
  getFoods(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/foods/?${queryString}`);
  }

  createFood(foodData) {
    return this.post('/foods/', foodData);
  }

  updateFood(foodId, foodData) {
    return this.put(`/foods/${foodId}/`, foodData);
  }

  getFoodAnalytics(foodId, timeRange = '1week') {
    return this.get(`/foods/${foodId}/analytics/?time_range=${timeRange}`);
  }

  deleteFood(foodId) {
    return this.delete(`/foods/${foodId}/`);
  }

  getRecentlyLoggedFoods(days = 30) {
    return this.get(`/foods/logs/recent-foods/?days=${days}`);
  }

  // Meal methods
  getMeals() {
    return this.get('/foods/meals/');
  }

  createMeal(mealData) {
    return this.post('/foods/meals/', mealData);
  }

  deleteMeal(mealId) {
    return this.delete(`/foods/meals/${mealId}/`);
  }

  // Food log methods
  getFoodLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/foods/logs/?${queryString}`);
  }

  createFoodLog(logData) {
    return this.post('/foods/logs/', logData);
  }

  updateFoodLog(logId, logData) {
    return this.patch(`/foods/logs/${logId}/`, logData);
  }

  deleteFoodLog(logId) {
    return this.delete(`/foods/logs/${logId}/`);
  }

  // Profile management

  calculateBodyMetrics() {
    return this.get('/users/calculate-metrics/');
  }

  generateMacroGoals(weightGoal, timeframeWeeks) {
    return this.post('/users/calculate-macros/', {
      weight_goal: weightGoal,
      timeframe_weeks: timeframeWeeks
    });
  }

  // Workout management
  getWorkouts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/workouts/?${queryString}`);
  }

  createWorkout(workoutData) {
    return this.post('/workouts/', workoutData);
  }

  getWorkout(workoutId) {
    return this.get(`/workouts/${workoutId}/`);
  }

  updateWorkout(workoutId, workoutData) {
    return this.put(`/workouts/${workoutId}/`, workoutData);
  }

  deleteWorkout(workoutId) {
    return this.delete(`/workouts/${workoutId}/`);
  }

  // Muscle management
  getMuscles() {
    return this.get('/workouts/muscles/');
  }

  getMusclePriorities() {
    return this.get('/workouts/muscle-priorities/');
  }

  updateMusclePriorities(muscleLogsData) {
    return this.post('/workouts/muscle-priorities/', { muscle_logs: muscleLogsData });
  }

  // Workout logging
  getWorkoutLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/workouts/logs/?${queryString}`);
  }

  logWorkout(logData) {
    return this.post('/workouts/logs/', logData);
  }

  deleteWorkoutLog(logId) {
    return this.delete(`/workouts/logs/${logId}/`);
  }

  // Split management
  getSplits() {
    return this.get('/workouts/splits/');
  }

  createSplit(splitData) {
    return this.post('/workouts/splits/', splitData);
  }

  getSplit(splitId) {
    return this.get(`/workouts/splits/${splitId}/`);
  }

  updateSplit(splitId, splitData) {
    return this.put(`/workouts/splits/${splitId}/`, splitData);
  }

  deleteSplit(splitId) {
    return this.delete(`/workouts/splits/${splitId}/`);
  }

  activateSplit(splitId, startDate) {
    return this.post(`/workouts/splits/${splitId}/activate/`, { start_date: startDate });
  }

  getCurrentSplitDay(date) {
    return this.get(`/workouts/current-split-day/?date=${date}`);
  }

  // Statistics and utilities
  getWorkoutStats(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    
    const url = queryParams.toString() ? `/workouts/stats/?${queryParams.toString()}` : '/workouts/stats/';
    return this.get(url);
  }

  getRecentlyLoggedWorkouts() {
    return this.get('/workouts/recently-logged/');
  }

  getWorkoutIcons() {
    return this.get('/workouts/icons/');
  }

  // Additional Trackers - Weight Log
  getWeightLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/logging/weight/?${queryString}`);
  }

  createWeightLog(logData) {
    return this.post('/logging/weight/', logData);
  }

  updateWeightLog(logId, logData) {
    return this.put(`/logging/weight/${logId}/`, logData);
  }

  deleteWeightLog(logId) {
    return this.delete(`/logging/weight/${logId}/`);
  }

  getWeightStreak() {
    return this.get('/logging/weight/streak/');
  }

  // Additional Trackers - Body Measurement Log
  getBodyMeasurementLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/logging/body-measurement/?${queryString}`);
  }

  createBodyMeasurementLog(logData) {
    return this.post('/logging/body-measurement/', logData);
  }

  updateBodyMeasurementLog(logId, logData) {
    return this.put(`/logging/body-measurement/${logId}/`, logData);
  }

  deleteBodyMeasurementLog(logId) {
    return this.delete(`/logging/body-measurement/${logId}/`);
  }

  getBodyMeasurementStreak() {
    return this.get('/logging/body-measurement/streak/');
  }

  // Additional Trackers - Water Log
  getWaterLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/logging/water/?${queryString}`);
  }

  createWaterLog(logData) {
    return this.post('/logging/water/', logData);
  }

  updateWaterLog(logId, logData) {
    return this.put(`/logging/water/${logId}/`, logData);
  }

  deleteWaterLog(logId) {
    return this.delete(`/logging/water/${logId}/`);
  }

  getWaterStreak() {
    return this.get('/logging/water/streak/');
  }

  // Additional Trackers - Steps Log
  getStepsLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/logging/steps/?${queryString}`);
  }

  createStepsLog(logData) {
    return this.post('/logging/steps/', logData);
  }

  updateStepsLog(logId, logData) {
    return this.put(`/logging/steps/${logId}/`, logData);
  }

  deleteStepsLog(logId) {
    return this.delete(`/logging/steps/${logId}/`);
  }

  getStepsStreak() {
    return this.get('/logging/steps/streak/');
  }

  // Additional Trackers - Cardio Log
  getCardioLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/logging/cardio/?${queryString}`);
  }

  createCardioLog(logData) {
    return this.post('/logging/cardio/', logData);
  }

  updateCardioLog(logId, logData) {
    return this.put(`/logging/cardio/${logId}/`, logData);
  }

  deleteCardioLog(logId) {
    return this.delete(`/logging/cardio/${logId}/`);
  }

  getCardioStreak() {
    return this.get('/logging/cardio/streak/');
  }

  // Additional Trackers - Sleep Log
  getSleepLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/health/sleep/?${queryString}`);
  }

  createSleepLog(logData) {
    return this.post('/health/sleep/', logData);
  }

  updateSleepLog(logId, logData) {
    return this.put(`/health/sleep/${logId}/`, logData);
  }

  deleteSleepLog(logId) {
    return this.delete(`/health/sleep/${logId}/`);
  }

  getSleepStreak() {
    return this.get('/health/sleep/streak/');
  }

  // Additional Trackers - Health Metrics Log
  getHealthMetricsLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/health/health-metrics/?${queryString}`);
  }

  createHealthMetricsLog(logData) {
    return this.post('/health/health-metrics/', logData);
  }

  updateHealthMetricsLog(logId, logData) {
    return this.put(`/health/health-metrics/${logId}/`, logData);
  }

  deleteHealthMetricsLog(logId) {
    return this.delete(`/health/health-metrics/${logId}/`);
  }

  getHealthMetricsStreak() {
    return this.get('/health/health-metrics/streak/');
  }

  // Get all tracker streaks at once
  getAllTrackerStreaks() {
    return this.get('/logging/streaks/');
  }
}

const api = new ApiService();
export default api;
