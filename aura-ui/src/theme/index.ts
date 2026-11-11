import { createTheme, darken, lighten, type Theme } from "@mui/material/styles";
import { extendTheme as extendJoyTheme } from "@mui/joy/styles";
import { prismGarden } from "./prismGarden";
import { auraPalettes, getAuraShade, normalizeAuraIntensity } from "./auraTheme";
import {
  getInterfaceThemeTokens,
  type InterfaceMode,
  getInterfaceThemeCssVariables,
  resolveInterfaceTheme,
  type InterfaceTheme,
} from "./interfaceThemes";
import type { AuraColorDefinition } from "@/features/mood/models/aura";
import type { ThemeToken } from "@/store/referenceDataApi";

export { prismGarden } from "./prismGarden";

/** Installs validated database-managed theme tokens as CSS variables for shared UI surfaces. */
export function installThemeTokenVariables(tokens: ThemeToken[], auras: AuraColorDefinition[] = []): void {
  for (const { key, value } of tokens) {
    if (!/^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/.test(key)) continue;
    document.documentElement.style.setProperty(`--aura-${key.replace(/\./g, "-")}`, value);
  }
  for (const aura of auras) {
    for (const [shade, value] of Object.entries(aura.shades ?? {})) {
      document.documentElement.style.setProperty(`--aura-palette-${aura.key}-${shade}`, value);
    }
    document.documentElement.style.setProperty(`--aura-palette-${aura.key}-500`, aura.shades?.[500] ?? aura.baseHex);
  }
}
export {
  interfaceThemes,
  interfaceThemeTokens,
  getInterfaceThemeTokens,
  resolveInterfaceMode,
  type InterfaceMode,
  getInterfaceThemeCssVariables,
  resolveInterfaceTheme,
  type InterfaceTheme,
} from "./interfaceThemes";

/** Builds an aura-tinted wash for reflection surfaces while the app shell follows its interface theme. */
export function getAuraBackground(color: unknown, intensity: unknown = 50): string {
  const hue = typeof color === "string" ? color : "";
  const strength = 0.08 + normalizeAuraIntensity(intensity) / 700;
  return `radial-gradient(ellipse at 8% 10%, color-mix(in srgb, ${auraPalettes[hue][400].main} ${Math.round(strength * 100)}%, transparent) 0%, transparent 55%), radial-gradient(ellipse at 92% 50%, color-mix(in srgb, ${auraPalettes[hue][200].main} ${Math.round(strength * 70)}%, transparent) 0%, transparent 58%)`;
}

/**
 * Creates the Material UI adapter for the selected interface theme.
 * Recorded aura color remains entry data and is styled by its own aura palette.
 * @param selectedTheme Saved interface preference; missing or invalid values use Aurora.
 * @param selectedMode Independent screen brightness; legacy Ivory falls back to light.
 * @returns A Material UI theme ready for `ThemeProvider`.
 */
export function getAuraTheme(
  auraColor: string = "",
  auraIntensity: number = 50,
  selectedTheme: InterfaceTheme | string = "Aurora",
  selectedMode?: InterfaceMode,
): Theme {
  const normalizedTheme = resolveInterfaceTheme(selectedTheme);
  // The caller supplies mode independently; legacy Ivory resolves to Aurora light.
  const tokens = getInterfaceThemeTokens(selectedTheme, selectedMode);
  const colorScheme = tokens.mode;
  const cssVariables = getInterfaceThemeCssVariables(normalizedTheme, tokens.mode);
  const auraHue = auraColor;
  const auraAccent = auraPalettes[auraHue][getAuraShade(auraIntensity)].main!;

  return createTheme({
    palette: {
      mode: colorScheme,
      primary: { main: tokens.primary, contrastText: tokens.primaryContrast },
      // primaryContrast is the on-color token: dark on the light accents of dark themes, white on Ivory.
      secondary: { main: tokens.accent, contrastText: tokens.primaryContrast },
      // Error text uses the per-theme danger token so it stays readable on every surface.
      error: { main: tokens.danger },
      background: { default: tokens.canvas, paper: tokens.surface },
      text: { primary: tokens.ink, secondary: tokens.inkMuted },
      divider: tokens.border,
    },
    typography: {
      fontFamily: prismGarden.font.body,
      h1: { fontFamily: prismGarden.font.display, fontWeight: 500 },
      h2: { fontFamily: prismGarden.font.display, fontWeight: 500 },
      h3: { fontFamily: prismGarden.font.display, fontWeight: 500 },
      h4: { fontFamily: prismGarden.font.display, fontWeight: 500 },
      h5: { fontFamily: prismGarden.font.display, fontWeight: 500 },
      h6: { fontFamily: prismGarden.font.display, fontWeight: 500 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            ...cssVariables,
            colorScheme,
            "--aura-accent": auraAccent,
            "--aura-glow": `color-mix(in srgb, ${auraAccent} 24%, transparent)`,
            "--aura-wash": `color-mix(in srgb, ${auraAccent} 14%, transparent)`,
            "--aura-line": `color-mix(in srgb, ${auraAccent} 30%, transparent)`,
            "--aura-panel": tokens.surface,
            "--aura-dark": `linear-gradient(135deg, color-mix(in srgb, ${auraAccent} 22%, transparent), transparent 85%), ${tokens.surfaceRaised}`,
          },
          body: {
            backgroundColor: tokens.canvas,
            backgroundImage: `radial-gradient(circle at 8% 2%, ${tokens.glow}, transparent 28rem)`,
            color: tokens.ink,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
          },
        },
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            "&:focus-visible": { outline: `3px solid ${tokens.focus}`, outlineOffset: 3 },
          },
        },
      },
      MuiButton: {
        styleOverrides: { root: { minHeight: 44, borderRadius: prismGarden.radius.control } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minHeight: 44,
            backgroundColor: tokens.surfaceRaised,
            "& fieldset": { borderColor: tokens.controlBorder },
          },
        },
      },
    },
  });
}

