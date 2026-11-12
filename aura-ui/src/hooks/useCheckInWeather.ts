import { skipToken } from "@reduxjs/toolkit/query";
import type { WeatherDto } from "@/features/weather/WeatherDto";
import { useWeatherLocation } from "@/hooks/useWeatherLocation";
import { useGetCurrentWeatherQuery } from "@/store/weatherApi";

/**
 * Current weather to attach to a new check-in, so Insights can relate weather to energy.
 * It reuses the user's saved weather location and RTK Query's cached weather (the same request
 * as the Today weather chip), never prompts for location, and is undefined when weather is off,
 * still loading, or unavailable; check-ins never wait for it.
 */
export function useCheckInWeather(profile: Parameters<typeof useWeatherLocation>[0]): WeatherDto | undefined {
  const location = useWeatherLocation(profile);
  const { data } = useGetCurrentWeatherQuery(location.status === "ready" ? location.query : skipToken);
  return data;
}
