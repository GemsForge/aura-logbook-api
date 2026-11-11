import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import uiReducer from "@/store/slices/uiSlice";
import { weatherApi } from "@/store/weatherApi";
import WeatherCard from "./WeatherCard";

/** The chip needs only the weather API and the UI slice (to open the profile setting). */
const renderWithProviders = (ui: ReactElement) => render(
  <Provider store={configureStore({
    reducer: { ui: uiReducer, [weatherApi.reducerPath]: weatherApi.reducer },
    middleware: (getDefault) => getDefault().concat(weatherApi.middleware),
  })}>{ui}</Provider>,
);

const getCurrent = vi.hoisted(() => vi.fn());
vi.mock("@/api/WeatherApi", () => ({ WeatherApi: { getCurrent } }));

/** #331: no default city; with no location the chip links to the setting and sends nothing. */
describe("WeatherCard", () => {
  beforeEach(() => getCurrent.mockReset());

  it("shows a quiet prompt and requests no weather when location is off", () => {
    renderWithProviders(<WeatherCard location={{ status: "off" }} />);
    expect(screen.getByRole("button", { name: "Set your location" })).toBeInTheDocument();
    expect(getCurrent).not.toHaveBeenCalled();
  });

  it("asks the user to allow location without prompting itself", () => {
    renderWithProviders(<WeatherCard location={{ status: "needs-permission" }} />);
    expect(screen.getByRole("button", { name: "Allow location for weather" })).toBeInTheDocument();
    expect(getCurrent).not.toHaveBeenCalled();
  });

  it("shows the temperature in the saved unit", async () => {
    getCurrent.mockResolvedValue({ temperature: 21.4, unit: "C", description: "Clear", iconCode: "c01d" });
    renderWithProviders(<WeatherCard location={{ status: "ready", query: { city: "Lisbon", country: "PT", unit: "C" } }} />);
    expect(await screen.findByText("21°C · Clear")).toBeInTheDocument();
    expect(getCurrent).toHaveBeenCalledWith({ city: "Lisbon", country: "PT", unit: "C" });
  });
});