/**
 * Creates the Joy UI adapter using the same semantic colors as Material UI.
 * @param selectedTheme Saved interface preference; missing or invalid values use Aurora.
 * @param selectedMode Independent screen brightness; legacy callers may omit it.
 * @returns A Joy UI theme ready for `CssVarsProvider`.
 */
export function getAuraJoyTheme(
  selectedTheme: InterfaceTheme | string = "Aurora",
  _legacyAuraIntensity?: number,
  explicitTheme?: InterfaceTheme | string,
  selectedMode?: InterfaceMode,
) {
  // The optional trailing argument preserves compatibility with older callers while the app shell uses the theme-only form.
  const tokens = getInterfaceThemeTokens(explicitTheme ?? selectedTheme, selectedMode);
  const primary = {
    50: lighten(tokens.primary, 0.88),
    100: lighten(tokens.primary, 0.76),
    200: lighten(tokens.primary, 0.62),
    300: lighten(tokens.primary, 0.46),
    400: lighten(tokens.primary, 0.24),
    500: tokens.primary,
    600: darken(tokens.primary, 0.12),
    700: darken(tokens.primary, 0.25),
    800: darken(tokens.primary, 0.4),
    900: darken(tokens.primary, 0.56),
  };
  const palette = {
    background: {
      body: tokens.canvas,
      surface: tokens.surface,
      popup: tokens.surfaceRaised,
      level1: tokens.surfaceRaised,
      level2: tokens.border,
      level3: tokens.border,
      tooltip: tokens.ink,
    },
    text: {
      primary: tokens.ink,
      secondary: tokens.inkMuted,
      tertiary: tokens.inkMuted,
      icon: tokens.inkMuted,
    },
    divider: tokens.border,
    focusVisible: tokens.focus,
    primary: {
      ...primary,
      solidBg: tokens.primary,
      solidColor: tokens.primaryContrast,
      solidHoverBg: darken(tokens.primary, 0.08),
      solidActiveBg: darken(tokens.primary, 0.16),
      softBg: tokens.surfaceRaised,
      softColor: tokens.ink,
      outlinedColor: tokens.primary,
      outlinedBorder: tokens.primary,
      // Joy's default hover fill is a mid purple that drops primary text to ~2.4:1. Hover on the
      // raised surface instead, where primary text keeps its readable contrast.
      outlinedHoverBg: tokens.surfaceRaised,
      outlinedActiveBg: tokens.surfaceRaised,
      plainHoverBg: tokens.surfaceRaised,
      plainActiveBg: tokens.surfaceRaised,
    },
    // Joy's default danger text is tuned for white pages; use the per-theme readable token.
    danger: {
      // Joy Typography colors text from mainChannel ("R G B"), not plainColor.
      mainChannel: [1, 3, 5].map((i) => parseInt(tokens.danger.slice(i, i + 2), 16)).join(" "),
      plainColor: tokens.danger,
      outlinedColor: tokens.danger,
      outlinedBorder: tokens.danger,
    },
    neutral: {
      50: tokens.surface,
      100: tokens.surfaceRaised,
      200: tokens.border,
      300: tokens.border,
      400: tokens.inkMuted,
      500: tokens.inkMuted,
      600: tokens.ink,
      700: tokens.ink,
      800: tokens.ink,
      900: tokens.ink,
      plainColor: tokens.ink,
      outlinedColor: tokens.ink,
      outlinedBorder: tokens.controlBorder,
      // Soft neutral controls (e.g. quick mood buttons) must sit on a themed fill, or Joy's
      // light default leaves light ink on a light button in the dark themes.
      softBg: tokens.surfaceRaised,
      softHoverBg: tokens.border,
      softActiveBg: tokens.border,
      softColor: tokens.ink,
      solidColor: tokens.ink,
      solidBg: tokens.surfaceRaised,
    },
  };

  return extendJoyTheme({
    fontFamily: { body: prismGarden.font.body, display: prismGarden.font.display },
    radius: {
      xs: "0.375rem", sm: "0.5rem", md: prismGarden.radius.control,
      lg: prismGarden.radius.card, xl: prismGarden.radius.shell,
    },
    shadow: {
      xs: "0 1px 2px rgba(0, 0, 0, 0.16)",
      sm: `0 8px 28px ${tokens.glow}`,
      md: `0 12px 36px ${tokens.glow}`,
      lg: `0 18px 48px ${tokens.glow}`,
      xl: `0 24px 64px ${tokens.glow}`,
    },
    colorSchemes: { light: { palette }, dark: { palette } },
  });
}
