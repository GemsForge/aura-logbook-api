import { Grid, Box, Typography } from "@mui/material";
import { auraFeatures } from "./AuraFeatures";

/**
 * `AuraFeatureCards` renders a responsive grid of informational cards
 * highlighting the key features of the Aura Logbook app.
 *
 * Each card includes a title, description, and subtle elevation styling.
 * Designed to visually introduce users to the aura-centered experience.
 *
 * @returns A MUI `Grid` component containing aura-themed feature cards.
 */

export default function AuraFeatureCards (){
    return (
      <Grid container spacing={4} justifyContent="center">
        {auraFeatures.map(({ title, description }, index) => (
          <Grid
            key={index}
            size={{
              xs: 12, // full width on mobile
              sm: 6, // two columns on small screens
              md: 4, // optional: three columns on larger screens
            }}
            sx={{
              display: "flex",
              justifyContent: "center",
            }}>
            <Box
              sx={{
                width: "100%",
                maxWidth: 300,
                p: 2,
                borderRadius: 2,
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                bgcolor: "background.paper",
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
          </Grid>
        ))}
      </Grid>
    );
}