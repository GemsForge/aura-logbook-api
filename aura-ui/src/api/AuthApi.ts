
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
 * REST client for /api/Auth. The diagnostic `test` route and all-users listing were removed with
 * #327. Password recovery (#329) is token-based: `forgotPassword` emails a single-use link and
 * `resetPassword` redeems it; the API returns 404 for both when recovery is disabled.
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
   * Request a reset link. The API answers identically whether or not the account exists.
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await api.post(`${API_BASE}/forgot-password`, { email });
    return res.data;
  },

  /**
   * Redeem an emailed reset token with a new password (8–72 characters).
   */
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const res = await api.post(`${API_BASE}/reset-password`, { token, newPassword });
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
