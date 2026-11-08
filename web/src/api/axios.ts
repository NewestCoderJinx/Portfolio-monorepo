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

// A 401 on a request that carried our token means the login is no longer valid:
// clear it and let the app send the owner back to the sign-in form.
API.interceptors.response.use(
  (res) => res,
  (error) => {
    const sentToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && sentToken) {
      localStorage.removeItem('access_token');
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  },
);

export default API;
