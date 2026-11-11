import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import CircularProgress from "@mui/joy/CircularProgress";
import { useGetCurrentWeatherQuery } from "@/store/weatherApi";

export interface WeatherCardProps {
  /** Choose coordinates or a city query to retrieve current conditions. */
  lat?: number; lon?: number; city?: string; state?: string; country?: string;
  /** Renders current conditions as a compact inline chip for the Today greeting. */
  compact?: boolean;
}

/** Keeps weather loading, failure and current conditions inside one consistent card. */
/** Shows a concise current-weather summary in the dashboard card stack. */
export default function WeatherCard({ city, state, country, lat, lon, compact = false }: WeatherCardProps) {
  const { data: weather, isLoading, isError, refetch } = useGetCurrentWeatherQuery({ lat, lon, city, state, country });
  if (compact) return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.5, borderRadius: 999, bgcolor: "var(--aura-wash)", minHeight: 32 }}>
      {isLoading ? <Typography level="body-xs" role="status">Weather loading</Typography>
        : isError || !weather ? <Typography level="body-xs" role="status">Weather unavailable</Typography>
          : <><Box component="img" src={`/weather-icons/icons/${weather.iconCode}.png`} alt="" sx={{ width: 24, height: 24 }} /><Typography level="body-xs" aria-label={`${Math.round(weather.temperature)} degrees, ${weather.description}`}>{Math.round(weather.temperature)}° · {weather.description}</Typography></>}
    </Box>
  );
  return (
    <Sheet className="aura-panel" sx={{ p: 2.5 }}>
      <Typography className="aura-eyebrow" color="neutral">Outside your window</Typography>
      {isLoading ? <Box role="status" aria-label="Loading weather" sx={{ py: 3 }}><CircularProgress size="sm" /></Box>
        : isError || !weather ? <Box sx={{ py: 2 }}><Typography role="alert" level="body-sm" color="danger">Unable to load weather.</Typography><Typography component="button" onClick={() => refetch()} sx={{ mt: 1, border: 0, cursor: "pointer", bgcolor: "transparent", textDecoration: "underline" }}>Try again</Typography></Box>
        : <>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
            <Typography level="h3" sx={{ fontSize: "4rem", fontWeight: 400, letterSpacing: "-.06em" }}>{Math.round(weather.temperature)}°</Typography>
            <Box component="img" src={`/weather-icons/icons/${weather.iconCode}.png`} alt={weather.description} sx={{ width: 76, height: 76 }} />
          </Box>
          <Typography level="title-sm">{weather.description}</Typography>
          <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>{[city, state, country].filter(Boolean).join(", ")}</Typography>
        </>}
    </Sheet>
  );
}
