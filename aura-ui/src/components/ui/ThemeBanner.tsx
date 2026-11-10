import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface ThemeBannerProps {
  title: string;
  description: string;
  eyebrow?: string;
  illustration?: "journal" | "mood" | "aura" | "insights" | "summary" | "calendar" | "settings";
  children?: ReactNode;
}

/** Themed page introduction using the selected theme art and a bounded text scrim. */
export function ThemeBanner({ title, description, eyebrow, illustration, children }: ThemeBannerProps) {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        width: "100%",
        maxWidth: "100%",
        minHeight: { xs: 148, sm: 176 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 3,
        px: { xs: 2.5, sm: 3.5, md: 4 },
        py: { xs: 2.5, sm: 3 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: { xs: 3, md: 4 },
        color: "text.primary",
        backgroundColor: "background.paper",
        backgroundImage: "linear-gradient(90deg, var(--al-theme-banner-scrim, rgba(23, 15, 38, .92)) 0%, transparent 100%), var(--al-theme-banner, none)",
        backgroundPosition: "center, center 54%",
        backgroundSize: "cover",
        boxShadow: "0 12px 38px var(--al-theme-glow, transparent)",
      }}>
      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 680 }}>
        {eyebrow && (
          <Typography component="p" variant="overline" sx={{ mb: 0.25, letterSpacing: ".14em", color: "text.secondary" }}>
            {eyebrow}
          </Typography>
        )}
        <Typography component="h1" variant="h3" sx={{ fontSize: { xs: "1.75rem", sm: "2.35rem" }, fontWeight: 650, lineHeight: 1.12 }}>
          {title}
        </Typography>
        <Typography component="p" color="text.secondary" sx={{ mt: 1, maxWidth: 600, lineHeight: 1.55 }}>
          {description}
        </Typography>
        {children && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mt: 2.25 }}>{children}</Box>}
      </Box>
      {illustration && (
        <Box
          component="img"
          src={`/theme-assets/feature-icons/icon-${illustration}.svg`}
          alt=""
          aria-hidden="true"
          sx={{ width: { xs: 64, sm: 84, md: 104 }, height: "auto", flex: "0 0 auto", mr: { xs: 0, sm: 1, md: 3 }, filter: "drop-shadow(0 8px 24px var(--al-theme-glow, transparent))" }}
        />
      )}
    </Box>
  );
}
