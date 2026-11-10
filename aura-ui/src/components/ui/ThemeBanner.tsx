import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface ThemeBannerProps {
  title: string;
  description: string;
  eyebrow?: string;
  illustration?: "journal" | "mood" | "aura" | "insights" | "summary" | "calendar" | "settings";
  children?: ReactNode;
}

/**
 * Compact themed page introduction using the selected theme art and a bounded text scrim.
 * Kept short (one title line plus one description line) so page content starts above the fold;
 * `eyebrow` is accepted for compatibility but no longer rendered, since it repeated the title.
 */
export function ThemeBanner({ title, description, illustration, children }: ThemeBannerProps) {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 2,
        px: { xs: 2, sm: 2.5, md: 3 },
        py: { xs: 1.5, sm: 2 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: { xs: 2.5, md: 3 },
        color: "text.primary",
        backgroundColor: "background.paper",
        backgroundImage: "linear-gradient(90deg, var(--al-theme-banner-scrim, rgba(23, 15, 38, .92)) 0%, transparent 100%), var(--al-theme-banner, none)",
        backgroundPosition: "center, center 54%",
        backgroundSize: "cover",
        boxShadow: "0 12px 38px var(--al-theme-glow, transparent)",
      }}>
      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 680 }}>
        <Typography component="h1" variant="h3" sx={{ fontSize: { xs: "1.45rem", sm: "1.75rem" }, fontWeight: 650, lineHeight: 1.15 }}>
          {title}
        </Typography>
        <Typography component="p" color="text.secondary" variant="body2" sx={{ mt: .5, maxWidth: 600, lineHeight: 1.45 }}>
          {description}
        </Typography>
        {children && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.25 }}>{children}</Box>}
      </Box>
      {illustration && (
        <Box
          component="img"
          src={`/theme-assets/feature-icons/icon-${illustration}.svg`}
          alt=""
          aria-hidden="true"
          sx={{ width: { xs: 44, sm: 56, md: 64 }, height: "auto", flex: "0 0 auto", mr: { xs: 0, md: 1 }, filter: "drop-shadow(0 8px 24px var(--al-theme-glow, transparent))" }}
        />
      )}
    </Box>
  );
}
