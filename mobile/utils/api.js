import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your local IP when running on physical device
// e.g., 'http://192.168.1.100:8000'
export const BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const workoutsAPI = {
  getPredefined: () => api.get('/workouts/predefined'),
  getRecommendation: (params) => api.post('/workouts/recommend', params),
  logWorkout: (data) => api.post('/workouts/log', data),
  getHistory: (limit = 20) => api.get(`/workouts/history?limit=${limit}`),
  getStats: () => api.get('/workouts/stats'),
};

export const nutritionAPI = {
  searchFood: (q) => api.get(`/nutrition/search?q=${q}`),
  getFoods: () => api.get('/nutrition/foods'),
  logMeal: (data) => api.post('/nutrition/log', data),
  getToday: () => api.get('/nutrition/today'),
  deleteLog: (id) => api.delete(`/nutrition/log/${id}`),
  getWeekly: () => api.get('/nutrition/weekly'),
};

export const progressAPI = {
  logProgress: (data) => api.post('/progress/log', data),
  getHistory: () => api.get('/progress/history'),
  getSummary: () => api.get('/progress/summary'),
};

export const socialAPI = {
  getFeed: () => api.get('/social/feed'),
  createPost: (data) => api.post('/social/post', data),
  toggleLike: (postId) => api.post(`/social/like/${postId}`),
  deletePost: (postId) => api.delete(`/social/post/${postId}`),
};

export default api;
