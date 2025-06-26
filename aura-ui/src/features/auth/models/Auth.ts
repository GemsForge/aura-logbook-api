import type { AuraColor } from "@/features/mood/models/aura";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  birthday: string; // ISO string format (e.g., "2025-06-21") for DateOnly
  profilePictureBlob?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  auraColor?: AuraColor;
  auraIntensity?: number;
}

export interface UpdateUserRequest {
  id: number;
  email: string;
  password?: string;
  displayName?: string;
  auraColor?: AuraColor;
  auraIntensity?: number;
  birthday: string;
  avatar?: string; // base64 or image URL
}
