import type { UserProfile } from "./UserProfile";

export interface AuthState {
    isAuthenticated: boolean;
    loading: boolean;
    user?: UserProfile;
    error?: string;
  }
  