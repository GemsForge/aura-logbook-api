import Box from "@mui/joy/Box";
import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";
import CircularProgress from "@mui/joy/CircularProgress";
import { useGetCurrentWeatherQuery } from "@/store/weatherApi";

export interface WeatherCardProps {
  /** Choose coordinates or a city query to retrieve current conditions. */
  lat?: number; lon?: number; city?: string; state?: string; country?: string;
}

/** Keeps weather loading, failure and current conditions inside one consistent card. */
/** Shows a concise current-weather summary in the dashboard card stack. */
export default function WeatherCard({ city, state, country, lat, lon }: WeatherCardProps) {
  const { data: weather, isLoading, isError, refetch } = useGetCurrentWeatherQuery({ lat, lon, city, state, country });
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
