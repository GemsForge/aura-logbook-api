import { Chip } from "@mui/material";
import { MoodIcons } from "../../features/mood/models/aura/MoodIcons";
import type { MoodType } from "@/features/mood/models/schema";
import { AuraMoodMap } from "@/features/mood/models/aura";
import { auraPalettes } from "@/theme/auraTheme";

export function MoodTag({ mood }: { mood: MoodType }) {
  const { auraColor } = AuraMoodMap[mood];

  // pick a light shade (100, 200, 300…)
  const lightShade = auraPalettes[auraColor][200].main;

  // fallback text color – you can keep this high-contrast
  const textColor = auraPalettes[auraColor].primary.contrastText ?? "#000";

  return (
    <Chip
      label={`${MoodIcons[mood as keyof typeof MoodIcons] ?? ""} ${mood}`}
      variant="filled"
      sx={{
        mr: 1,
        mb: 1,
        bgcolor: lightShade,
        color: textColor,
      }}
    />
  );
}
