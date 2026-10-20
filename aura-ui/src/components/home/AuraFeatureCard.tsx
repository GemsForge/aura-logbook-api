import { Box, Typography } from "@mui/material";
import { auraFeatures } from "./AuraFeatures";
import { prismGarden } from "@/theme";

/** Responsive overview cards used by the public home page. */
export default function AuraFeatureCards() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))",
        gap: { xs: 2, sm: 3 },
        width: "100%",
        minWidth: 0,
      }}>
      {auraFeatures.map(({ title, description }) => (
        <Box
          key={title}
          sx={{
            width: "100%",
            minWidth: 0,
            p: { xs: 2, sm: 2.5 },
            border: "1px solid",
            borderColor: prismGarden.color.line,
            borderRadius: prismGarden.radius.card,
            boxShadow: prismGarden.shadow.soft,
            bgcolor: prismGarden.color.surface,
            textAlign: "center",
            minHeight: 160,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
          }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2">{description}</Typography>
        </Box>
      ))}
    </Box>
  );
}
