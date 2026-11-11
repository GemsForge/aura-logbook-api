import { afterEach, describe, expect, it, vi } from "vitest";
import { mockGeolocation } from "@/test/geolocation";
import { readDeviceLocation, resolveTemperatureUnit, resolveWeatherLocationMode, roundCoordinate } from "./weatherLocation";

afterEach(() => vi.unstubAllGlobals());

describe("weatherLocation", () => {
  it("rounds coordinates to two decimals (city level)", () => {
    expect(roundCoordinate(33.748995)).toBe(33.75);
    expect(roundCoordinate(-84.387982)).toBe(-84.39);
  });

  it("defaults unknown stored values to Off and Fahrenheit", () => {
    expect(resolveWeatherLocationMode(undefined)).toBe("Off");
    expect(resolveWeatherLocationMode("Everywhere")).toBe("Off");
    expect(resolveWeatherLocationMode("City")).toBe("City");
    expect(resolveTemperatureUnit("c")).toBe("C");
    expect(resolveTemperatureUnit(null)).toBe("F");
  });

  it("returns rounded coordinates, never the precise ones", async () => {
    mockGeolocation({ coords: { latitude: 51.507351, longitude: -0.127758 } });
    expect(await readDeviceLocation()).toEqual({ ok: true, lat: 51.51, lon: -0.13 });
  });

  it.each([[1, "denied"], [2, "unavailable"], [3, "timeout"]] as const)("maps error code %i to %s", async (code, reason) => {
    mockGeolocation({ errorCode: code });
    expect(await readDeviceLocation()).toEqual({ ok: false, reason });
  });
});
