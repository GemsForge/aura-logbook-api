// src/theme/index.ts
import { createTheme, type Theme } from "@mui/material/styles";
import { extendTheme as extendJoyTheme } from "@mui/joy/styles";
import { AuraColor } from "../features/mood/models/aura";
export { prismGarden } from "./prismGarden";
import { prismGarden } from "./prismGarden";

/** Converts the product's 0-100 aura intensity scale to a stable MUI shade. */
function resolveAuraShade(intensity: number): number {
  if (intensity === 10) return 200;
  if (intensity === 50) return 500;
  if (intensity === 100) return 900;
  return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].includes(intensity)
    ? intensity
    : 500;
}
import { blue, green, grey, indigo, orange, pink, purple, red, yellow } from "@mui/material/colors";

/**
 * Returns a MUI theme tailored to the user’s selected aura color and intensity.
 * @param color     The aura hue (must match a key in auraShades).
 * @param intensity MUI shade level (e.g., 100, 200, ..., 900).
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
    const shades = auraShades[color] || auraShades.blue;
    const mainColor = shades[resolveAuraShade(intensity)] || shades[500];
  
    return createTheme({
      palette: {
        primary: { main: mainColor },
        background: {
          default: prismGarden.color.canvas,
          paper: prismGarden.color.surface,
        },
        text: { primary: prismGarden.color.ink, secondary: prismGarden.color.inkMuted },
      },
      typography: {
        // Optional: add per-aura typography tweaks here
      },
      // Component overrides or shape settings can be added here
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
  const shades = palettes[color] ?? palettes.blue;
  const selected = shades[resolveAuraShade(intensity)] ?? shades[500];

  return extendJoyTheme({
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
            surface: prismGarden.color.surface,
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
            solidHoverBg: shades[Math.min(intensity + 100, 900)] ?? shades[600],
            solidActiveBg: shades[Math.min(intensity + 200, 900)] ?? shades[700],
          },
        },
      },
    },
  });
}
  
