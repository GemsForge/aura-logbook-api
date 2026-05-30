import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  LoginRequest,
  LoginResponse,
  UpdateUserRequest,
  UserProfile,
} from "@/features/auth/models";
import type { AuraColor } from "@/features/mood/models/aura";
import { authApi } from "../authApi";
import authReducer from "../slices/authSlice";

function createJsonResponse<T>(data: T) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware),
  });
}

const testData = {
  userProfile: {
    id: 1,
    email: "gem@example.com",
    displayName: "Gem",
  } as unknown as UserProfile,
  loginPayload: {
    email: "gem@example.com",
    password: "password123",
  } as LoginRequest,
  loginResponse: {
    token: "test-token",
  } as LoginResponse,
  updateUserPayload: {
    displayName: "Gem Updated",
  } as UpdateUserRequest,
  updateAuraPayload: {
    auraColor: "Blue" as AuraColor,
    auraIntensity: 7,
  },
};

describe("authApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should cache the current user response", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse(testData.userProfile));
    const store = createTestStore();

    const firstResult = await store.dispatch(
      authApi.endpoints.getCurrentUser.initiate()
    );
    const secondResult = await store.dispatch(
      authApi.endpoints.getCurrentUser.initiate()
    );

    expect(firstResult.data).toEqual(testData.userProfile);
    expect(secondResult.data).toEqual(testData.userProfile);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should store cached current user data in the RTK Query cache", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse(testData.userProfile)
    );
    const store = createTestStore();

    await store.dispatch(authApi.endpoints.getCurrentUser.initiate());

    const queryCacheEntries = Object.values(
      store.getState()[authApi.reducerPath].queries
    );

    expect(queryCacheEntries).toHaveLength(1);
    expect(queryCacheEntries[0]?.status).toBe("fulfilled");
    expect(queryCacheEntries[0]?.data).toEqual(testData.userProfile);
  });

  it("should save the token to auth state when login succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse(testData.loginResponse)
    );
    const store = createTestStore();

    const result = await store.dispatch(
      authApi.endpoints.login.initiate(testData.loginPayload)
    );

    expect(result.data).toEqual(testData.loginResponse);
    expect(store.getState().auth.token).toBe(testData.loginResponse.token);
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });

  it("should update the current user and cache the response", async () => {
    const updatedUser = {
      ...testData.userProfile,
      displayName: "Gem Updated",
    } as unknown as UserProfile;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse(updatedUser));
    const store = createTestStore();

    const result = await store.dispatch(
      authApi.endpoints.updateUser.initiate(testData.updateUserPayload)
    );

    expect(result.data).toEqual(updatedUser);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.url).toContain("/Auth/update");
    expect(request.method).toBe("PUT");
  });

  it("should update the user's aura and cache the response", async () => {
    const updatedUser = {
      ...testData.userProfile,
      auraColor: testData.updateAuraPayload.auraColor,
      auraIntensity: testData.updateAuraPayload.auraIntensity,
    } as unknown as UserProfile;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse(updatedUser));
    const store = createTestStore();

    const result = await store.dispatch(
      authApi.endpoints.updateAura.initiate(testData.updateAuraPayload)
    );

    expect(result.data).toEqual(updatedUser);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.url).toContain("/Auth/updateAura");
    expect(request.method).toBe("PATCH");
  });
});
