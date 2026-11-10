import { Box, Typography } from "@mui/material";
import Sheet from "@mui/joy/Sheet";
import type { SpiritualPathway } from "@/features/auth/models/SpiritualPathway";

const pathwayArt: Record<SpiritualPathway, { src: string; alt: string; title: string }> = {
  Mindfulness: {
    src: "/theme-assets/pathways/mindful/mindful-gentle-landscape.png",
    alt: "A quiet mountain landscape in soft evening colors.",
    title: "A mindful moment",
  },
  Faith: {
    src: "/theme-assets/pathways/faith-religion/faith-religion-open-book.png",
    alt: "An open book resting in a gentle pool of warm light.",
    title: "A moment for meaning",
  },
  Energy: {
    src: "/theme-assets/pathways/astrology-energy/astrology-energy-moon-phases.png",
    alt: "A calm illustration of the moon's phases among stars.",
    title: "A celestial reflection",
  },
};

/** Shows only the illustration collection for the user's selected reflection pathway. */
export function PathwayReflectionArt({ pathway }: { pathway: SpiritualPathway }) {
  const art = pathwayArt[pathway];
  return (
    <Sheet variant="outlined" sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, mb: 3, borderRadius: 3, borderColor: "divider", bgcolor: "background.paper" }}>
      <Box component="img" src={art.src} alt={art.alt} loading="lazy" sx={{ width: { xs: 92, sm: 124 }, height: 88, objectFit: "cover", borderRadius: 2, flex: "0 0 auto" }} />
      <Box>
        <Typography variant="subtitle1" fontWeight={650}>{art.title}</Typography>
        <Typography variant="body2" color="text.secondary">
          Your pathway shapes optional prompts and imagery; your journal remains yours.
        </Typography>
      </Box>
    </Sheet>
  );
}
