import type { MoodType } from "@/features/mood/models/schema";
import { useGetReferenceDataQuery } from "@/store/referenceDataApi";
import { getAccessibleTextColor } from "@/theme/auraTheme";
import Chip from "@mui/joy/Chip";
import Box from "@mui/joy/Box";
import { MoodIcon } from "@/components/mood/MoodIcon";

/** Displays a mood with its current database-defined icon and aura mapping. */
export function MoodTag({ mood }: { mood: MoodType }) {
  const { data } = useGetReferenceDataQuery();
  const moodDefinition = data?.moods.find((definition) => definition.key === mood);
  const aura = data?.auras.find((definition) => definition.key === moodDefinition?.auraColorKeys[0]);
  const background = aura?.shades?.[100] ?? aura?.baseHex ?? "transparent";

  return (
    <Chip variant="solid" sx={{ mr: 1, mb: 1, bgcolor: background, color: getAccessibleTextColor(background) }}>
      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
        <MoodIcon icon={moodDefinition?.icon} size={20} />
        {mood}
      </Box>
    </Chip>
  );
}
