// src/theme/index.ts
import { alpha, createTheme, type Theme } from "@mui/material/styles";
import { extendTheme as extendJoyTheme } from "@mui/joy/styles";
import { AuraColor } from "../features/mood/models/aura";
export { prismGarden } from "./prismGarden";
import { prismGarden } from "./prismGarden";
import { getAuraShade, normalizeAuraIntensity, resolveAuraColor, auraPalettes } from "./auraTheme";

/** Layers shades of the selected aura over a stable canvas without introducing a competing hue. */
export function getAuraBackground(color: unknown, intensity: unknown = 50): string {
  const hue = resolveAuraColor(color);
  const strength = 0.12 + normalizeAuraIntensity(intensity) / 500;
  return `radial-gradient(ellipse at 8% 12%, ${alpha(auraPalettes[hue][400].main!, strength)} 0%, transparent 55%), radial-gradient(ellipse at 92% 40%, ${alpha(auraPalettes[hue][200].main!, strength * 0.7)} 0%, transparent 58%), radial-gradient(ellipse at 45% 95%, ${alpha(auraPalettes[hue][300].main!, strength * 0.6)} 0%, transparent 60%)`;
}

/** Converts the product's 0-100 aura intensity scale to a stable MUI shade. */
function resolveAuraShade(intensity: number): number {
  return getAuraShade(intensity);
}
import { blue, green, grey, indigo, orange, pink, purple, red, yellow } from "@mui/material/colors";

/**
 * Returns a MUI theme tailored to the user’s selected aura color and intensity.
 * @param color     The aura hue (must match a key in auraShades).
 * @param intensity User-selected intensity from 0 to 100; legacy shade values are normalized.
 */
export function getAuraTheme(
    color: AuraColor,
    intensity: number = 500
  ): Theme {
    // Map each aura to its full set of MUI color shades
    const auraShades: Record<AuraColor, Record<number, string>> = {
      red: red,
      orange: orange,
      yellow: yellow,
      green: green,
      blue: blue,
      indigo: indigo,
      violet: purple,
      gray: grey,
      pink: pink,
    };
  
    // Select the requested shade, defaulting to 500 if unavailable
    const shades = auraShades[resolveAuraColor(color)];
    const mainColor = shades[resolveAuraShade(intensity)] || shades[500];
  
    return createTheme({
      palette: {
        primary: { main: mainColor },
        background: {
          default: prismGarden.color.canvas,
          paper: alpha(prismGarden.color.surface, 0.94),
        },
        text: { primary: prismGarden.color.ink, secondary: prismGarden.color.inkMuted },
      },
      typography: {
        fontFamily: prismGarden.font.body,
        h1: { fontFamily: prismGarden.font.display },
        h2: { fontFamily: prismGarden.font.display },
        h3: { fontFamily: prismGarden.font.display },
        h4: { fontFamily: prismGarden.font.display },
        h5: { fontFamily: prismGarden.font.display },
        h6: { fontFamily: prismGarden.font.display },
      },
      components: {
        MuiCssBaseline: { styleOverrides: {
          body: {
            backgroundImage: getAuraBackground(color, intensity), backgroundAttachment: "fixed",
            "--aura-accent": mainColor,
            "--aura-glow": alpha(shades[400], 0.25),
            "--aura-wash": alpha(shades[300], 0.16),
            "--aura-line": alpha(shades[600], 0.24),
            "--aura-panel": alpha(prismGarden.color.surface, 0.76),
            "--aura-dark": `linear-gradient(135deg, ${alpha(shades[500], 0.28)}, transparent 85%), #222C27`,
          },
        } },
        MuiButton: { styleOverrides: { root: { borderRadius: "999px", textTransform: "none" } } },
        MuiOutlinedInput: { styleOverrides: { root: { borderRadius: prismGarden.radius.control, backgroundColor: alpha(prismGarden.color.surface, 0.74) } } },
        MuiDialog: { styleOverrides: { paper: { borderRadius: 28, border: "1px solid rgba(255,255,255,.8)", boxShadow: prismGarden.shadow.raised } } },
      },
    });
  }

export function getAuraJoyTheme(color: AuraColor, intensity: number = 500) {
  const palettes: Record<AuraColor, Record<number, string>> = {
    red,
    orange,
    yellow,
    green,
    blue,
    indigo,
    violet: purple,
    gray: grey,
    pink,
  };
  const shades = palettes[resolveAuraColor(color)];
  const selected = shades[resolveAuraShade(intensity)] ?? shades[500];

  return extendJoyTheme({
    components: {
      JoyButton: { styleOverrides: { root: { borderRadius: "999px", minHeight: 42, paddingInline: 20, fontWeight: 600, transition: "transform .18s ease, box-shadow .18s ease", "&:hover": { transform: "translateY(-1px)" } } } },
      JoySheet: { styleOverrides: { root: { borderColor: "var(--aura-line, #D8DDD4)" } } },
      JoyInput: { styleOverrides: { root: { minHeight: 48, backgroundColor: "rgba(255,254,250,.72)", boxShadow: "none" } } },
      JoySelect: { styleOverrides: { root: { minHeight: 48 } } },
      JoyFormLabel: { styleOverrides: { root: { fontSize: "0.8rem", fontWeight: 600 } } },
    },
    fontFamily: {
      body: prismGarden.font.body,
      display: prismGarden.font.display,
    },
    radius: { sm: prismGarden.radius.control, md: prismGarden.radius.card, lg: prismGarden.radius.shell, xl: "2rem" },
    shadow: {
      sm: prismGarden.shadow.soft,
      md: prismGarden.shadow.raised,
      lg: prismGarden.shadow.raised,
    },
    colorSchemes: {
      light: {
        palette: {
          background: {
            body: prismGarden.color.canvas,
            surface: alpha(prismGarden.color.surface, 0.8),
            popup: prismGarden.color.surface,
          },
          neutral: {
            50: prismGarden.color.surface,
            100: prismGarden.color.surfaceSoft,
            200: prismGarden.color.stone,
            300: prismGarden.color.line,
            500: prismGarden.color.inkMuted,
            700: prismGarden.color.ink,
            900: prismGarden.color.ink,
          },
          focusVisible: prismGarden.color.focus,
          primary: {
            50: shades[50],
            100: shades[100],
            200: shades[200],
            300: shades[300],
            400: shades[400],
            500: shades[500],
            600: shades[600],
            700: shades[700],
            800: shades[800],
            900: shades[900],
            solidBg: selected,
            solidColor: getAuraTheme(color, intensity).palette.getContrastText(selected),
            solidHoverBg: shades[Math.min(resolveAuraShade(intensity) + 100, 900)],
            solidActiveBg: shades[Math.min(resolveAuraShade(intensity) + 200, 900)],
          },
        },
      },
    },
  });
}
  
