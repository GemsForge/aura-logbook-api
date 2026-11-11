/**
 * #331 weather location rules shared by the profile setting and Today.
 *
 * - Off (default): nothing is requested or sent.
 * - City: the typed place is sent; it is the only location data stored on the profile.
 * - Device: the browser's position is read only after the user turned it on in the profile
 *   (which is where the permission prompt happens), rounded to two decimals (~1 km), and
 *   never stored.
 */
export type WeatherLocationMode = "Off" | "City" | "Device";
export type TemperatureUnit = "F" | "C";

export const weatherLocationModes: readonly WeatherLocationMode[] = ["Off", "City", "Device"];

/** Coerces missing or unknown stored values to "Off". */
export const resolveWeatherLocationMode = (value?: string | null): WeatherLocationMode =>
  value === "City" || value === "Device" ? value : "Off";

/** Coerces missing or unknown stored values to Fahrenheit. */
export const resolveTemperatureUnit = (value?: string | null): TemperatureUnit => (value?.toUpperCase() === "C" ? "C" : "F");

/** Rounds to city level before anything leaves the browser. */
export const roundCoordinate = (value: number) => Math.round(value * 100) / 100;

export type DeviceLocationResult =
  | { ok: true; lat: number; lon: number }
  | { ok: false; reason: "denied" | "unavailable" | "timeout" | "unsupported" };

/**
 * Reads the device position once. Call only from a user action (the profile setting) or after
 * `isDeviceLocationGranted` is true, so the browser never prompts on page load.
 */
export function readDeviceLocation(timeoutMs = 10000): Promise<DeviceLocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve({ ok: false, reason: "unsupported" });
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ ok: true, lat: roundCoordinate(coords.latitude), lon: roundCoordinate(coords.longitude) }),
      (error) => resolve({
        ok: false,
        reason: error.code === error.PERMISSION_DENIED ? "denied" : error.code === error.TIMEOUT ? "timeout" : "unavailable",
      }),
      // Low accuracy is enough for weather and avoids waking GPS.
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 30 * 60 * 1000 },
    );
  });
}

/** True only when the browser already granted location, so reading it will not show a prompt. */
export async function isDeviceLocationGranted(): Promise<boolean> {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    return status?.state === "granted";
  } catch {
    return false;
  }
}

/** Plain-language copy for each way device location can fail. */
export const deviceLocationFailureCopy: Record<Exclude<DeviceLocationResult, { ok: true }>["reason"], string> = {
  denied: "Location permission was turned off for this site. You can type a city instead.",
  unavailable: "This device couldn’t find its location right now. You can type a city instead.",
  timeout: "Finding your location took too long. Try again, or type a city instead.",
  unsupported: "This browser doesn’t share location. You can type a city instead.",
};
