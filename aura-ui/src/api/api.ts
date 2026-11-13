import axios from 'axios';
import { logout } from '../store/slices/authSlice';
import { shouldClearAuthenticationState } from './authErrorHandling';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  async (config) => {
    // Load the store only when a request is sent to avoid a store/API module import cycle.
    const { store } = await import('../store/store');
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (shouldClearAuthenticationState(status, error?.config?.url)) {
      const { store } = await import('../store/store');
      store.dispatch(logout());
      // Optionally redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
