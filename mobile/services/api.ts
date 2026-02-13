import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.0.102:8000/api'; // Physical device (PC's LAN IP)
// const API_URL = 'http://10.0.2.2:8000/api'; // Android Emulator
// const API_URL = 'http://103.7.193.2:91/api'; // Server Public IP
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
