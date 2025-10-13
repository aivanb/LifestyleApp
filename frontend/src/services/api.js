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

  deleteFoodLog(logId) {
    return this.delete(`/foods/logs/${logId}/`);
  }
}

const api = new ApiService();
export default api;
