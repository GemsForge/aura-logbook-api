import api from "./api";

export interface WeatherDto {
  temperature: number;
  description: string;
  iconCode: string;
}
const API_BASE = "/Weather";

export const WeatherApi = {
  /**
   * Fetch current weather for a location
   * Accepts either { lat, lon } or { city, state, country } in params
   */
  getCurrent: async (params: {
    lat?: number;
    lon?: number;
    city?: string;
    state?: string;
    country?: string;
  }): Promise<WeatherDto> => {
    const response = await api.get<WeatherDto>(`${API_BASE}/current`, {
      params,
    });
    return response.data;
  },
};
