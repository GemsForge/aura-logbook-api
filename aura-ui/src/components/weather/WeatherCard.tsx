import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetCurrentWeatherQuery } from "@/store/weatherApi";
import { useAppDispatch } from "@/store/hooks";
import { openProfileModal } from "@/store/slices/uiSlice";
import type { WeatherLocationState } from "@/hooks/useWeatherLocation";

export interface WeatherCardProps {
  /** Resolved from the user's saved weather location (#331); never a default city. */
  location: WeatherLocationState;
}

// Every state renders in the same 32px pill so the Today greeting row never shifts.
const chipSx = {
  display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.5, borderRadius: 999,
  bgcolor: "var(--aura-wash)", minHeight: 32, minWidth: 132, boxSizing: "border-box",
} as const;
const linkSx = {
  border: 0, background: "transparent", p: 0, cursor: "pointer", color: "inherit", font: "inherit",
  textDecoration: "underline", textUnderlineOffset: "2px",
} as const;

/**
 * Compact current-weather chip for the Today greeting. With no location it shows a quiet link
 * to the profile setting instead of weather, and it never requests a location itself.
 */
export default function WeatherCard({ location }: WeatherCardProps) {
  const dispatch = useAppDispatch();
  const query = location.status === "ready" ? location.query : skipToken;
  const { data: weather, isLoading, isError } = useGetCurrentWeatherQuery(query);
  const openSettings = () => dispatch(openProfileModal());

  if (location.status === "off" || location.status === "needs-permission") {
    return (
      <Box sx={chipSx}>
        <Typography level="body-xs" component="button" type="button" onClick={openSettings} sx={linkSx}>
          {location.status === "off" ? "Set your location" : "Allow location for weather"}
        </Typography>
      </Box>
    );
  }
  if (location.status === "locating" || isLoading) {
    return <Box sx={chipSx}><Typography level="body-xs" role="status">Weather loading</Typography></Box>;
  }
  if (isError || !weather) {
    return <Box sx={chipSx}><Typography level="body-xs" role="status">Weather unavailable</Typography></Box>;
  }
  const unit = weather.unit ?? "F";
  const temperature = Math.round(weather.temperature);
  return (
    <Box sx={chipSx}>
      <Box component="img" src={`/weather-icons/icons/${weather.iconCode}.png`} alt="" sx={{ width: 24, height: 24 }} />
      <Typography level="body-xs" aria-label={`${temperature} degrees ${unit === "C" ? "Celsius" : "Fahrenheit"}, ${weather.description}`}>
        {temperature}°{unit} · {weather.description}
      </Typography>
    </Box>
  );
}
