import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockGeolocation } from "@/test/geolocation";
import { useWeatherLocation } from "./useWeatherLocation";

const permission = (state: PermissionState) =>
  vi.fn(() => Promise.resolve({ state } as PermissionStatus));

afterEach(() => vi.unstubAllGlobals());

/** #331: Today never prompts for location and never falls back to a default city. */
describe("useWeatherLocation", () => {
  it("is off by default and reads no location", () => {
    const getCurrentPosition = mockGeolocation({ coords: { latitude: 1, longitude: 1 } });
    const { result } = renderHook(() => useWeatherLocation({}));
    expect(result.current).toEqual({ status: "off" });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("uses the typed city with the saved unit", () => {
    const { result } = renderHook(() => useWeatherLocation({ weatherLocationMode: "City", weatherCity: "Lisbon", weatherCountry: "PT", temperatureUnit: "C" }));
    expect(result.current).toEqual({ status: "ready", query: { city: "Lisbon", state: undefined, country: "PT", unit: "C" } });
  });

  it("treats City mode without a city as off", () => {
    const { result } = renderHook(() => useWeatherLocation({ weatherLocationMode: "City", weatherCity: " " }));
    expect(result.current).toEqual({ status: "off" });
  });

  it("does not prompt on page load when device permission isn't granted", async () => {
    const getCurrentPosition = mockGeolocation({ coords: { latitude: 1, longitude: 1 } });
    vi.stubGlobal("navigator", { ...navigator, permissions: { query: permission("prompt") } });
    const { result } = renderHook(() => useWeatherLocation({ weatherLocationMode: "Device" }));
    await waitFor(() => expect(result.current).toEqual({ status: "needs-permission" }));
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("reads a rounded device position when permission is already granted", async () => {
    const getCurrentPosition = mockGeolocation({ coords: { latitude: 40.712776, longitude: -74.005974 } });
    vi.stubGlobal("navigator", { ...navigator, permissions: { query: permission("granted") } });
    const { result } = renderHook(() => useWeatherLocation({ weatherLocationMode: "Device" }));
    await waitFor(() => expect(result.current).toEqual({ status: "ready", query: { lat: 40.71, lon: -74.01, unit: "F" } }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});
