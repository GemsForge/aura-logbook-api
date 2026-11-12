import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";

/** Displays accessible previous/next controls and the current photo position when a set has multiple photos. */
export default function PhotoNavigationControls({ index, count, onNavigate }: {
  index: number;
  count: number;
  onNavigate: (nextIndex: number) => void;
}) {
  if (count < 2 || index < 0) return null;
  return (
    <Box role="group" aria-label="Photo navigation" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <IconButton size="sm" variant="outlined" aria-label="Previous photo" disabled={index <= 0} onClick={() => onNavigate(index - 1)}>
        <ChevronLeft fontSize="small" />
      </IconButton>
      <Typography level="body-xs" aria-live="polite" sx={{ minWidth: 48, textAlign: "center" }}>{index + 1} of {count}</Typography>
      <IconButton size="sm" variant="outlined" aria-label="Next photo" disabled={index >= count - 1} onClick={() => onNavigate(index + 1)}>
        <ChevronRight fontSize="small" />
      </IconButton>
    </Box>
  );
}
