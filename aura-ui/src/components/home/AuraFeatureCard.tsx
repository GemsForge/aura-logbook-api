import { Box, Typography } from "@mui/material";
import { auraFeatures } from "./AuraFeatures";

/** Presents three plain-language product ideas without adding more card chrome. */
export default function AuraFeatureCards() {
  return (
    <Box component="ul" aria-label="What you can do with Aura Logbook" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, width: "100%", minWidth: 0 }}>
      {auraFeatures.map(({ title, description }, index) => (
        <Box
          component="li"
          key={title}
          sx={{
            width: "100%",
            minWidth: 0,
            py: { xs: 2, md: 1 },
            pr: { md: index < auraFeatures.length - 1 ? 3 : 0 },
            pl: { md: index > 0 ? 3 : 0 },
            borderTop: { xs: "1px solid var(--al-theme-border)", md: 0 },
            borderLeft: { md: index > 0 ? "1px solid var(--al-theme-border)" : 0 },
          }}>
          <Typography component="h2" variant="h5" gutterBottom sx={{ fontSize: "clamp(1.25rem, 1.1rem + .5vw, 1.5rem)", fontWeight: 550 }}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary">{description}</Typography>
        </Box>
      ))}
    </Box>
  );
}
