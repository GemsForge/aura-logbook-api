import axios from 'axios';
import { logout } from '../store/slices/authSlice';
import { shouldClearAuthenticationState } from './authErrorHandling';

/**
 * The store is attached after it is created (see store.ts) instead of imported here. Importing it
 * formed a cycle (store → auraApi → ZodiacApi → api → store) that left slices undefined at load time.
 */
type AttachedStore = { getState: () => { auth: { token: string | null } }; dispatch: (action: ReturnType<typeof logout>) => unknown };
let attachedStore: AttachedStore | null = null;

/** Gives the axios client access to the auth token and logout dispatch. Called once by store.ts. */
export function attachStore(store: AttachedStore) {
  attachedStore = store;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = attachedStore?.getState().auth.token;
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
  (error) => {
    const status = error?.response?.status;
    if (shouldClearAuthenticationState(status, error?.config?.url)) {
      attachedStore?.dispatch(logout());
      // Optionally redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
