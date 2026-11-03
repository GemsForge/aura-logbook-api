import Typography from "@mui/joy/Typography";
import Sheet from "@mui/joy/Sheet";

interface MoodStatCardProps {
  title: string;
  value: string;
  emoji?: string;
}

export default function MoodStatCard({
  title,
  value,
  emoji,
}: MoodStatCardProps) {
  return (
    <Sheet variant="outlined" sx={{ minWidth: 0, textAlign: "left", p: { xs: 2, sm: 2.5 }, borderRadius: "lg", bgcolor: "rgba(255,254,250,.5)", overflowWrap: "anywhere" }}>
        <Typography level="body-xs" textColor="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography level="title-lg" sx={{ fontFamily: "display", fontWeight: 400, fontSize: { xs: "1.25rem", sm: "1.6rem" } }}>
          {emoji && <span style={{ marginRight: 4 }}>{emoji}</span>}
          {value}
        </Typography>
    </Sheet>
  );
}
