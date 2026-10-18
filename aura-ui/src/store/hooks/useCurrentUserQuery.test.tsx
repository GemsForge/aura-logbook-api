import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import authReducer from "@/store/slices/authSlice";
import { authApi } from "@/store/authApi";
import { useCurrentUserQuery } from "./useCurrentUserQuery";

function QueryProbe() {
  const { isUninitialized } = useCurrentUserQuery();
  return <div>{isUninitialized ? "query skipped" : "query started"}</div>;
}

function renderQueryProbe(token: string | null) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware),
    preloadedState: {
      auth: { token, isAuthenticated: Boolean(token), profile: null },
    },
  });

  return render(
    <Provider store={store}>
      <QueryProbe />
    </Provider>,
  );
}

describe("useCurrentUserQuery", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not request the current user when no token is stored", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderQueryProbe(null);

    expect(screen.getByText("query skipped")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends an authenticated current-user request when a token is present", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 7 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderQueryProbe("valid-test-token");

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toMatch(/\/Auth\/me$/);
    expect(request.headers.get("Authorization")).toBe("Bearer valid-test-token");
  });
});
