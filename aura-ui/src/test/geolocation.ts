import { vi } from "vitest";

/** Installs a fake navigator.geolocation that answers getCurrentPosition once. */
export function mockGeolocation(answer: { coords?: { latitude: number; longitude: number }; errorCode?: 1 | 2 | 3 }) {
  const getCurrentPosition = vi.fn((success: PositionCallback, failure?: PositionErrorCallback | null) => {
    if (answer.coords) success({ coords: answer.coords } as GeolocationPosition);
    else failure?.({ code: answer.errorCode!, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "" } as GeolocationPositionError);
  });
  vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
  return getCurrentPosition;
}
