import type { UserProfile } from ".";


export interface AuthState {
    isAuthenticated: boolean;
    loading: boolean;
    user?: UserProfile;
    error?: string;
  }
  