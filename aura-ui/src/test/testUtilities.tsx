import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../store/slices/authSlice";
// import moodReducer from "../store/slices/moodSlice";

/**
 * Utility function to render a component with Redux and React Router context for testing.
 *
 * @param ui - The React component to render.
 * @param options - Optional configuration for the test environment, including initial route and preloaded Redux state.
 * @returns An object containing the Redux store and the result of the render function.
 * @note
 * 1. Creates a fake Redux store for the test
 * 2. Wraps the component in Redux Provider
 * 3. Wraps the component in MemoryRouter
 * 4. Renders the component using React Testing Library
 * 5. Returns the store too, in case the test needs to inspect state
 *
 * @example
 * renderWithProviders(<MyComponent />, {
 *   route: "/my-route",
 *   preloadedState: {
 *     auth: {
 *       token: "test-token",
 *       isAuthenticated: true,
 *       profile: null,
 *     },
 *   },
 * });
 *
 * expect(screen.getByText("Expected text")).toBeInTheDocument();
 */
type RenderWithProvidersOptions = {
  route?: string;
  preloadedState?: Parameters<typeof configureStore>[0]["preloadedState"];
};

export function renderWithProviders(
  ui: ReactElement,
  { route = "/", preloadedState }: RenderWithProvidersOptions = {}
) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      //moods: moodReducer,
    },
    preloadedState,
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>
    ),
  };
}

// This helper creates a fake “logged-in user” Redux state.
export function createAuthenticatedState() {
  return {
    auth: {
      token: "test-token",
      isAuthenticated: true,
      profile: {
        id: 1,
        email: "gem@example.com",
        displayName: "Gem",
      },
    },
  };
}

// This helper creates a fake "logged-out user" Redux state.
export function createUnauthenticatedState() {
  return {
    auth: {
      token: null,
      isAuthenticated: false,
      profile: null,
    },
  };
}
