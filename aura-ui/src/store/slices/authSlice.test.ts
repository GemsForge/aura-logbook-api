// @vitest-environment jsdom
import type { RootState } from "../store";
import type { UnknownAction } from "@reduxjs/toolkit";
import authReducer, {
  logout,
  selectCurrentUser,
  setProfile,
  setToken,
} from "./authSlice";
import type { UserProfile } from "@/features/auth/models";

const testData = {
  token: "fake-token",
  userProfile: {
    id: 1,
    email: "gem@example.com",
    displayName: "Gem",
  } as UserProfile,
};

const unknownAction: UnknownAction = { type: "unknown" };

const testCases = {
  returnsInitialState: {
    description: "should return the initial state",
    action: unknownAction,
    expectedState: { token: null, isAuthenticated: false, profile: null },
  },
  setsToken: {
    description:
      "sets token, authenticates user, and stores token in localStorage",
    action: setToken(testData.token),
    expectedState: { token: testData.token, isAuthenticated: true },
  },
  clearsTokenOnLogout: {
    description:
      "clears token, profile, auth state, and session storage on logout",
    action: logout(),
    expectedState: { token: null, isAuthenticated: false, profile: null },
  },
  setsUserProfile: {
    description: "sets the user profile and marks user as authenticated",
    action: setProfile(testData.userProfile),
    expectedState: { profile: testData.userProfile, isAuthenticated: true },
  },

  clearsProfileWithoutChangingToken: {
    description: "allows profile to be cleared without changing token directly",
    action: setProfile(null),
    expectedState: { profile: null },
  },
  
  selectCurrentUser:{
    description: "selects the current user profile from the state",
    action: null, // No action needed for selector test
    expectedState: testData.userProfile,
  }
};

//Encapsulate tests for authSlice in a describe block to group them together and provide a clear structure for the test suite.
describe("authSlice", () => {
  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });
  // Test casting the initial state to the expected AuthState type to ensure type safety and prevent TypeScript errors during testing.
  it(testCases.returnsInitialState.description, () => {
    const state = authReducer(undefined, testCases.returnsInitialState.action);

    expect(state).toEqual(testCases.returnsInitialState.expectedState);
  });
  // Test that the setToken action correctly updates the state AND localStorage, ensuring that the token is stored persistently and the user is marked as authenticated.
  it(testCases.setsToken.description, () => {
    const state = authReducer(undefined, testCases.setsToken.action);

    // .toBe() is used to check for strict equality.
    expect(state.token).toBe(testData.token);
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem("token")).toBe(testData.token);
  });

  it(testCases.clearsTokenOnLogout.description, () => {
    localStorage.setItem("token", testData.token);
    localStorage.setItem("session_hydrated", "true");

    const previousState = {
      token: testData.token,
      isAuthenticated: true,
      profile: { ...testData.userProfile } as UserProfile,
    };

    const state = authReducer(previousState, logout());

    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.profile).toBeNull();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("session_hydrated")).toBeNull();
  });

  // Test that the setProfile action correctly updates the user profile in the state and marks the user as authenticated.
  it(testCases.setsUserProfile.description, () => {
    const mockProfile = { ...testData.userProfile } as UserProfile;

    const state = authReducer(undefined, testCases.setsUserProfile.action);

    expect(state.profile).toEqual(mockProfile);
    expect(state.isAuthenticated).toBe(true);
  });

  // Test that the setProfile action can clear the user profile w/o affecting the token or authentication status, allowing for scenarios where the profile might be reset without logging out the user.
  it(testCases.clearsProfileWithoutChangingToken.description, () => {
    const previousState = {
      token: testData.token,
      isAuthenticated: true,
      profile: { ...testData.userProfile },
    };

    const state = authReducer(previousState, setProfile(null));

    expect(state.profile).toBeNull();
    expect(state.token).toBe(testData.token);
    expect(state.isAuthenticated).toBe(true);
  });

  it(testCases.selectCurrentUser.description, () => {
    const mockState: Pick<RootState, "auth"> = {
      auth: {
        token: testData.token,
        isAuthenticated: true,
        profile: testCases.selectCurrentUser.expectedState,
      },
    };
    const result = selectCurrentUser(mockState as RootState);

    expect(result).toEqual(testCases.selectCurrentUser.expectedState);
  });
});
