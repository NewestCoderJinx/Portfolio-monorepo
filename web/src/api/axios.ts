import axios from 'axios';

export const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// No default Content-Type: axios picks JSON for objects and multipart (with boundary) for FormData.
const API = axios.create({ baseURL: API_URL });

// Attach JWT token automatically if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
