import { useAppSelector } from "@/store/hooks";
import { selectInterfaceTheme, selectInterfaceMode } from "@/store/slices/uiSlice";
import { getInterfaceThemeBanner } from "@/theme/interfaceThemes";
import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface ThemeBannerProps {
  title: string;
  description: string;
  illustration?: "journal" | "mood" | "aura" | "insights" | "summary" | "calendar" | "settings";
  children?: ReactNode;
  /** Optional artwork (e.g. the user's pathway thumbnail) shown in place of the feature icon. */
  art?: ReactNode;
}

/**
 * One decorative image fades into its matching canvas; legacy art loads only if the variant fails.
 * Compact themed page introduction using the selected theme art and a bounded text scrim.
 * Kept short (one title line plus one description line) so page content starts above the fold.
 */
export function ThemeBanner({ title, description, illustration, children, art }: ThemeBannerProps) {
  const theme = useAppSelector(selectInterfaceTheme);
  const mode = useAppSelector(selectInterfaceMode);
  const { src, fallback } = getInterfaceThemeBanner(theme, mode);
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
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: "linear-gradient(90deg, var(--al-theme-banner-scrim, rgba(23, 15, 38, .92)) 0%, var(--al-theme-banner-scrim, rgba(23, 15, 38, .92)) 55%, transparent 100%)",
        },
        boxShadow: "0 12px 38px var(--al-theme-glow, transparent)",
      }}>
      <Box
        component="img"
        key={src}
        src={src}
        alt=""
        aria-hidden="true"
        onError={(event) => {
          // Request the original only after failure; a missing original leaves the themed canvas visible.
          const image = event.currentTarget;
          if (image.getAttribute("src") !== fallback) image.src = fallback;
          else image.style.visibility = "hidden";
        }}
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, objectFit: "cover", objectPosition: "center 54%", pointerEvents: "none" }}
      />
      <Box sx={{ position: "relative", zIndex: 2, maxWidth: 680 }}>
        <Typography component="h1" variant="h3" sx={{ fontSize: { xs: "1.45rem", sm: "1.75rem" }, fontWeight: 650, lineHeight: 1.15 }}>
          {title}
        </Typography>
        <Typography component="p" color="text.secondary" variant="body2" sx={{ mt: .5, maxWidth: 600, lineHeight: 1.45 }}>
          {description}
        </Typography>
        {children && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.25 }}>{children}</Box>}
      </Box>
      {art ? <Box sx={{ position: "relative", zIndex: 2, flex: "0 0 auto" }}>{art}</Box> : illustration && (
        <Box
          component="img"
          src={`/theme-assets/feature-icons/icon-${illustration}.svg`}
          alt=""
          aria-hidden="true"
          sx={{ position: "relative", zIndex: 2, width: { xs: 44, sm: 56, md: 64 }, height: "auto", flex: "0 0 auto", mr: { xs: 0, md: 1 }, filter: "drop-shadow(0 8px 24px var(--al-theme-glow, transparent))" }}
        />
      )}
    </Box>
  );
}
