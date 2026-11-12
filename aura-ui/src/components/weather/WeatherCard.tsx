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

// Every state keeps the chip at least 32px tall so loading does not shift the greeting banner.
const chipSx = {
  display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.5, borderRadius: 999,
  // The weather chip is a small, repeated cue for the check-in-derived aura.
  bgcolor: "color-mix(in srgb, var(--aura-accent, var(--al-theme-primary)) 18%, var(--al-theme-surface-raised))", color: "var(--al-theme-ink)",
  border: "1px solid var(--aura-line, var(--al-theme-border))", minHeight: 32, minWidth: 132, boxSizing: "border-box",
} as const;
const linkSx = {
  border: 0, background: "transparent", p: 0, cursor: "pointer", color: "inherit", font: "inherit",
  textDecoration: "underline", textUnderlineOffset: "2px",
} as const;

/**
 * Compact current-weather chip for the greeting banner. Its surface and text follow the interface
 * theme; with no location it links to profile settings and never requests a location itself.
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
