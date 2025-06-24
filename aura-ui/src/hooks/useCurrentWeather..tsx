import { WeatherApi, type WeatherDto } from "@/api/WeatherApi";
import { useAppSelector } from "../store/hooks";
import { useEffect, useState } from "react";

export interface UseCurrentWeather {
  weather: WeatherDto | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Fetches current weather for the signed-in user
 * based on their lat/lon or city/state/country.
 */
export function useCurrentWeather(): UseCurrentWeather {
 
const user = useAppSelector((state) => state.auth.user);

  const [weather, setWeather] = useState<WeatherDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const params: {
      lat?: number;
      lon?: number;
      city?: string;
      state?: string;
      country?: string;
    } = {};

    if (user.lat != null && user.lon != null) {
      params.lat = user.lat;
      params.lon = user.lon;
    } else if (user.city) {
      params.city = user.city;
      params.state = user.state;
      params.country = user.country;
    } else {
      setError(new Error("No location available on user profile"));
      setLoading(false);
      return;
    }
    setLoading(true);
    WeatherApi.getCurrent(params)
      .then(setWeather)
      .catch((e) => setError(e as Error))
      .finally(() => setLoading(false));
  }, [user]);

  return { weather, loading, error };
}
