import { Typography } from "@mui/material";
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
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h6">
          {emoji && <span style={{ marginRight: 4 }}>{emoji}</span>}
          {value}
        </Typography>
    </Sheet>
  );
}
