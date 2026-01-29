import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://119.148.16.204:88/api'; // Server Public IP
// const API_URL = 'http://localhost:8123/api'; // iOS Simulator

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  validateStatus: (status) => status >= 200 && status < 300, // Reject redirects (which often mean auth failure -> HTML login page)
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
