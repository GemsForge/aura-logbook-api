import {
  interfaceThemes,
  resolveInterfaceTheme,
  type InterfaceTheme,
} from "@/features/auth/models/InterfaceTheme";

export { interfaceThemes, resolveInterfaceTheme };
export type { InterfaceTheme };

/** Semantic colors used by both component libraries and global page surfaces. */
export interface InterfaceThemeTokens {
  mode: "dark" | "light";
  canvas: string;
  surface: string;
  surfaceRaised: string;
  ink: string;
  inkMuted: string;
  border: string;
  primary: string;
  primaryContrast: string;
  accent: string;
  focus: string;
  glow: string;
  bannerScrim: string;
}

/** Complete theme tokens derived from the approved Aura Logbook palettes. */
export const interfaceThemeTokens: Record<InterfaceTheme, InterfaceThemeTokens> = {
  Aurora: {
    mode: "dark", canvas: "#170F26", surface: "#211640", surfaceRaised: "#30214B",
    ink: "#FBF6FF", inkMuted: "#D2C5E0", border: "#59476C", primary: "#B58BE6",
    primaryContrast: "#1D1230", accent: "#E8B8CE", focus: "#FFD58D",
    glow: "rgba(174, 119, 236, 0.20)", bannerScrim: "rgba(23, 15, 38, 0.92)",
  },
  Earth: {
    mode: "dark", canvas: "#1C2A22", surface: "#28392F", surfaceRaised: "#354A3D",
    ink: "#F7F4EA", inkMuted: "#D3D9CB", border: "#596D5F", primary: "#D5C5A1",
    primaryContrast: "#26362D", accent: "#B8CA9A", focus: "#F5D58A",
    glow: "rgba(160, 183, 119, 0.18)", bannerScrim: "rgba(28, 42, 34, 0.92)",
  },
  Ocean: {
    mode: "dark", canvas: "#0C2233", surface: "#102B43", surfaceRaised: "#193A53",
    ink: "#F1FAFC", inkMuted: "#C5DDE1", border: "#3B6172", primary: "#8CC8D5",
    primaryContrast: "#102B3A", accent: "#8CC8C5", focus: "#F6D89A",
    glow: "rgba(66, 185, 205, 0.18)", bannerScrim: "rgba(12, 34, 51, 0.92)",
  },
  Sunset: {
    mode: "dark", canvas: "#351E2B", surface: "#542A3A", surfaceRaised: "#69394B",
    ink: "#FFF7EF", inkMuted: "#EBD5C8", border: "#865466", primary: "#F3C37A",
    primaryContrast: "#3B2530", accent: "#E99A74", focus: "#FFE1A5",
    glow: "rgba(246, 157, 102, 0.20)", bannerScrim: "rgba(53, 30, 43, 0.92)",
  },
  Amethyst: {
    mode: "dark", canvas: "#21182F", surface: "#302044", surfaceRaised: "#412B59",
    ink: "#FBF5FF", inkMuted: "#D7C9E4", border: "#665079", primary: "#D6B8E8",
    primaryContrast: "#2C1B3D", accent: "#F0C7B5", focus: "#FFE0A1",
    glow: "rgba(174, 126, 220, 0.20)", bannerScrim: "rgba(33, 24, 47, 0.92)",
  },
  Midnight: {
    mode: "dark", canvas: "#0E1529", surface: "#11182F", surfaceRaised: "#1D2945",
    ink: "#F3F5FF", inkMuted: "#C5CDE5", border: "#3F4D72", primary: "#AAB4E6",
    primaryContrast: "#17213B", accent: "#F1D7B5", focus: "#F5D28B",
    glow: "rgba(104, 143, 225, 0.20)", bannerScrim: "rgba(14, 21, 41, 0.92)",
  },
  Ivory: {
    mode: "light", canvas: "#FBF6EC", surface: "#FFFCF7", surfaceRaised: "#F0E7D9",
    ink: "#352D2C", inkMuted: "#665D56", border: "#CFC1AF", primary: "#815F7E",
    primaryContrast: "#FFFFFF", accent: "#C87961", focus: "#4C3451",
    glow: "rgba(162, 119, 198, 0.13)", bannerScrim: "rgba(251, 246, 236, 0.92)",
  },
};

/** Creates CSS custom properties for the shared shell and its theme banner. */
export function getInterfaceThemeCssVariables(theme: InterfaceTheme): Record<string, string> {
  const tokens = interfaceThemeTokens[resolveInterfaceTheme(theme)];
  const slug = theme.toLowerCase();
  return {
    "--al-theme-canvas": tokens.canvas,
    "--al-theme-surface": tokens.surface,
    "--al-theme-surface-raised": tokens.surfaceRaised,
    "--al-theme-ink": tokens.ink,
    "--al-theme-ink-muted": tokens.inkMuted,
    "--al-theme-border": tokens.border,
    "--al-theme-primary": tokens.primary,
    "--al-theme-primary-contrast": tokens.primaryContrast,
    "--al-theme-accent": tokens.accent,
    "--al-theme-focus": tokens.focus,
    "--al-theme-glow": tokens.glow,
    "--al-theme-banner-scrim": tokens.bannerScrim,
    "--al-theme-banner": `url("/theme-assets/backgrounds/banner-${slug}.png")`,
  };
}
