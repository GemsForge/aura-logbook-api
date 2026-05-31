import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ToastProvider } from "../hooks/useToast";
import { getAuraTheme } from "../theme";
import authReducer from "../store/slices/authSlice";
import uiReducer from "../store/slices/uiSlice";
import { AuraColor } from "@/features/mood/models/aura";

/**
 * Utility function to render a component with Redux and React Router context for testing.
 *
 * @param ui - The React component to render.
 * @param options - Optional configuration for the test environment, including initial route and preloaded Redux state.
 * @returns An object containing the Redux store and the result of the render function.
 * @note
 *  1. Creates a fake Redux store for the test
 *  2. Wraps the component in Redux Provider
 *  3. Wraps the component in the Aura MUI theme
 *  4. Adds ToastProvider and LocalizationProvider context
 *  5. Wraps the component in MemoryRouter
 *  6. Renders the component using React Testing Library
 *  7. Returns the store too, in case the test needs to inspect state
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
 *   auraColor: "blue",
 *   auraIntensity: 500,
 * });
 *
 * expect(screen.getByText("Expected text")).toBeInTheDocument();
 */
type RenderWithProvidersOptions = {
  route?: string;
  preloadedState?: Parameters<typeof configureStore>[0]["preloadedState"];
  auraColor?: AuraColor;
  auraIntensity?: number;
};

export function renderWithProviders(
  ui: ReactElement,
  {
    route = "/",
    preloadedState,
    auraColor = AuraColor.Blue,
    auraIntensity = 500,
  }: RenderWithProvidersOptions = {}
) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
    preloadedState,
  });

  const theme = getAuraTheme(auraColor, auraIntensity);

  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
            </LocalizationProvider>
          </ToastProvider>
        </ThemeProvider>
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

// This helper creates a fake Redux state with the profile modal open.
export function createProfileModalOpenState() {
  return {
    ui: {
      isProfileModalOpen: true,
    },
  };
}
