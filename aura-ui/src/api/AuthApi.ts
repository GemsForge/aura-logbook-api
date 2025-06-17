
import axios from "axios";
import {
    type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type UpdateUserRequest,
  type UserProfile,
} from ".././features/auth/models/index";

const API_BASE = "/api/auth";

export const authApi = {
  /**
   * Test connection to the API.
   */
  testConnection: async (): Promise<UserProfile> => {
    const res = await axios.get(`${API_BASE}/test`);
    return res.data;
  },

  /**
   * Get all users (requires Authorization).
   */
  getAllUsers: async (): Promise<UserProfile[]> => {
    const res = await axios.get(`${API_BASE}/all`);
    return res.data;
  },

  /**
   * Authenticate user with email and password.
   */
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const res = await axios.post(`${API_BASE}/login`, payload);
    return res.data;
  },

  /**
   * Register a new user.
   */
  register: async (payload: RegisterRequest): Promise<string> => {
    const res = await axios.post(`${API_BASE}/register`, payload);
    return res.data;
  },

  /**
   * Update the current authenticated user's profile.
   */
  updateUser: async (payload: UpdateUserRequest): Promise<string> => {
    const res = await axios.put(`${API_BASE}/update`, payload);
    return res.data;
  },
};
