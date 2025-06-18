import { Card, CardContent, Typography } from "@mui/material";

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
    <Card sx={{ minWidth: 150, textAlign: "center" }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h6">
          {emoji && <span style={{ marginRight: 4 }}>{emoji}</span>}
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
