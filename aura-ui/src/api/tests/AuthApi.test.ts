import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { AuthApi } from "../AuthApi";
import api from "../api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateUserRequest,
  UserProfile,
} from "../../features/auth/models";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

type MockedApiClient = {
  get: Mock;
  post: Mock;
  put: Mock;
};

const mockedApi = api as unknown as MockedApiClient;

const testData = {
  userProfile: {
    id: 1,
    email: "gem@example.com",
    displayName: "Gem",
  } as UserProfile,
  loginPayload: {
    email: "gem@example.com",
    password: "password123",
  } as LoginRequest,
  loginResponse: {
    token: "test-token",
  } as LoginResponse,
  registerPayload: {
    email: "gem@example.com",
    password: "password123",
    displayName: "Gem",
  } as RegisterRequest,
  updatePayload: {
    displayName: "Gem Updated",
  } as UpdateUserRequest,
};

describe("AuthApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // #327: these routes were removed from the API, so the client must not expose them.
  it("does not expose removed password-reset or diagnostic endpoints", () => {
    expect(AuthApi).not.toHaveProperty("resetPassword");
    expect(AuthApi).not.toHaveProperty("testConnection");
    expect(AuthApi).not.toHaveProperty("getAllUsers");
  });

  it("should login a user", async () => {
    mockedApi.post.mockResolvedValue({ data: testData.loginResponse });

    const result = await AuthApi.login(testData.loginPayload);

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/Auth/login",
      testData.loginPayload
    );
    expect(result).toEqual(testData.loginResponse);
  });

  it("should register a user", async () => {
    const responseMessage = "User registered successfully.";
    mockedApi.post.mockResolvedValue({ data: responseMessage });

    const result = await AuthApi.register(testData.registerPayload);

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/Auth/register",
      testData.registerPayload
    );
    expect(result).toBe(responseMessage);
  });

  it("should update the current user", async () => {
    const responseMessage = "User updated successfully.";
    mockedApi.put.mockResolvedValue({ data: responseMessage });

    const result = await AuthApi.updateUser(testData.updatePayload);

    expect(mockedApi.put).toHaveBeenCalledWith(
      "/Auth/update",
      testData.updatePayload
    );
    expect(result).toBe(responseMessage);
  });

  it("should get the current authenticated user", async () => {
    mockedApi.get.mockResolvedValue({ data: testData.userProfile });

    const result = await AuthApi.getCurrentUser();

    expect(mockedApi.get).toHaveBeenCalledWith("/Auth/me");
    expect(result).toEqual(testData.userProfile);
  });
});