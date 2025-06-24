// src/components/weather/WeatherCard.tsx
import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress
} from "@mui/material";
import { useGetCurrentWeatherQuery } from "../../store/weatherApi";

export interface WeatherCardProps {
  /** You can supply either lat/lon or city/state/country */
  lat?: number;
  lon?: number;
  city?: string;
  state?: string;
  country?: string;
}


const WeatherCard: React.FC<WeatherCardProps> = ({
    city,
    state,
    country,
    lat,
    lon,
}) => {
    const {
            data: weather,
            isLoading,
            isError,
          } = useGetCurrentWeatherQuery({ lat, lon, city, state, country });

          if (isLoading) return <CircularProgress size={32} />;
          if (isError || !weather)
              return (
                <Typography color="error" variant="body2">
                  Unable to load weather.
                </Typography>
              );
  // OpenWeather icon URL pattern
  const iconUrl = `/weather-icons/icons/${weather.iconCode}.png`;  

 console.log(weather.iconCode);
  return (
    <Card sx={{ display: "flex", alignItems: "center", p: 2, mb: 2 }}>
      <Box
        component="img"
        src={iconUrl}
        alt={weather.description}
        sx={{ width: 64, height: 64, mr: 2 }}
      />
      <CardContent sx={{ flex: 1 }}>
        <Typography variant="h5">
          {Math.round(weather.temperature)}°{/* adjust unit if needed */}
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          sx={{ textTransform: "capitalize" }}
        >
          {weather.description}
        </Typography>
        {(city || state || country) && (
          <Typography variant="body2" color="text.secondary">
            {[city, state, country].filter(Boolean).join(", ")}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherCard;
