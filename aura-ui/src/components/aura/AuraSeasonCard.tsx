import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Button from "@mui/joy/Button";
import Typography from "@mui/joy/Typography";
import { useGetAuraSeasonsQuery } from "@/store/auraApi";

/** Shows the optional named-season reflection only after the API confirms the pattern has held. */
export default function AuraSeasonCard() {
  const { data, isLoading, isError, refetch } = useGetAuraSeasonsQuery();
  if (isLoading) {
    return <Typography role="status" level="body-sm" color="neutral" sx={{ mb: 2 }}>Checking for a season pattern…</Typography>;
  }
  if (isError) {
    return (
      <Sheet component="section" className="aura-panel" aria-label="Aura season" sx={{ p: 2, mb: 2 }}>
        <Typography role="alert" level="body-sm">We couldn’t load your season reflection.</Typography>
        <Button variant="plain" onClick={() => void refetch()} sx={{ minHeight: 44, mt: 0.5 }}>Try again</Button>
      </Sheet>
    );
  }
  if (!data) return null;
  if (!data.current) {
    return (
      <Sheet component="section" className="aura-panel" aria-labelledby="aura-season-title" sx={{ p: 2, mb: 2 }}>
        <Typography id="aura-season-title" component="h2" level="title-lg">Your aura is shifting…</Typography>
        <Typography level="body-sm" color="neutral" sx={{ mt: 0.75 }}>A season may emerge as your reflections gather.</Typography>
      </Sheet>
    );
  }
  return (
    <Sheet component="section" className="aura-panel" aria-labelledby="aura-season-title" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesome aria-hidden="true" sx={{ color: "var(--aura-accent)" }} />
        <Typography id="aura-season-title" component="h2" level="title-lg">{data.current.name}</Typography>
      </Box>
      <Typography level="body-sm" sx={{ mt: 0.75 }}>A stretch often linked with {data.current.oftenLinkedWith}.</Typography>
      <Typography level="body-md" sx={{ mt: 1 }}>{data.current.prompt}</Typography>
      <Typography level="body-sm" color="neutral" sx={{ mt: 0.75 }}>A gentle next step: {data.current.nextStep}</Typography>
    </Sheet>
  );
}
