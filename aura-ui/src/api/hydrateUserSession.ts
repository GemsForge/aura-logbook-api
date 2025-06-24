// src/utils/authUtils.ts
import { AuthApi } from "@/api/AuthApi";
import { loginSuccess } from "@/store/slices/authSlice";
import type { AppDispatch } from "@/store/store";
import type { UserProfile } from "@/features/auth/models";
import api from "./api";

export async function hydrateUserSession(
  token: string,
  dispatch: AppDispatch
): Promise<UserProfile | null> {
  try {
    localStorage.setItem("token", token); // ensure interceptor picks it up

    // ✅ Inject token directly into Axios headers
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    
    const user = await AuthApi.getCurrentUser(); // now token is available
    dispatch(loginSuccess({ token, profile: user  }));
 
    localStorage.setItem("session_hydrated", "true");

    return user;
  } catch (error) {
    console.error("Session hydration failed:", error);
    return null;
  }
}
