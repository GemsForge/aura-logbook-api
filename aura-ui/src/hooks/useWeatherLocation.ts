import { useEffect, useState } from "react";
import type { UserProfile } from "@/features/auth/models/UserProfile";
import {
  isDeviceLocationGranted,
  readDeviceLocation,
  resolveTemperatureUnit,
  resolveWeatherLocationMode,
  type TemperatureUnit,
} from "@/features/weather/weatherLocation";

/** Query sent to GET /Weather/current. Coordinates are already rounded to city level. */
export interface WeatherQuery {
  lat?: number;
  lon?: number;
  city?: string;
  state?: string;
  country?: string;
  unit: TemperatureUnit;
}

/**
 * What Today's weather chip should do (#331):
 * - "off": no location is requested or sent; show a quiet prompt to set one.
 * - "locating": reading an already-permitted device position.
 * - "needs-permission": device mode is on, but the browser isn't currently allowing location.
 *   Nothing is requested here: the prompt only ever happens from the profile setting.
 * - "ready": a query to send.
 */
export type WeatherLocationState =
  | { status: "off" }
  | { status: "locating" }
  | { status: "needs-permission" }
  | { status: "ready"; query: WeatherQuery };

/** Resolves the saved preference into a weather query without ever prompting on page load. */
export function useWeatherLocation(profile?: Pick<UserProfile, "weatherLocationMode" | "weatherCity" | "weatherRegion" | "weatherCountry" | "temperatureUnit"> | null): WeatherLocationState {
  const mode = resolveWeatherLocationMode(profile?.weatherLocationMode);
  const unit = resolveTemperatureUnit(profile?.temperatureUnit);
  const city = profile?.weatherCity?.trim();
  const [device, setDevice] = useState<WeatherLocationState>({ status: "locating" });

  useEffect(() => {
    if (mode !== "Device") return;
    let cancelled = false;
    setDevice({ status: "locating" });
    void (async () => {
      // Only read the position when the browser already allows it; otherwise it would prompt.
      if (!(await isDeviceLocationGranted())) {
        if (!cancelled) setDevice({ status: "needs-permission" });
        return;
      }
      const result = await readDeviceLocation();
      if (cancelled) return;
      setDevice(result.ok ? { status: "ready", query: { lat: result.lat, lon: result.lon, unit } } : { status: "needs-permission" });
    })();
    return () => { cancelled = true; };
  }, [mode, unit]);

  if (mode === "City" && city) {
    return { status: "ready", query: { city, state: profile?.weatherRegion ?? undefined, country: profile?.weatherCountry ?? undefined, unit } };
  }
  if (mode === "Device") return device;
  return { status: "off" };
}
