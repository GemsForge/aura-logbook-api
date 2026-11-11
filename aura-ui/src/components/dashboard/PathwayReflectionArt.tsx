import Box from "@mui/joy/Box";
import type { SpiritualPathway } from "@/features/auth/models/SpiritualPathway";

const pathwayArt: Record<SpiritualPathway, { src: string; alt: string }> = {
  Mindfulness: {
    src: "/theme-assets/pathways/mindful/mindful-gentle-landscape.png",
    alt: "A quiet mountain landscape in soft evening colors.",
  },
  Faith: {
    src: "/theme-assets/pathways/faith-religion/faith-religion-open-book.png",
    alt: "An open book resting in a gentle pool of warm light.",
  },
  Energy: {
    src: "/theme-assets/pathways/astrology-energy/astrology-energy-moon-phases.png",
    alt: "A calm illustration of the moon's phases among stars.",
  },
};

/**
 * Compact thumbnail of the user's own pathway illustration, shown inside a page banner.
 * Only the selected pathway's art renders, so astrology imagery stays on Astrology & Energy.
 * Callers pass a normalized pathway; with none, they omit the art and the banner keeps its icon.
 */
export function PathwayReflectionArt({ pathway }: { pathway: SpiritualPathway }) {
  const art = pathwayArt[pathway];
  return (
    <Box component="img" src={art.src} alt={art.alt}
      sx={{ display: "block", width: { xs: 56, sm: 72 }, height: { xs: 56, sm: 72 }, objectFit: "cover", borderRadius: "12px", border: "1px solid var(--al-theme-border)" }} />
  );
}
