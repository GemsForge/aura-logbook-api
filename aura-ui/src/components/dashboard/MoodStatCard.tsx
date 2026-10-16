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
    <Sheet variant="outlined" sx={{ minWidth: 150, textAlign: "center", p: 2 }}>
        <Typography level="body-sm" textColor="text.secondary">
          {title}
        </Typography>
        <Typography level="title-lg">
          {emoji && <span style={{ marginRight: 4 }}>{emoji}</span>}
          {value}
        </Typography>
    </Sheet>
  );
}
