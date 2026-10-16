// src/theme/index.ts
import { createTheme, type Theme } from "@mui/material/styles";
import { extendTheme as extendJoyTheme } from "@mui/joy/styles";
import { AuraColor } from "../features/mood/models/aura";
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
    const mainColor = shades[intensity] || shades[500];
  
    console.log(`[theming]`, color, intensity, "→", mainColor);
    return createTheme({
      palette: {
        primary: { main: mainColor },
        background: {
          default: "#fafafa",
          paper: "#fff",
        },
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
  const selected = shades[intensity] ?? shades[500];

  return extendJoyTheme({
    colorSchemes: {
      light: {
        palette: {
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
  
