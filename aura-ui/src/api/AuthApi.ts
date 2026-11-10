
import {
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type UpdateUserRequest,
  type UserProfile,
} from ".././features/auth/models/index";
import api from "./api";

const API_BASE = "/Auth";

/**
 * REST client for /api/Auth. Password reset, the diagnostic `test` route, and the all-users
 * listing were removed with #327 and must not be reintroduced without a verified recovery flow.
 */
export const AuthApi = {
  /**
   * Authenticate user with email and password.
   */
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post(`${API_BASE}/login`, payload);
    return res.data;
  },

  /**
   * Register a new user.
   */
  register: async (payload: RegisterRequest): Promise<string> => {
    const res = await api.post(`${API_BASE}/register`, payload);
    return res.data;
  },

  /**
   * Update the current authenticated user's profile.
   */
  updateUser: async (payload: UpdateUserRequest): Promise<UserProfile> => {
    const res = await api.put(`${API_BASE}/update`, payload);
    return res.data;
  },

  /**
   * Get current authenticated user profile (id, email, displayName)
   */
  getCurrentUser: async(): Promise<UserProfile>=>{
    const res = await api.get(`${API_BASE}/me`);
    return res.data;
  }
};
